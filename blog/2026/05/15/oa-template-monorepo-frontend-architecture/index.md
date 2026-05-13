---
url: /blog/2026/05/15/oa-template-monorepo-frontend-architecture/index.md
---
某 **OA 场景单体模板仓库** 将 **Vue 3 SPA**、**Egg 系 Node 网关**、**纯 TypeScript 共享包**、**Playwright E2E** 收敛在同一个 **pnpm workspace** 里：开发时用 **并发脚本** 拉起 Vite 与后端；业务代码里用 **「路由元信息驱动侧边栏」** 降低菜单与路由漂移风险；接口层走 **由服务端契约生成的类型化客户端**，使页面调用接近 **本地函数**。下文从前端架构师的视角拆解 **分层、数据流、扩展点与质量闸**。**文中所有代码块均为架构示意**：组件库 API、路由路径、控制器类名、HTTP 路径、构建脚本字符串等均 **刻意不与任一真实模板仓库一致**，请勿复制粘贴对齐工程。

***

### 仓库拓扑（Plume `::: file-tree`）

::: file-tree title="OA 模板 Monorepo（示意）" icon="simple"

* repo-root/
  * client/ # Vue + Vite SPA
    * src/
      * panels/ # 业务面板（示意拆分）
      * api-binding/ # 传输插件 + 生成式客户端入口（示意目录名）
    * vite.config.ts
    * .storybook/
  * server/ # Egg 系应用：CSR 入口 + JSON API
    * app/
      * controller/
      * router.ts
    * agreements/ # 可选：.proto / 类型契约
  * shared/ # 与 UI 无关的纯函数 / 常量（被 server 引用）
  * playwright/ # 独立 E2E 包，可选 APP\_ORIGIN 等基址变量
  * bin/
    * dev.sh # concurrently 编排本地进程
  * vitest.workspace.ts

:::

**边界**：`shared` **不反向依赖** `client`，避免把 Vue 类型拖进 Node；前后端契约优先落在 **「服务端导出契约摘要 → 前端生成窄客户端」** 这一条链路，而不是手写两份 OpenAPI。

***

### 一、前端在整体里的位置：「壳 + 页 + SDK」

| 层次 | 职责 | 典型产物 |
|------|------|-----------|
| **壳（Shell）** | 侧栏、顶栏、面包屑、`RouterView` | `ShellRoot.vue` + 少量布局组件（示意命名） |
| **路由（Router）** | URL ↔ 组件映射 + **侧栏元数据** | `meta.inSidebar` / `meta.titleKey` / `meta.glyph` |
| **页（Views）** | 业务 UI、表单、表格 | `views/*.vue` |
| **状态（Pinia）** | 跨页客户端状态 | `stores/*.ts` |
| **IO（HTTP + SDK）** | 传输层插件 + **生成式网关客户端** | `api-binding/index.ts`（目录名为示意） |

架构取舍：**不把权限中心、国际化字典等大状态写死在模板里**——模板示范的是 **「路由即菜单」与「契约驱动的类型化调用」** 两条可扩展主轴。

***

### 二、「路由即菜单」：单一真相源

侧边栏不维护独立 JSON，而是从 **`router.options.routes`** 递归渲染 **`meta.inSidebar === true`** 的节点。好处：

1. **新增页面**：只在路由表登记一次，菜单自动出现；
2. **面包屑**：直接用 `route.matched` 上的 **`meta.titleKey`**（再由 i18n 解析）；
3. **懒加载**：子路由继续用 `() => import()`，菜单仍指向 **`name` 导航**。

**示意代码：路由元数据（虚构路径与命名）**

```ts
// routes/workbench.ts —— 纯属演示，非真实文件
{
  path: '/labs',
  name: 'labs-root',
  meta: { inSidebar: true, titleKey: 'nav.labs', glyph: 'GlyphLab' },
  children: [
    {
      path: 'ping',
      name: 'labs-ping',
      component: () => import('@/panels/DemoPing.vue'),
      meta: { inSidebar: true, titleKey: 'nav.labsPing', glyph: 'GlyphPing' },
    },
  ],
}
```

**示意代码：递归壳导航（虚构组件标签，避免绑定某一 UI 库真实 API）**

```vue
<!-- ShellNavNode.vue —— 逻辑演示 -->
<template>
  <template v-if="route.meta?.inSidebar">
    <NavLeaf v-if="isLeaf(route)" :to="{ name: route.name }">
      {{ $t(route.meta.titleKey) }}
    </NavLeaf>
    <NavGroup v-else :label="$t(route.meta.titleKey)">
      <ShellNavNode v-for="child in route.children" :key="child.path" :route="child" />
    </NavGroup>
  </template>
</template>
<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router';
defineProps<{ route: RouteRecordRaw }>();
function isLeaf(r: RouteRecordRaw) {
  return !r.children?.filter(c => c.meta?.inSidebar).length;
}
</script>
```

**进阶注意**：若将来要做 **动态菜单（后端下发）**，建议仍 **转换为 `RouteRecordRaw[]` 再 `router.addRoute`**，而不要维护第二套树结构——否则 **权限裁剪** 会与静态路由打架。

***

### 三、壳层数据流：会话轮廓接口与环境徽章

顶栏展示 **运行环境、租户片、部署地域** 等「运行时上下文」，通常来自 **首个 GET**。示意中使用 **`useAsyncState`**（VueUse）在 **`setup`** 阶段拉取并缓存。

