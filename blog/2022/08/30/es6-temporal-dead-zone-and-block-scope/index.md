---
url: /blog/2022/08/30/es6-temporal-dead-zone-and-block-scope/index.md
---
## 为什么需要「块级作用域」

`var` 只有==函数作用域==和**全局作用域**，没有块作用域，导致循环里异步回调、误穿透到外层等问题。`let` / `const` 以**词法环境**里的「块」为边界，行为更接近多数语言的直觉。

## 暂时性死区（TDZ）—— 重点里的重点

从**进入块级作用域**到 **`let`/`const` 声明语句执行完** 之间，该绑定处于 **TDZ**：可以解析标识符，但**禁止读取**（包括 `typeof` 的安全用法也会失败）。

```js
// 同一外层块内，不能在声明前访问
console.log(x) // ReferenceError: Cannot access 'x' before initialization
let x = 1
```

容易忽略的两点：

1. **TDZ 是「绑定」层面的，不是「值」**：声明已「挂号」在词法环境里，只是处于未初始化状态。
2. **`const` 必须带初始化器**，否则会语法错误；`let` 可以延后赋值，但在赋值前读取仍走 TDZ。

### 与 `var` 的「提升」对比

`var` 会提升并初始化为 `undefined`，所以声明前读取得到 `undefined` 而不是报错——这常常==掩盖逻辑错误==。`let`/`const` 用 TDZ 把这类问题变成 **尽早抛错**，是有意设计。

### 典型面试题：循环与闭包

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}
// 打印 3 3 3

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0)
}
// 打印 0 1 2
```

本质：`let` 每次迭代会创建**新的绑定**（概念上 per-iteration binding），每个闭包捕获自己的 `j`；`var` 只有一个共享的 `i`。

## 不常仔细想：`const` 只约束绑定，不深度冻结对象

```js
const o = { a: 1 }
o.a = 2 // 合法
o = {} // TypeError
```

immutable 的想像往往来自业务约定，**不是** `const` 的语义。需要不可变对象要另用 `Object.freeze`（浅）、immutable 库或数据结构习惯。

## 箭头函数：不是「更短的 function」

* **没有自己的 `this`、`arguments`、`super`、`new.target`**，均从**外层词法环境**继承。
* **不能作构造函数**（没有 `[[Construct]]`），`new` 会报错。
* 适合做回调、短表达式；需要动态 `this`（如 DOM 监听里既要外层又要元素）时仍要用普通函数或显式绑定。

```js
const obj = {
  n: 1,
  a: () => console.log(this.n), // 外层 this，往往不是 obj
  b() { console.log(this.n) },
}
```

## 顶层的 `let` 不会挂到 `globalThis`（模块与脚本差异）

在**经典脚本**里顶层 `var` / `function` 可能漏到全局对象；**模块**或严格块级风格下，顶层 `let` 仍是**脚本/模块顶层词法绑定**，不要假设 `window.x` 一定存在。

## 小结

* **TDZ** 让「声明前使用」在 `let`/`const` 上**必现错误**，与 `var` 的 `undefined` 完全不同。
* **循环闭包**要分清**共享绑定**还是**每轮新绑定**。
* **`const`** = 禁止**重绑定**，不等于深度不可变。
* **箭头函数**绑定的是**词法 this**，滥用会在面向对象或 DOM 场景里踩坑。

后续若写**深一点的 TDZ 与参数默认值、解构的交互**（同一形参列表里的「从左到右」初始化顺序），可以继续单独开一篇。
