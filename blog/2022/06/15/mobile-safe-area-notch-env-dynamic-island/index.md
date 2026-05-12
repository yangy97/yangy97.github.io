---
url: /blog/2022/06/15/mobile-safe-area-notch-env-dynamic-island/index.md
---
\==Safe Area== 是系统在 **刘海、圆角、Home 指示条、横屏摄像头侧** 等区域外，给内容留出的 **「可安全渲染」矩形**。Web 侧通过 **`env(safe-area-inset-*)`** 读取 **四边内边距**。本篇从 **前置条件、写法、fixed 场景、横竖屏、Android WebView** 分层写深，避免「抄了 padding 仍被挡」。

***

### 一、为什么你写了 `padding` 仍无效：三个前置条件

\==1）`viewport-fit=cover`==

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

若仍是默认 **`auto`**，页面 **不延伸到圆角外**，浏览器可能 **不把 inset 暴露给你**（表现为 **env 全是 0**）。

**2）背景是否真的铺满**

**`env()` 解决的是「内容与系统手势冲突」**，不是自动帮你 **把背景画满**。全屏头图常要 **`background-size: cover` + 合理 `background-position`**，再单独给 **前景内容** 加 **safe-area padding**。

**3）是否在「全屏」容器里算 inset**

在 **嵌套 `transform` 的父级** 里，`fixed` 子元素的包含块可能被改变（CSS 规范中的 **containing block** 规则），表现为 **safe-area 与预期不符**。排障时先 **简化 DOM**：**底栏是否直接挂在 body 下**？

***

### 二、`constant()` 与 `env()`：兼容写法怎么排

早期 iOS 用 **`constant()`**，后统一为 **`env()`**。稳妥写法是 **同一属性写三遍**（后写覆盖前写）：

```css
.page {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
```

**与 `calc` 组合**（业务里最常见）：

```css
.toolbar {
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}
```

**注意**：`env()` 在 **不支持** 的浏览器中会 **整条声明失效**（取决于解析规则），关键页面可 **再叠一层纯 px 兜底**：

```css
.toolbar {
  padding-bottom: 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}
```

***

### 三、四个 inset 分别在什么场景变大

| 边 | 典型场景 |
|----|----------|
| **top** | 刘海、状态栏区域、**Dynamic Island** 周边（机型与系统版本相关）。 |
| **bottom** | **Home 指示条**、横条手势区；**随「是否全屏视频、游戏模式」变化**。 |
| **left / right** | **横屏**、**摄像头在长边** 的机型；**全屏视频** 时可能单侧 inset 很大。 |

**结论**：**不要**把「底部安全区」写死成 **34px** 这类魔法数；**必须**用 `env` 或 **运行时读取**（降级方案）。

***

### 四、fixed 底栏：三种常见结构

**结构 A：整块背景延伸，内容区内缩（最稳）**

```html
<footer class="bar">
  <div class="bar__inner">按钮文案</div>
</footer>
```

```css
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  /* 背景可以铺到屏幕最底（含指示条区域） */
  background: linear-gradient(transparent, rgba(0,0,0,.6));
  padding-bottom: env(safe-area-inset-bottom);
}
.bar__inner {
  padding: 12px 16px;
}
```

**结构 B：伪元素专门铺「底下那条」**\
适合 **背景要顶满、但中间按钮不贴底** 的视觉稿：用 **`::after` 增高** 或 **负 margin** 拉背景，**真正可点区域** 仍在 **safe-area 内**（实现细节按设计调，核心是 **分层**）。

**结构 C：安全区用独立占位 div**\
在 **flex 列布局** 里，底部 **`flex-shrink:0` 的 spacer** 高度为 **`env(safe-area-inset-bottom)`**，主内容区 **`padding-bottom` 不再重复加**，避免 **双倍留白**——团队内 **只能选一种约定**。

***

### 五、横屏与弹窗

**横屏视频 / 游戏 H5**：左右 **inset** 可能 **不对称**，弹窗 **`width: 90vw`** 仍可能 **贴摄像头侧**，需要 **`max()` 与 inset 联用** 或 **媒体查询横屏单独加 padding**。

```css
@media (orientation: landscape) {
  .dialog {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
}
```

***

### 六、Android 与混合容器

* **Chrome Android**：对 **cutout（刘海）** 的支持 **随版本前进**，仍建议 **真机清单**。
* **微信内置浏览器 / 各家 WebView**：**不一定** 完整实现 **viewport-fit** 与 **env**；常见降级：

```js
function safeAreaBottomFallback() {
  // 仅示例：用 CSS env 优先；若无 env，可结合 UA + 已知机型表（维护成本高，慎用）
  const div = document.createElement('div');
  div.style.paddingBottom = 'env(safe-area-inset-bottom)';
  document.body.appendChild(div);
  const pb = getComputedStyle(div).paddingBottom;
  document.body.removeChild(div);
  return parseFloat(pb) || 0;
}
```

更现实的做法：**关键页面** 在 **业务 WebView** 里由 **客户端注入 safeAreaInsets**（JSON），H5 **以客户端为准**。

***

### 七、验收清单（建议）

* \[ ] **竖屏**：底栏 **最后一条可点元素** 是否在 **指示条之上**？
* \[ ] **横屏**：左右是否 **被摄像头/圆角遮挡**？
* \[ ] **弹层全屏**：**顶部状态栏/刘海** 是否仍可读？
* \[ ] **iOS 低版本 + Android 国产机** 各抽一台 **冒烟**。

***

### 八、收束

安全区 = **`viewport-fit=cover`** + **`env(safe-area-inset-*)`** + **正确的层叠结构**。和《viewport》篇连读：**先保证视口模型对，再谈 inset**；和《键盘》篇连读：**键盘弹起后底部 inset 与可视区会一起变**，必要时 **VisualViewport** 补刀。
