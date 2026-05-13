---
url: /blog/2022/05/09/vue-vite-project-structure/index.md
---
用 ==Vite== 搭 Vue 3 项目时，官方模板很轻，**目录怎么长**取决于团队规模与是否 monorepo。这篇给一个 **中后台 / 中小型 SPA** 常用布局，可按需删减。

***

### 一、推荐的基础树（示例）

```text
src/
  assets/           # 静态资源：图片、字体（小图标可放这里或转 SVG 组件）
  components/       # 跨页面复用的展示组件
    common/           # 按钮、布局壳等
  composables/      # 组合式函数 useXxx
  views/            # 路由页面（或 pages/，二选一，全项目统一）
  router/           # 路由表与守卫
  stores/           # Pinia（若使用）
  api/              # 对后端封装的请求层（axios/fetch 实例、接口函数）
  utils/            # 纯函数、常量
  types/            # 全局 TS 类型（或按模块分）
  App.vue
  main.ts
```

\==原则==：**路由页面**与\*\* dumb 组件\*\*分层清晰；**请求**不要散落在各个 `.vue` 里硬编码 URL。

***

### 二、`@` 别名与路径

`vite.config.ts` 里通常配置：

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

`tsconfig.json` 里同步 `paths`，IDE 才能跳转。

***

### 三、环境变量

* 客户端可见变量必须以 **`VITE_`** 前缀（Vite 约定）。
* **密钥、服务端 token** 不要进前端包；需要时走 **自建 BFF** 或后端转发。

`.env.development` / `.env.production` 分环境，**不要**把真实密钥提交到 Git。

***

### 四、与 Monorepo 的关系

若 UI 与 BFF 在同一仓库，常见把 `apps/web`、`packages/ui` 拆开，见《Monorepo 与 pnpm：目录与依赖怎么管》。单仓单应用时保持 `src` 内清晰即可。

***

### 五、小结

目录没有唯一标准，但 **全项目统一命名**（views 还是 pages、api 还是 services）比「个人喜好」重要；新同学看目录就能猜到哪类文件该放哪，维护成本最低。
