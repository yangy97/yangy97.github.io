---
url: /blog/2025/08/09/micro-frontend-qiankun-practice-full-guide/index.md
---
> 概念速览见《微前端实践：qiankun 生命周期、沙箱与数据通信》。本篇==子应用打包以 Vite 为主==；**Webpack / vue-cli 老项目** 仅文末一句带过好。**包版本**以 [qiankun 官方文档](https://qiankun.umijs.org/) 与 [vite-plugin-qiankun](https://github.com/tengmaoqing/vite-plugin-qiankun) 为准。

***

### 一、准备与角色划分

* \==主应用（基座）==：负责 **菜单、登录、子应用注册、容器 DOM**；**顶层路由** 必须能落到同一 HTML（history fallback）。
* **子应用**：可 **独立开发、独立部署**；必须导出 **`bootstrap` / `mount` / `unmount`**。
* **建议约定**：子应用 **URL 前缀** 如 `/app-order`，与 **`router` base、activeRule、base（Vite publicPath）** 三处写同一个字符串。

**端口示例**：主应用 `8080`，子应用 A `8081`、B `8082`（`registerMicroApps` 里多一条即可）。

***

### 二、主应用：安装与启动 qiankun

```bash
# Vue / React 主应用内
npm i qiankun
```

在 **应用启动最早阶段**（如 `src/main.ts` 或 `src/qiankun/index.ts`）写注册逻辑，**不要** 放在某个页面组件的 `onMounted` 里再 `start`（会反复注册或时序乱）。

**最小注册代码（可直接改路径与端口联调）**：

```ts
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'app-order',
    entry: '//localhost:8081',
    container: '#subapp-container',
    activeRule: (location) => location.pathname.startsWith('/order'),
    props: { routerBase: '/order' },
  },
]);

start({
  prefetch: true,
  sandbox: { experimentalStyleIsolation: true },
});
```

* **`entry`**：生产环境写 **子应用 `index.html` 的绝对 URL**；本地可 `//localhost:8081`（协议跟随主应用）。
* **`container`**：主应用布局里需存在该选择器，例如 `App.vue` 中 `<div id="subapp-container" />`；若用布局切换子路由，**容器要在激活子应用时始终存在**。
* **`activeRule`** 与主应用 **Vue Router** 的 path 要一致，否则子应用不挂载。
* **`props.routerBase`** 子应用在 mount 时读取，给 **子应用 `createWebHistory(routerBase)`** 用。

在 **`start()` 之前** 确保主应用路由已能访问到带容器的布局页；若用 **Hash 主应用** 子应用，注意 **activeRule** 里要解析 `location.hash` 而不是只看 `pathname`（以你的路由模式为准）。

***

### 三、子应用：Vite + Vue3 + `vite-plugin-qiankun`（主路径）

**1）创建子应用**

```bash
npm create vite@latest child-order -- --template vue-ts
cd child-order
npm i
npm i vite-plugin-qiankun -D
```

**2）`vite.config.ts` 要点**（`name` 与主应用 `registerMicroApps` 的 `name` 一致；`base` 与线上子路径一致）

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import qiankun from 'vite-plugin-qiankun';

const APP_NAME = 'app-order';
const isProd = process.env.NODE_ENV === 'production';
const port = 8081;

export default defineConfig({
  base: isProd ? '/order/' : `http://localhost:${port}/`,
  plugins: [
    vue(),
    qiankun(APP_NAME, {
      useDevMode: !isProd, // 开发时由插件配合热更新，以插件版本说明为准
    }),
  ],
  server: {
    port,
    origin: `http://localhost:${port}`,
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
});
```

* **`base`**：开发阶段常用 **全量 URL**，避免资源从主应用域错误解析；**生产** 多为 **`/order/`** 同域部署。以你 **Nginx/网关** 实际为准调整。
* 插件的 **`useDevMode`、选项名** 若与上游变更不一致，以 [vite-plugin-qiankun](https://github.com/tengmaoqing/vite-plugin-qiankun) README 为准。

**3）`src/router/index.ts`**：basename 与主应用为子应用分配的路径一致，例如 `'/order'`。

```ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(
    (window as any).__POWERED_BY_QIANKUN__ ? '/order' : '/',
  ),
  routes: [/* ... */],
});

export default router;
```

独立打开子应用时用 **`/`**；被 qiankun 嵌入时走 **`/order`**（与主应用 `activeRule`、主应用子路由一致）。

**4）`src/main.ts` 导出生命周期**

```ts
import { createApp, type App as VueApp } from 'vue';
import App from './App.vue';
import router from './router';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/helper';

let app: VueApp | null = null;

function render(props: { container?: HTMLElement } = {}) {
  const el =
    props.container?.querySelector('#app') ?? document.querySelector('#app');
  if (!el) return;
  app = createApp(App);
  app.use(router);
  app.mount(el);
}

