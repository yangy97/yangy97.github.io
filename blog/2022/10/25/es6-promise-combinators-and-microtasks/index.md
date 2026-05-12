---
url: /blog/2022/10/25/es6-promise-combinators-and-microtasks/index.md
---
## 先对齐心智：Promise 解决的是「异步结果的单一结果类型」

`resolve` / `reject` 只能终态一次；链上的 `then` 返回新 Promise。==不常写但容易混==的是：**组合子**解决的是「多路异步的聚合语义」，和单个 `then` 链是不同层级的问题。

## `Promise.all`——「全赢才赢，一输全输」

* 全 fulfilled → `values` 数组（顺序与入参一致，**不是完成顺序**）。
* **任一** rejected → **立刻**以该原因 reject，其它结果丢弃（并不取消仍在飞行的请求）。

适合：多个**强依赖**必须都成功（如配置片段拉齐再渲染）。

## `Promise.allSettled`——「都要有个交代」

ES2020。无论 fulfilled 还是 rejected，**全部落定**后给出：

```ts
{ status: 'fulfilled' | 'rejected', value?: any, reason?: any }
```

适合：批量上报、并发探测、**不想被单个失败 short-circuit** 的场景。 UI 上常见「几项成功几项失败」就用它。

## `Promise.any`——「谁先成功算谁」

ES2021。**第一个 fulfilled** 就 resolve；**全部 rejected** 才 reject，且原因是 **`AggregateError`**（可遍历 `errors`）。

和 `Promise.race` 区别：`race` 是**谁先落定就信谁**，包括 reject——常常是翻车点。

## `Promise.race` 的盲区

用于超时封装时：

```js
function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ])
}
```

超时 reject 了，**底层 `p` 仍在执行**（没有内置取消）。需要 **AbortController** 或业务层取消令牌。

## 微任务：`.then` 到底「什么时候跑」

规范层面：`then` 的回调进入**微任务队列**。当前宏任务执行完后，**清空微任务队列**，再绘画、再下一个宏任务。

面试常考点：

```js
console.log('script start')
setTimeout(() => console.log('macro'), 0)
Promise.resolve().then(() => console.log('micro'))
console.log('script end')
// script start → script end → micro → macro
```

`await`（从第二个微任务起）与 `queueMicrotask` 也落在微任务世界，和 `Promise` 混排时要防止**长微任务链卡渲染**。

## `async/await` 只是语法糖，不是新并发模型

`async` 函数**总是**返回 Promise；`await` 会「解开」thenable。连续 `await` 基本是**顺序执行**；要并发仍要 **`Promise.all` / `allSettled`** 等显式组合。

## 小结

| API | 语义要点 |
|-----|----------|
| `all` | 全成功；一个失败整体失败 |
| `allSettled` | 等全员终态；适合报表型聚合 |
| `any` | 第一个成功即成功；全败 `AggregateError` |
| `race` | 第一个落定（成或败） |

**取消与清理**、**微任务阻塞首屏**，是线上比语法更少教但要自觉补的两块。需要和 **AbortController + fetch** 写在一起的话，可以单独做「可取消的并发」短篇。
