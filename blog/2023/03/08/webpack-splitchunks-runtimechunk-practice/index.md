---
url: /blog/2023/03/08/webpack-splitchunks-runtimechunk-practice/index.md
---
\==代码分割== 不是越多越好：**chunk 太多** 会 **HTTP 开销** 上升；**太少** 则 **缓存粒度粗**，一改业务 **整包失效**。`splitChunks` 管 **异步/同步拆包**；`runtimeChunk: 'single'` 把 **webpack 运行时代码** 单独抽出，避免 **业务 chunk 哈希抖动**。本篇给 **可直接改的 `optimization` 模板** 与 **调参顺序**。

***

### 一、为什么需要 `runtimeChunk`

Webpack 在 chunk 里注入 ==模块加载、热替换、chunk 映射== 等 **runtime**。若不抽离，**任一业务 chunk 变化** 可能 **连带 runtime 重算哈希**，**vendor 缓存** 命中率下降。

```js
optimization: {
  runtimeChunk: 'single',
},
```

**多页应用** 若每个 entry 都 `single`，要确认 **HTML 是否都引入 runtime**（或由 HtmlWebpackPlugin 自动注入）。

***

### 二、`splitChunks` 默认行为与自定义

```js
optimization: {
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: -10,
      },
      common: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      },
    },
  },
},
```

| 概念 | 含义 |
|------|------|
| **chunks: 'all'** | 同步 + 异步都参与拆 |
| **cacheGroups** | **命中规则 + 优先级**，后处理的组可 **覆盖** 默认 |
| **priority** | 数字 **越大越优先** |

***

### 三、与动态 `import()` 的关系

**路由级懒加载** 产生 **async chunk**；`splitChunks` 再决定是否 **把 async 里的 node\_modules 提到公共 vendor**。若 **每个路由都打一份 lodash**，检查 **是否被重复打包**（`webpack-bundle-analyzer`）。

***

### 四、常见坑

1. **`name` 写死** 导致 **单文件过大**——可改 **按包名分包**（`cacheGroups` 多组）或 **限制 maxSize**（Webpack 5+ 支持进一步拆分，以文档为准）。
2. **SSR / Node 目标** 与浏览器 **split 策略不同**，不要混用同一套 optimization。
3. **MF（Module Federation）** 下 **remote 与 host 的 shared** 会显著改变 chunk 图，需 **单独调**。

***

### 五、收束

调优顺序：**先 analyzer 看体积** → **runtimeChunk** → **vendor 组** → **业务公共** → **路由懒加载**。别在未测 **首屏 waterfall** 前盲目 `maxAsyncRequests: 999`。