renderWithQiankun({
  bootstrap() {
    return Promise.resolve();
  },
  mount(props) {
    render(props);
  },
  unmount() {
    app?.unmount();
    app = null;
  },
  update() {
    return Promise.resolve();
  },
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}
```

**`helper`** 从 **`vite-plugin-qiankun/helper`** 引入 `renderWithQiankun` 与 `qiankunWindow`；若大版本调整导出路径，以 **node\_modules 内类型定义** 为准。

**5）`index.html`** 保留根节点 `#app`，与 `querySelector` 一致即可。

**6）HMR 异常**时，先用 **`npm run build && npx serve dist`** 或静态服务器验证 **生产形态**，再对照 issue 中 **useDevMode** 说明。

***

### 四、子应用：Vite + React 18

思路与 Vue 相同：**`vite-plugin-qiankun` + `renderWithQiankun`（或同插件提供的 React 辅助）**、**`createRoot` 挂到 `props.container`**、`unmount` 里 **`root.unmount()`**。模板可选用 **`@vitejs/plugin-react`**。

**双份 React**：子应用与主应用各打一份时易出现 **Invalid hook call**，需在 **`optimizeDeps` / 外部化** 或 **Module Federation 共享** 上定版本；见《Module Federation 详版》的 **`shared: { singleton: true }`** 思路。

***

### 五、老项目用 Webpack 时（一句带过）

**vue-cli** 子应用需 **`output.library` UMD**、在入口最前 **动态 `__webpack_public_path__`**（`window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__`），与官方示例一致；**create-react-app 需 eject 或 `craco` 改配置**。**新项目优先 Vite + 上节**。

***

### 六、数据通信：`initGlobalState` 与 `props`

```ts
import { initGlobalState, MicroAppStateActions } from 'qiankun';

const state = { user: null as { id: string } | null };
const actions: MicroAppStateActions = initGlobalState(state);

actions.onGlobalStateChange((newState, prev) => {
  console.log(newState, prev);
});

// 主应用里更新
actions.setGlobalState({ user: { id: '1' } });
```

子应用在 **`mount(props)`** 中通过 **`props.setGlobalState` / `onGlobalStateChange`**（若主应用从 `getGlobalState` 注入，以你封装为准）与基座同步。**建议**：**权限、用户摘要** 可放；**大表单/列表** 仍走 **接口 + BFF**。

***

### 七、预加载、性能与 `prefetch`

* **`start({ prefetch: true })`** 会在空闲时拉子应用资源，具体策略见文档。
* 子应用 **包体** 仍要做 **code split、路由懒加载**；微前端不替你砍体积。
* 若子应用极多，可评估 **只 prefetch 下一屏** 的自定义策略，避免无差别打满带宽。

***

### 八、部署清单

| 检查项 | 说明 |
|--------|------|
| 子应用 `index.html` 可公网访问 | `entry` 用 **https** 绝对地址（或主应用同域反代后路径） |
| 子应用 **`base` 与静态资源** 正确 | 避免 `chunk` 从错误根路径 404 |
| 主应用 **history fallback** | `/order/**` 回主 `index.html` |
| **CORS** | 若 `entry` 与主应用不同源，**子应用资源响应头** 需允许主域（或由网关统一加） |
| **Cookie 域** | 同站策略与 **SameSite**；跨子域时让 **BFF/网关** 定策略 |

***

### 九、常见问题与排错

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 白屏，子应用 **js/css 404** | **`base` 与网关前缀不一致**；开发期 **`//localhost` 与 `https` 混用** | 先 **单开子站** 确认 `index.html` 引用的 **chunk URL** 能 200；生产 **`base: '/子路径/'`** 与 Nginx 一致 |
| 子应用 **永远不挂载** | **activeRule** 与真实 **pathname** 不符；`#subapp` **未出现在 DOM** | `console` 里打印 **location**；用 **`registerMicroApps` 的 `activeRule` 打日志**；保证 **主路由先渲染出容器** 再 `start` |
| **`vite-plugin-qiankun` HMR 乱 / 白屏** | 插件与 **Vite 大版本** 不兼容、**`useDevMode`** 与场景不符 | 用 **`npm run build` + 静态服** 复现；对照插件 issue 升版或关 HMR 试产线形态 |
| **`__POWERED_BY_QIANKUN__` 与独立运行逻辑打架** | `router` basename、**`render` 双入口** 写反 | 独立访问走 **`/`，嵌入走 `/order`**；`qiankunWindow` 或全局标记分支要 **单一真源** |
| **`initGlobalState` 不触发** | 子应用未 **订阅** 或主应用未 **在 mount 后 set** | 主应用在 **`mount` 完成后再 `setGlobalState`**；子应用 **onGlobalStateChange** 要在 **mount 内** 注册并在 **unmount 取消** |
| **qiankun 与 cookie** | 跨站 **SameSite**、**third-party cookie** 被禁 | 尽量 **同站 + 反代** 子应用入口；**鉴权** 以 **BFF + HttpOnly** 为优先 |

**仍搞不定**时，按顺序：**子应用单站 OK → 主应用只注册一条子应用 → 关沙箱/关样式隔离对比** 缩小范围。

***

### 十、小结

qiankun 落地 **= 子应用生命周期 + 主应用正确注册 + `base` / 路由与 activeRule 一致**。**Vite 子应用** 以 **`vite-plugin-qiankun` + 双模式 `main`/`router`** 为当前主流写法；**Webpack 仅维护老栈时**再翻官方 UMD 示例。
