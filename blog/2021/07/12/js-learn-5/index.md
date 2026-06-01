---
url: /blog/2021/07/12/js-learn-5/index.md
---
红宝书第 5 章讲 **Map / Set / WeakMap / WeakSet**。早期笔记只记了性能对比；这篇补 **选型、API 边界与工程场景**，面试和日常写代码都能直接用。

***

### 一、Object 还是 Map？

| 维度 | Object | Map |
|------|--------|-----|
| 键类型 | String / Symbol | **任意值**（含对象、函数） |
| 键顺序 | 整数键先排序，再插入序（复杂） | **严格插入序** |
| 大小 | 需 `Object.keys().length` | **`map.size`** |
| 原型 | 有默认键（`toString` 等） | **无默认键** |
| 迭代 | 需 `Object.entries` 等 | **直接 `for...of`** |
| JSON | 可序列化 | **不能直接 JSON.stringify** |

#### 1.1 性能（红宝书原结论，作参考）

1. **内存**：同键值对数量下，Map 大约可多存 ~50%（引擎实现相关，勿死记数字）。
2. **插入**：大量插入时 Map 往往略快，且不会随条目数线性恶化到 Object 那种程度。
3. **查找**：少量键时 Object 可能更快；键很多、频繁查找时 Map 更稳。
4. **删除**：Map 的 `delete()` 通常比 Object 的 `delete` 更快；**大量删** 选 Map。

#### 1.2 工程上怎么选

```javascript
// ✅ 用 Map：键是对象、需要稳定迭代顺序、频繁增删
const cache = new Map(); // key = requestParams object
cache.set(params, response);

// ✅ 用 Object：纯 JSON 传输、固定 schema 的配置、与后端 DTO 对齐
const user = { id: 1, name: '砚雪' };

// ❌ 不要用 Object 当「任意对象当键」的缓存
const bad = {};
bad[someObject] = 1; // 键被转成 "[object Object]"
```

***

### 二、Set：去重与集合运算

```javascript
const ids = new Set([1, 2, 2, 3]); // {1,2,3}

// 数组去重
const unique = [...new Set(arr)];

// 集合运算
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);
const intersection = new Set([...a].filter(x => b.has(x)));
const union = new Set([...a, ...b]);
```

**场景**：权限码去重、已选 tag、Visited 路由记录。\
**注意**：对象引用去重要同一引用或自定义逻辑，Set 不会深比较内容。

***

### 三、WeakMap / WeakSet

> Weak 描述的是 GC 对 **键** 的持有方式：==弱引用==，不阻止键被回收。

| 特性 | Map/Set | WeakMap/WeakSet |
|------|---------|-----------------|
| 键/值 | 任意 | WeakMap 键 **只能是 Object** |
| 可迭代 | ✓ | **✗ 不可迭代** |
| size | 有 | **无** |
| GC | 强引用阻止回收 | 键无其他引用时可被回收 |

#### 3.1 典型用途

```javascript
// DOM 节点关联私有数据，节点移除后自动释放
const privateData = new WeakMap();

function bind(el, data) {
  privateData.set(el, data);
}

// Vue 3 响应式也用 WeakMap 存 target → reactive proxy 映射
```

```javascript
// 标记对象「已访问过」，不阻止对象本身被 GC
const visited = new WeakSet();
function walk(obj) {
  if (visited.has(obj)) return;
  visited.add(obj);
  // ...
}
```

**不要** 把 WeakMap 当普通缓存——你无法遍历、无法知道还剩多少条目。

***

### 四、与 ES6 其他章节的衔接

* 迭代协议：[Symbol 与迭代器](/2023/05/10/es6-symbol-iterator-and-tagged-template/)
* 对象键：`Reflect.ownKeys` 可拿到 Symbol 键
* 面试常问：Map vs Object、WeakMap 为什么不可迭代

***

### 五、一句话

**结构化 JSON 数据用 Object；对象当键、频繁增删、要 size/迭代用 Map；DOM/私有元数据用 WeakMap；去重用 Set。**
