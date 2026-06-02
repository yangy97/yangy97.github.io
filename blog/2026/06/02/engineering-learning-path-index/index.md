---
url: /blog/2026/06/02/engineering-learning-path-index/index.md
---
`02-工程化与性能` 目录文章多、术语杂，直接点开「深入 Vite 双引擎」或「企业 CI/CD」容易 **概念接不上**。本篇是 **阅读地图**：先说明各块在解决什么问题，再给出 **先决知识 + 推荐顺序**。Vue/小程序主线见 [Vue 导读](/2026/05/24/vue-learning-path-index/)。

***

### 一、目录里大致有什么

```text
构建链     Vite / Webpack 从零到一 + 深入
性能       总览 + 网络/渲染/JS/列表/内存/Vitals/CI
测试       策略 + Vitest + MSW + Playwright
企业级     CI/CD、网关、多环境、可观测、发布、安全
Node       事件循环、Stream、Egg 基础（进阶在 06 目录）
```

**读法原则**：深文在正文里对缩写/行话做 **inline 解释**（括号说明）；仍卡住时回到本篇查 **该先读哪篇**。

***

### 二、先决知识（跨系列共用）

| 概念 | 一句话 | 不懂先读 |
|------|--------|----------|
| **HTTP** | 浏览器用请求拉 HTML/JS/API | 面经 [网络缓存安全](/2026/05/25/interview-network-security-cache/) |
| **ESM / CJS** | `import` vs `require` 两种模块格式 | [ES Module 文](/2023/05/08/es6-module-live-binding-and-dynamic-import/) |
| **CDN / 缓存头** | 静态资源边缘缓存与 `Cache-Control` | [性能·网络篇](/2023/07/21/frontend-performance-network-assets/) |
| **主线程** | JS 与布局默认在同一线程跑 | [性能·渲染篇](/2023/07/31/frontend-performance-render-paint/) |
| **CI/CD** | 提交代码后自动构建、测试、部署 | [企业级导读](/2026/06/02/enterprise-ops-primer-index/) |
| **BFF** | 给前端定制的后端聚合层 | [BFF RPC 文](/2026/05/16/bff-protobuf-rpc-client-stack-srpc-pattern/) |

***

### 三、路径 A：性能优化（前端工程师主路径）

**目标**：能定义指标、定位瓶颈、落地优化，而不是只会说「加缓存」。

| 顺序 | 文章 | 说明 |
|------|------|------|
| 0 | [性能总览](/2023/07/26/frontend-performance-overview/) | **必读**；SLO、关键路径、术语表 |
| 1 | [Web Vitals](/2023/08/15/frontend-performance-web-vitals/) | LCP/INP/CLS 是什么、怎么量 |
| 2 | [网络与静态资源](/2023/07/21/frontend-performance-network-assets/) | 体积、缓存、preload |
| 3 | [渲染与绘制](/2023/07/31/frontend-performance-render-paint/) | 重排、合成、滚动 |
| 4 | [JavaScript 与加载](/2023/07/07/frontend-performance-js-bundle/) | 分包、长任务 |
| 5 | [长列表与图片](/2023/07/12/frontend-performance-list-image/) | 虚拟列表、懒加载 |
| 6 | [Vue 实践](/2023/08/10/frontend-performance-vue-practice/) | 框架层落地 |
| 7 | [DevTools 排查](/2023/07/02/frontend-performance-devtools/) | 实操 |
| 8 | [性能预算 CI](/2025/10/16/frontend-performance-budget-ci/) | 防回归 |

按需：[内存泄漏](/2023/07/16/frontend-performance-memory-leaks/)、[SSR 注水](/2023/08/05/frontend-performance-ssr-hydration-basics/)。

***

### 四、路径 B：Vite / Webpack 构建

| 顺序 | Vite | Webpack |
|------|------|---------|
| 1 | [Vite 从 0 到 1](/2024/04/01/vite-from-zero-to-one-scaffold-scripts/) | [Webpack 从 0 到 1](/2023/09/10/webpack-from-zero-to-one-entry-output-devserver/) |
| 2 | [devServer 代理 HMR](/2024/01/20/vite-server-proxy-hmr-bff-integration/) | [Loader 与 babel](/2023/09/15/webpack-loader-rules-babel-css-from-zero/) |
| 3 | [esbuild + Rollup 双引擎](/2024/02/07/vite-esbuild-dev-rollup-build-architecture/) | [Tapable 与 Compiler](/2023/10/05/webpack-tapable-compiler-plugin-mechanism/) |
| 4 | 插件 / 拆包 / env 系列 | splitChunks / MF 系列 |

**Monorepo**： [pnpm workspace](/2023/06/20/monorepo-pnpm-workspace/)。

***

### 五、路径 C：测试

1. [测试策略（金字塔）](/2026/05/22/frontend-testing-strategy-unit-integration-e2e/)
2. [Vitest 从 0 到 1](/2026/05/21/vitest-vue-test-utils-zero-to-one/)
3. [MSW 表格表单](/2026/05/21/frontend-admin-table-form-testing-msw/)
4. [Playwright 架构](/2025/11/16/headless-playwright-architecture-tracing-ci/)
5. [Playwright E2E 业务场景](/2026/06/01/playwright-e2e-admin-order-flow-scenario/)

***

### 六、路径 D：企业级 / 运维向（前端要懂边界）

从 [企业级运维导读](/2026/06/02/enterprise-ops-primer-index/) 进入，按 **CI → 环境 → 网关 → 发布 → 观测 → 安全** 顺序读。

***

### 七、与其他目录的衔接

| 目录 | 导读 |
|------|------|
| 微前端 | [微前端版图与选型](/2025/04/24/micro-frontend-mainstream-landscape-and-choice-2026/) |
| 中后台架构 | [架构导读](/2026/06/02/architecture-admin-index/) |
| RBAC | [RBAC 导读](/2026/06/02/rbac-learning-path-index/) |

***

### 八、一句话

**工程化深文 = 先读导读定顺序，再读总览拿术语，最后进分篇改代码**；遇到 K8s、RPC、权限模型等词，回导读里的「先决知识」表查该补哪篇。
