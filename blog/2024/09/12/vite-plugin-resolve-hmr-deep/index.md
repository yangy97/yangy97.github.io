---
url: /blog/2024/09/12/vite-plugin-resolve-hmr-deep/index.md
---
Vite 插件 ==兼容 Rollup 插件钩子==，又扩展了 **`configureServer`、`transformIndexHtml`** 等 **仅开发期** 能力。**resolve 别名**、**条件替换**、**HMR 自研模块** 出问题时常表现为 **「刷新才生效」或「边界失效」**。下面写 **插件流水线、resolve、HMR API 与常见坑**。

***

### 一、插件 `enforce`：pre / 默认 / post

```ts
export default defineConfig({
  plugins: [
    { name: 'a', enforce: 'pre', resolveId(id) { /* ... */ } },
    { name: 'b', transform(code, id) { /* ... */ } },
    { name: 'c', enforce: 'post', transform(code, id) { /* ... */ } },
  ],
});
```

\==直觉==：**pre** 先改 **id 解析** 或 **虚拟模块**；**post** 最后 **再加工**（如压缩前注入）。

***

### 二、`resolve.alias` 与 TS 路径

```ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

**TS** 仍需 **`paths` 同步**，否则 **编辑器/ tsc** 与 **Vite 运行时** 不一致。

***

### 三、虚拟模块：与插件配合

```ts
const virtualId = '\0virtual:env';
export function envPlugin(): Plugin {
  return {
    name: 'virtual-env',
    resolveId(id) {
      if (id === 'virtual:env') return virtualId;
    },
    load(id) {
      if (id === virtualId) return `export default ${JSON.stringify(process.env.MY_KEY)}`;
    },
  };
}
```

`\0` 前缀惯例表示 **虚拟 id**，避免与真实文件冲突。

***

### 四、HMR：`import.meta.hot` 与边界

**条件**

```ts
if (import.meta.hot) {
  import.meta.hot.accept('./foo.ts', (newMod) => {
    // 替换副作用
  });
}
```

**常见边界**

* **非 ESM** 或 **动态入口** 难以局部更新 → **整页刷新**。
* **导出整体重绑** 失败 → 需要 **`accept` 回调里改 DOM 状态** 或 **用状态管理** 全量替换。
* **CSS** 通常 **自动 HMR**；**CSS Modules** 类名变化可能导致 **组件未重挂载** 而样式已变 → **设计组件时要可热替换**。

***

### 五、`server.watch` 与 Monorepo

`server.watch` 默认可能 **不跟踪** `node_modules` 里 symlink 的包；开发 **本地 npm link** 时：

```ts
server: {
  watch: { usePolling: true }, // 少数文件系统需要
  fs: { allow: ['..'] },       // 允许访问工作区外（按安全策略）
},
```

***

### 六、收束

Vite 插件 = **Rollup 钩子 + Vite 专属钩子**；排障 **先看 enforce 顺序**，再看 **resolve 与虚拟模块**。HMR **不是魔法**，**状态ful 模块** 要自己 **accept** 或 **容忍刷新**。
