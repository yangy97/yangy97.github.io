---
url: /blog/2023/08/15/frontend-performance-web-vitals/index.md
---
\==Core Web Vitals== 是 Google 推动的 **用户体验量化** 集合；**实验室（Lighthouse）** 可复现，**RUM（真实用户）** 反映网络/设备长尾。本篇写：**指标语义、与 TTFB 关系、劣化链、上报与分位、团队流程**。

***

### 一、指标速查（语义 + 常见差因）

| 指标 | 测什么 | 常见差因 |
|------|--------|----------|
| ==TTFB== | 首字节时间（偏服务端/网络） | 源站慢、冷启动、未缓存 HTML、TLS 往返 |
| **LCP** | 视口内 **最大** 内容绘制完成 | 大图晚到、阻塞 CSS/JS、字体阻塞、LCP 元素被 lazy |
| **INP** | 交互到 **下一次绘制** 的延迟（多次交互取差） | 长任务、大列表 patch、第三方占线程 |
| **CLS** | 意外布局偏移累计 | 无尺寸媒体、动态插广告、字体 swap 引起换行 |

**阈值与定义**以 [web.dev/vitals](https://web.dev/vitals/) 为准，会更新。

***

### 二、LCP：全链路视角

LCP 不只关前端：**TTFB 高** → 一切晚起步。优化常分三段：

1. **网络/HTML**：CDN、缓存、压缩、早刷 HTML（SSR/边缘）。
2. **资源发现**：`preload`、`fetchpriority`、别错误 `lazy` LCP 图。
3. **渲染阻塞**：关键 CSS、同步 JS、字体策略。

**DevTools**：Performance Insights / LCP 标记 → 点选 **LCP 元素**。

***

### 三、INP：为何比「单次 FID」更贴中后台

后台用户 **连续点表格、筛选项**，INP 关注 **最差交互**。优化：

* 减少点击路径上的 **同步排序 / JSON.parse**；
* 虚拟列表 / 分页；
* 第三方延后；
* 关注 **Long Animation Frames / LoAF**（若浏览器提供）做归因。

***

### 四、CLS：图片、广告、字体

**图片**：始终带 **width/height** 或 **aspect-ratio 容器**。\
**广告**：预留 **固定槽位**，勿在正文中间 **突然插入**。\
**字体**：`font-display: swap` 减少 FOIT，但可能 **文字跳动**——用 **尺寸匹配的 fallback** 或 **font metric overrides**（进阶）。

***

### 五、RUM：`web-vitals` + 采样 + 分位

安装：`npm i web-vitals`

```js
import { onCLS, onINP, onLCP } from "web-vitals";

const sample = Math.random() < 0.1; // 10% 采样
if (!sample) {
  /* 仍可上报轻量心跳，视隐私政策 */
}

function send(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    navigationType: performance.getEntriesByType?.("navigation")[0]?.type,
    path: location.pathname,
  });
  navigator.sendBeacon?.("/api/metrics", body) ||
    fetch("/api/metrics", { method: "POST", body, keepalive: true });
}

onLCP(send);
onINP(send);
onCLS(send);
```

**分析**：上报到 **日志/OLAP** 后算 **P75/P95**，按 **路由、设备等级、国家** 切片；**别看只有平均**。

**隐私**：不要带 **query 里的 PII**、用户输入内容。

***

### 六、实验室 vs RUM

| 场景 | 用谁 |
|------|------|
| PR 回归、同机对比 | Lighthouse（固定节流） |
| 线上谁最痛 | RUM P95 |
| 证明「某次发布」伤害 | 同版本前后 RUM 对比 |

***

### 七、与 CI

CI 里 **LCP 波动大**，更适合 **bundle size** 硬闸（见《性能预算与 CI》）；指标可用 **定时任务** 或 **发布后监控**。

***

### 八、收束

先 **定位最差的指标 + 最差页面/地区**，再下钻 DevTools；**TTFB + LCP + INP + CLS** 四条线往往要 **前后端一起算**。
