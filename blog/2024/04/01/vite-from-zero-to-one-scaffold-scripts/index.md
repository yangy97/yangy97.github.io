---
url: /blog/2024/04/01/vite-from-zero-to-one-scaffold-scripts/index.md
---
目标：==理解== `npm create vite` 生成的 **每一层职责**，并能 **手写最小 `vite.config`** 接上 **路径别名、端口、预览**。与 Webpack「一切皆配置」不同，Vite **默认合理**，改配置前先知道 **默认值在哪查**。

***

### 一、创建项目

```bash
npm create vite@latest my-app -- --template vue-ts
cd my-app
npm install
npm run dev
```

关键文件：

```text
my-app/
  index.html          # 入口 HTML（注意：在根目录，不是 public）
  vite.config.ts
  package.json
  src/
    main.ts
```

\==Vite 以 `index.html` 为开发服务器入口==，脚本用 **`<script type="module" src="/src/main.ts">`**，浏览器 **原生 ESM** 拉模块。

***

### 二、`package.json` scripts 含义

| 脚本 | 作用 |
|------|------|
| **`dev`** | 起 **开发服务器**（esbuild 转译 TS、HMR） |
| **`build`** | **Rollup** 生产打包到 `dist/` |
| **`preview`** | **本地静态服** 预览 `dist`（用于验收构建产物） |

**误区**：`preview` **不是** 另一个构建，只是 **serve dist**。

***

### 三、最小 `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
```

**`defineConfig`** 提供类型提示；**路径别名** 建议与 **`tsconfig paths`** 同步。

***

### 四、与 Webpack 的心智差异（一句话）

* **开发**：Vite **尽量不改应用源码**，依赖 **预构建** 解决裸导入与性能。
* **生产**：**Rollup** 负责 **tree-shaking、拆包、压缩**——配置落在 **`build.rollupOptions`**。

***

### 五、收束

从 0 到 1：**根 `index.html` + `type=module` + `vite.config` 插件**。下一篇写 **`optimizeDeps` 与预构建踩坑**。
