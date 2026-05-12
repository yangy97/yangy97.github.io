---
url: /blog/2021/07/12/js-learn-5/index.md
---
### js高级程序设计第五章

#### 选择 Object 还是 Map

1. 内存占用 `Map` 大约可以比 `Object` 多存储 50%的键/值对
2. 插入性能

> 过插入 `Map` 在所有浏览器中一般会稍微快
> 一点儿。对这两个类型来说，插入速度并不会随着键/值对数量而线性增加。如果代码涉及大量插入操
> 作，那么显然 `Map` 的性能更佳

3. 查找速度 如果代码涉及大量查找操作，那么某些情况下可能选择 `Object` 更好一些
4. 删除性能 大多数浏览器引擎来说，`Map` 的 `delete()`操作都比插入和查找更快。如果代码涉及大量删除操作，那么毫无疑问应该选择 `Map`

#### WeakMap/WeakSet 不可迭代

> `WeakMap/WeakSet 是 Map/Set 的“兄弟”类型，其 API 也是 Map/Set 的子集。WeakMap/WeakSet 中的“weak”（弱），描述的是 JavaScript 垃圾回收程序对待“弱映射”中键的方式`
> `弱映射中的键只能是 Object 或者继承自 Object 的类型`
