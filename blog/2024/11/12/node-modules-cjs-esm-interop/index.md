---
url: /blog/2024/11/12/node-modules-cjs-esm-interop/index.md
---
CommonJS（`require`/`module.exports`）与 ES Module（`import`/`export`）长期共存。==解析算法、缓存、循环依赖行为== 不一致；**互操作**（`import()` 动态加载 CJS、`createRequire` 在 ESM 里用 `require`）是升级与工具链里必踩的坑。本篇按 **运行时行为** 讲透主干。

***

### 一、`require(x)` 解析在干什么（简化）

1. \==核心模块==（如 `fs`）优先。
2. **路径**：以 `/` `./` `../` 开头走 **文件**；否则走 **node\_modules 向上查找**。
3. **目录**：尝试 `package.json` 的 **`main`**、**`exports`**（若存在则 **严格按 exports 映射**，没匹配到会失败）。
4. **扩展名**：`.js`、`.json`、`.node` 等（具体列表以文档为准）。

**`exports` 字段** 是现代包的「公开 API 边界」：避免深路径被外部依赖，升级时可改内部结构。

***

### 二、模块缓存与多次 `require`

同一 **解析路径** 的模块 **只执行一次** 顶层代码，之后 `require` 返回 **同一 `module.exports` 引用**。

* **副作用模块**（注册全局、打补丁）依赖这个特性。
* **热更新** 必须 **删 `require.cache`** 或换进程，生产慎用。

***

### 三、循环依赖（A require B，B require A）

执行顺序是 **谁先有未完成的 exports**。典型现象：**某一侧拿到的是「尚未赋值完成的 exports」**（如 `{}` 或部分初始化）。

**解法**：把相互依赖收拢成 **第三模块**、或 **延迟访问**（函数内再 `require`）、或 **拆接口层**。**不要**指望「再绕一圈」就 magically 好。

***

### 四、ESM 与 CJS 的差异（要点）

| 维度 | CJS | ESM |
|------|-----|-----|
| **加载** | **同步**（运行时一路 require） | **静态** 分析 + 异步加载（顶层 `await` 等） |
| **值绑定** | `module.exports` **可改** | `import` 的 live binding（对 `export let` 等） |
| **`this`** | 模块顶层常见为 `exports` | 顶层 **`undefined`**（严格模式语义） |

Node 用 **`"type": "module"`** 或 **`.mjs`** 标明 ESM；**`.cjs`** 强制 CJS。

***

### 五、互操作实战

* **ESM 里需要 `require`**：用 **`module.createRequire(import.meta.url)`**。
* **CJS 里动态加载 ESM**：**`import()`** 返回 Promise。
* **默认导出**：CJS 的 `module.exports = fn` 在 ESM 侧常被当作 **default import**（Node 互操作规则以官方表为准，版本间会细化）。

**工具链**：TypeScript `moduleResolution`、打包器 **是否 external** Node 内置模块，都会影响产物是 **纯 ESM** 还是 **混用**。

***

### 六、收束

模块问题 **一半是路径解析（exports）**，一半是 **循环依赖与互操作**。新库优先 **明确 `exports` + 选准 `type`**；老项目渐进迁移用 **`import()` / createRequire\`** 比一次性重写安全。
