---
url: /blog/2023/07/31/frontend-performance-render-paint/index.md
---
渲染管线（再简化仍有用）：==Style → Layout → Paint → Composite==。\
**Layout（重排）** 最贵：**几何信息**变了就要重新排版；**Paint** 次之；**Composite** 常由 **GPU** 完成，成本相对可控。下面写 **强制布局、层与合成、contain、滚动与动画** 的深度与例子。

***

### 一、哪些属性会触发布局 / 绘制 / 合成（直觉表）

| 你改了什么 | 常触发 |
|------------|--------|
| width/height/top/left、文字内容 | Layout → Paint → Composite |
| color、background（非 transform 动画） | Paint → Composite |
| transform、opacity（多数情况） | Composite（理想路径） |

\==经验==：动画优先 **`transform` + `opacity`**；避免每帧改 **`width`/`height`/`top`**。

***

### 二、强制同步布局（Forced Layout）详解

浏览器本可 **批量** 提交 DOM/CSS 变更，再在下一帧统一算布局；但 JS **读** `offsetWidth`、`scrollHeight`、`getBoundingClientRect()` 等时，必须先拿到 **最新布局**，于是 **强制提前 flush**——这就是 **强制同步布局**。

**典型反例：**

```js
const boxes = document.querySelectorAll(".box");
for (let i = 0; i < boxes.length; i++) {
  boxes[i].style.width = boxes[i].offsetWidth + 10 + "px";
}
```

**更好：先读后写**

```js
const widths = [...boxes].map((el) => el.offsetWidth);
boxes.forEach((el, i) => {
  el.style.width = widths[i] + 10 + "px";
});
```

**再进阶**：把「写」合并到 **`requestAnimationFrame`**，与显示器刷新对齐。

***

### 三、`transform` 动画 vs `top/left`（示例）

**易触发 Layout：**

```css
.ball {
  position: absolute;
  top: var(--y);
}
```

**倾向只走合成：**

```css
.ball {
  transform: translateY(var(--y));
}
```

`will-change: transform` 可提示浏览器 **提前提升层**，动画 **结束务必移除**，避免层泛滥占显存。

***

### 四、合成层（Layers）与「层爆炸」

**提升层**的常见条件：`transform`、`opacity`、`will-change`、`<video>`、`<canvas>`、`position:fixed` 等（具体以浏览器实现为准）。\
**层太多**：显存涨、合成成本涨。架构上避免 **成百上千** 个独立层（例如列表每项 `will-change`）。

**DevTools → Layers**：看是否异常分层。

***

### 五、CSS `contain`：隔离重排/重绘范围

```css
.card {
  contain: layout paint;
}
```

适合 **卡片内部频繁变**、但 **不影响外部布局** 的模块；可减少 **整页失效范围**。需 **实测**，错误 `contain` 会裁切溢出或影响 `position:fixed` 子元素。

***

### 六、滚动：节流、passive、`IntersectionObserver`

**反例：scroll 里读布局 + setState**

```js
window.addEventListener("scroll", () => {
  measureEverything();
  updateReactOrVueState();
});
```

**更好：**

```js
window.addEventListener(
  "scroll",
  throttle(() => {
    /* 少读布局 */
  }, 100),
  { passive: true }
);
```

进入视口才加载：

```js
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) loadHeavyWidget(e.target);
    });
  },
  { rootMargin: "200px" }
);
```

***

### 七、`content-visibility` 与长页面

```css
.section {
  content-visibility: auto;
  contain-intrinsic-size: 800px;
}
```

**离屏**区块可跳过大量布局/绘制；`contain-intrinsic-size` 减轻滚动条跳动。上线前测 **CLS** 与 **可访问性**（屏幕阅读器、锚点滚动）。

***

### 八、FLIP（可选进阶）

列表重排动画可用 **First-Last-Invert-Play**：先记旧位置，再记新位置，用 `transform` 补间——避免动画过程中 **反复 Layout**。实现略长，适合对动效要求高的列表。

***

### 九、DevTools 看什么

* **Performance**：紫色 **Layout / Recalculate Style** 占比；长 Task。
* **Rendering → Paint flashing**：滚动时 **绿屏面积大** → 重绘范围大。
* **Performance → Experience → Layout shifts**：CLS 与元素归因（新版 Chrome）。

***

### 十、与列表

大 DOM + 滚动 = Layout 高频：请 **虚拟列表**（见《长列表与图片》）。

***

### 十一、收束

卡顿优先查：**强制布局循环**、**每帧改布局属性动画**、**scroll 高频重活**。用 Performance **紫色条** 与 **Paint flashing** 验证，再改代码。
