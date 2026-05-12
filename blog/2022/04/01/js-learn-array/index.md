---
url: /blog/2022/04/01/js-learn-array/index.md
---
## 数组那些事

### `Array.prototype.at()`

#### 参数 index

> `at() `方法接收一个整数值并返回该索引对应的元素，允许正数和负数。负整数从数组中的最后一个元素开始倒数
> 负数这样理解 `index + array.length `

#### 返回值

> 要返回的数组元素的索引（从零开始），会被转换为整数。负数索引从数组末尾开始计数——如果 `index < 0`，则会访问 `index + array.length` 位置的元素

#### 在非数组对象上调用 `at()`

> `at()` 方法读取 `this` 的 `length` 属性并计算需要访问的索引。

```js
const arrayLike = {
  length: 2,
  0: "a",
  1: "b",
};
console.log(Array.prototype.at.call(arrayLike, -1)); // "b"
```

### `Array.prototype.concat()`

> `concat()` 方法用于合并两个或多个数组。此方法不会更改现有数组，而是`返回一个新数组`。

> 如果任何源数组是`稀疏数组`，concat() 方法会保留空槽

#### 稀疏数组

> 数组可以包含“空槽”，这与用值 undefined 填充的槽不一样。空槽可以通过以下方式之一创建

```js
// Array 构造函数：
const a = Array(5); // [ <5 empty items> ]

// 数组字面量中的连续逗号：
const b = [1, 2, , , 5]; // [ 1, 2, <2 empty items>, 5 ]

// 直接给大于 array.length 的索引设置值以形成空槽：
const c = [1, 2];
c[4] = 5; // [ 1, 2, <2 empty items>, 5 ]

// 通过直接设置 .length 拉长一个数组：
const d = [1, 2];
d.length = 5; // [ 1, 2, <3 empty items> ]

// 删除一个元素：
const e = [1, 2, 3, 4, 5];
delete e[2]; // [ 1, 2, <1 empty item>, 4, 5 ]

```

> 如果任何源数组是稀疏的，则结果数组也将是稀疏的,不会跳过空

```js
console.log([1, , 3].concat([4, 5])); // [1, empty, 3, 4, 5]
console.log([1, 2].concat([3, , 5])); // [1, 2, 3, empty, 5]
```

> 非对象调用会被转换

```js

console.log(Array.prototype.concat.call({}, 1, 2, 3)); // [{}, 1, 2, 3]
console.log(Array.prototype.concat.call(1, 2, 3)); // [ [Number: 1], 2, 3 ]
const arrayLike = { [Symbol.isConcatSpreadable]: true, length: 2, 0: 1, 1: 2 };
console.log(Array.prototype.concat.call(arrayLike, 3, 4)); // [1, 2, 3, 4]
```

### `Array.prototype.copyWithin()`

> copyWithin() 方法浅复制数组的一部分到同一数组中的另一个位置，并返回它，不会改变原数组的长度

```js
copyWithin(target)
copyWithin(target, start)
copyWithin(target, start, end)

```

#### 参数

target:

1. <0 ->target + array.length
2. target < -array.length -> 0
3. `>=array.length` 不会拷贝,

start:

1. <0 ->start+array.length
2. `如果省略 start 或 start < -array.length`，则默认为 0
3. `start >= array.length` 不会拷贝

end:

1. `end<0 ->end+array.length`
2. `end < -array.length ->0`
3. `end 或 end >= array.length` 拷贝到数组结束 默认`array.length`

#### copyWithin() 将保留空插槽

### `Array.prototype.entries()`

> `entries()` 方法返回一个新的`数组迭代器` 对象，该对象包含数组中每个索引的`键/值对`

### `Array.prototype.fill(value,start,end)`

start:

1. `如果 start >= array.length，没有索引被填`

```js
const array1 = [1, 2, 3, 4];

// 在 2-4填充 0
console.log(array1.fill(0, 2, 4));
// Expected output: Array [1, 2, 0, 0]

// 
console.log(array1.fill(5, 1));
// Expected output: Array [1, 5, 5, 5]

console.log(array1.fill(6));
// Expected output: Array [6, 6, 6, 6]`\
```

### `Array.prototype.every()`

> `every()` 方法测试一个数组内的所有元素是否`都能通过`指定函数的测试。它`返回一个布尔值`

```js
  every(callbackFn)
every(callbackFn, thisArg)

```

callbackFn:

1. element 当前元素
2. index 当前索引
3. array 数组本身

thisArg:

1. 执行 callbackFn 时用作 this 的值

> `对于空数组，它只返回 true`

#### 检查一个数组是否是另一个数组的子集

```js
const isSubset = (array1, array2) =>
  array2.every((element) => array1.includes(element));

console.log(isSubset([1, 2, 3, 4, 5, 6, 7], [5, 7, 6])); // true
console.log(isSubset([1, 2, 3, 4, 5, 6, 7], [5, 8, 7])); // false

```

#### 在稀疏数组上使用 every()

> every() 不会在空槽上运行它的断言函数。 *==`直接跳过`==*

```js
console.log([1, , 3].every((x) => x !== undefined)); // true
console.log([2, , 2].every((x) => x === 2)); // true
```

### `Array.prototype.filter(cb,thisArg)`

cb:接受三个参数如下

`element`:数组中当前正在处理的元素。

`index`:正在处理的元素在数组中的索引。

`array`:调用了 filter() 的数组本身。

> 它不会对稀疏数组中的空槽调用,仅对已分配值的数组索引调用 `跳过空`
