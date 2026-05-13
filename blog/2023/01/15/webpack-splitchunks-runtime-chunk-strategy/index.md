---
url: /blog/2023/01/15/webpack-splitchunks-runtime-chunk-strategy/index.md
---
\==代码分割==决定 **首屏下载多少**、**缓存命中率** 与 **并行请求数**。Webpack 5 里由 **`import()`** 产生 **async chunk**，由 **`splitChunks`** 抽 **vendor / common**，**`runtimeChunk`** 则把 **manifest** 从业务 chunk 里拆出，避免 **业务改一行 → vendor hash 全变**。下面写 **策略、默认行为、配置示例与排障**。

***

### 一、三种 chunk 心智模型

| 类型 | 来源 | 典型内容 |
|------|------|----------|
| ==Entry chunk== | `entry` | 入口 + 同步依赖 |
| **Async chunk** | 动态 `import()` | 路由页、重型组件 |
| **Split chunk** | `splitChunks` 命中 | `node_modules`、被多入口共享模块 |

***

### 二、`import()` 与魔法注释

```js
const Page = () => import(/* webpackChunkName: "page-a" */ './PageA.vue');
```

* **`webpackChunkName`**：合并到同一 **命名 chunk**（配合魔法注释分组）。
* **`webpackPrefetch` / `webpackPreload`**：插入 `<link rel="prefetch/preload">` 提示（**仍受浏览器策略影响**）。

***

### 三、`splitChunks` 核心字段（Webpack 5）

```js
optimization: {
  splitChunks: {
    chunks: 'all', // async + initial
    minSize: 20000,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: -10,
        reuseExistingChunk: true,
      },
      common: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      },
    },
  },
  runtimeChunk: 'single', // 或 { name: 'runtime' }
},
```

**`chunks: 'all'`**：同步入口里 **也能** 拆出 vendor（默认只对 async 较保守，需显式）。\
**`cacheGroups.priority`**：数字 **大** 优先匹配。

***

### 四、为什么要 `runtimeChunk: 'single'`

Webpack **运行时代码**（`__webpack_require__`、chunk 加载表）默认可能 **打进 entry**。\
你只改 **业务模块** 时，**module id 映射** 变化会导致 **含 runtime 的 chunk hash 变**，**长期缓存的 vendor 也可能跟着变**。

**拆出 runtime** 后：**业务 hash 变** 只影响 **业务 chunk + runtime**，**vendor 更稳定**。

**多页应用**：有时用 **`multiple`** 或按入口拆，避免 **单文件 runtime 过大**；需权衡。

***

### 五、示例：「把 UI 库单独打一包」

```js
cacheGroups: {
  antd: {
    test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
    name: 'antd',
    chunks: 'all',
    priority: 20,
  },
},
```

**注意**：**过度拆分** → HTTP/1.1 **队头阻塞**、**握手多**；HTTP/2 **仍不宜** 几十个小文件（**压缩效率**、**服务器推送已式微**）。一般以 **体积曲线 + Lighthouse** 为准。

***

### 六、排障：chunk 加载顺序错、空白页

* **manifest 与业务 chunk 不匹配**：常见于 **CDN 缓存** 只刷新部分文件 → **强缓存策略** 应对 **全量 hash 一致**。
* **`chunkLoadError`**：网络断、错误版本、**跨域** `crossOrigin` 脚本拿不到 **详细错误**。

***

### 七、小结

代码分割 = **`import()` 划界 + splitChunks 抽公共 + runtime 保缓存**。先 **量体积与请求数**，再微调 **cacheGroups**，避免 **为拆而拆**。
