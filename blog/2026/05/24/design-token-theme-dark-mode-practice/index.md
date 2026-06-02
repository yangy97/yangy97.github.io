---
url: /blog/2026/05/24/design-token-theme-dark-mode-practice/index.md
---
换肤不是「多写一套 CSS」，而是 **Token 语义化 + CSS 变量运行时切换**。本篇给 **颜色/间距/圆角 token 层** 与 **暗色模式**（prefers-color-scheme / class 切换）（prefers-color-scheme / class 切换）（prefers-color-scheme / class 切换） 落地方式（与 Plume 博客换肤思路相通）。

***

### 一、Token 分层

```css
:root {
  --color-brand: #2563eb;
  --color-bg: #ffffff;
  --color-text: #1f2937;
  --radius-md: 8px;
  --space-md: 16px;
}

[data-theme='dark'] {
  --color-bg: #0f172a;
  --color-text: #e2e8f0;
}
```

组件只用 **语义变量**，不写死 `#2563eb`。

***

### 二、与 UI 库集成

Element Plus：

```scss
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': ('base': var(--color-brand)),
  ),
);
```

***

### 三、切换实现

```typescript
function setTheme(mode: 'light' | 'dark') {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem('theme', mode);
}
```

监听 `prefers-color-scheme` 作 **跟随系统** 选项。

***

### 四、Design Token 仓库

Monorepo 中 `packages/tokens` 导出 JSON + CSS：

```json
{
  "color": { "brand": { "light": "#2563eb", "dark": "#3b82f6" } }
}
```

CI 生成各端产物（Web/小程序 rpx 换算另议）。

***

### 五、无障碍

对比度 **WCAG AA**；暗色不只反转颜色，要 **单独调 border/shadow**。

***

### 六、小结

换肤 = **语义 token + CSS 变量 + data-theme**。Tailwind 选型见前一篇。
