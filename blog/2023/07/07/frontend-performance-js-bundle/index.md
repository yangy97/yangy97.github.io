---
url: /blog/2023/07/07/frontend-performance-js-bundle/index.md
---
主线程负责：==解析/编译 JS==、执行、样式计算、布局、部分绘制协调。Chrome 把 **>50ms** 的连续任务标为 **Long Task**（经验值，以浏览器实现为准），会直接影响 **INP** 与 **可交互时间**。本篇补：**任务从哪来、怎么拆、Worker 边界、第三方、Profile 读法**。

***

### 一、一次冷启动主线程在忙什么（简化）

1. \==下载== script（Network）
2. **Parse + Compile**（大文件更明显，尤其移动设备）
3. **执行** 顶层代码（注册路由、初始化框架）
4. **首屏渲染** 触发的业务逻辑

所以：**减少首包 KB** 与 **减少顶层同步工作** 同样重要。

***

### 二、长任务典型来源

| 来源 | 例子 |
|------|------|
| 大包 | 单 chunk 2MB+，parse+compile 占满几十 ms～几百 ms |
| 同步 CPU | 大数组排序、复杂正则、巨型 `JSON.parse` |
| 框架 | 超大虚拟 DOM diff、错误导致的重复渲染 |
| 第三方 | 统计脚本、A/B SDK 同步执行 |

***

### 三、路由分包 + 组件异步（Vue）

```ts
{ path: "/dash", component: () => import("@/views/Dash.vue") }
```

组件内：

```vue
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
const Heavy = defineAsyncComponent(() => import("./Heavy.vue"));
</script>
```

**注意**：若 `Heavy.vue` 顶层仍 `import * as echarts from 'echarts'`，**进入该 chunk 仍会拉满 echarts**——重库宜 **再拆** 或 **按需 API**。

***

### 四、Web Worker：何时值回票价

适合：**CPU 重、可序列化数据、结果可异步展示**。\
不适合：**频繁 tiny 消息**（序列化开销 > 计算）、**必须同步更新 DOM**（Worker 不能碰 DOM）。

**主线程（Vite `new URL` Worker）：**

```js
const w = new Worker(new URL("./calc.ts", import.meta.url), { type: "module" });
w.postMessage({ rows: bigArray });
w.onmessage = (e) => {
  result.value = e.data;
};
```

**calc.ts：**

```ts
self.onmessage = (e: MessageEvent<{ rows: number[] }>) => {
  const { rows } = e.data;
  self.postMessage(rows.reduce((a, b) => a + b, 0));
};
```

大数据建议 **Transferable**（`postMessage(buf, [buf])`）减少拷贝。

***

### 五、长任务切片：让出事件循环

```js
async function chunkWork(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    fn(items.slice(i, i + size));
    await new Promise((r) => setTimeout(r, 0));
  }
}
```

**`scheduler.yield()`**（ Chromium 新 API，需查兼容性）可更语义化让出；不支持则 `setTimeout`。

***

### 六、第三方脚本：加载与超时

```js
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    const t = setTimeout(() => reject(new Error("timeout")), 8000);
    s.onload = () => {
      clearTimeout(t);
      resolve();
    };
    s.onerror = () => {
      clearTimeout(t);
      reject();
    };
    document.body.appendChild(s);
  });
}
```

失败时 **不得阻塞主流程**（统计可丢，下单不可丢）。

***

### 七、`browserslist` 与 Legacy 包

若 `.browserslistrc` 仍覆盖 **极老浏览器**，polyfill 会 **撑爆主包**。应对：

* 用 **真实流量** 更新 browserslist；
* Vite **`@vitejs/plugin-legacy`**：现代浏览器走 **小 esbuild 包**，老浏览器另发 **legacy chunk**。

***

### 八、Performance：怎么读 Main 线程

1. 录 **点击 → 下一帧**。
2. 找 **灰色 Task** 宽度 **>50ms**。
3. **Bottom-Up**：看 `Evaluate Script` / `FunctionCall` / `Vue patch` 等。
4. 若热点是 **Compile Script** → 回到 **拆包与减依赖**；若是 **业务函数** → **算法或 Worker**。

**Long Animation Frames API（LoAF）** 等新 API 可更细归因 INP（需浏览器支持，可查 MDN）。

***

### 九、收束

优先 **减首包 parse+compile**、**砍长任务**、**治理第三方**；Worker 与切片是 **战术**，不能替代 **架构上少做同步重活**。
