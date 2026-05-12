---
url: /blog/2025/03/02/micro-frontend-webpack-module-federation/index.md
---
\==Module Federation（MF）== 最初是 **Webpack 5** 特性：**运行时** 从 **remote 容器** 加载 **exposes** 的模块，**`shared` 做依赖单例**。**现在落地新项目更常用 Vite 联邦插件**（`@originjs/vite-plugin-federation` 等），**字段语义与下述 Webpack 一致**，差别只在写在 **`vite.config.ts`** 还是 **`webpack.config.js`**。与 **qiankun 应用级** 不同，MF 更偏 **模块/组件级集成**。

> **Vite 双仓库从 `vite.config`、联调到缓存** 见《**微前端工程实践：Module Federation 双仓库从初始化到生产部署（详版）**》。

***

### 一、Remote 与 Host 角色

| 角色 | 职责 |
|------|------|
| ==Remote== | `exposes` 对外暴露 `./Button`、`./Page` |
| **Host** | `remotes` 声明远程入口，\*\*import('remoteName/exposed')\` |

**运行时**：Host 加载 **remoteEntry.js**，再 **异步拉取 chunk**。

***

### 二、最小配置：Vite（推荐新项目）

`remote` 与 `host` 均安装 `@originjs/vite-plugin-federation` 后，在 `vite.config.ts` 的 `plugins` 里各写 **federation({ ... })** —— `name`、`filename: 'remoteEntry.js'`、`exposes`（仅 remote）或 `remotes`（仅 host）与 `shared`。**消费侧** 使用 **`import('remoteName/暴露路径')` + `React.lazy` / `defineAsyncComponent`** 即可。完整片段与端口联调见《**Module Federation 双仓库从初始化到生产部署（详版）**》。

#### 本地双项目联调（Vite）

1. 两个包各自 **`npm run dev`**（或 `build` + `serve`），remote 在 **:3002** 等，确认 **`remoteEntry.js` URL** 在浏览器能打开。
2. host 的 `remotes` 填 **上一步的 `http://localhost:3002/.../remoteEntry.js`**，host 在 **:3000**。
3. 先起 **remote** 再起 **host**，在 Network 里看 **federation 拉取是否 200**。

***

### 三、最小配置：Webpack 5（老项目/原理对照一句）

`ModuleFederationPlugin` 的 **`name` / `filename` / `exposes` / `remotes` / `shared`** 与 Vite 联邦插件一一对应；**Remote、Host 各在 `webpack` 里配一段插件** 即可。示意：

```js
// Remote：exposes
new ModuleFederationPlugin({
  name: 'remoteApp',
  filename: 'remoteEntry.js',
  exposes: { './Widget': './src/Widget.tsx' },
  shared: { react: { singleton: true, requiredVersion: '^18.0.0' } },
}),
// Host：remotes
new ModuleFederationPlugin({
  name: 'host',
  remotes: { remoteApp: 'remoteApp@https://cdn.example.com/remoteEntry.js' },
  shared: { react: { singleton: true, requiredVersion: '^18.0.0' } },
}),
```

`React.lazy(() => import('remoteApp/Widget'))` 用法相同。**本地** 用 **`webpack serve`** 多配置起 **host/remote** 两端口，不再赘述。

**动态 remote（运行时注入 CDN 地址）**：适合 **多环境** 或 **按租户切换** 皮肤包，避免每次改 Host 重发版。

```js
// host 侧：在 bootstrap 时写入 __REMOTES__，再由 Module Federation 的 promise remotes 解析
remotes: {
  remoteApp: `promise new Promise(resolve => {
    const url = window.__RUNTIME__.remoteEntryUrl;
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve(window.remoteApp);
    document.head.appendChild(script);
  })`,
},
```

具体写法以 **Webpack 文档** 中 *Promise-based Dynamic Remotes* 为准；核心是 **先加载 script，再 resolve 全局容器对象**。

***

### 四、`shared` 与 `singleton`

* **`singleton: true`**：**整页一份** React/Vue，避免 **双实例** 导致 **状态与 hooks 异常**。
* **`requiredVersion`**：不满足时 **控制台警告** 或 **运行时行为**（以实际为准）。

**版本策略**：**主应用锁大版本**，remote **peer** 对齐；**乱升** 会导致 **remote 与 host 不兼容**。

***

### 五、部署与 CDN

* **`remoteEntry` 地址** 变化时，Host 配置需 **同步**（或 **动态注入** remotes）。
* **缓存**：`remoteEntry` **短缓存**，chunk **hash 长缓存**。

***

### 六、与 qiankun / iframe 的选型

| 方案 | 适合 |
|------|------|
| **qiankun** | **整应用** 嵌入、**多团队独立仓库**、**路由级** |
| **MF** | **组件/模块** 复用、**同技术栈**、**共享依赖强烈** |
| **iframe** | **强隔离**、**遗留系统** 几乎不改 |

**组合**：主应用 **qiankun** 载子应用，子应用 **内部** 再用 MF 拉 **设计系统 remote**——注意 **构建与运行时** 两层复杂度。

***

### 七、Rspack 侧

**Rspack** 与 **Webpack 5** 的 **ModuleFederationPlugin** 概念一致，**老项目迁 Rspack** 时联邦配置可平移；**新项目更推荐上文的 Vite 联邦**。

***

### 八、常见问题与处理

| 问题 | 处理 |
|------|------|
| **remote 已发版，host 没吃到** | 查 **`remoteEntry.js` 缓存**（应短缓存）；**hash chunk** 长缓存可保留 |
| **双份 React 报错** | 统一 **`shared` singleton** + 两端 **大版本** 与 **依赖解析** 一致 |
| **Vite 联邦 dev 能跑、生产挂** | **build 后 `publicPath` / `remote` 真实 URL** 与 dev 不同；**用生成物路径** 配 `remotes` |
| **团队争论「该 MF 还是 qiankun」** | **子 SPA 多团队 = qiankun 类**；**同壳内复用模块 = MF**；可 **壳 + 子内联邦** 并存 |

***

### 九、收束

Module Federation = **远程模块 + shared 单例**。先 **锁 React/Vue 版本契约**，再 **拆 remote**；**运维上要能灰度 remoteEntry**。应用级集成可继续读 **qiankun / single-spa** 系列，把 **「整应用」** 与 **「远程组件」** 分层设计。
