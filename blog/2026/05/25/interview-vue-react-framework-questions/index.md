---
url: /blog/2026/05/25/interview-vue-react-framework-questions/index.md
---
框架题几乎 **每面必问**。本篇按 **Vue2/3 对比、响应式、生命周期、状态、React hooks** 组织答法，并链到本站 Vue 专题。

***

### 一、Vue2 vs Vue3（总表）

| 点 | Vue2 | Vue3 |
|----|------|------|
| API | Options API 为主 | Composition API |
| 响应式 | `Object.defineProperty` | `Proxy` |
| 根节点 | 单根 | 多根 Fragment |
| 全局 API | `new Vue()` | `createApp()` |
| 状态 | Vuex | Pinia 推荐 |

迁移见 [Vue2→3 清单](/2026/05/20/vue2-to-vue3-migration-checklist/)。

***

### 二、响应式原理

**Vue2**：递归遍历 data，`get` 依赖收集，`set` 派发更新；数组变异方法 + `Vue.set`。

**Vue3**：`Proxy` 拦截 get/set/delete；支持 Map/Set；性能更好。

**追问**：`ref` vs `reactive`？

* `ref` 基本类型 / 需要 `.value`
* `reactive` 对象，解构会丢响应式 → `toRefs`

源码笔记：[defineProperty](/2020/12/17/vue-learn-defineProperty/)、[Dep](/2021/01/05/vue-learn-Dep/)。

***

### 三、生命周期

**Vue2**：beforeCreate → created → beforeMount → mounted → beforeUpdate → updated → beforeDestroy → destroyed。

**Vue3**：`beforeUnmount` / `unmounted`；setup 在 beforeCreate 之前。

**面经题**：Watcher 在哪个阶段？—— 组件 mount 过程中渲染 Watcher，依赖收集在 render 时。

***

### 四、指令与 v-model

**常问**：指令内部做了什么？\
生命周期：`bind` → `inserted` → `update` → `unbind`（Vue2 命名；Vue3 为 mounted/updated 等钩子）。

**v-model**：`:value` + `@input` 语法糖；组件上为 `modelValue` + `update:modelValue`。

手写 v-model 思路：props 接 value，emit input/update。

***

### 五、EventBus

Vue2 常用 `new Vue()` 作 bus；Vue3 推荐 **mitt** 或 Pinia。\
说清楚 **订阅要 off**，否则泄漏。

***

### 六、Vuex / Pinia

**Vuex**：state / getters / mutations（同步）/ actions（异步）/ modules。

**Pinia**：无 mutations，store 即 module。见 [Pinia 状态设计](/2026/05/19/vue3-pinia-state-design-patterns/)。

***

### 七、React Hooks（SHEIN/CVTE 问过）

| Hook | 作用 |
|------|------|
| useState | 状态 |
| useEffect | 副作用，依赖数组控制 |
| useMemo/useCallback | 缓存 |
| useRef | DOM / 可变值不触发渲染 |

**useEffect vs mounted**：严格模式会双调用；清理函数在 unmount 执行。

本站 React 入门：[React + Vite 结构](/2026/05/24/react-vite-project-structure-basics/)。

***

### 八、发布订阅（富途）

EventEmitter 模式：on / emit / off。\
Vue 响应式、EventBus、DOM 事件都可往这套解释。

***

### 九、小结

答框架题 **先对比表，再原理一句，再项目里怎么用**。深入读 [Vue 学习路径导读](/2026/05/24/vue-learning-path-index/)。
