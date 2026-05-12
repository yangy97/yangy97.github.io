---
url: /blog/2025/02/03/micro-frontend-qiankun-sandbox-lifecycle/index.md
---
[qiankun](https://qiankun.umijs.org/) 基于 ==single-spa==，在蚂蚁场景打磨：**HTML Entry**、**JS 沙箱**、**样式隔离**、**预加载**。下面写 **注册参数、子应用导出协议、沙箱类型与限制、全局状态**，并带 **配置示例**。

> 需要 **分步骤脚手架、Vite 子应用（主路径）、部署与排错** 的完整过程，见《**微前端工程实践：qiankun 从脚手架到联调与上线（详版）**》。

***

### 一、本地从零跑通（推荐顺序）

1. \==先起一个纯子应用==：**推荐** `npm create vite@latest`；老项目可继续 `vue create`。单独访问子应用 `http://localhost:8081` 正常。
2. **再建主应用**（Vue3/React 均可），安装 `qiankun`，在布局里留出 `#subapp-viewport`。
3. **子应用改 `router` base** 与主应用 `activeRule` 一致，例如 basename `/vue`。
4. **子应用入口导出** `bootstrap/mount/unmount`（见下文；**Vite 用** `vite-plugin-qiankun` 的 `renderWithQiankun`），`npm run dev` 两端口联调。

**`entry`**：可以是 **远程部署的 index.html**，实现 **独立部署**；本地联调写 `//localhost:8081` 即可（`//` 表示跟随当前页面协议）。

***

### 二、主应用注册（完整示意）

```ts
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'app-vue',
    entry: '//localhost:8081', // HTML 入口，qiankun 会 fetch 解析资源
    container: '#subapp-viewport',
    activeRule: (location) => location.pathname.startsWith('/vue'),
    props: { routerBase: '/vue', tokenBridge: getToken },
  },
]);

start({
  sandbox: { strictStyleIsolation: true }, // 可选：shadow dom 等策略以文档为准
  prefetch: true,
});
```

**路由兜底**：主应用 history 模式下，服务器要把 **`/vue` 及子路径** 都回到主应用 `index.html`，否则刷新 404；子应用内部路由由 qiankun 激活后再接管。

***

### 三、子应用必须导出的生命周期

**当前更常见：Vite 子应用** —— 用 **`vite-plugin-qiankun`**：在 `vite.config.ts` 中配置 **`base` / `server.cors` / 插件**（`qiankun('子应用名', { useDevMode })`），在 `main` 里用 **helper** 的 **`renderWithQiankun`** 注册 **`bootstrap` / `mount` / `unmount` / `update`**（与打包器无关的协议一致）。**详版**见《微前端工程实践：qiankun 从脚手架到联调与上线（详版）》**第三节**。

**老项目用 Webpack / vue-cli** 时：在入口最前设 **`__webpack_public_path__`**，**`vue.config.js` 的 `output.library` UMD** 对齐 qiankun；一句带过即可，不展开。

子入口 **导出协议**（两种打包方式都满足这个形状即可）：

```ts
export async function bootstrap() {}
export async function mount(props) {
  // 创建 Vue/React 根实例，挂到 props.container
}
export async function unmount(props) {
  // 销毁实例，避免内存泄漏
}
```

**unmount 不干净** → 二次进入 **重复监听**、**定时器泄漏**。

**Vue3 + Vite 骨架示意**（若不用 `renderWithQiankun` 自写，也要保证 **挂到 `props.container` 下**）：

```ts
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

let app: ReturnType<typeof createApp> | null = null;

export async function mount(props: any) {
  app = createApp(App);
  app.use(router);
  const el = document.createElement('div');
  props.container.appendChild(el);
  app.mount(el);
}

export async function unmount() {
  app?.unmount();
  app = null;
}
```

***

### 四、沙箱：快照 vs Proxy

**JS 沙箱** 目标：子应用 **改动 `window.xxx`** 在 **卸载后恢复**，避免 **污染下一子应用**。

**限制**

* **原生构造函数**、**document.body 直接 append** 等 **难完全回滚**。
* **第三方库** 把东西挂 `window` 上 → 与 **strict 沙箱** 冲突时需 **黑名单** 或 **换隔离策略**。

**样式隔离**：**scoped** + **experimentalStyleIsolation**（类名前缀）或 **Shadow DOM**（注意 **弹层**）。

***

### 五、数据：`props` 与 `initGlobalState`

主应用 **`initGlobalState`** 可做 **轻量共享**；**重业务** 仍建议 **BFF + 主应用鉴权**。

```ts
const actions = initGlobalState({ user: null });
actions.onGlobalStateChange((state, prev) => console.log(state));
actions.setGlobalState({ user: { id: 1 } });
```

**反模式**：把 **整棵业务树** 塞 global state → **类型与版本** 难演进。

***

### 六、路由同步

子应用 **`router base`** 必须 **与 activeRule** 一致；**history 模式** 下 **主应用** 需 **兜底** 把 `/vue/**` **forward** 到子应用容器。

**典型坑**：子应用 **自己改 `window.location`** 导致 **整页刷新** 跳出微前端 → 统一用 **router API**。

***

### 七、排错清单（联调时按顺序扫）

| 现象 | 常见原因 | 处理办法 |
|------|----------|----------|
| 子应用白屏、控制台资源 404 | **`publicPath`/`base`** 与部署路径不一致；`entry` 指向错环境 | 对齐 **Vite `base` / 线上 CDN 子路径**；`entry` 用当前环境 **可访问的 `index.html` URL** 验一遍 |
| `Invalid hook call` | **页内两份 React** | 子应用 **externals 主应用** 或 **Module Federation `shared` singleton**；禁止双份 **react** |
| 样式「串台」 | 未开隔离或第三方全局 **reset** | 开 **`experimentalStyleIsolation` / 样式沙箱**；Element/AntD 大版本**不要**与主应用混用两套全局样式 |
| 卸载后再进，事件触发两次 | **unmount** 未移除监听 / 未销毁实例 | 在 **unmount** 里 **解绑、clearInterval、destroy 路由**；开发环境注意 **React StrictMode 双调** 勿误判 |
| 刷新整页跳出微前端 | **`window.location` / 裸 `<a href>`** | 子应用内 **一律 router API**；链接 **`preventDefault` + `router.push`** |
| 子应用能进，**刷新子路由 404** | 服务器未 **history fallback** 到主 `index.html` | 网关/Nginx 把 **子 path** 回退到**主站** 入口；**不要**只配子站而不含主应用壳 |

***

### 八、收束

qiankun = **single-spa + 工程化沙箱 + HTML Entry**。落地成本在 **子应用构建适配** 与 **样式/全局单例**；**先规范 unmount**，再谈 **prefetch**。更底层的 **single-spa 注册模型** 见同系列《微前端实践：single-spa 从零到注册子应用》。
