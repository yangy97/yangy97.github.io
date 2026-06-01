---
url: /blog/2021/02/12/instanceof/index.md
---
`instanceof` 判断 **构造函数的 prototype 是否出现在对象的原型链上**。面试常要求手写；生产里更常用 **类型守卫、Array.isArray、duck typing**。本篇补全 **边界、完整实现与替代方案**。

***

### 一、语义与内置行为

```javascript
const a = {};
a instanceof Object; // true

const a = 1;
a instanceof Number; // false —— 原始值不是对象
```

**规则**：

1. 若 `left` 不是 object（含 `typeof null === 'object'` 的 null），返回 **false**。
2. 沿 `left.__proto__`（即 `Object.getPrototypeOf(left)`）向上走，若某层 **严格等于** `right.prototype`，返回 true。
3. 走到 `null` 仍未命中，返回 false。

***

### 二、难点分析

#### 2.1 基本类型与装箱

```javascript
(1).instanceof Number;        // true —— 临时 Number 对象
Number(1) instanceof Number; // false —— 原始 number
```

`instanceof` **不能** 用来判断 `number/string/boolean` 原始值；用 `typeof` 或 `Object.prototype.toString.call(x)`。

#### 2.2 跨 realm（iframe）

不同 iframe 的 `Array` 构造函数不同，**`arr instanceof Array` 可能 false**。\
可靠写法：`Array.isArray(arr)` 或 `Object.prototype.toString.call(arr) === '[object Array]'`。

#### 2.3 可自定义：`Symbol.hasInstance`

```javascript
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}
[] instanceof MyArray; // true
```

手写实现需考虑：若 `right` 有 `[Symbol.hasInstance]`，应委托给它（简化版可略）。

***

### 三、手写实现

#### 3.1 简易版（面试够用）

```javascript
function _instanceof(left, right) {
  if (left === null || (typeof left !== 'object' && typeof left !== 'function')) {
    return false;
  }
  const rightProto = right.prototype;
  if (typeof rightProto !== 'object' && typeof rightProto !== 'function') {
    return false;
  }
  let proto = Object.getPrototypeOf(left);
  while (proto !== null) {
    if (proto === rightProto) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

注意：函数也是 object，可以是 `instanceof Function` 的左侧。

#### 3.2 更接近规范的版本

```javascript
function instanceOf(left, right) {
  if (right == null || typeof right !== 'object' && typeof right !== 'function') {
    throw new TypeError('Right-hand side of instanceof is not an object');
  }
  const hasInstance = right[Symbol.hasInstance];
  if (typeof hasInstance === 'function') {
    return !!hasInstance.call(right, left);
  }
  if (typeof left !== 'object' && typeof left !== 'function') return false;

  let proto = left;
  while (proto = Object.getPrototypeOf(proto)) {
    if (proto === right.prototype) return true;
  }
  return false;
}
```

***

### 四、生产里用什么替代

| 需求 | 推荐 |
|------|------|
| 是否数组 | `Array.isArray(x)` |
| 是否 Promise | `x instanceof Promise` 或 thenable 检测 |
| 是否 plain object | `Object.prototype.toString.call(x) === '[object Object]'` |
| TS 类型窄化 | 用户定义 type guard：`function isUser(x): x is User` |
| 跨 iframe | 不用 instanceof，用 tag / toString |

***

### 五、与 Vue / 框架

Vue 2/3 内部判断 plain object、VNode 类型时 **不用** 面向用户的 `instanceof`，而是 **标志位 / Symbol / shape**——避免跨 bundle 多份 Vue 拷贝导致 `instanceof Component` 失败（微前端常见坑）。

***

### 六、一句话

**instanceof Walk 原型链；原始值和跨 realm 不可靠；业务优先 `Array.isArray` / type guard，框架内部用私有标记。**
