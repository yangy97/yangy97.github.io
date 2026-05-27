---
url: /blog/2026/05/20/vue2-to-vue3-migration-checklist/index.md
---
Vue 2 EOL 后，存量项目迁移是 **渐进过程**，不是一夜重写。本篇给 **分阶段 checklist** 与 **高频 Breaking 对照表**，适合 Options API 老项目。

***

### 一、阶段规划

| 阶段 | 动作 | 风险 |
|------|------|------|
| 1 | 升 Vue 2.7 + `@vue/composition-api` 试水 | 低 |
| 2 | 换构建链 vue-cli → Vite | 中 |
| 3 | `@vue/compat` 跑 Vue 3 兼容模式 | 中 |
| 4 | 去 compat，Composition API 新代码 | 中 |
| 5 | 删 Vue 2 依赖、全量回归 | 高 |

\==策略==：**新功能用 Vue 3 写法；老模块触达时再改**。

***

### 二、Breaking 对照（精选）

| Vue 2 | Vue 3 |
|-------|-------|
| `new Vue()` | `createApp()` |
| `Vue.prototype.$x` | `app.config.globalProperties` |
| `filters` | 方法 / computed |
| `$listeners` | 合并进 `$attrs` |
| `v-model` 组件默认 `value` + `input` | `modelValue` + `update:modelValue` |
| 事件 API `$on/$off` | 用 mitt / pinia |
| `$children` | ref / provide |

***

### 三、UI 库

* Element UI → **Element Plus**
* Vuetify 2 → 3 大改
* 先查 **组件库迁移指南**，再动业务代码

***

### 四、Vuex → Pinia

按模块逐个迁；`mapState` 改 `storeToRefs`。见[《Pinia 状态设计》](/2026/05/19/vue3-pinia-state-design-patterns/)。

***

### 五、测试与类型

* `@vue/test-utils` v2
* 逐步加 `lang="ts"`；不必一次全 TS

***

### 六、回归清单

* \[ ] 路由守卫与动态路由
* \[ ] 全局组件/指令
* \[ ] 第三方图表、富文本
* \[ ] 微前端生命周期（若子应用）
* \[ ] E2E 核心路径

***

### 七、小结

迁移靠 **compat + 分模块 + UI 库官方指南**。Vue2 源码笔记仍可作原理阅读，见[《Vue 学习路径导读》](/2026/05/24/vue-learning-path-index/)。
