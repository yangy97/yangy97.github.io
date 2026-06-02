---
url: /blog/2026/05/23/css-tailwind-modules-scoped-selection/index.md
---
样式方案没有银弹：**Tailwind 快、CSS Modules 隔离强、Vue Scoped 省心**。本篇按 **团队规模、设计系统、是否多框架** 给选型建议。

***

### 一、对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Tailwind** | 迭代快、少命名 | HTML 类名长、需设计 token 约束 |
| **CSS Modules**（编译期局部类名）（编译期局部类名）（编译期局部类名） | 类名隔离、可 TS | 文件分散 |
| **Vue Scoped** | SFC 一体 | 深层穿透麻烦；难跨组件共享 |
| **BEM + Sass** | 老项目熟悉 | 易全局污染 |

***

### 二、Tailwind 中后台注意

* 用 `@apply` **适度**，别再造一层 CSS
* 主题色进 `tailwind.config` **与设计 token 统一**
* 与 Element Plus 并存：注意 **preflight 冲突**（可 `corePlugins: { preflight: false }` 视情况）

***

### 三、CSS Modules

```vue
<style module>
.title { font-size: 18px; }
</style>
<template>
  <h1 :class="$style.title">...</h1>
</template>
```

适合 **组件库内部** 不泄漏类名。

***

### 四、混合策略（常见）

* 布局/间距：**Tailwind**
* 组件库主题：**Design Token**（见下一篇）
* 第三方覆盖：**:deep()** 少量隔离

***

### 五、微前端

子应用 **样式隔离** 靠 qiankun shadow/CSS 前缀；Tailwind preflight 可能 **影响主应用**——子应用单独构建、注意 scope。

***

### 六、小结

选型 = **速度 vs 隔离 vs 设计系统**。移动端 CSS 见 mobile 系列；兼容性见 compatibility-css。
