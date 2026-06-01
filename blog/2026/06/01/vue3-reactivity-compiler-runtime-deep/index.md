---
url: /blog/2026/06/01/vue3-reactivity-compiler-runtime-deep/index.md
---
Vue 2 源码笔记（[defineProperty / Dep](/2020/12/17/vue-learn-defineProperty/)）讲的是 **Object.defineProperty + Dep/Watcher**；Vue 3 换成 **Proxy + effect + track/trigger**，编译器也拆成 **compiler-dom / runtime-core**。这篇给已经会用组合式 API 的开发者，补 **原理层因果链**，方便读源码、排性能 bug、写库。

***

### 一、响应式：从 reactive 到 effect

#### 1.1 核心数据结构

```text
reactive(obj)  →  Proxy handler（get/set/deleteProperty）
track()          →  当前 activeEffect 记入 target.key 的 deps
trigger()        →  通知 deps 里所有 effect 重新执行
effect(fn)       →  包装 fn，执行时设 activeEffect，收集依赖
```

与 Vue 2 对比：

| 维度 | Vue 2 | Vue 3 |
|------|-------|-------|
| 拦截方式 | defineProperty，需递归遍历 | Proxy，惰性代理嵌套对象 |
| 数组 | 重写 push/splice 等 7 个方法 | 原生数组方法 + Proxy |
| 新增属性 | 需 `$set` | 直接赋值即可 |
| 依赖收集 | Dep + Watcher | targetMap → deps → effect |

#### 1.2 ref vs reactive

* `reactive`：对象/数组走 Proxy；**解构会丢响应式**（引用拷贝）。
* `ref`：包装任意值，`.value` 读写时再 track/trigger；模板里自动解包。
* `shallowRef` / `shallowReactive`：只跟踪第一层，适合大对象或第三方实例。

**实践**：表单大对象用 `reactive`，标量/异步结果用 `ref`；从 store 解构用 `storeToRefs`（Pinia）。

#### 1.3 computed 与 watch

* **computed**：lazy effect——依赖变才重算，有缓存；setter 可选。
* **watch**：默认 lazy；`flush: 'post'` 在 DOM 更新后跑，适合测布局；`watchEffect` 立即执行且自动收集依赖。

读源码入口：`@vue/reactivity` 包，`reactive.ts`、`effect.ts`、`computed.ts`。

***

### 二、编译器：template → render function

Vue 3 编译分 **base** 与 **dom** 两层：

```text
template
  → parse（AST）
  → transform（静态提升、patchFlag、block tree）
  → generate（render + _cache）
```

#### 2.1 patchFlag 与静态提升

编译器会给动态节点打 **patchFlag**（如 TEXT、CLASS、PROPS），运行时 **只 diff 有 flag 的节点**，静态子树整块跳过。

```vue
<!-- 编译后：静态 div 被 hoist，只有 span 参与更新 -->
<div class="static">
  <span>{{ msg }}</span>
</div>
```

**排障**：生产环境若更新慢，用 Vue DevTools 或 `@vue/compiler-dom` 的 `compile()` 看生成代码里 patchFlag 是否符合预期。

#### 2.2 v-model 与事件

Vue 3 统一 **modelValue + update:modelValue**；自定义组件多 v-model 用 `v-model:title` 语法。编译器把 `v-model` 转成 props + onUpdate 事件，和手写 `:model-value` 等价。

***

### 三、运行时：组件实例与 patch

#### 3.1 挂载流程（简化）

```text
createApp(App)
  → createVNode(App)
  → renderer.render(vnode, container)
  → patch(null, vnode, container)   // 首次 mount
  → component mount → setup → render effect
```

`setup()` 在 **beforeCreate 之前** 执行；`expose()` 暴露给 ref 的方法在父组件 `$refs` 可见。

#### 3.2 patch 与 Diff

* **同层比较**：key + type 决定是否复用 DOM。
* **Fragment**：多根节点用 Fragment vnode，避免额外 wrapper。
* **Block tree**：动态节点收集到 `dynamicChildren`，更新时 **只遍历动态列表**。

与 Vue 2 双端 diff 不同，Vue 3 用 **最长递增子序列（LIS）** 优化列表移动，减少 DOM 操作。

#### 3.3 调度器 queueJob

组件更新 effect 不会同步刷 DOM，而是 **入队 microtask**，同一 tick 多次 set 只 patch 一次。`nextTick()` 等同 `Promise.then` 后读 DOM。

***

### 四、和工程实践的连接

| 现象 | 可能原因 | 应对 |
|------|----------|------|
| 大列表卡顿 | 每个 item 都是深度 reactive | `shallowRef` + 不可变替换；虚拟滚动 |
| 意外触发更新 | 解构 reactive、把 reactive 放进第三方库 | `toRefs` / 普通对象拷贝 |
| 组件不更新 | 替换数组索引未触发（极少见） | 用 splice 或新数组 |
| 内存泄漏 | watch 未 stop、全局 effect | `onScopeDispose`、组件卸载清理 |

更偏 **写法** 见 [Composables 设计模式](/2026/05/20/vue3-composables-design-patterns-deep/)；偏 **状态分层** 见 [Pinia 状态设计](/2026/05/19/vue3-pinia-state-design-patterns/)。

***

### 五、建议阅读顺序

1. 本文（Proxy + patch 总览）
2. [编译器 parse/transform/codegen](/2026/06/01/vue3-compiler-source-parse-transform-codegen/)（patchFlag 从哪来）
3. Vue 2 [Dep/响应式](/2020/12/17/vue-learn-defineProperty/) 对照迁移差异
4. [Vue2→3 迁移清单](/2026/05/20/vue2-to-vue3-migration-checklist/)
5. 官方文档 [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) 配合 `@vue/reactivity` 源码

***

### 六、一句话

Vue 3 的性能红利一半来自 **Proxy 粒度更细**，一半来自 **编译期标记 + block tree**；搞懂 track/trigger 与 patchFlag，就能解释大部分「为什么这里会/不会更新」。
