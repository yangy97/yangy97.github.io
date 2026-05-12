---
url: /blog/2021/01/24/curry/index.md
---
### 柯里化函数

> 柯里化（Currying）是一种关于函数的高阶技术。它不仅被用于 JavaScript，还被用于其他编程语言。

柯里化是一种函数的转换，它是指将一个函数从可调用的 f(a, b, c) 转换为可调用的 f(a)(b)(c)。

柯里化不会调用函数。它只是对函数进行转换

#### 优点一

使得函数职责单一
eg:

```js
function curry(f) { // curry(f) 执行柯里化转换
  return function(a) {
    return function(b) {
      return f(a, b);
    };
  };
}

// 用法
function sum(a, b) {
  return a + b;
}

let curriedSum = curry(sum);

console.log( curriedSum(1)(2) ); // 3

```

#### 优点二

对参数逻辑复用

```js
function foo(name) {
  name = name+'大富婆'
  return function(message){
      return  `${name},${message}`
  }
}
let newFoo =new foo('xxx')
newFoo('xxx')
newFoo('xxx1')
newFoo('xxx2')
```

#### 优点四

缓存,一次判断多次使用 (应用场景:判断浏览器)

```js
function foo(type){
  if(type==='A'){
      return function(){
        console.log('打印a')
      }
  }else{
    return function(){
            console.log('打印其他')
          }
  }
}
let newFoo = foo('A')

```

柯里化更高级的实现，例如 lodash 库的 \_.curry，会返回一个包装器，该包装器允许函数被正常调用或者以偏函数（partial）的方式调用

```js
function sum(a, b) {
  return a + b;
}

let curriedSum = _.curry(sum); // 使用来自 lodash 库的 _.curry

 console.log( curriedSum(1, 2) ); // 3，仍可正常调用
 console.log( curriedSum(1)(2) )

```

### 柯里化实现

#### 实现一

```javascript
/**
 * @Description  函数柯力化 简易求和版 curry()(1,2,3)(4)
 * @param { 函数初始化值 利用必包 返回一个函数}
 * @return {利用必包 返回一个函数}
 */
function curry(...rest) {
  // rest 接受第一次获取的参数
  function innerCurry() {
    console.log(rest, "push前");
    // 合并 后续参数 比如 curry(1,2)(3) ->[1,2,3]
    rest.push(...arguments);
    console.log(rest, "push后");
    // 利用必包 返回当前函数
    return innerCurry;
  }
  // 隐式转换 修改本身toString方法 进而求和
  innerCurry.toString = () => rest.reduce((x, y) => x + y);
  return innerCurry;
}
console.log(curry()); //[Function: innerCurry] { toString: [Function (anonymous)] }111
console.log(curry()(3).toString()); // 6

```

#### 实现二

根据传入函数运行对应的函数

```js
function curry(fn, ...existingArgs) {
  return function () {
    // 拼接存储已经获取到的变量
    let _args = [...existingArgs, ...arguments];
    console.log(existingArgs, arguments, "这里打印的参数");
    // console.log("拼接后的 _args:",_args)

    // 与原函数所需的参数个数进行比较
    if (_args.length < fn.length) {
      // 参数个数还不够，递归，继续返回函数
      return curry(fn, ..._args);
    } else {
      return fn.apply(this, _args);
    }
  };
}
const aa = (a, b, c, d, e) => {
  return [a, b, c, d, e];
};
console.log(curry(aa, 1, 2, 3, 4)(5)); 
```
