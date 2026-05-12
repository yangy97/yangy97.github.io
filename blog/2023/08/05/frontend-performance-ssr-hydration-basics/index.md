---
url: /blog/2023/08/05/frontend-performance-ssr-hydration-basics/index.md
---
SSR 解决 ==首屏 HTML 与 SEO==；Hydration 解决 **把静态 DOM 变成可交互应用**。代价是：**数据一致性**、**注水主线程成本**、**运维复杂度**。本篇写：**mismatch 根因、数据单次来源、流式与 TTI、选型**。

***

### 一、Hydration mismatch 常见根因

| 根因 | 例子 |
|------|------|
| 时间/时区 | 服务端 UTC vs 客户端本地 |
| 随机 | `Math.random()`、`Date.now()` 直接渲染 |
| 环境 API | 服务端无 `window` / `localStorage`，客户端补值 |
| 数据不一致 | SSR 请求结果与 CSR 再请求不一致 |

\==缓解==：

* 强依赖浏览器的信息 **放 `onMounted`** 再渲染；
* 或 **服务端序列化 state** 注入 HTML，`pinia`/`store` hydrate **同一快照**。

***

### 二、TTI / INP：LCP 好也不够

用户要的是 **能点**。主包 2MB → parse+hydrate 仍可能 **数秒**。手段：

* **路由/组件分包**，首屏只 hydrate **当前路由**；
* **懒 hydration**（框架支持时）；
* **少在 hydration 前跑同步重逻辑**。

***

### 三、避免「SSR 拉一遍、浏览器再拉一遍」

**反模式**：HTML 里已有列表，hydrate 后又 `fetch` 同样接口 → **闪烁 + 双倍流量**。

**更好**：SSR 把 **首屏数据** 嵌进 HTML（`__INITIAL_STATE__` 或 payload），客户端 store **初始化即用**，后续再增量。

***

### 四、流式 SSR（概念）

服务端 **边生成边刷 HTML**，可 **更早 TTFB/首字节**，但 **水合顺序** 与 **脚本依赖** 要设计。Nuxt、Next 等有现成方案；自研成本高。

***

### 五、与静态资源

SSR 不减免 **图片/字体/JS 分包**；LCP 仍可能被 **大图** 卡住——继续走《网络与静态资源》《长列表与图片》。

***

### 六、选型（更新）

| 场景 | 倾向 |
|------|------|
| 内容/SEO 强依赖 | SSR 或 SSG |
| 登录后后台 | SPA + 骨架屏 常更省总成本 |
| 全球静态分发 | SSG + CDN 常优于自建 SSR 集群 |
| 仅部分页面 SEO | 选 **预渲染** 子集 |

***

### 七、收束

SSR 的敌人是 **不一致** 与 **过重客户端包**。先 **数据单一真相**，再 **拆包减 hydrate**；否则容易 **负优化**。
