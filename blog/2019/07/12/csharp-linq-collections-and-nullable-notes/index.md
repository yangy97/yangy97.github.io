---
url: /blog/2019/07/12/csharp-linq-collections-and-nullable-notes/index.md
---
写业务代码时经常要在 ==LINQ==、**各种集合** 和 **可空引用** 之间切换，这里记几条容易翻车的点，便于以后检索。

## LINQ

* **延迟执行**：`Where`、`Select` 等只有在 **枚举**（`foreach`、`.ToList()`）时才真正跑 pipeline；在循环里改被迭代集合常会炸。
* **`First` vs `FirstOrDefault`**：没有元素时前者抛异常；对外部数据优先显式判断或使用 `SingleOrDefault` 前要确认唯一性。
* **`GroupBy` 与匿名类型**：key 相等性要心里有数；大集合下注意内存与多次枚举。

## 集合

* **`List<T>` vs `IEnumerable<T>`**：公开 API 返回接口更灵活；内部仍常用 `List` 做缓冲。
* **字典与线程**：多线程读写要用 `ConcurrentDictionary` 或上层锁，而不是普通 `Dictionary`。
* **`HashSet` 去重**：引用类型要正确实现 `Equals/GetHashCode` 或提供自定义 comparer。

## 可空与默认值

* **值类型可空**：`int?` 与 `null` 合并运算符 `??` 的组合在接口层很常用。
* **可空引用类型（Nullable reference types）**：开 `nullable enable` 后，对可能为 `null` 的 string 不判空会在分析器里报一团；习惯在边界做一次规范化。

## 延伸阅读

* 运行期与部署向问题见 [《C#遇到的部分坑》](/2019/03/05/c-object/)。
