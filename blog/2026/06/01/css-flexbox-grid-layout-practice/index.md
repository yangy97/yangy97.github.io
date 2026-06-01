---
url: /blog/2026/06/01/css-flexbox-grid-layout-practice/index.md
---
Tailwind 与 Design Token 文（[选型](/2023/05/23/css-tailwind-modules-scoped-selection/)、[主题](/2026/05/24/design-token-theme-dark-mode-practice/)）解决 **怎么写样式**；这篇补 **Flex / Grid 布局因果**——中后台卡片、表单、仪表盘、圣杯布局该用谁。

***

### 一、Flex vs Grid：怎么选

| 场景 | 更推荐 | 原因 |
|------|--------|------|
| 导航栏、工具条、按钮组 | **Flex** | 一维、内容驱动宽度 |
| 表单行内 label + input | **Flex** | 对齐轴清晰 |
| 整页 dashboard 分栏 | **Grid** | 二维区域命名 |
| 照片墙、固定列数卡片 | **Grid** | `repeat(auto-fill, minmax())` |
| 未知条目数横向滚动 | **Flex** + `overflow-x` | Grid 也可，Flex 更直觉 |
| 表格语义 | **`<table>`** 或组件库 Table | 别硬用 Grid 冒充表格 |

**口诀**：==一维 Flex，二维 Grid==；需要 **同时** 控行和列轨道用 Grid。

***

### 二、Flex 核心属性链

```css
.container {
  display: flex;
  flex-direction: row;      /* 主轴方向 */
  justify-content: space-between; /* 主轴对齐 */
  align-items: center;      /* 交叉轴对齐 */
  gap: 12px;
  flex-wrap: wrap;          /* 换行 */
}

.item {
  flex: 1 1 200px;          /* grow shrink basis */
  min-width: 0;             /* 允许收缩，防文本撑破 */
}
```

#### 2.1 高频坑

1. **`flex: 1` 子项文字溢出**：加 `min-width: 0` 或 `overflow: hidden`，否则 flex item 默认 `min-width: auto` 不收缩。
2. **`align-items: center` 导致多行基线乱**：多行文本块改 `align-items: flex-start`。
3. **垂直居中整页**：父 `min-height: 100vh; display: flex; align-items: center; justify-content: center;`——移动端注意地址栏高度，可用 `dvh`（见 [viewport 与 rem/vw](/2023/05/15/mobile-viewport-dpr-rem-vw-fundamentals/)）。
4. **`margin-left: auto` 推右**：单个元素靠右的经典写法（如 header 里用户菜单）。

#### 2.2 圣杯 / 双飞翼的现代写法

```css
.page {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}
.main {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
}
@media (max-width: 768px) {
  .main { grid-template-columns: 1fr; }
}
```

侧边栏 + 内容区用 **Grid 两列** 比 float 时代简单得多。

***

### 三、Grid 核心属性链

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

.card-span-8 { grid-column: span 8; }
.card-span-4 { grid-column: span 4; }

/* 响应式卡片墙 */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
```

#### 3.1 命名区域（可读性高）

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

改布局只改 **areas 字符串**，适合中后台 shell。

#### 3.2 subgrid（渐进增强）

`grid-template-columns: subgrid` 让嵌套 grid 继承父列轨道——复杂表单对齐可用；需查 [caniuse](https://caniuse.com/?search=subgrid) 决定是否降级。

***

### 四、与 Tailwind 的配合

```html
<div class="flex items-center justify-between gap-3 min-w-0">
  <span class="truncate flex-1">很长很长的标题...</span>
  <button class="shrink-0">操作</button>
</div>

<div class="grid grid-cols-12 gap-4">
  <section class="col-span-8">...</section>
  <aside class="col-span-4">...</aside>
</div>
```

Tailwind 是 **类名映射** 到上面 CSS；读不懂布局时，在 DevTools 里 **Computed → 看 flex/grid** 比背类名快。

***

### 五、中后台典型模式

| 模式 | 实现要点 |
|------|----------|
| 固定头 + 滚动内容 | 外层 `flex flex-col h-screen`，内容 `flex-1 overflow-auto` |
| 表格 + 分页贴底 | 表格外层 `flex flex-col flex-1 min-h-0`，表体 `overflow-auto` |
| 表单两列 | Grid `grid-cols-2 gap-x-6`，窄屏 `md:grid-cols-1` |
| 抽屉 / 侧栏 | 不用布局硬撑宽度，用组件库 Drawer；布局只负责主区域 |

ProTable 场景见 [动态表单与 ProTable](/2026/05/23/admin-dynamic-form-protable-patterns/)。

***

### 六、调试清单

1. DevTools **Flexbox / Grid overlay** 看轨道与 gap。
2. 找 **谁设置了固定 height** 导致 `overflow` 失效。
3. 查 **`min-width: 0` / `min-height: 0`** 是否缺失。
4. 移动端横竖屏切换是否用了 **错误的高度单位**（100vh vs 100dvh）。

***

### 七、一句话

布局问题九成是 **一维二维选错** 或 **min-size 默认值阻止收缩**；Flex 管对齐与分配剩余空间，Grid 管页面骨架与响应式列。
