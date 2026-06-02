---
url: /blog/2022/09/17/es6-module-live-binding-and-dynamic-import/index.md
---
## `import` 不是「拷贝一份快照」

ESM 的 `export`/`import` 之间是 ==live binding（活的绑定）==：导出端改名，导入端读到的也是**最新值**（在合法用法内）。这和一些人心里「require 拷了一份」的模型不同。

```js
// counter.js
export let count = 0
export function inc() { count++ }

// main.js
import { count, inc } from './counter.js'
inc()
console.log(count) // 1
```

**注意**：你不能在导入方对 live binding **赋值**（只读视图），否则语法或运行时会拦截。

## `export default` 与具名导出的心智模型

* `default` 本质是模块里的一个**命名槽位**，绑定的可能是函数、类、对象或字面量。
* `import foo from './m.js'` 里的 `foo` **只是本地绑定名**，和导出侧名字无关。

混淆点：**重新导出**时 `export { x as default }` 与 `export default x` 在工具和 tree-shaking 上的提示路径可能不同，排查打包问题时值得留意。

## 循环依赖：为什么「能跑但有时是 undefined」

A 引 B，B 又引 A 时，执行顺序取决于**谁先被求值**。某一侧可能在对方 **`export` 尚未初始化** 时就读取，得到 **TDZ 报错** 或暂时性的 **`undefined`**（取决于访问的是 default 包装对象还是尚未填上的绑定）。

工程上 mitigation：

* 把共享状态抽到**第三模块** C，A/B 都只依赖 C。
* 把相互引用改成**运行时**再取（例如函数内部 `import()` 或延迟 `require`——在 ESM 里更偏向**动态 import** 或事件驱动初始化）。
* 避免在模块顶层执行**副作用 + 立刻读对向导出**。

## 动态 `import()`——不常写但很有用

```js
const mod = await import('./heavy.js')
mod.init()
```

* 返回 **Promise**，适合**按路由、按需、减首包**。
* 在非 async 函数里可以用 `.then`，要注意错误边界。
* **完全静态**的可分析性会变差，但对有意拆 chunk 的场景是正常用线。

和 `import.meta` 一起记：`import.meta.url` 在做 **asset 路径、Worker、WASM** 时经常要用。

## `import * as ns` 得到的是「模块命名空间对象」

* 对象**不可扩展、属性枚举有特定规则**，且导出绑定只读。
* 用来调试或封装转发时可以，但不要指望当普通 `{}` 随便挂属性。

## 与 CommonJS 混用时「少想一步」就会栽

打包器或 Node 的互操作下，可能出现 **default 是一层 `{ default: ... }`** 的剥离问题；`__esModule` 等是历史包袱。遇到「明明导出了却拿到 undefined」时，优先查：

* 实际产物是 CJS 还是 ESM；
* `module.exports` / `exports.default` 形状；
* tsconfig 的 `module`、`esModuleInterop`、`allowSyntheticDefaultImports`。

## 小结

* **Live binding** 决定「导入不是快照」，读的是**当前绑定**。
* **循环依赖**要在**设计层**拆；现象层是初始化次序与 TDZ。
* **`import()`** 做代码分割与延迟加载；**`import.meta`** 做 URL 与运行时信息。
* **CJS/ESM** 边界是线上问题高发区，要会读**编译产物**。
