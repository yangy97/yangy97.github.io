---
url: /blog/2026/05/24/vue-learning-path-index/index.md
---
`01-前端核心` 里既有 **js-learn 红宝书笔记**，也有 **Vue2 源码**，还有 **Vue3 工程化** 新文。本篇帮你 **按目标选读**，避免在源码里迷路或重复读同一知识点。

***

### 一、三条线

```text
A. JavaScript 基础 ──► js-learn / ES6 系列
B. Vue 原理       ──► vue-learn-* 源码笔记
C. Vue 3 工程     ──► composition / pinia / router / TS
```

可以 **A → C 并行**；B 适合想搞懂响应式时按需翻。

***

### 二、路径 A：JavaScript（面试 + 日常）

| 阶段 | 推荐 |
|------|------|
| 语法基础 | js-learn 系列、ES6 模块/Promise 四篇 |
| 异步 | promise、paralle-request |
| DOM/BOM | js-learn-DOM、js-learn-event |

标签：[红宝书整理](/posts/tags/?tag=%E7%BA%A2%E5%AE%9D%E4%B9%A6%E6%95%B4%E7%90%86)

***

### 三、路径 B：Vue 2 源码（理解用）

顺序建议：**init → Dep/响应式 → render → mounted → build**

* [vue-learn-init](/2020/11/28/vue-learn-init/)
* [defineProperty / Dep](/2020/12/17/vue-learn-defineProperty/)
* [render](/2020/10/03/vue-learn-render/)
* [mounted](/2020/11/10/vue-learn-mounted/)

\==不必== 全背；配合 Vue 3 文档对照 **迁移差异**（见 [Vue2→3 迁移清单](/2026/05/20/vue2-to-vue3-migration-checklist/)）。

***

### 四、路径 C：Vue 3 工程（工作直接用）

| 顺序 | 文章 |
|------|------|
| 1 | [Vue + Vite 项目结构](/2022/05/09/vue-vite-project-structure/) |
| 2 | [组合式 API 模式](/2022/04/20/vue3-composition-api-patterns/) |
| 3 | [Composables 深入](/2026/05/20/vue3-composables-design-patterns-deep/) |
| 4 | [Pinia](/2026/05/19/vue3-pinia-state-design-patterns/) |
| 5 | [Router 权限](/2026/05/20/vue-router4-permission-dynamic-menu/) |
| 6 | [TypeScript 配置](/2026/05/20/typescript-frontend-project-setup-strict/) + [Vue+TS](/2026/05/21/vue-typescript-props-emit-component-types/) |
| 7 | [Vitest 测试](/2026/05/21/vitest-vue-test-utils-zero-to-one/) |

***

### 五、与全站其他目录的衔接

* **构建**： [构建与工程化专题目录](/posts/categories/?id=cce9da)
* **性能**：[性能优化标签](/posts/tags/?tag=%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96)
* **微前端**：[微前端标签](/posts/tags/?tag=%E5%BE%AE%E5%89%8D%E7%AB%AF)
* **中后台架构**：[08-架构](/posts/categories/) 下 RBAC + 动态表单

***

### 六、React 读者

仅维护 React 子应用时读 [React + Vite 结构](/2026/05/24/react-vite-project-structure-basics/) 即可。

***

### 七、小结

**上班写 Vue 3 → 走路径 C**；**补 JS 底子 → 路径 A**；\*\* curiosity 驱动 → 路径 B 挑章读\*\*。
