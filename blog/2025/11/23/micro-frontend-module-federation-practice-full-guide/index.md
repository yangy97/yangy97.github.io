---
url: /blog/2025/11/23/micro-frontend-module-federation-practice-full-guide/index.md
---
> 概念与 `shared` 见《微前端与 Webpack Module Federation：共享依赖、远程容器与版本》（该文仍以 ==Webpack 5 语法== 讲清原理）。**本文实操以 Vite 为主**；**Webpack 5 的 `ModuleFederationPlugin`** 仅作一句对照。

***

### 一、角色与文件

* \==host==：**消费者**，运行时拉 **`remoteEntry.js`**。
* **remote**：**生产者**，`exposes` 暴露页面或组件。
* **约定**：**React / Vue 大版本** 在 `shared` 与 **子项目 `peerDependencies`** 中 **锁死**。

**目录（Vite 示例）**

```
host/
  src/
  vite.config.ts
  package.json
remote/
  src/
  vite.config.ts
  package.json
```

安装联邦插件（**包名、字段以当前 README 为准**，常见为 [`@originjs/vite-plugin-federation`](https://github.com/originjs/vite-plugin-federation) 或团队选型的 **`@module-federation/vite`**）：

```bash
# remote / host 各自
npm i @originjs/vite-plugin-federation -D
```

***

### 二、Remote：`vite.config.ts` 核心

以下以 **Vue3 + 暴露一个页面组件** 为例；React 将 `exposes` 指到 `tsx` 即可。

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'order_remote',
      filename: 'remoteEntry.js',
      exposes: {
        './OrderPage': './src/OrderPage.vue',
      },
      shared: {
        vue: { singleton: true, requiredVersion: '^3.0.0' },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false, // 联调期可先关；上线再按团队规范打开
    cssCodeSplit: false, // 部分联邦示例建议单 css，以插件说明为准
  },
  server: {
    port: 3002,
    cors: true,
    origin: 'http://localhost:3002',
  },
});
```

* **`name`** 与 **host 侧 `remotes` 的键** 一致。
* 构建后 **`remoteEntry.js`** 可能在 `dist` **根** 或 **`dist/assets/`**，以 **实际 `npm run build` 产物** 为准，host 的 URL **写对目录**。
* **`shared` 的 singleton**：避免页内 **双份 Vue/React** 导致诡异 bug。

`npm run build` 后检查 **`dist` 中是否存在 `remoteEntry.js`** 及异步 chunk；`npm run dev` 时 **有的版本** 将入口暴露在 **与生产不同的路径**，以 **开发服务器实际返回** 的 URL 联调（浏览器直接打开 `http://localhost:3002/.../remoteEntry.js` 确认）。

***

### 三、Host：拉 remote 与消费

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'shell',
      remotes: {
        // 开发期指向 remote dev；生产写 CDN 绝对地址
        order_remote: 'http://localhost:3002/remoteEntry.js',
      },
      shared: {
        vue: { singleton: true, requiredVersion: '^3.0.0' },
      },
    }),
  ],
  build: { target: 'esnext' },
  server: { port: 3000, cors: true },
});
```

**使用（Vue3 异步组件）**：

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

const OrderPage = defineAsyncComponent(() => import('order_remote/OrderPage'));
</script>

<template>
  <Suspense>
    <template #default><OrderPage /></template>
    <template #fallback><div>加载中</div></template>
  </Suspense>
</template>
```

**TypeScript** 需在 **host** 中声明 remote 模块，避免 `import('order_remote/...')` 报类型错：

```ts
// host/src/vite-env.d.ts 等
declare module 'order_remote/OrderPage' {
  import { DefineComponent } from 'vue';
  const c: DefineComponent<{}, {}, any>;
  export default c;
}
```

**React 18** 则用 **`React.lazy` + `Suspense`** 消费 `exposes` 的模块；`shared` 中增加 **`react` / `react-dom`** 的 `singleton`。

***

### 四、本地联调顺序

