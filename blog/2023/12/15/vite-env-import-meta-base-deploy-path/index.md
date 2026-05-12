---
url: /blog/2023/12/15/vite-env-import-meta-base-deploy-path/index.md
---
Vite 用 ==`import.meta.env`== 暴露 **模式、BASE\_URL、开发/生产标记**；**`.env*` 文件**按 **优先级** 合并。**部署到子路径** 时 **`base`** 配错会导致 **白屏与资源 404**。本篇把 **变量规则** 与 **静态资源路径** 一次说清。

***

### 一、内置环境变量（概念）

| 变量 | 含义 |
|------|------|
| ==`import.meta.env.MODE`== | `development` / `production` 等 |
| **`import.meta.env.BASE_URL`** | **`base` 配置** 的公开前缀，路由 basename 常用 |
| **`import.meta.env.PROD` / `DEV`** | 布尔，便于 **tree-shake** 掉调试代码 |
| **`import.meta.env.SSR`** | 是否 SSR 构建 |

**注意**：**只有以 `VITE_` 前缀** 的自定义变量会暴露给客户端（默认规则，可配 `envPrefix`）。

***

### 二、`.env` 文件层级（简）

```text
.env                # 所有环境
.env.local          # 本地覆盖，勿提交
.env.development
.env.production
```

**加载顺序** 与 **mode** 有关；**本地秘密** 放 `.env.local` 并 **gitignore**。

***

### 三、`base` 与 GitHub Pages / 子目录

部署到 `https://user.github.io/repo/` 时：

```ts
export default defineConfig({
  base: '/repo/',
});
```

**路由库**（vue-router `createWebHistory`）通常要写：

```ts
createWebHistory(import.meta.env.BASE_URL)
```

否则 **刷新 404** 或 **资源路径错**。

***

### 四、不要用 `process.env` 裸写

Vite **不默认**  polyfill Node 的 `process`；请用 **`import.meta.env`** 或 **`define` 注入**（需知 **静态替换** 边界）。

***

### 五、收束

环境题：**先看 MODE 与 BASE\_URL** → **再看是否只暴露了 VITE\_** → **最后对齐 Nginx/CDN 的真实路径**。与下一篇 **build.rollupOptions** 一起看 **publicPath 等价物**。
