---
url: /blog/2021/06/23/js-learn-3/index.md
---
### js高级程序设计第三章

#### `var`  声明提升

使用 `var` 时，下面的代码不会报错。这是因为使用这个关键字声明的变量会自动提升到函数作用域顶部：

```js
function foo() { 
 console.log(age); 
 var age = 26; 
} 
foo(); // undefined 
```

之所以不会报错，是因为 ECMAScript 运行时把它看成等价于如下代码：

```js
function foo() { 
 var age; 
 console.log(age); 
 age = 26; 
} 
foo(); // undefined
```

经典面试题

```js
function sum(s) {
  console.log(s)
  var s=2
  function s(){}
  console.log(s)
}
sum(10)
```

第一个输出 `ƒ s(){}`
第二个输出 2
很多人好奇为什么? 显而易见

1. 预编译阶段 会解析成如下代码块 入参 相当于在外定义了 `s` 变量

```js
{
  var s =10
  (function(){
    function s(){}
  
    console.log(s)
    s =2
     console.log(s)
  })
}
```

2. 函数提升优先

```js
{
  var s =10
  (function(){
    function s(){}
  //上面可以等价为
  var s = function(){}
  ...
  })
}
```

3. 解析` var s=2`,因为前面函数同名 已经做了提升 那此处不做提升

```js
{
  var s =10
  (function(){
    var s=function (){}
  
    console.log(s)
     s =2
     console.log(s)
  })
}
```

是不是恍然大悟呢

#### `let` 声明

1. `let` 跟 `var` 的作用差不多，但有着非常重要的区别。最明显的区别是，`let` 声明的范围是块作用域，而 `var` 声明的范围是函数作用域

```js
if (true) { 
 var name = 'Matt'; 
 console.log(name); // Matt 
} 
console.log(name); // Matt
// ---------------------

if (true) { 
 let age = 26; 
 console.log(age); // 26 
} 
console.log(age); // ReferenceError: age 没有定义
```

2. `let 也不允许同一个块作用域中出现冗余声明。这样会导致报错`

```js
var name; 
var name; 


let age; 
let age; // SyntaxError；标识符 age 已经声明过了


```

JavaScript 引擎会记录用于变量声明的标识符及其所在的块作用域，因此嵌套使用相同的标
识符不会报错，而这是因为同一个块中没有重复声明

```js
var name = 'Nicholas'; 
console.log(name); // 'Nicholas' 
if (true) { 
 var name = 'Matt'; 
 console.log(name); // 'Matt' 
} 
let age = 30; 
console.log(age); // 30 
if (true) { 
 let age = 26; 
 console.log(age); // 26 
}
```

对声明冗余报错不会因混用 let 和 var 而受影响。这两个关键字声明的并不是不同类型的变量，
它们只是指出变量在相关作用域如何存在。

```js
var name; 
let name; // SyntaxError 


let age; 
var age; // SyntaxError
```

1. 暂时性死区

> `let` 声明的变量不会在作用域中被提升

```js
// name 会被提升
console.log(name); // undefined 
var name = 'Matt'; 
// ------变成这样
var name;
console.log(name);
name = 'Matt'

// age 不会被提升
console.log(age); // ReferenceError：age 没有定义
let age = 26;
```

2. 全局声明
   `let 在全局作用域中声明的变量不会成为 window 对象的属性 不过，let 声明仍然是在全局作用域中发生的`

#### `for 循环中的 let 声明`

经典面试题

```js
for (var i = 0; i < 5; ++i) { 
 setTimeout(() => console.log(i), 0) 
}
// 你可能以为会输出 0、1、2、3、4 
// 实际上会输出 5、5、5、5、5
//之所以会这样，是因为在退出循环时，迭代变量保存的是导致循环退出的值：5。在之后执行超时
//逻辑时，所有的 i 都是同一个变量，因而输出的都是同一个最终值

//而在使用 let 声明迭代变量时，JavaScript 引擎在后台会为每个迭代循环声明一个新的迭代变量
for (let i = 0; i < 5; ++i) { 
 setTimeout(() => console.log(i), 0) 
} 
// 会输出 0、1、2、3、4
```

#### `const 声明`

`const 的行为与 let 基本相同，唯一一个重要的区别是用它声明变量时必须同时初始化变量，且尝试修改 const 声明的变量会导致运行时错误`

```js
const age = 26; 
age = 36; // TypeError: 给常量赋值
// const 也不允许重复声明
const name = 'Matt'; 
const name = 'Nicholas'; // SyntaxError 
// const 声明的作用域也是块
const name = 'Matt'; 
if (true) { 
 const name = 'Nicholas'; 
} 
console.log(name); // Matt
```

`const 声明的限制只适用于它指向的变量的引用。换句话说，如果 const 变量引用的是一个对象，那么修改这个对象内部的属性并不违反 const 的限制。`

```js
const person = {}; 
person.name = 'Matt'; // ok
```

#### typeof 可以去看我前面的文章 这里提一点

```js

typeof null //->object
//??为什么 object
//000: object   - 当前存储的数据指向一个对象
//null 的值是机器码 NULL 指针(null 指针的值全是 0)
//那也就是说 null 的类型标签也是 000，和 Object 的类型标签一样, 所以会被判定为 Object。
```

#### 值得注意

```js
let message; // 这个变量被声明了，只是值为 undefined 
// 确保没有声明过这个变量
// let age 
console.log(message); // "undefined" 
console.log(age); // 报错

```

##### 为什么第一个正确,第二个错误呢?

`  在上面的例子中，第一个 console.log 会指出变量 message 的值，即"undefined"。而第二个console.log 要输出个未声明的变量 age 的值，因此会导致报错。对未声明的变量，只能执行一个有用的操作，就是对它调用 typeof`

1. `console.log(NaN == NaN); // false`
