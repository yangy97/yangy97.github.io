---
url: /blog/2022/06/20/webpack-loader-rules-babel-css-from-zero/index.md
---
Webpack 只认识 ==JS==；**TS、CSS、图片** 都靠 **loader** 转成 JS 可消费的模块。**规则从下到上执行**（或理解为 **先右后左** 的 `use` 数组）。本篇搭一条 **babel-loader + css-loader + style-loader** 的最小链，并说明 **与 `type: "asset"` 的差异**。

***

### 一、安装

```bash
npm i -D babel-loader @babel/core @babel/preset-env @babel/preset-typescript
npm i -D style-loader css-loader
```

***

### 二、`module.rules` 最小示例

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              '@babel/preset-typescript',
            ],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
```

\==顺序==：对 CSS，`css-loader` **先** 解析 `@import`/`url()`，**再** `style-loader` **注入** `<style>`。若写反，会直接报错或行为怪异。

***

### 三、为什么需要 `exclude: /node_modules/`

默认 **不转译** 依赖，避免 **构建爆炸慢**。若某依赖 **未编译到目标浏览器**，再对该包 **单独 `include`** 或 **换已构建版本**。

***

### 四、生产环境 CSS 的常见升级路径

开发用 **style-loader** 最快；生产往往换成 **`MiniCssExtractPlugin.loader`** 生成 **独立 CSS 文件**，利于 **缓存与并行下载**。切换时 **保持 loader 链顺序思想不变**。

***

### 五、资源：`type: 'asset'`

Webpack 5 推荐用 **内置 asset** 处理图片/字体，而不是老旧的 `file-loader`/`url-loader`：

```js
{
  test: /\.(png|jpg|webp|svg)$/i,
  type: 'asset',
  parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
}
```

***

### 六、小结

loader 题先想 **输入输出类型**：**TS→JS**、**CSS→JS 字符串**、**二进制→URL/base64**。链路过长时 **抽函数生成 rules**，避免复制粘贴十段 `use`。
