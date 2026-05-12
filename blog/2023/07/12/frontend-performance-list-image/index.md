---
url: /blog/2023/07/12/frontend-performance-list-image/index.md
---
长列表的本质矛盾：==DOM 数量 ∝ 数据行数==，而布局/绘制/ diff 成本随 DOM 涨。**图片**则是 **字节 × 解码 × 优先级**：LCP 候选若被排到队尾，首屏体验直接崩。下面写 **虚拟滚动原理、变高行、图片与 CLS、Vue 注意点**。

***

### 一、虚拟滚动：固定行高（最易实现）

视口高 `H`，行高 `h`，缓冲 `b`，总行数 `N`：

```js
function range(scrollTop, H, h, b, N) {
  const start = Math.max(0, Math.floor(scrollTop / h) - b);
  const visible = Math.ceil(H / h) + 2 * b;
  const end = Math.min(N, start + visible);
  return { start, end };
}
```

列表容器用 ==`padding-top` + `padding-bottom`== 或 **transform 平移** 制造「总长滚动条」，中间只挂载 `end-start` 个节点。

**库**：`vue-virtual-scroller`、`@tanstack/vue-virtual` 等；自研前先确认 **是否真要造轮子**。

***

### 二、变高行：为什么难

每行高度依赖内容 → 必须用 **前缀和** 或 **二分** 查 `scrollTop` 落在哪一段，并 **缓存已测量高度**。实现复杂度远高于固定行高。

**产品侧**：能 **固定行高** 就固定；必须变高时 **限制最大行高** + 「展开」再测高。

**二分查找 scrollTop 对应 index（示意）：**

```js
// heights[] 为每行高度，prefix[i] = sum(heights[0..i-1])
function findIndex(prefix, scrollTop) {
  let lo = 0,
    hi = prefix.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (prefix[mid] <= scrollTop) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
```

***

### 三、Vue：一万条 `v-for` 必炸

```vue
<!-- 反例 -->
<div v-for="item in allRows" :key="item.id"><Row :data="item" /></div>
```

应：**分页**、**虚拟列表**，或后端 **游标分页** + 前端只持当前窗口数据。

**`:key`**：列表会插入/重排时 **不要用 index**：

```vue
<div v-for="row in rows" :key="row.id">
```

***

### 四、图片：格式、尺寸、解码

| 格式 | 适用 |
|------|------|
| AVIF | 照片优先（体积小，解码略重） |
| WebP | 兼容与体积折中 |
| PNG | 透明、简单 UI |
| JPEG | 老环境回退 |

**`decoding`**：

```html
<img src="/a.jpg" alt="" width="600" height="400" decoding="async" />
```

首屏 LCP 图有时可考虑 `decoding="sync"`（需 A/B，可能抢主线程）。

***

### 五、响应式图片：`<picture>` + `srcset`

```html
<picture>
  <source
    type="image/avif"
    srcset="/h-800.avif 800w, /h-1200.avif 1200w"
    sizes="(max-width: 600px) 100vw, 1200px"
  />
  <source
    type="image/webp"
    srcset="/h-800.webp 800w, /h-1200.webp 1200w"
    sizes="(max-width: 600px) 100vw, 1200px"
  />
  <img src="/h-1200.jpg" alt="" width="1200" height="630" />
</picture>
```

CDN 常见：`?w=800&q=75` 动态裁切，注意 **缓存键** 与 **签名**。

***

### 六、懒加载与 LCP 的冲突

```html
<img src="/below.jpg" alt="" loading="lazy" width="800" height="600" />
```

**首屏 Hero / LCP 候选** 不要用 `lazy`，否则浏览器 **降低优先级**，LCP 变差。应对：**`fetchpriority="high"`**（支持时）+ `preload`（见《网络与静态资源》）。

***

### 七、CLS：占位与 `aspect-ratio`

```html
<div class="wrap" style="aspect-ratio: 16/9; background: #f0f0f0">
  <img class="cover" src="/x.jpg" alt="" />
</div>
```

```css
.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

***

### 八、构建期图片管线（概念）

* `vite-imagetools`、`sharp` 构建多规格；
* **不要**把 4000px 原图丢给 CSS `width:300px` 硬缩——浪费字节与解码。

***

### 九、收束

列表：**减 DOM**（虚拟或分页）；图片：**减字节 + 正确优先级 + 控 CLS**。三件事比换皮肤主题更能救性能。
