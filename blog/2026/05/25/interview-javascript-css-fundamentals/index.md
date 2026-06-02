---
url: /blog/2026/05/25/interview-javascript-css-fundamentals/index.md
---
微众、SHEIN、CVTE、富途面里 **JS/CSS 基础**（类型、原型、布局） 重复率最高。本篇把原题整理成 **答法骨架**，细节链到本站红宝书与 ES6 笔记。

***

### 一、类型判断

**常问**：`typeof`（原始类型）/ `instanceof`（原型链检测） 区别？还有哪些判断方式？

| 方式 | 适用 | 坑 |
|------|------|-----|
| `typeof` | 原始类型 | `typeof null === 'object'` |
| `instanceof` | 引用类型、原型链 | 跨 iframe 失效 |
| `Object.prototype.toString` | 通用 | 写法冗长 |
| `Array.isArray` | 数组 | — |

***

### 二、数组

**常问**：常见方法及区别？

* **改原数组**：push/pop/shift/unshift/splice/sort/reverse
* **不改原数组**：map/filter/concat/slice/toSorted（新）
* **聚合**：reduce、some/every

项目里能说 **「用 reduce 做 groupBy」** 比背 API 名单加分。

***

### 三、存储

**常问**：**Cookie**（带过期、可 HttpOnly）/ **localStorage**（持久）/ **sessionStorage**（标签页级）？

| | Cookie | localStorage | sessionStorage |
|--|--------|--------------|----------------|
| 容量 | ~4KB | ~5MB | ~5MB |
| 随请求发送 | 是 | 否 | 否 |
| 生命周期 | 可设过期 | 持久 | 标签页 |
| 服务端可读 | HttpOnly 时否 | 否 | 否 |

**追问**：localStorage 做过期缓存？\
包一层 `{ expire, data }`，读时比对 `Date.now()`（见小程序缓存文同思路）。

***

### 四、继承与原型

**常问**：JS 继承方式？

* 原型链继承
* 构造函数 + `call`
* `Object.create`
* ES6 `class extends`（语法糖）

能画 **原型链图** 即可。

***

### 五、事件循环

**必考**：输出顺序题。

\==口诀==：同步 → 微任务（Promise.then）→ 宏任务（setTimeout）→ 微任务 → …

详见 [Promise 组合子与微任务](/2022/10/25/es6-promise-combinators-and-microtasks/)。

***

### 六、CSS：BFC

**常问**：什么是 BFC？如何触发？

块级格式化上下文，内部布局不受外部 float 影响。

触发：`overflow: hidden/auto`、`display: flow-root`、`float`、`position: absolute` 等。

应用：清除浮动、两栏自适应、margin 折叠。

***

### 七、Flex / Grid

**常问**：flex 常用属性？

* 容器：`display:flex`、`justify-content`、`align-items`、`flex-wrap`
* 子项：`flex: 1`、`flex-shrink: 0`

Grid 富途面提到过：了解 `grid-template-columns` 即可，中后台 **flex 更常见**。

***

### 八、防抖节流

| | 防抖 | 节流 |
|--|------|------|
| 场景 | 搜索输入、resize 停稳后 | 滚动、按钮连点 |
| 思路 | 延迟执行，重复触发重置计时 | 固定间隔最多执行一次 |

***

### 九、图片懒加载

思路：

1. `loading="lazy"`（现代浏览器）
2. `IntersectionObserver` + `data-src`
3. 占位图 / LQIP

见 [列表与图片性能](/2023/07/12/frontend-performance-list-image/)。

***

### 十、小结

基础题答 **定义 + 使用场景 + 一个坑**。更多 ES 细节翻 [红宝书整理标签](/posts/tags/?tag=%E7%BA%A2%E5%AE%9D%E4%B9%A6%E6%95%B4%E7%90%86)。
