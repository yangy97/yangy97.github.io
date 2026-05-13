---
url: /blog/2022/08/11/mobile-scroll-touch-overscroll-rubber-band/index.md
---
弹层、长列表、==嵌套滚动== 在移动端组合时，问题往往不是「不会写 `overflow: auto`」，而是 **触摸事件目标**、**滚动链（scroll chaining）**、**浏览器默认手势** 三层纠缠。本篇把 **穿透、橡皮筋、误触返回** 拆开，并给出 **可组合的 CSS + JS 策略** 与 **反模式警告**。

***

### 一、滚动穿透：现象与根因

\==现象==：蒙层打开时，**手指在蒙层上滑动**，**底下的页面跟着滚**；或蒙层内列表滚到顶/底后，**继续拖动把底层带跑**。

**根因（简化模型）**：

1. **默认滚动目标** 仍是 **可滚动的 `body`** 或 **外层容器**；
2. **`touchmove` 事件** 冒泡到 **document**，浏览器按默认行为 **滚动页面**；
3. **蒙层自身** 未形成 **独立的滚动容器** 或未 **阻断链式滚动**。

***

### 二、锁 body：为什么只写 `overflow:hidden` 不够

**桌面**上 `overflow:hidden` 往往够用；**iOS Safari** 历史上存在：

* **`body` 仍可被拖动**（与 **`-webkit-overflow-scrolling`**、**fixed 子元素** 组合有关）；
* **地址栏 / 底部工具栏** 变化导致 **视口高度跳变**。

**常见「锁滚动」组合拳**（思路，非唯一）：

```js
const scrollY = window.scrollY || window.pageYOffset;

function lock() {
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
}

function unlock() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
}
```

**要点**：**记录 `scrollY`**，关闭蒙层时 **还原**，否则 **页面会跳到顶部**。

***

### 三、`touchmove` 与 `passive`

在蒙层 **外部** 监听：

```js
document.addEventListener(
  'touchmove',
  (e) => {
    if (modalOpen) e.preventDefault();
  },
  { passive: false }
);
```

**`passive: false`** 才允许 **`preventDefault`**。但 **全局禁止** 会导致 **蒙层内部列表也无法滚**。

**更稳的做法**：**只禁止「蒙层背后」的默认行为**——例如判断 **`e.target` 是否在蒙层根节点内**，或 **蒙层用 `@touchmove.stop`**（Vue）时仍注意 **内层滚动**。

**内层可滚、外层锁死** 的经典结构：

```html
<div class="mask">
  <div class="mask__panel">
    <div class="mask__scroll">…长内容…</div>
  </div>
</div>
```

```css
.mask { overflow: hidden; }
.mask__scroll {
  max-height: 70vh;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
```

***

### 四、`overscroll-behavior`：从根上减弱「链式滚动」

```css
.mask__scroll {
  overscroll-behavior: contain; /* 或 y 轴 contain */
}
```

**`contain`**：当前元素滚动到边界时，**尽量不把滚动传递给祖先**。

**`none`**：更强，可能影响 **下拉刷新** 等 **父级手势**，需 **分场景**。

**兼容性**：以 [Can I use](https://caniuse.com/css-overscroll-behavior) 为准；**老机型** 仍要 **JS 兜底**。

***

### 五、`touch-action`：把手势交给谁

```css
.carousel {
  touch-action: pan-x;
}
.list {
  touch-action: pan-y;
}
```

**典型用途**：

* **横向轮播** 与 **纵向列表** 同屏时，**限制轴向** 减少 **抖动**。
* **地图 / canvas**：`touch-action: none` 后 **自己处理** `pointer`/`touch`（成本 **高**，慎用）。

***

### 六、iOS 橡皮筋（rubber-band）与「整页晃动」

当 **内部滚动到顶** 仍继续下拉，**整页** 可能被 **整体拉动**。缓解思路：

* **内部滚动容器** 使用 **`overscroll-behavior: contain`**；
* **避免** 在 **`body` 上叠过多 `transform`**（会改变 **fixed 参照**，副作用见《安全区》篇）。

***

### 七、侧滑返回与水平手势冲突

**iOS 边缘右滑返回** 与 **业务横向滑动** 冲突时：

* **产品层**：**避开全屏横滑**；
* **技术层**：**缩小横滑热区**、**首帧判断角度**、或在 **App 内** 由客户端 **关闭系统边缘返回**（仅少数场景可行）。

Web 侧 **无法 100% 禁用系统手势**，不要承诺 **「完全不会误触返回」**。

***

### 八、`-webkit-overflow-scrolling: touch` 今昔

历史上用于 **惯性滚动**；**新版本 iOS** 行为已变化，**不要**把它当万能药。以 **实测** 为准，优先 **`overflow:auto` + `overscroll-behavior`**。

***

### 九、反模式（避免）

1. **整页 `touchmove` 无脑 `preventDefault`**：破坏 **输入框聚焦**、**地图缩放**、**系统手势**。
2. **蒙层用 `100vh` 撑满且不处理地址栏**：出现 **底部缝**（与 **dvh / fill-available** 联调）。
3. **多层嵌套 `fixed` + `transform`**：排障时 **先减层**。

***

### 十、小结

穿透 = **锁谁滚 + 是否链式滚动**；橡皮筋 = **边界行为 + overscroll**。优先 **结构 + CSS（overscroll-behavior）**，**JS 只补洞**；与《键盘》《viewport》交叉时，**同一页面模板** 做 **一次完整回归**。
