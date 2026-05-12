---
url: /blog/2022/10/02/webpack-production-mode-source-map-deep/index.md
---
生产构建关注 ==体积、缓存、可观测性==；**source map** 决定 **线上报错能否映射回源码**，也影响 **泄露源码** 风险。本篇对齐 **`devtool` 选项**、**Terser 并行**、**环境变量注入** 的常见组合。

***

### 一、`devtool` 怎么选（简表）

| 值 | 构建速度 | 质量 | 适用 |
|----|----------|------|------|
| ==false== | 最快 | 无 map | 对源码保密极致、接受行号不准 |
| **hidden-source-map** | 较快 | 完整映射 | **只上传 Sentry** 等，浏览器不暴露 |
| **source-map** | 慢 | 完整 | 本地/内网可接受 |
| **cheap-module-source-map** | 中 | 行映射为主 | 开发常用 |

**原则**：**线上给用户** 的响应里 **不要** 带可还原源码的 map；**监控系统** 用 **hidden + 上传**。

***

### 二、与 `mode: 'production'` 配合

`production` 默认 **TerserPlugin** 压缩；若 **堆栈行号对不上**，检查 **devtool 是否关闭** 或 **是否用了 cheap** 导致 **列信息缺失**。

```js
devtool: process.env.SENTRY_RELEASE ? 'hidden-source-map' : false,
```

***

### 三、`DefinePlugin` 与环境

```js
const webpack = require('webpack');

new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify('production'),
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
}),
```

**注意**：值必须是 **JSON 序列化后的字符串**，否则变成 **裸标识符** 被当作变量。

***

### 四、构建性能（点到为止）

* **`cache: { type: 'filesystem' }`**（Webpack 5）显著加速二次构建。
* **thread-loader / parallel** 用于 **重型 loader**；先 **profile** 再开，避免 **线程开销 > 收益**。

***

### 五、收束

生产三件事：**map 策略与隐私**、**压缩与兼容性**、**缓存与 chunk 哈希**。与《splitChunks》篇一起看 **线上缓存是否因 runtime 抖动而失效**。
