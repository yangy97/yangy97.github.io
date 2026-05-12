---
url: /blog/2022/02/23/js-learn-es/index.md
---
### es6+部分方法

#### 数组打平方法

##### 递归

```js
function flatten(sourceArray, flattenedArray = []) { 
 for (const element of sourceArray) { 
 if (Array.isArray(element)) { 
 flatten(element, flattenedArray); 
 } else { 
 flattenedArray.push(element); 
 } 
 } 
 return flattenedArray; 
} 
const arr = [[0], 1, 2, [3, [4, 5]], 6]; 
console.log(flatten(arr))
```

##### 用`falt`新方法

`了 Array.prototype.flat()`,返回一个对要打平 Array 实例的浅复制副本
`falt` 默认参数1 表示展开的层

```js
const arr = [[0], 1, 2, [3, [4, 5]], 6]; 
console.log(arr.flat(2)); 
// [0, 1, 2, 3, 4, 5, 6] 
console.log(arr.flat());
```

##### `Array.prototype.flatMap()`

> `arr.flatMap(f)`与 `arr.map(f).flat()`等价

```js
const arr = [[1], [3], [5]]; 
console.log(arr.map(([x]) => [x, x + 1])); 
// [[1, 2], [3, 4], [5, 6]] 
console.log(arr.flatMap(([x]) => [x, x + 1])); 
// [1, 2, 3, 4, 5, 6]
```

##### `Object.fromEntries()`

> 用于通过键/值对数组的
> 集合构建对象。这个方法执行与 Object.entries()方法相反的操作

```js
 const obj = {
  foo: 'bar', 
  baz: 'qux' 
}; 
const objEntries = Object.entries(obj); 
console.log(objEntries); 
// [["foo", "bar"], ["baz", "qux"]] 
console.log(Object.fromEntries(objEntries)); 
// { foo: "bar", baz: "qux" }
```

##### `trimStart() 和 trimEnd()`

> 分别用于删除字符串开头和末尾的空格,取代之前的 trimLeft()和 trimRight()

```js
let s = ' foo '; 
console.log(s.trimStart()); // "foo " 
console.log(s.trimEnd()); // " foo"
```
