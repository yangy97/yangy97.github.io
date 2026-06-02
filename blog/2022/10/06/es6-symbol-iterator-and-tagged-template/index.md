---
url: /blog/2022/10/06/es6-symbol-iterator-and-tagged-template/index.md
---
## `Symbol`：唯一键，而不是魔法字符串

`Symbol` 创建的是==唯一==（除全局 registry 外）的值，适合做：

* 对象上的**半私有**字段（需配合不对外暴露 symbol 引用）；
* \*\* well-known symbols\*\*（如 `Symbol.iterator`）参与语言内部协议。

```js
const k = Symbol('desc') // 描述仅调试用
const o = { [k]: 42 }
```

### 不常想：`Symbol` 在 `for...in` / `Object.keys` 里默认不可枚举

JSON 序列化也会==忽略== symbol 键——这是特性不是 bug。调试时可用 `Object.getOwnPropertySymbols`。

### `Symbol.iterator` 与可迭代协议

**可迭代对象**需提供 `@@iterator` 方法（即 `obj[Symbol.iterator]`），返回一个**迭代器对象**：

* 迭代器需有 `next()`，返回 `{ value, done }`。

```js
const range = {
  from: 1,
  to: 3,
  [Symbol.iterator]() {
    let n = this.from
    const end = this.to
    return {
      next() {
        if (n <= end) return { value: n++, done: false }
        return { done: true }
      },
    }
  },
}
console.log([...range]) // [1, 2, 3]
```

`for...of`、展开、`Array.from` 都依赖这条协议；**类数组但有 `length` 没有 iterator 的**不能直接展开，需 `Array.from` 或手动包一层。

## 生成器函数：「暂停的迭代器工厂」

```js
function* gen() {
  yield 1
  yield 2
}
const g = gen()
g.next() // { value: 1, done: false }
```

与异步结合时有 `async function*`（异步迭代），配合 `for await...of`；这在读 **Node stream、Web Streams、分页 API** 时反而比手写 Promise 链清爽。

## 标签模板（tagged template）——字符串之外的用途

```js
function tag(strings, ...values) {
  console.log(strings.raw[0]) // 未转义 raw
  return strings[0] + values.map(String).join('')
}
const n = 2
tag`line\t${n}`
```

重点：

* **第一个参数**是**按插值切开的 cooked 字符串数组**；
* **`strings.raw`** 保留写进源码里的反斜杠序列（对 DSL、CSS-in-JS、i18n 占位符很有用）；
* **其余参数**是按顺序的插值表达式结果。

日常业务里直接手写标签函数少，但**读懂**库内部（styled-components、某些安全模板库）会用到。

## 常见盲区：`Array-like` 与可迭代不是一回事

有 `length` 和数字下标 ≠ 可迭代；DOM 的 `NodeList` 在现代浏览器通常**既是类数组又可迭代**，但老旧环境或 polyfill 差异仍可能导致 `for...of` 行为不一致，关键还是看**原型链上有没有 `Symbol.iterator`**。

## 小结

* **`Symbol`** 解决**键冲突**与**协议挂钩**；别指望它出现在 `JSON.stringify` 里。
* **迭代协议**是 `for...of`/展开语法的底座，自研数据结构要「像 Map/Set 一样好用」，就要接 `Symbol.iterator`。
* **生成器**是同步迭代器的语法糖；往异步走是 `async generator` + `for await`。
* **标签模板**掌控**原始字符串切片与 raw**，读库、写小 DSL 时用得上。

若还要补 **Proxy/Reflect 与枚举不变量**、或 **WeakMap 做私有字段前的老套路**，可以再做一篇偏工程向的整理。
