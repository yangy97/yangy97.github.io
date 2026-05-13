---
url: /blog/2022/08/11/webpack-module-federation-zero-to-one-host-remote/index.md
---
\==Module Federation（MF）== 让 **多个独立构建** 在运行时 **共享模块**：典型是 **Host** 消费 **Remote** 暴露的 `exposes`。本篇给 **最小双包目录**、**`ModuleFederationPlugin` 配置要点**、**`shared` 防重复 React**、以及 **部署时 URL 与版本** 注意点。

***

### 一、两个包目录（示意）

```text
mf-host/
  webpack.config.js
  src/index.js
mf-remote/
  webpack.config.js
  src/Button.jsx
```

Remote ==暴露== 组件；Host **动态 import** remote 的 **remoteEntry.js**。

***

### 二、Remote 侧（精简）

```js
const { ModuleFederationPlugin } = require('webpack').container;

new ModuleFederationPlugin({
  name: 'remote_app',
  filename: 'remoteEntry.js',
  exposes: {
    './Button': './src/Button.jsx',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
}),
```

**`filename`**：Host 加载的 **入口 URL** 通常指向 **`https://remote.example.com/remoteEntry.js`**。

***

### 三、Host 侧（精简）

```js
new ModuleFederationPlugin({
  name: 'host_app',
  remotes: {
    remote_app: 'remote_app@https://remote.example.com/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
}),
```

业务代码：

```js
const Button = React.lazy(() => import('remote_app/Button'));
```

***

### 四、`shared` 与 **两份 React**

* **`singleton: true`**：全页 **单实例**，避免 **Hooks 报错**。
* **`requiredVersion`**：与 **semver** 协商 **可接受范围**；不匹配时 **控制台警告** 或 **运行时行为异常**。

***

### 五、部署与缓存

* **remoteEntry.js** 更新后，Host 若 **强缓存旧 URL**，会 **加载旧 remote**——配合 **文件名哈希** 或 **CDN 刷新策略**。
* **跨域**：`remoteEntry` 所在域需 **CORS** 允许 Host 页面来源 **加载脚本**。

***

### 六、小结

MF = **运行时依赖拼接**；成本在 **版本协商、缓存、观测**。与《微前端与 Module Federation》一文互补：应用级微前端还可选 **qiankun** 等，**技术选型不互斥**。
