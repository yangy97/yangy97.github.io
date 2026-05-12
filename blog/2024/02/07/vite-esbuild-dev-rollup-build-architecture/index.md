---
url: /blog/2024/02/07/vite-esbuild-dev-rollup-build-architecture/index.md
---
Vite 的「快」不是玄学：==开发态== 用 **esbuild** 做依赖预构建与 TS/JS 转译（Go、极快）；**生产构建** 用 **Rollup** 做 **tree-shaking、拆 chunk、压缩** 等成熟管线。理解 **为什么 dev 不打包应用源码**、**预构建解决什么**、**build 与 dev 行为差异**，才能 **正确配置**、**少踩环境坑**。下面分 **架构、依赖优化、与 Webpack 心智差异** 展开。

***

### 一、开发时：原生 ESM + 按需编译

浏览器 ==直接请求== 源码模块（路径经 Vite 解析），**改哪个文件编译哪个**，配合 **HTTP 缓存头**（304）与 **模块图**，冷启动 **远小于** 打整包。

**代价**：**极多小请求** → 本地局域网无碍；**依赖在 node\_modules 里若散落深层路径**，需 **预构建** 打成 **可缓存的单文件**。

***

### 二、依赖预构建（optimizeDeps）

首次 `npm run dev` 时，Vite 扫描入口，对 **bare import**（如 `import lodash from 'lodash'`）：

* 用 **esbuild** 打成 **ESM**，合并小模块，减少请求数。
* 处理 **CommonJS → ESM** 互操作（部分包）。

**配置入口**

```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['antd/es/locale/zh_CN'], // 强制预构建
    exclude: ['some-esm-only-pkg'],
  },
});
```

**典型坑**：依赖 **动态换路径**、**新装包未触发重预构建** → 删 **`node_modules/.vite`** 再启。

***

### 三、生产构建：Rollup

`vite build` 走 **Rollup**，输出 **静态资源**，默认 **目标浏览器** 由 `build.target` 控制，**legacy 插件** 可另产 **polyfill 包**。

**与 dev 不一致点**（故意或配置导致）：

* **条件导出** `development` / `production` 分支不同。
* **环境变量** `import.meta.env.PROD` 替换。
* **CSS** 合并、**代码分割** 策略只在 build 生效。

**排障**：先在 **预览** `vite preview` 看产物，而不是只信 dev。

***

### 四、esbuild 在 Vite 里的边界

esbuild **不做** TS **类型检查**（只做 **擦除类型**）。**类型** 仍应用 **`tsc --noEmit`** 或 **IDE** 在 CI 里卡。

***

### 五、与 Webpack 心智对照

| 维度 | Webpack（典型） | Vite |
|------|------------------|------|
| Dev 编译单位 | 常 **整图** 增量 | **单模块** 按需 |
| 依赖处理 | resolver + loader 链 | **esbuild 预构建** |
| 生产打包 | 自研 + terser 等 | **Rollup** |

***

### 六、收束

Vite = **dev 快在按需 + esbuild 预构建**、**prod 稳在 Rollup**。遇到 **「dev 好 build 挂」**，优先查 **副作用、条件导出、SSR/SSR 外部化**。
