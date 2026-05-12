---
url: /blog/2022/07/23/mobile-keyboard-visualviewport-input-fixed/index.md
---
软键盘问题本质是：==谁改变了「可见区域」==、**谁在改 `scroll`**、**`fixed` 相对谁定位**。仅记「监听 resize」往往不够，需要 **VisualViewport**、**延迟滚动**、**与 App 容器的约定** 一起看。本篇按 **现象 → 原因 → 对策 → 伪代码** 写深。

***

### 一、三个容易混淆的现象

| 现象 | 常见诱因（简化） |
|------|------------------|
| ==聚焦后整页跳一下== | 浏览器 **`scrollIntoView`** 想把 input 放进可视区；与 **你自己的 scrollTop** 抢控制权。 |
| **fixed 底栏盖住输入框** | 键盘占用高度后，**视觉视口** 变小，但 **fixed 仍相对布局视口**，**底部参照** 未随键盘上移。 |
| **收起键盘后页面「半截空白」或无法滚动** | **iOS** 上 **视口高度缓存错误**、**overflow 锁死**、**100vh 与动态工具栏** 组合问题。 |

***

### 二、Layout / Visual / VisualViewport API

**布局视口**：整页布局的「大画布」。\
**视觉视口**：屏幕上 **当前能看到的窗口**（会随缩放、键盘、地址栏变化）。

**VisualViewport**（现代浏览器）提供：

* **`visualViewport.height` / `.width`**：当前 **视觉视口** 尺寸。
* **`visualViewport.offsetTop` / `.offsetLeft`**：相对 **布局视口** 的偏移（地址栏、缩放等会引起变化）。
* **事件**：`resize`、`scroll`（视觉视口相对布局视口移动时）。

**示例：打印键盘大致是否弹出（仅启发式）**

```js
let lastInnerHeight = window.innerHeight;

function onVVChange() {
  const vv = window.visualViewport;
  if (!vv) return;
  const h = vv.height;
  const delta = lastInnerHeight - h;
  // delta 大且聚焦在 input 上时，多数情况与键盘相关（非绝对）
  lastInnerHeight = window.innerHeight;
  console.log('vv.height', h, 'offsetTop', vv.offsetTop);
}

if (window.visualViewport) {
  visualViewport.addEventListener('resize', onVVChange);
}
```

**注意**：**地址栏显隐** 也会改 `vv.height`，不能 **单靠高度差** 判断键盘，需结合 **`document.activeElement`**、**`focusin`** 等。

***

### 三、fixed 底栏 + 输入框：推荐结构策略

**策略 1：少用「整页 fixed 底栏」**\
改为：**主列滚动 + 底部区域 `sticky`** 或 **输入区与列表同处一个 flex 列**，键盘顶起时 **自然留在列尾**，减少 **双视口错位**。

**策略 2：必须用 fixed 时，用 vv 抬高度**

思路：监听 **`visualViewport.resize`**，把 **底栏 `bottom`** 设为 **`键盘占用高度` 的近似值**。

```js
function keyboardOverlapHeight() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  // 近似：布局高度与视觉高度之差（需按页面实测调）
  const layoutH = window.innerHeight;
  return Math.max(0, layoutH - vv.height - vv.offsetTop);
}

function syncFooter() {
  const el = document.querySelector('.js-footer');
  if (!el) return;
  const overlap = keyboardOverlapHeight();
  el.style.transform = `translateY(-${overlap}px)`;
}

if (window.visualViewport) {
  visualViewport.addEventListener('resize', syncFooter);
  visualViewport.addEventListener('scroll', syncFooter);
}
```

**说明**：上面是 **思路演示**，真实项目要处理 **无 vv 的降级**、**节流**、**与 iOS 橡皮筋冲突**（见《滚动》篇）。

***

### 四、聚焦时滚动：`scrollIntoView` 的正确打开方式

```js
input.addEventListener('focus', () => {
  requestAnimationFrame(() => {
    input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
});
```

**要点**：

* **加 `requestAnimationFrame` / `setTimeout(0, …)`**：等 **键盘动画开始** 后再滚，减少 **抢跑**。
* **`block: 'center'`**：比 `'nearest'` 更少 **「刚好压在键盘边」**。
* **安卓与 iOS** 行为不同，需 **真机** 调参。

***

### 五、iOS 「收起键盘后留白」常见修补

**现象**：键盘关闭后，**页面底部出现一块空白**，**滚动区域异常**。

**常见修补（择一或组合）**：

```js
window.addEventListener('focusout', () => {
  setTimeout(() => {
    window.scrollTo(0, Math.min(document.documentElement.scrollTop, document.body.scrollTop));
  }, 100);
});
```

或 **`blur` 后强制 `document.body.style.height = 'auto'`**（视具体 bug 而定）。这类修补 **依赖系统版本**，应 **灰度** 并 **记录 UA**。

***

### 六、300ms、fastclick、以及现代浏览器

早期 **点击穿透** 与 **300ms 延迟** 让 **fastclick** 流行；如今 **多数移动浏览器已优化**，引入 fastclick 可能带来 **误拦截、与手势库冲突**。新项目 **优先不引**；老项目 **按机型逐步下线**。

***

### 七、与 App 内 WebView 的协作

**最佳实践**：由 **客户端** 提供：

* **键盘高度**（原生事件）；
* **安全区**；
* **是否透明导航栏**。

H5 **以桥接数据为准**，比 **纯 Web 猜键盘** 稳得多。

***

### 八、排障顺序建议

1. **是否只在 iOS / 只在 Android？** 缩小 **浏览器内核** 范围。
2. **是否只在 `fixed` 页面？** 先 **改结构** 再写补丁。
3. **`visualViewport` 是否存在？** 无则 **降级** 为 **`window.innerHeight` + resize**。
4. **第三方输入法** 是否复现？**搜狗 / 讯飞** 与 **系统键盘** 行为常不一致。

***

### 九、收束

键盘问题没有 **一行万能代码**，但有 **稳定策略**：**优先结构** → **再用 VisualViewport 补** → **最后才上 focus/blur 黑魔法**。与《viewport》《安全区》连读：**100vh、safe-area、键盘** 三者会 **叠加**，上线前用 **同一套页面模板** 做 **回归**。
