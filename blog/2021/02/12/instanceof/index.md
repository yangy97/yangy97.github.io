---
url: /blog/2021/02/12/instanceof/index.md
---
### 手写实现instanceof

目前判断

```js
var a = {}
a instanceof Object

```

## 难点分析

> 首先判断instanceof左边的类型 因为instanceof不能判断基础类型 ,基本数据类型以及 null 直接返回 false
> 比如

```js
var a =1
a instanceof Number // false
```

> instanceof:判断对象和构造函数在原型链上是否有关系，有就返回真没有就返回false  left = left.**proto**

## 手写简易版实现

```js
function _instanceof(left,right){
  // 基本数据类型以及 null 直接返回 false
  if( left === null||typeof left !== 'object' ) return false;
    var _rightProto = right.prototype;
    left = left.__proto__;
  while(true){
    // 左边找不到的情况下 也就是找到最顶层null 
    if (left === null){
          return false
    }
    if(_rightProto===left){
      return true
    }
    left = left.__proto__
  }
}
// console.log(_instanceof([],'Object'))
// console.log([].__proto__.__proto__)
```
