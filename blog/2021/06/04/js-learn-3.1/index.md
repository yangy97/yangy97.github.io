---
url: /blog/2021/06/04/js-learn-3.1/index.md
---
红宝书第 3 章下半：**按位操作** 与 **相等操作符**。按位运算日常用得少，但在 **权限位、颜色、性能敏感路径** 仍会出现；相等性则是面试必考。本篇补 **规则 + 例题 + Object.is**。

***

### 一、按位操作（32 位整数）

JS 按位运算先把操作数转为 **32 位有符号整数**。

#### 1.1 按位非 `~`

```javascript
let num1 = 25;   // ...00011001
let num2 = ~num1; // ...11100110 → 显示为 -26
// 效果：~n === -(n + 1)（仅对 32 位整数范围内成立）
```

用途：`~indexOf(x)` 判断「不存在」（老代码）；现代用 `includes`。

#### 1.2 按位与 `&`

两位都是 1 才为 1。**掩码** 取某几位：

```javascript
const READ = 1;   // 001
const WRITE = 2;  // 010
const EXEC = 4;   // 100
let perm = READ | WRITE; // 011

(perm & READ) !== 0;  // 有读权限
(perm & EXEC) !== 0;  // false
```

#### 1.3 按位或 `|`

有 1 则 1。用于 **合并标志位**（见上 `perm`）。

#### 1.4 按位异或 `^`

两位不同为 1，相同为 0。

```javascript
// 交换两数（少用，可读性差）
a ^= b; b ^= a; a ^= b;

// 找「只出现一次」的数（leetcode 经典）
// 成对相同异或为 0，最后剩单个
```

#### 1.5 移位 `<<` `>>` `>>>`

* `<<` 左移，相当于 ×2（溢出截断）。
* `>>` 算术右移，保留符号。
* `>>>` 无符号右移。

颜色通道有时用位运算打包 RGB，现代更常用字符串或 CSS 变量。

***

### 二、关系操作符

`<` `>` `<=` `>=` 会 **ToPrimitive** 比较，字符串与数字混比容易踩坑：

```javascript
'10' > 9   // true（'10' 转数字）
'10' > '9' // false（字符串逐字比较）
```

**建议**：比较前显式 `Number()` / `String()`。

***

### 三、相等操作符：`==` vs `===`

#### 3.1 `==`（抽象相等，会类型转换）

```javascript
null == undefined  // true（规范特例）
null == 0          // false
'0' == false       // true
[] == false        // true
[] == ![]          // true（经典面试题）
```

#### 3.2 `===`（严格相等，不转换类型）

```javascript
null === undefined  // false
0 === false         // false
NaN === NaN         // false ← 坑
```

#### 3.3 `Object.is`（ES6，更接近「SameValue」）

```javascript
Object.is(NaN, NaN);       // true
Object.is(+0, -0);         // false（=== 认为 +0 === -0）
Object.is(undefined, undefined); // true
```

Vue 3 内部依赖收集用 `Object.is` 比较旧值新值。

#### 3.4 实践建议

| 场景 | 推荐 |
|------|------|
| 业务代码默认 | **`===` / `!==`** |
| 判空 | `x == null` 同时匹配 `null` 和 `undefined`（团队统一即可） |
| 可能 NaN | `Number.isNaN(x)` |
| 框架内部 / Map 键 | `Object.is` |

***

### 四、与 typeof、instanceof 的分工

* `typeof`：区分 undefined / boolean / string / number / bigint / symbol / function；**object/null 坑**（`typeof null === 'object'`）。
* `instanceof`：原型链判断，见 [instanceof 手写](/2021/02/12/instanceof/)。
* `Array.isArray()`：数组专用。

***

### 五、一句话

**按位运算记「掩码与标志位」即可；相等性默认 `===`，需要判 NaN 用 `Object.is`，别在业务里炫 `==` 隐式转换。**