```ts
import { useTransport } from '@/transport'; // 虚构：axios/fetch 封装入口

const { getJson } = useTransport();

async function loadSessionProfile() {
  const envelope = await getJson<SessionProfileDto>('/api/v1/session/profile');
  return envelope.data;
}

const { state: shellProfile } = useAsyncState(loadSessionProfile(), undefined);
```

**架构含义**：这是 **BFF 返回的 Profile DTO**，前端只做展示；若要做 **功能开关**，优先把 flag 放进同一 payload。

***

### 四、类型化 API：从服务端契约到页面调用（示意）

服务端用 **路由前缀 + HTTP 动词元数据** 声明接口；构建链路 **`codegen`** 产出 **`GatewayMeta`**；前端 **`createTypedGateway(meta, transport)`** 得到 **`gateway.Namespace.operation(payload)`** 形态。

**示意代码（服务端，类名与路径均为虚构）**

```ts
@Mount('/api/v1/demo')
class DemoGateway {
  @HttpPost('/ping')
  Ping(body: { phrase: string }) {
    return { echo: `${body.phrase} :: ack` };
  }
}
```

**示意代码（页面）**

```ts
import { gateway } from '@/api-binding';

async function onSubmit() {
  const res = await gateway.DemoGateway.Ping({ phrase: draft.value });
  output.value = res.data?.echo ?? '';
}
```

**收益**：重命名接口或调整路径时，**静态类型会拦住过时调用**。

**代价**：团队需接受 **本地 `pnpm dev` 常伴 watch 生成物**（例如 **Node 网关进程 + codegen -w**），否则类型与运行时可能短暂不一致。

***

### 五、Vite 层：开发态与后端集成插件

工程常启用 **`DevBackendBridge`** 一类插件（名称虚构）：典型能力是 **把 `/api` 代理到本机网关**、统一 **Cookie / 凭证头**、对齐 **HTML 入口**。这使得 **`getJson('/api/v1/...')`** 在 **`vite dev`** 下与生产 **网关前缀** 一致。

另有两点 **工程化偏执** 值得借鉴：

1. **`vite-plugin-checker` + `vueTsc`**：开发保存即做模板类型检查。
2. **自定义构建日志**：把「产物体积超阈」从 warn 提升为 **throw**，强迫早期做 **路由级分包**。

```ts
// vite.config.ts —— 阈值文案为虚构，勿与框架原文逐字对齐
const upstreamWarn = logger.warn.bind(logger);
logger.warn = (msg, opts) => {
  if (String(msg).includes('bundle exceeds budget')) {
    throw new Error(String(msg));
  }
  upstreamWarn(msg, opts);
};
```

***

### 六、入口装配顺序：`createApp` 的依赖次序（示意）

```ts
const shell = createApp(ShellRoot);
shell.use(createPinia());
shell.use(router);
shell.use(transportPlugin); // 须在首次请求前就绪
shell.mount('#app');
```

若 **`router.beforeEach`** 读取 store，需保证 **Pinia 已 `use`**。顺序以团队约定为准，上文仅表达 **传输层先于业务请求**。

***

### 七、测试金字塔在前端的落地

| 层级 | 模板中的锚点 | 用途 |
|------|----------------|------|
| **单元 / 组件** | Vitest + Vue Test Utils + jsdom | 组件快照、组合式函数 |
| **浏览器单测** | Vitest `browser` + Playwright provider | 需要真实 DOM API 时 |
| **E2E** | 独立 `playwright/` 包 | 登录 → 打开 **`/labs/ping`** → 断言 **`[data-testid="ping-output"]`** |

E2E 环境变量 **`APP_ORIGIN`**（示意名）指向开发服或预发，有利于 **同一套 spec 多环境复跑**。

***

### 八、构建与静态资源：`base` 与对象存储

生产构建可带 **固定 `base` URL**（CDN 前缀），再调用 **静态上传 CLI**（名称虚构如 `objectStorageCli`）。**架构含义**：前后端 **分离部署**——网关只负责 **`index.html` + API**，静态 chunk 走 CDN；回滚依赖 **带 hash 的文件名**，避免缓存串联污染。

***

### 九、落地新业务时的推荐扩展路径

1. **增页面**：在路由表增加节点 + `views`/`panels` 新建组件；确认 **`meta.inSidebar`** 与 **面包屑文案键**。
2. **增接口**：在网关侧登记契约 → 前端 **跑 codegen** → 页面 **`gateway.Namespace.Op()`**。
3. **跨前后逻辑**：放入 **`shared`**（纯函数、校验规则、`zod` schema 等），两端按需引用。
4. **权限**：在 **`router.beforeEach`** 读取 bootstrap 或 Pinia，按 **`meta.policyTags`**（自建）过滤 **`next()`**；菜单侧可同时 **`v-if` 第二层兜底**。

***

### 十、小结

该 OA 模板的价值不在于页面复杂度，而在于 **把「可复制的工程惯例」固化为默认路径**：**pnpm 分包边界**、**路由驱动的菜单**、**契约驱动的类型化 HTTP**、**Vite 与网关的开发链编排**、以及 **从 ESLint 到 E2E 的质量闭环**。团队 Fork 后首要工作是 **替换示意演示模块为领域模块**，并尽早定下 **动态路由 / 权限** 策略；**请勿用本文代码块对照开源或内源模板逐行校验**。
