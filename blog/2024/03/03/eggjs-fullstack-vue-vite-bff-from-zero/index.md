---
url: /blog/2024/03/03/eggjs-fullstack-vue-vite-bff-from-zero/index.md
---
下面是一套 ==能直接照着搭== 的最小闭环：**根目录 pnpm workspace**，`apps/web` 跑 **Vite + Vue3**，`apps/server` 跑 **Egg 3**；浏览器只访问 **5173**，通过 **开发代理** 把 `/api` 转到 Egg **7001**，避免本地 CORS。你只需要 **Node 18+** 与 **pnpm**。

***

### 〇、你会得到什么

* 一条 ==GET== `GET /api/v1/hello`：返回 JSON。
* 一条 **POST** `POST /api/v1/echo`：原样回显 JSON body（演示 **body 解析**）。
* 前端 `App.vue` 用 **`fetch('/api/...')`**（相对路径），由 Vite 代理到 Egg。
* 根目录一条命令 **并行起前后端**（可选 `concurrently`）。

***

### 一、创建目录与 workspace

```bash
mkdir egg-vue-bff-demo && cd egg-vue-bff-demo
pnpm init
```

根目录 `pnpm-workspace.yaml`：

```yaml
packages:
  - 'apps/*'
```

根 `package.json`（名称随意，重点是 scripts）：

```json
{
  "name": "egg-vue-bff-demo",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "dev:server": "pnpm --dir apps/server dev",
    "dev:web": "pnpm --dir apps/web dev"
  }
}
```

> 说明：`pnpm -r --parallel run dev` 会在 **所有子包** 里找 `dev` 并并行执行，因此 **`apps/server` 与 `apps/web` 的 `package.json` 都必须有 `dev` 脚本**（下文的 Egg 用 `egg-bin dev`，Vite 模板自带 `vite`）。若不想并行，可开 **两个终端** 分别执行 `pnpm dev:server` 与 `pnpm dev:web`。

目录结构（后面几步会填满）：

```text
egg-vue-bff-demo/
  pnpm-workspace.yaml
  package.json
  apps/
    server/          # Egg BFF
    web/             # Vue + Vite
```

***

### 二、后端：初始化 Egg（apps/server）

```bash
mkdir -p apps/server && cd apps/server
pnpm init
pnpm add egg
pnpm add -D egg-bin
cd ../..
```

`apps/server/package.json` 的 **`scripts`** 务必有：

```json
{
  "name": "egg-bff",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "egg-bin dev",
    "debug": "egg-bin debug"
  },
  "dependencies": {
    "egg": "^3.0.0"
  },
  "devDependencies": {
    "egg-bin": "^6.0.0"
  }
}
```

#### 1）`config/config.default.js`

```js
/** @param {import('egg').EggAppInfo} appInfo */
module.exports = appInfo => ({
  keys: appInfo.name + '_cookie_secret_change_me',

  cluster: {
    listen: {
      port: 7001,
      hostname: '0.0.0.0',
    },
  },

  // 关闭 CSRF 仅便于本地 POST 演示；依赖 egg-security 等能力，若启动报错可暂时删掉本段
  security: {
    csrf: {
      enable: false,
    },
  },
});
```

#### 2）`config/plugin.js`

```js
module.exports = {
  // 按需开启：sequelize、redis、validate 等
};
```

#### 3）`app/router.js`

```js
/**
 * @param {import('egg').Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/api/v1/hello', controller.api.hello);
  router.post('/api/v1/echo', controller.api.echo);
};
```

#### 4）`app/controller/api.js`

```js
const Controller = require('egg').Controller;

class ApiController extends Controller {
  async hello() {
    const { ctx } = this;
    const message = await ctx.service.demo.greeting(ctx.query.name);
    ctx.body = {
      code: 0,
      data: { message },
    };
  }

  async echo() {
    const { ctx } = this;
    // 需开启 bodyParser（Egg 默认开启），POST JSON 在 ctx.request.body
    ctx.body = {
      code: 0,
      data: { received: ctx.request.body },
    };
  }
}

module.exports = ApiController;
```

#### 5）`app/service/demo.js`

