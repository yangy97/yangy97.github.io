---
url: /blog/2025/05/21/micro-frontend-single-spa-zero-to-one/index.md
---
\==single-spa== 是「微前端」一词流行前就已存在的 **多框架应用编排** 方案：**不绑定 Webpack**，用 **活动规则（activeWhen）** 决定何时挂载/卸载子应用。**qiankun** 在其上增加了 **HTML Entry、沙箱、样式隔离** 等工程化能力。理解 single-spa 有助于 **排查 qiankun 生命周期问题** 和 **自研壳子**。

***

### 一、核心概念：application 与 parcel

* \==Application（应用）==：与 **URL 规则** 绑定，同时 **只有一个** 应用在某条规则下处于 mounted（默认模型）。
* **Parcel（包裹）**：可在 **同一页** 多处挂载，更像「可复用的挂载单元」；**qiankun 子应用** 更接近 application 模型。

日常 **路由级微前端** 先掌握 **registerApplication** 即可。

***

### 二、最小主应用（逻辑示意）

生产环境推荐 **`create-single-spa` 生成的 root-config**（内置 **import map + SystemJS / ES 模块** 约定），避免手写加载器踩坑。下面用 **伪代码** 只保留 **single-spa API** 主干：

```ts
import { registerApplication, start } from 'single-spa';

registerApplication({
  name: '@demo/app1',
  // 实际项目里常是 System.import('//cdn.../main.js') 或打包后的动态 import
  app: () => import('//localhost:8081/main.js'),
  activeWhen: (location) => location.pathname.startsWith('/app1'),
  customProps: { domElementGetter: () => document.getElementById('app1') },
});

start({ urlRerouteOnly: true });
```

**要点**：`app()` 返回 **Promise**，resolve 的对象需实现 **`bootstrap` / `mount` / `unmount`**（与 qiankun 子应用导出一致）。`urlRerouteOnly: true` 可减少 **非路由触发的重挂载**（详见官方文档）。**跨域子应用入口** 的加载方式以你选的 **打包 + 部署** 为准，不要混用未配置的 **裸 import URL**。

***

### 三、子应用导出协议（与 qiankun 对齐）

```ts
export async function bootstrap(props) {
  // 一次性的全局配置
}

export async function mount(props) {
  // props.domElementGetter() 或 customProps 里传入的容器
}

export async function unmount(props) {
  // 必须可逆：解绑事件、销毁框架根实例
}
```

**Webpack 常见配合**：`output.libraryTarget: 'system'` 或 **`@single-spa/parcel`/`single-spa-vue`** 等 helper 包减少样板代码。

***

### 四、实际操作：与 create-single-spa 脚手架

官方推荐用 **`create-single-spa`** 生成 **root-config** 与 **子应用**（Vue/React/Angular），自带 **import map** 与 **推荐目录结构**。

```bash
npx create-single-spa
# 按提示选择：root config / application，框架类型，组织名 @your-org/app-name
```

生成后重点读 **`importmap.json`**（或内联 import map）：**子应用包名 → 部署 URL** 的映射即 **运行时发版** 的关键；运维可只 **改 JSON 灰度** 而不重打主应用包。

***

### 五、常见坑

| 坑 | 处理 |
|----|------|
| 子应用 **二次 mount** | `unmount` 未清空 DOM；或 **activeWhen 重叠** |
| **样式全局污染** | single-spa **本身不做样式隔离**；需 **CSS Modules、构建约定或上层框架（qiankun）** |
| **公共依赖多份** | 用 **import map 指向同一 CDN** 或上 **Module Federation** |

**补充（联调时）**：**`activeWhen` 写错** 导致子应用**永远不激活** —— 用 **临时 `console.log(location)`** 对一下规则；**import map 指错** 时 **子应用空壳** —— 看 **Network 里 system/import 的 URL** 是否 404。

***

### 六、收束

single-spa = **生命周期协议 + 路由驱动挂载**。**qiankun** 在协议之上解决 **HTML 入口与沙箱**；选型时若团队 **只想用协议、自研加载器**，可评估 **pure single-spa + import map**；否则多数国内项目仍 **qiankun / Garfish / micro-app** 起步更快。
