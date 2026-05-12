---
url: /blog/2023/10/21/vite-build-rollup-ssr-external/index.md
---
`vite build` 本质是 ==调 Rollup== 产出 **浏览器包**；**SSR**、**库模式**、**Node 端打包** 时 **`ssr.noExternal` / `build.rollupOptions.external`** 决定 **哪些依赖打进 bundle**，错配会导致 **双份 React** 或 **服务端读不到 CJS**。下面写 **输出形态、manualChunks、SSR 外部化策略、库模式**。

***

### 一、`build.rollupOptions`：接管输出的主入口

```ts
export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react-vendor';
        },
        chunkFileNames: 'js/[name]-[hash].js',
      },
    },
  },
});
```

\==`manualChunks`==：比 **全量 vendors 一包** 更细，但 **过碎** 影响 **HTTP/2 多路复用下的压缩比**——需 **实测**。

***

### 二、SSR：`noExternal` vs `external`

**服务端渲染** 时，部分 **仅 CJS** 的包若 **被外部化**，Node `require` 路径可能与 **打包根** 不一致；若 **打进 bundle**，又可能 **与宿主重复**。

```ts
export default defineConfig({
  ssr: {
    noExternal: ['antd', /@scope\\/pkg/],
  },
});
```

**经验**：**同一 React 副本** 必须在 **client/ssr 两端一致**；**`react` 不要** 被错误打两份。

***

### 三、环境变量与 `import.meta.env`

Vite **静态替换** `import.meta.env.VITE_*`，**不会** 暴露 `process.env` 给浏览器（除非插件注入）。

```ts
// 仅 VITE_ 前缀进客户端
console.log(import.meta.env.VITE_API_BASE);
```

**SSR**：服务端可读 **真实环境变量**，但 **不要** 把密钥编译进 **client bundle**。

***

### 四、库模式：`build.lib`

```ts
build: {
  lib: {
    entry: path.resolve(__dirname, 'src/index.ts'),
    name: 'MyLib',
    fileName: 'my-lib',
    formats: ['es', 'cjs'],
  },
  rollupOptions: {
    external: ['vue'],
  },
},
```

**peerDependencies** 应 **`external`**，否则 **打进库** 会 **体积爆炸** 且 **宿主重复实例**。

***

### 五、`build.chunkSizeWarningLimit` 与产物分析

默认 **>500KB** 警告；大 chunk 用 **`rollup-plugin-visualizer`** 看 **谁占体积**，再决定 **拆包或懒加载**。

***

### 六、收束

生产构建 = **Rollup 输出策略 + SSR 外部化清单 + 环境变量边界**。**库模式** 与 **应用模式** 的 **external 心智** 不同，**勿混用**。
