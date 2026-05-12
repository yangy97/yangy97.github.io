---
url: /blog/2022/04/29/webpack-loader-pitch-tree-shaking-sideeffects/index.md
---
Loader 把 ==任意资源== 转成 Webpack 能继续解析的 **JS 模块字符串**；**从右到左** 的执行顺序常被背错，而 **Pitch** 阶段则是 **从左到右** 的另一条链。**Tree shaking** 依赖 **ESM 静态结构** 与 `package.json` 的 **`sideEffects`** 声明。下面写 **执行顺序、inline request、副作用标记、常见坑**。

***

### 一、Normal 阶段：从右到左

```js
// webpack.config.js
module: {
  rules: [
    { test: /\.tsx$/, use: ['babel-loader', 'ts-loader'] },
  ],
},
```

对某个 `.tsx` 文件：==先 `ts-loader` 再 `babel-loader`==（**右先左后**）。\
记忆：**最后一个 loader 最先碰到「原始文件」**。

***

### 二、Pitch 阶段：从左到右，可「短路」

每个 loader 可导出 **`pitch`** 函数，在 **normal 之前** 按 **从左到右** 执行。

若某个 `pitch` **有返回值**，则 **跳过后续 loader 的 normal**，直接回到 **右侧** loader 的 normal（**熔断**）。\
**style-loader** 等利用 pitch 注入运行时，避免重复读文件。

**示例（概念）**

```js
module.exports = function () {};
module.exports.pitch = function (remainingRequest) {
  // 若在此 return "module.exports = ..."，则短路后续 normal
};
```

***

### 三、inline request：`!!` `!` `?` 的含义

import 或 require 里可写：

```js
import x from '!!style-loader!css-loader!./a.css';
```

* **`!!`**：禁用 **全部** config 与前置 loader，只用本串。
* **`!`**：禁用 **normal** 规则里追加的 loader（细节以文档为准）。

用于 **特例覆盖**，但可读性差，**尽量少用**。

***

### 四、Tree Shaking：ESM + 静态分析 + 生产模式

* **前提**：`import/export` **静态**（顶层），CommonJS `require` **难以摇掉**。
* **`usedExports` + `minimize`**：`sideEffects: false` 时更激进删除未引用 export。

**`package.json`**

```json
{
  "sideEffects": false
}
```

或 **白名单**：

```json
{
  "sideEffects": ["**/*.css", "./polyfill.ts"]
}
```

**语义**：告诉打包器 **哪些子路径「有副作用」**（改原型、注册全局、CSS side effect）。**乱写 `false`** 会导致 **删掉仍有副作用的模块** → 线上 **静默坏**。

***

### 五、典型坑：barrel 文件与「摇不动」

`index.ts` 里 `export * from './a'`、`export * from './b'`，若业务只 `import { foo } from './index'`，理论上只应拉 **a**。若 **b 里有顶层副作用**（或 TS 编译成无 ESM 信息），摇树效果变差。

**缓解**：**细粒度入口**、**禁止** 巨型 barrel、库作者正确标 **`sideEffects`**。

***

### 六、`exports` 字段与条件导出（略提）

Node/Webpack 解析 **`package.json#exports`** 时，**子路径** 与 **development/production** 条件会影响 **实际 resolve 到的文件**，进而影响 **是否能摇**。排障时可用 **`resolve fullySpecified`** 等配置（Webpack 5）。

***

### 七、收束

Loader = **资源转换管道 + 可选 pitch 短路**；Tree shaking = **ESM + 真实 sideEffects 声明 + 避免假 barrel**。生产问题 **先查是否 CJS 混用** 与 **sideEffects 撒谎**。
