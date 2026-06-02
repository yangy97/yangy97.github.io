---
url: /blog/2026/06/01/vue3-compiler-source-parse-transform-codegen/index.md
---
[Vue 3 响应式与运行时](/2026/06/01/vue3-reactivity-compiler-runtime-deep/) 讲了 **Proxy**（属性拦截）、**patchFlag**（动态节点标记）、**patch**（虚拟 DOM 差异更新）流程；本篇专讲 **@vue/compiler-core** 流水线：**parse**（模板→AST）→ **transform**（优化 AST）→ **generate**（生成 render 函数），与 runtime 那篇 **互补**。读完后应能解释「模板里 `v-if` 为什么变成 `block` + `patchFlag`」。

***

### 一、编译在整体中的位置

```text
.vue / template 字符串
    ↓  @vue/compiler-dom（含 compiler-core）
AST → transform 插件链 → codegen
    ↓
render 函数 (_renderFn) + helper imports
    ↓  运行时 @vue/runtime-core
createVNode → patch
```

* **compiler-dom**（面向 DOM 的编译器）：HTML 特有（如 `v-html`、`style` 解析）。
* **compiler-core**（平台无关编译核心）：与平台无关的 AST、指令、表达式。
* **compiler-sfc**：`.vue` 单文件拆 script/template/style。

源码入口：`packages/compiler-core/src/compile.ts` 的 `baseCompile()`。

***

### 二、Phase 1：Parse → AST

模板字符串经 **HTML 解析器** 变成 **AST 节点树**。

常见节点类型（简化）：

| 类型 | 含义 |
|------|------|
| `ROOT` | 根 |
| `ELEMENT` | 普通元素 |
| `TEXT` | 文本 |
| `INTERPOLATION` | `{{ msg }}` |
| `COMPOUND_EXPRESSION` | 复杂表达式拼接 |

```vue
<div><p>{{ msg }}</p></div>
```

```text
ROOT
 └── ELEMENT div
      └── ELEMENT p
           └── INTERPOLATION {{ msg }}
```

**注意**：Parse 阶段 **不做** 优化，只结构化。

调试：[@vue/compiler-dom 在线](https://template-explorer.vuejs.org/) 看 AST 与生成代码（SFC 可选）。

***

### 三、Phase 2：Transform 插件链

`transform()` 按顺序跑 **nodeTransforms** 与 **directiveTransforms**，修改 AST 并注入 codegen 元数据。

核心 transform（需记名字）：

| Transform | 作用 |
|-----------|------|
| **transformElement** | 元素 → `VNodeCall`、收集 **patchFlag** |
| **transformText** | 文本合并、动态文本 flag |
| **transformExpression** | 表达式作用域、前缀 `_ctx.` |
| **transformBind** | `:prop` → props 对象 |
| **transformOn** | `@click` → onXXX 事件 |
| **transformIf / transformFor** | 控制流 → block + 嵌套 render 函数 |

#### 3.1 静态提升（hoistStatic）

纯静态子树标记 `hoistStatic`，codegen 时提到 **render 函数外**：

```javascript
const _hoisted_1 = /*#__PURE__*/ _createElementVNode("div", null, "静态", -1 /* HOISTED */);

function render(_ctx) {
  return _openBlock(), _createElementBlock("div", null, [
    _createElementVNode("span", null, _toDisplayString(_ctx.msg), 1 /* TEXT */),
    _hoisted_1,
  ]);
}
```

**效果**：静态节点 **只创建一次**，更新只 patch 动态节点。

#### 3.2 patchFlag 从哪来

`transformElement` 分析元素上 **动态 prop、动态子节点**，按位或合成 flag：

```javascript
// 示例：仅 TEXT 动态
_createElementVNode("span", null, _toDisplayString(_ctx.msg), 1 /* TEXT */)
```

常见 flag（runtime 同名）：`TEXT`、`CLASS`、`STYLE`、`PROPS`、`FULL_PROPS` 等。\
有 flag 的元素进入父节点的 **dynamicChildren** 数组（block tree）。

#### 3.3 v-if / v-for 与控制流

* **v-if**：编译为 **条件表达式** 或 **嵌套 block**，不是 runtime 里 if/else DOM 操作。
* **v-for**：生成 `_renderList` 调用，带 **fragment** 或 block children。
* Vue 3.4+ **v-if / v-for 优先级** 与 2 不同，以文档为准。

***

### 四、Phase 3：Generate

`generate()` 把 transform 后的 AST 打印为 **JavaScript 字符串**（或 SSR 字符串代码）。

输出形态：

```javascript
import { toDisplayString as _toDisplayString, openBlock as _openBlock, ... } from "vue";

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  // ...
}
```

* **`_cache`**：v-once、静态节点缓存槽。
* **`_ctx`**：组件实例 proxy（模板里 `msg` → `_ctx.msg`）。
* **helper 自动 import**：`_createElementVNode` 等从 `vue` 按需引入，利于 tree-shaking。

**SSR 模式**：`ssrCodegenTransform` 生成 `_ssrRender` 推字符串，hydration 时客户端再 patch。

***

### 五、与响应式 runtime 的衔接

```text
模板 {{ count }}
  → transform: INTERPOLATION 绑定 _ctx.count
  → render effect 执行 render()
  → 读 count → track
  → count 变 → trigger → effect 重跑 render
  → patch 时看 patchFlag，只更新 TEXT 节点
```

读 `@vue/reactivity` 的 effect 与读 compiler 的 patchFlag **要连在一起**，否则看不懂「为什么有时全树 diff、有时只改文本」。

***

### 六、自定义编译：何时需要

| 场景 | 手段 |
|------|------|
| 模板新指令 | `compilerOptions.directives` + transform |
| 宏 / compile-time 优化 | babel-plugin-jsx 式插件或 unplugin |
| 禁止某 HTML 标签 | `isCustomElement` / `isBuiltInComponent` |

一般业务 **不需要** fork compiler；用 **宏**（`defineModel`）、**组合式 API** 即可。

***

### 七、阅读源码建议顺序

1. [Template Explorer](https://template-explorer.vuejs.org/) 对照 AST / code
2. `compiler-core/src/parser` — 理解 AST 形状
3. `compiler-core/src/transform.ts` + `transforms/transformElement.ts` — patchFlag
4. `compiler-core/src/codegen` — 生成函数长什么样
5. 回到 [runtime patch](/2026/06/01/vue3-reactivity-compiler-runtime-deep/) 看 `patchBlockChildren`

Vue 2 编译对比：[vue-learn-build](/2020/11/15/vue-learn-build/)（旧笔记，架构已变，仅作历史参考）。

***

### 八、一句话

**Vue 3 编译器 = parse 成 AST → transform 标静态/动态并降维成 block → codegen 出带 patchFlag 的 render**；性能优化大半在 transform，读源码从 Template Explorer 加 `transformElement` 入手最省时间。
