---
url: /blog/2024/05/26/vite-optimize-deps-prebundle-gotchas/index.md
---
开发时 Vite 用 ==esbuild== 把 **node\_modules 里难直接给浏览器的依赖** 打成 **可缓存的 ESM 包**，写在 **`node_modules/.vite`**。搞不清 **`optimizeDeps.include/exclude`**，会遇到 **`Failed to resolve import`**、**双份依赖**、**热更新慢**。本篇列 **典型症状与改法**。

***

### 一、为什么要预构建

* \==CommonJS / 散落入口==：浏览器不能原生 `require`。
* **大量小文件**：直接请求 **deep path** 会 **请求风暴**。
* **统一 ESM 形状**：后续 **转换成本** 更低。

***

### 二、何时需要 `include`

某包 **未被自动探测到** 或 **动态 import** 导致首次慢，可 **显式 include**：

```ts
export default defineConfig({
  optimizeDeps: {
    include: ['lodash-es', 'some-cjs-package->some-cjs-package/dist/index.esm.js'],
  },
});
```

***

### 三、何时需要 `exclude`

* **只想在浏览器里用原生 ESM 的包**（极少）。
* **预构建反而破坏** 的包（需读 issue）；可 **exclude** 后 **自己保证** 浏览器可加载。

**慎用**：exclude 过多会 **回到冷启动慢**。

***

### 四、`force` 与缓存

升级依赖后 **仍用旧预构建**：

```bash
rm -rf node_modules/.vite
# 或
vite --force
```

CI 中若 **锁文件未变但 patch 了 node\_modules**，也可能需要 **清缓存**。

***

### 五、与 SSR 的交叉

SSR 时 **部分依赖** 需在 **服务端 external** 或 **ssr.noExternal** 里声明，否则 **双份实现** 或 **Node API 打进浏览器**。见专门 **SSR 边界** 一文。

***

### 六、小结

预构建题：**先删 `.vite` 试一次** → **看报错是 resolve 还是运行时** → **再决定 include/exclude**。不要在未读 **依赖包导出方式** 前盲目 **整包 exclude**。