```js
const Service = require('egg').Service;

class DemoService extends Service {
  /**
   * @param {string} [name]
   */
  async greeting(name) {
    const n = name && String(name).trim() ? String(name).trim() : 'World';
    return `Hello, ${n} — Egg time=${Date.now()}`;
  }
}

module.exports = DemoService;
```

若你希望 **零缺失文件**，可先执行官方脚手架（再按本文覆盖路由与 Controller）：

```bash
cd apps
npm init egg@latest server -- --type=simple
# 或 pnpm / yarn 等价命令，以官网为准
```

下面给出的是 **最小手写清单**；若 **`egg-bin dev` 报缺入口**，请对照官方模板的 **`app.js` / `package.json` 的 egg 字段** 补齐。

在 `apps/server` 下执行 **`pnpm dev`**，浏览器访问\
`http://127.0.0.1:7001/api/v1/hello?name=Egg`\
应看到 JSON。再用 curl 测 POST：

```bash
curl -s -X POST http://127.0.0.1:7001/api/v1/echo \
  -H 'Content-Type: application/json' \
  -d '{"ping":"pong"}'
```

***

### 三、前端：Vite + Vue3（apps/web）

```bash
cd apps
pnpm create vite@latest web -- --template vue
cd web
pnpm install
cd ../..
```

> `create-vite` 在不同版本下参数略有差异；若交互式创建，选手动选 **Vue** 模板即可，关键是后面 **`vite.config` 里配好 `/api` 代理**。

#### 1）`apps/web/vite.config.ts`（或 `.js`）增加代理

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7001',
        changeOrigin: true,
      },
    },
  },
});
```

#### 2）示例页面 `apps/web/src/App.vue`（替换为最小演示）

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const loading = ref(false);
const hello = ref('');
const echo = ref<any>(null);
const err = ref('');

async function loadHello() {
  loading.value = true;
  err.value = '';
  try {
    const r = await fetch('/api/v1/hello?name=Vue');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    hello.value = j?.data?.message ?? JSON.stringify(j);
  } catch (e: any) {
    err.value = e?.message ?? String(e);
  } finally {
    loading.value = false;
  }
}

async function postEcho() {
  loading.value = true;
  err.value = '';
  try {
    const r = await fetch('/api/v1/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'vue', at: Date.now() }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    echo.value = await r.json();
  } catch (e: any) {
    err.value = e?.message ?? String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadHello);
</script>

<template>
  <main style="padding: 24px; font-family: system-ui">
    <h1>Egg BFF + Vite 联调</h1>
    <p v-if="loading">加载中…</p>
    <p v-if="err" style="color: crimson">{{ err }}</p>
    <section>
      <h2>GET /api/v1/hello</h2>
      <pre>{{ hello }}</pre>
      <button type="button" @click="loadHello">重试 GET</button>
    </section>
    <section style="margin-top: 24px">
      <h2>POST /api/v1/echo</h2>
      <button type="button" @click="postEcho">发送 POST</button>
      <pre>{{ echo }}</pre>
    </section>
  </main>
</template>
```

**访问方式**：只打开 **`http://127.0.0.1:5173`**，不要直接请求 7001（前端页面）。`/api` 会被代理到 Egg。

***

### 四、联调顺序（避免「接口 404」）

1. 先起 **Egg**：`pnpm --dir apps/server dev`，确认 **7001** 可 curl。
2. 再起 **Vite**：`pnpm --dir apps/web dev`。
3. 若页面里 `/api` 失败：检查 **代理 target**、**防火墙**、以及 Egg 是否监听 **0.0.0.0:7001**。

***

### 五、部署时怎么对齐（简述）

| 方式 | 做法 |
|------|------|
| **同域** | Nginx：`/` 静态指向 `web/dist`，`/api` **反代**到 Node；浏览器无 CORS。 |
| **跨域** | Egg 配 **cors** 插件白名单 + 前端 **credentials** 与 Cookie 策略一致。 |

生产务必 **恢复/配置 CSRF**、HTTPS、限流与日志，本文仅为 **开发闭环**。

***

### 六、小结

这一例把三件事钉死：**端口分工（5173 / 7001）**、**Vite 代理前缀（/api）**、**Egg 路由与 Service 分层**。在此基础上再接入鉴权、校验、HttpClient 调下游，就是完整 BFF。
