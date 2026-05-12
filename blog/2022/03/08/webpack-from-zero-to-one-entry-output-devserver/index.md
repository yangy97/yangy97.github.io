---
url: /blog/2022/03/08/webpack-from-zero-to-one-entry-output-devserver/index.md
---
目标：不用脚手架，用 ==webpack 5== 搭一个 **能改即热更新** 的前端入口。搞清 **entry 如何进图**、**output 文件名与 publicPath**、**mode 对 behavior 的影响**、**devServer 如何把内存里的 bundle 喂给浏览器**，后面读任何配置都有锚点。

***

### 一、初始化

```bash
mkdir webpack-demo && cd webpack-demo
npm init -y
npm i -D webpack webpack-cli webpack-dev-server html-webpack-plugin
```

目录：

```text
webpack-demo/
  package.json
  webpack.config.js
  src/
    index.js
  public/
    index.html
```

***

### 二、`webpack.config.js`（最小）

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash:8].js',
    clean: true,
    // 部署到子路径时再配，例如 publicPath: '/blog/assets/'
    publicPath: '/',
  },
  devServer: {
    static: path.resolve(__dirname, 'public'),
    port: 8080,
    hot: true,
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({ template: 'public/index.html' }),
  ],
};
```

\==`publicPath`==：运行时 **script/link 前缀**；与 **devServer 的 `devMiddleware.publicPath`** 要对齐，否则 **资源 404**。

***

### 三、`mode` 到底改了什么

| mode | 典型行为 |
|------|----------|
| **development** | 更易读的输出、默认 **不** 做极限压缩；部分优化关闭便于调试 |
| **production** | **tree-shaking、minimize** 等默认开启（仍受 sideEffects 等约束） |
| **none** | 不应用 mode 预设，适合教学或完全自控 |

**误区**：以为 `mode: production` 就自动「最快」——生产构建往往 **更慢**，因为优化更重。

***

### 四、`devServer` 与文件系统

* **开发**：bundle 多在 **内存**（`webpack-dev-middleware`），**不写** `dist`。
* **`static`**：额外静态目录（放 `index.html` 模板时通常配合 `HtmlWebpackPlugin`）。
* **`historyApiFallback`**：SPA 刷新 **深链接** 时回到 `index.html`，避免 **404**。

***

### 五、`package.json` scripts

```json
{
  "scripts": {
    "dev": "webpack serve --config webpack.config.js",
    "build": "webpack --config webpack.config.js --mode production"
  }
}
```

***

### 六、收束

从 0 到 1 只需四件事：**entry 进图**、**output 命名**、**HtmlWebpackPlugin 注入**、**devServer 起服务**。下一篇接 **resolve 与 loader 规则**，把 `.ts`、`.css` 接进管线。
