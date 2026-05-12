---
url: /blog/2025/10/28/micro-frontend-garfish-practice-full-guide/index.md
---
[Garfish](https://www.garfishjs.org/) 是字节开源的 ==微前端框架==，能力覆盖 **子应用管理、预加载、沙箱、插件、路由** 等。本篇按 **能开工** 的粒度写主应用、子应用、插件思路；**具体 API 名称与参数** 以 [Garfish 官方文档](https://www.garfishjs.org/) 为准（版本升级较快）。**子应用**新建推荐 **`npm create vite@latest` + 官方 `@garfish/bridge-*`** 文档；**Webpack 子项目** 仅按官档 **同构改造**，不展开独立小节。

***

### 一、主应用：安装与 `Garfish.run`

\==1）安装==

```bash
npm i garfish
```

**2）入口中初始化**（以下结构与官方 **快速开始** 一致，细项以文档为准）：

```ts
import Garfish from 'garfish';

Garfish.setGlobalValue('appName', 'main-dashboard');

Garfish.run({
  basename: '/',
  domGetter: '#subApp',
  apps: [
    {
      name: 'reactApp',
      activeWhen: '/react-app',
      entry: 'http://localhost:8080',
    },
    {
      name: 'vueApp',
      activeWhen: '/vue-app',
      entry: 'http://localhost:8081',
    },
  ],
});
```

* **`domGetter`**：子应用 **挂载的容器**；可以是 **选择器字符串** 或 **函数**。
* **`activeWhen`**：子应用 **激活路径**，支持 **字符串前缀** 或 **函数**（以文档类型为准）。
* **`entry`**：子应用 **HTML 入口**（同 qiankun 的 HTML Entry 思路）。
* **`basename`**：Garfish 作为 **基座** 的 **总 basename**，与主应用 **顶层路由** 配合。

**3）在页面中准备容器**：

```html
<div id="subApp"></div>
```

子应用 **激活时** Garfish 会把 **子应用根** 挂进该节点（具体是 **全量替换** 还是 **内嵌** 以文档与版本为准，联调时观察 DOM 树即可确认）。

***

### 二、子应用：需要导出什么

Garfish 要求子应用以 **子应用包** 形式被加载，**生命周期** 与 qiankun 体系类似，常见包括：

* **`provider`** 函数：创建 **根组件 / 根实例** 的工厂；
* 或在文档所述的 **`export`** 中提供 **render** 与 **destroy** 配对。

**典型 React 子应用**（仅逻辑示意）：

```ts
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter } from '@garfish/bridge-react'; // 以官方 bridge 包名为准
import App from './App';

export const provider = () => {
  return {
    render({ dom, basename }) {
      const root = createRoot(dom);
      root.render(<App />);
      return () => root.unmount();
    },
  };
};
```

**要点**：**`destroy` 可逆**、**basename** 与主应用给的路径一致。**Vue 子应用** 用 **`@garfish/bridge-vue`** 等（包名以文档为准）。

**强烈建议**：用官方 **create-garfish / 模板** 生成一版子项目，对 **ts 类型、bridge 包版本** 最省事。

***

### 三、预加载

Garfish 提供 **预加载 API**（如 `preloadApp` 或 `run` 的选项，名称以文档为准）：

* 在 **主应用** 的 **用户登录后** 或 **菜单数据返回后** 对 **高优子应用** 预取；
* 与 **路由懒加载** 结合，避免 **一次性 preload 全站** 造成 **首包膨胀**。

***

### 四、插件体系（扩展点）

插件可用于：

* **统一错误处理**：子应用 **加载失败** 时，主应用 **兜底页 + 埋点**；
* **改造 fetch**：在子应用请求头里 **自动带 traceId**；
* **沙箱前/后钩子**：在 **mount 前后** 做 **A/B、主题注入**（见文档 **Plugin** 章）。

**实践**：**第一版别写太多插件**，先 **跑通主 + 1 子应用**；稳定后再加 **可观测性** 插件。

***

### 五、与集团基建

Garfish 在 **字节内** 与 **发布、监控** 有深度结合；**开源** 使用时要自行对接 **Sentry/ARMS/自研** 的 **子应用名、版本、sourcemap**。在 **RUM** 中建议上报字段：`garfish.appName`、**子应用 `entry` 版本**（可来自 **子应用 `package.json` 的 build id** 注入 `window`）。

***

### 六、联调与部署

* **联调**：主 **Garfish 基座** 与 子 **devServer** 同时起，**CORS** 在子 **devServer** 打开（或主应用走 **dev proxy** 把 `entry` 指到同域 path）。
* **部署**：子应用 **独立静态资源**；`entry` 为 **可缓存的 `index.html`** 地址；**子应用发版** 不强制 **主应用重发**（与 qiankun 同模型）。

***

### 七、常见问题与处理

| 问题 | 原因 | 处理 |
|------|------|------|
| **`run` 后子区仍空白** | **`domGetter` 节点未就绪** 或 `entry` **404 / CORS** | `domGetter` 在 **能取到 #node** 的时序后执行；**Network 验 `index.html` 与 chunk** |
| **bridge 报版本/React 不兼容** | **`@garfish/bridge-*`** 与 **React 18 / Vue3** 未按表对齐 | 用 **官方模板** 锁 **peer 依赖**；少跨大版本手搓 |
| **子应用发版后白屏、老逻辑** | **CDN 长缓存了旧 `index.html`** 或 **entry 指错** | `index.html` **短缓存**；`entry` **目录发版** 或 **query 带版本** |
| **预加载压垮首包** | **无差别 preload 全部子应用** | 只 **预加载下一屏/高频**；用 performance 看 **LCP/带宽** 再开 |
| **插件改 `fetch` 后静态资源 404** | 插件 **误改 js/css 请求** | 插件内 **只匹配 API 域** 或 **path 白名单** |
| **RUM 无法区分子应用** | 未在上报里带 **子应用名/entry 版本** | 见上文 **RUM 字段**；`package.json` **buildId** 写进子应用 `window` |

***

### 八、收束

Garfish 落地 **= `run` 里配清 `activeWhen` 与 `entry` + 子应用 bridge 生命周期写对 + 再考虑插件与预加载**。与 **qiankun** 选型时，更多看 **团队已有样例、维护节奏与文档**；技术差距没有「代际」那么大，**工程纪律** 决定成败。
