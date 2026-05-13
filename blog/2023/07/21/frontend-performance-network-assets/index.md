---
url: /blog/2023/07/21/frontend-performance-network-assets/index.md
---
首屏时间 ≈ ==下载时间 + 解析/执行时间==（仍简化，但足够指导排期）。网络层优化的核心是：**更少字节、更少关键路径往返、更合理的缓存与优先级**，以及 **别把「可异步」的东西放在关键路径上**。下面分 **原理 → 反例/正例 → 构建与网关 → 排障**。

***

### 一、关键请求链（Critical Request Chain）在说什么

Lighthouse 里的 ==CRC== 指：HTML → 再拉 CSS/JS → JS 再动态 import 另一坨……**串行深度** 越大，首屏越晚。优化方向：

* **减少链长度**：合并「首屏真需要」的资源，或 **inline 极小关键 CSS**（注意缓存策略）。
* **拓宽并行度**：HTTP/2 多路复用、域名分片（HTTP/2 下通常 **不再推荐** 盲目拆域，除非有独立 CDN 或证书限制）。
* **提高关键资源优先级**：`preload`、`fetchpriority`、别把 LCP 图 lazy。

***

### 二、HTTP/1.1 vs HTTP/2 vs HTTP/3（选型直觉）

| 协议 | 直觉 |
|------|------|
| HTTP/1.1 | 同域 **并发连接数受限**，小文件碎片化会放大 RTT |
| HTTP/2 | **多路复用** 单连接，仍可能 **队头阻塞在 TCP 层** |
| HTTP/3（QUIC） | 丢包时 **不阻塞其它流**，弱网更友好；需 CDN/网关支持 |

**实践**：静态资源走 **HTTPS + HTTP/2 或 3**；合并请求要 **适度**——单文件过大反而阻塞解析。

***

### 三、体积：从「引入方式」开始的例子

**反例：整包 lodash**

```js
import _ from "lodash";
_.chunk(arr, 2);
```

**更好：按需 ES 模块**

```js
import chunk from "lodash/chunk";
```

若全项目大量用到 lodash API，评估 **是否换原生 / 自己封装 2～3 个函数**，减少 **供应链体积**。

**反例：UI 库全量注册**

```js
import ElementPlus from "element-plus";
app.use(ElementPlus);
```

更好是按文档做 **按需**（`unplugin-vue-components` + resolver 等），并 **审计** 实际引用组件数。

***

### 四、代码分割：路由级 + 组件级（Vue）

**路由：**

```js
{
  path: "/report",
  component: () => import("@/views/Report.vue"),
}
```

**组件内重型子树：**

```vue
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
const Chart = defineAsyncComponent({
  loader: () => import("./HeavyChart.vue"),
  delay: 200,
  timeout: 15000,
});
</script>
```

`delay`/`timeout` 可按 UX 调整，避免 **白块闪烁过久**。

**Vite 批量懒加载（按目录）：**

```ts
const modules = import.meta.glob("./views/**/*.vue");
// 用于菜单驱动路由时按需注册
```

***

### 五、Vite：`manualChunks` 与缓存策略

把 **少变** 的 vendor 与 **常变** 的业务分开，用户发版时 **浏览器可只下新业务 chunk**：

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("vue")) return "vue-vendor";
          if (id.includes("echarts")) return "echarts";
          return "vendor";
        },
      },
    },
  },
});
```

**注意**：`manualChunks` 过细 → **请求数暴涨**；过粗 → **缓存命中差**。用 **rollup-plugin-visualizer** 看产物再调。

***

### 六、资源提示：`preload` / `prefetch` / `preconnect` / `modulepreload`

| 指令 | 典型用途 | 误用后果 |
|------|----------|----------|
| `preconnect` | 提前建连第三方域（DNS+TLS） | 过多浪费连接 |
| `preload` | **本页关键** LCP 图、字体、关键 JS | 抢带宽，拖其它资源 |
| `prefetch` | **下一跳可能用** 的低优先级预取 | 浪费用户流量 |
| `modulepreload` | ES module 图里 **马上要执行** 的入口 | 与 `defer` 脚本配合要理清 |

**LCP 图 preload 示例**（路径替换为真实）：

```html
<link
  rel="preload"
  as="image"
  href="/hero.webp"
  imagesrcset="/hero-800.webp 800w, /hero-1200.webp 1200w"
  imagesizes="100vw"
/>
```

**字体**（影响首屏文字时）：

```html
<link rel="preload" as="font" href="/fonts/Inter.woff2" type="font/woff2" crossorigin />
```

***

### 七、脚本：`defer` / `async` / `type="module"`

```html
<script defer src="/app.js"></script>
<script async src="https://third-party/analytics.js"></script>
```

* **`defer`**：顺序执行，在 `DOMContentLoaded` 前；适合 **依赖 DOM 的业务包**。
* **`async`**：下载完尽快跑，**顺序不保证**；适合独立统计。
* **`type="module"`**：默认 **defer 语义**（经典脚本规则略有差异，以 MDN 为准）。

**反模式**：大业务包无 `defer/async` 塞在 `<head>` **中间**，阻塞 HTML 解析。

***

### 八、缓存：静态 hash 资源 vs HTML（Nginx 示意）

```nginx
location ~* \.(js|css)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
location = /index.html {
  add_header Cache-Control "no-cache";
}
```

**原则**：`index.html` 是 **版本指针**，应短缓存或协商；`*.[hash].js` 可 **immutable**。

**API**：`ETag` + `Cache-Control: private` 或短 `max-age`，避免 **错误缓存用户私有数据**。

***

### 九、第三方脚本治理（工程化）

* **清单化**：每个脚本有 owner、加载时机、超时策略。
* **延迟**：`requestIdleCallback` / 首次交互后 / 路由进入某页再加载。
* **子资源完整性（SRI）**：若脚本托管在第三方，考虑 `integrity`（需版本钉死）。

***

### 十、排查顺序（实操）

1. **Network**：按 **Size** 排序；看 **Waterfall** 是否串行；**Initiator** 追谁拉谁。
2. **Coverage**：首屏未执行比例。
3. **构建**：`vite build --report` 或 visualizer，看 **chunk 图**。
4. **对比**：同样页面，**禁用缓存** vs **二次访问**，验证 CDN 与 `immutable`。

***

### 十一、与其它篇

* 主线程：《JavaScript 与加载》
* 指标：《Web Vitals 与监控》
* 图片：《长列表与图片》

***

### 十二、小结

先 **量体积与关键链**，再谈技巧。多数首屏问题落在：**分包 + 缓存 + 关键资源优先级 + 第三方治理** 四件事上。
