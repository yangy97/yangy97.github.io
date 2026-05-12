---
url: /blog/2021/09/06/js-learn-function/index.md
---
### Function

> title: ECMAScript 6 的所有函数对象都会暴露一个只读的 name 属性，其中包含关于函数的信息

```js
function foo() {} 
let bar = function() {}; 
let baz = () => {}; 
console.log(foo.name); // foo 
console.log(bar.name); // bar 
console.log(baz.name); // baz 
console.log((() => {}).name); //（空字符串）
console.log((new Function()).name); // anonymous
```

> ，在使用 `function` 关键字定义（非箭头）函数时，可以在函数内部访问 `arguments` 对象，从中取得传进来的每个参数值

```js
function sayHi() { 
 console.log("Hello " + arguments[0] + ", " + arguments[1]); 
}
```

#### 函数声明与函数表达式

> JS 引擎在任何代码执行之前，会先读取函数声明，并在执行上下文中生成函数定义。而函数表达式必须等到代码执行到它那一行，才会在执行上下文中生成函数定义

```js

// 没问题 
console.log(sum(10, 10)); 
function sum(num1, num2) { 
 return num1 + num2; 
}

// 会出错
console.log(sum(10, 10)); 
var sum = function(num1, num2) { 
 return num1 + num2; 
};
//上面的代码之所以会出错，是因为这个函数定义包含在一个变量初始化语句中，而不是函数声明中。
//这意味着代码如果没有执行到var sum，那么执行上下文中就没有函数的定义，所以上面的代码会
//出错。这并不是因为使用 let 而导致的，使用 var 关键字也会碰到同样的问题
```

> 在 `ECMAScript 5 `中，函数内部存在两个特殊的对象：`arguments` 和 `this。ECMAScript 6 `又新增了 `new.target` 属性

#### arguments

`arguments.callee`  指向 `arguments` 对象所在函数的指针

#### new.target

> 如果函数是正常调用的，则 new.target 的值是 undefined；如果是使用 new 关键字调用的，则 new.target 将引用被调用的构造函数。

```js
function King() { 
 if (!new.target) { 
 throw 'King must be instantiated using "new"' 
 } 
 console.log('King instantiated using "new"'); 
} 
new King(); // King instantiated using "new" 
King(); // Error: King must be instantiated using "new"
```

#### 闭包

> 闭包指的是那些引用了另一个函数作用域中变量的函数，通常是在嵌套函数中实现的

#### 立即调用的函数表达式

```js
(function() { 
 // 块级作用域 
})();
```

> 它锁定参数值

经典面试题

```js
  	for(var i = 0; i < 5; i++) {
          setTimeout(function () {
              console.log(i)
          }, 1000)
      }
       // 55555
      for(let i = 0; i < 5; i++) {
          setTimeout(function () {
              console.log(i)
          }, 1000)
      }
// 0-4
  for(var i = 0; i < 5; i++) {
          setTimeout((function () {
              console.log(i)
          })(i), 1000)
      }
//0-4
```
