---
url: /blog/2026/05/26/interview-webpack-mobile-node/index.md
---
微众、SHEIN 爱问 **uni-app/Webpack**；富途爱问 **Node 事件循环 vs 浏览器**。本篇串工程化与移动端答法。

***

### 一、Webpack 流程

**常问**：打包原理 / loader 顺序 / plugin 区别？

```text
entry → 递归依赖 → loader 转换 → 插件介入生命周期 → output
```

* **Loader**：文件转换（babel、css、file）
* **Plugin**：整个编译生命周期（HtmlWebpackPlugin、SplitChunks）

**优化**：code split、tree shaking、cache、thread-loader、分析 bundle。

专题：[Webpack 从 0 到 1](/2022/03/08/webpack-from-zero-to-one-entry-output-devserver/) 及工程化目录。

***

### 二、uni-app 打包原理（面试版）

**一句话**：Vue 源码 → 各端编译器（webpack/vite）→ 平台特有运行时 + 条件编译。

**多端**：`#ifdef MP-WEIXIN` 等剔除分支；各端输出独立包。

深入：[uni-app / Taro 选型](/2026/05/17/miniprogram-uniapp-taro-selection-and-pitfalls/)。

***

### 三、移动端适配

**常问**：怎么做适配？

| 方案 | 说明 |
|------|------|
| rem + 根 font-size | 动态设置 html font-size |
| vw/vh | postcss-px-to-viewport |
| flex + 百分比 | 简单布局 |
| safe-area | 刘海/底部横条 env() |

专题系列：[viewport/DPR](/2022/05/28/mobile-viewport-dpr-rem-vw-fundamentals/)、[safe-area](/2022/06/15/mobile-safe-area-notch-env-dynamic-island/)。

**异形屏**：safe-area + 全屏 WebView 下 **viewport-fit=cover**。

***

### 四、App 内 H5 通信

**常问**：JSBridge 了解吗？

答：H5 调 Native **URL Scheme / 注入对象 / WKScriptMessageHandler**；异步 callback id + JSON RPC。

见 [JSBridge 实战](/2026/05/27/mobile-h5-webview-jsbridge-native-interaction/)。

***

### 五、性能优化（总答法）

**结构**：指标（LCP/FCP/TTI）→ 手段 → 项目例子

| 方向 | 手段 |
|------|------|
| 加载 | 分包、懒加载、CDN、HTTP2 |
| 运行时 | 虚拟列表、防抖、Web Worker |
| 监控 | 性能平台、错误上报 |

[性能总览](/2023/07/26/frontend-performance-overview/)、[Sentry 监控](/2026/05/23/frontend-error-monitoring-sentry-reporting/)。

***

### 六、Headless（微众）

**用途**：无 UI 浏览器自动化——截图、PDF、E2E、爬虫。\
项目答法：Playwright/Puppeteer + CI。见 [Playwright 架构](/2025/11/16/headless-playwright-architecture-tracing-ci/)。

***

### 七、Node 事件循环 vs 浏览器

| | 浏览器 | Node |
|--|--------|------|
| 宏任务 | timer、IO、UI | timer、IO、check、close |
| 微任务 | Promise | Promise |
| 特有 | render | **process.nextTick**（微任务前）、**setImmediate** |

[Node 事件循环](/2024/09/23/node-event-loop-libuv-phases/)。

**限流/黑名单**（富途）：IP 计数 Redis + 滑动窗口；黑名单表；验证码。

***

### 八、小结

工程化题 **说清 loader/plugin 分工**；移动端 **safe-area + 适配方案二选一讲透**。Node 题画 **两圈 event loop** 即可。