1. **先** `cd remote && npm run dev`（或 build + `serve dist`），浏览器确认 **`remoteEntry.js` 可访问**（路径可能是根路径或带 `assets/`，以 Network 为准）。
2. **再** `cd host && npm run dev` 开 **3000**，打开页面，在 **Network** 中确认依次请求 **entry** 与 **远程 chunk**。
3. **CORS**：remote 的 `server.cors: true` 或 host 用 **Vite `server.proxy`** 把 `/order_remote` 指到 3002，**同域** 可绕 CORS。
4. 若 `remotes` 的 URL 写错，控制台的 **federation 加载失败** 会指向 **404 的 remoteEntry** —— 优先核对 **dev/build 下 entry 实际路径**。

**Webpack 5 对照**（仅一句）：`ModuleFederationPlugin` 的 `exposes` / `remotes` / `shared` 含义相同，**差异在配置写在 `webpack.config.js` 与 `webpack serve` 的端口**；老项目可渐进迁移到 **Vite 联邦插件** 再拆仓库。

***

### 五、生产部署与缓存

| 资源 | 缓存策略 | 原因 |
|------|-----------|------|
| `remoteEntry.js` | **短缓存** 或 **不缓存** | 其 **内联引用** 的 chunk 名会随构建变，需 **尽快** 拉新 entry |
| 带 **hash 的 chunk** | **长缓存** | 内容变则文件名变 |

**回滚 remote**：只切 **旧版 `remoteEntry` 所在目录** 或 **配置中心里 remote 的 URL**；host **不必** 重发（若 remotes 为外链）。

**动态 remotes**：生产可由 **主应用 `window.__RUNTIME__.mfRemotes`** 等注入 URL，在 **`vite.config` 用 env** 或 **自定义插件** 写进 `federation({ remotes: ... })`；思路与 Webpack 的 **Promise remotes** 一致，实现思路与《**微前端与 Webpack Module Federation**》一文中的 **Promise 动态 remotes** 同构；Vite 侧用 **环境变量/运行时配置** 拼进 `federation({ remotes })` 即可。

***

### 六、与「应用级微前端」组合

* **基座用 qiankun** 拉 **子应用 A**，子应用 A 内部用 **Vite 联邦** 拉 **设计系统 / 业务 remote** —— 需保证 **`shared` singleton** 与 **线上一致** 的 **Runtime 单例**，并在 **UAT 实机** 打一遍 **Hooks / 主题**。
* **只联邦、无 qiankun**：适合 **同产品、多团队、模块级** 拼页；**多 HTML 子应用** 再考虑 **qiankun**。

***

### 七、常见问题与处理

| 问题 | 原因 | 处理 |
|------|------|------|
| **remote 拉取 404、联邦初始化失败** | `remotes` 中 **`remoteEntry.js` 路径** 与 **build 产物** 不一致（常见在 `dist/assets/`） | 每次发版在 **CI 后** 用 **curl 验 URL**；开发、生产 **两套 remotes 环境变量** |
| **`Invalid hook call` / 双 Vue** | **shared singleton** 未生效或 **remote 自打了一份** runtime | 两端 **同主版本** + 文档要求的 **单例** 配置；必要时 **一个工程 external** 由 host 提供 |
| **发版后 host 仍用旧页** | **浏览器/ CDN 缓存了旧 `remoteEntry.js`**；误以为只换 chunk 即可 | `remoteEntry` **短缓存**；发布时 **bump 目录或清 CDN** 验证 |
| **仅生产环境 `import()` 失败** | **HTTPS 与混合资源**、或 **跨域** 在 prod 更严 | **全 https**；`Access-Control-Allow-Origin` 与 **CORS 预检** 配齐 |
| **TS 报 remote 模块不存在** | 未 **声明模块** 或 **路径别名** 未覆盖 | 维护 **`remote.d.ts`**；**CI** 中跑 **typecheck** 防回归 |
| **与 qiankun 同页叠两层联邦** | **依赖共享** 与 **加载顺序** 更难 | 定 **谁提供 React 单例**；**UAT 全链路** 点一遍菜单与鉴权 |

***

### 八、小结

Module Federation **落地 = remote exposes + host remotes + shared 锁版本 + 搞对 `remoteEntry` 的真实 URL**。**本文以 Vite 联邦插件为主**；Webpack 5 仅作**概念等价的旧栈入口**。
