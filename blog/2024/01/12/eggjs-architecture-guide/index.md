---
url: /blog/2024/01/12/eggjs-architecture-guide/index.md
---
\==Egg.js== 在 **Koa** 之上用 **约定目录 + Loader** 把「路由、控制器、服务、中间件、插件」组装成可维护的后端。本篇把 **文件怎么被加载**、**一次请求经过哪些层**、**多进程模型** 讲清楚，避免只会照抄模板却不知道 **扩展点在哪**。细节以 [官方文档](https://www.eggjs.org/) 与当前版本为准。

***

### 一、典型目录与职责（不止「放哪」）

```text
app/
  controller/       # HTTP 适配：参数 → 调 service → 状态码/body
  service/          # 领域逻辑、事务、组合下游
  middleware/       # 横切：鉴权、trace、耗时
  extend/           # 扩展 ctx / app / helper（可选）
  public/           # 静态资源（若用）
  router.js         # 唯一集中路由表（推荐）
config/
  config.default.js
  config.prod.js
  plugin.js
  config.local.js   # 本地覆盖，通常 .gitignore
```

\==分工口诀==：`router` **只映射**；`controller` **薄**；`service` **厚**；与 HTTP 无关的复用逻辑 **不要** 塞进 controller。

***

### 二、Loader 在干什么（心智模型）

启动时 **Loader** 会扫描约定路径，把类 **挂到 app / ctx** 上，例如：

| 约定路径 | 挂载结果（示意） |
|----------|------------------|
| `app/controller/user.js` → `UserController` | `controller.user` |
| `app/service/order.js` → `OrderService` | `ctx.service.order` |
| `app/middleware/foo.js` | 在 `config` 里 **按名启用** 后进入洋葱 |

**顺序感**：**插件** 先于业务代码注册中间件与配置；**config** 多文件 **合并** 后再驱动运行时行为。线上排「为什么和本地不一样」，先看 **当前 `EGG_SERVER_ENV`** 与 **是否读了 `config.local.js`**。

***

### 三、一次请求的调用链（从外到内）

1. **Master / Agent**（多进程时）由 **cluster** 监听端口，**Worker** 里跑你的应用代码。
2. 请求进入 **Koa 中间件链**（全局 → 路由命中前的中间件）。
3. **`router.js`** 将 **METHOD + PATH** 映射到 **`controller.xxx.yyy`**。
4. **Controller** 调 **`ctx.service`**，必要时 **`ctx.curl`**、**model**、**缓存**。
5. 通过 **`ctx.body`**、**`ctx.status`** 返回；错误可被 **统一错误中间件** 接住。

**误区**：以为「进了 controller 就只剩同步代码」——`async` 里若 **漏 await**，照样会出现 **响应已发送但后续还在跑** 的竞态。

***

### 四、Application、Context、Request、Response

* **`app`**：进程级单例，放 **全局插件、定时任务注册、配置快照**。
* **`ctx`**：**单次请求** 的上下文，`ctx.request` / `ctx.response` 是 Koa 封装；业务态优先 **`ctx.state`**（如 `userId`），避免往 `ctx` 上乱挂魔法字段。
* **继承关系**：Egg 的 Controller / Service 通过 **`this.ctx`** 访问当次请求。

***

### 五、多进程与「单线程 JS」

Egg 生产常用 **多 Worker** 榨 CPU：**进程间不共享内存**，Session / 登录态若放内存要 **sticky** 或 **外置 Redis**。开发模式多为单进程，**不要把「本地单进程能跑」当成线上并发没问题**。

***

### 六、插件 `plugin.js`：能力从哪来

```js
// config/plugin.js 示意
exports.sequelize = { enable: true, package: 'egg-sequelize' };
```

插件本质是 **带 Loader 的迷你应用**：可注入 **config、中间件、路由**。**不要** 在同一能力上 **重复挂载** 两个插件（例如两套 body 解析），否则排障会非常痛苦。

***

### 七、和前端怎么配合（复习）

* **纯 API**：Egg 只出 JSON，前端静态部署 CDN / OSS。
* **BFF**：Egg **聚合下游**、裁剪字段、统一错误码；**超时、熔断、重试** 要在 **HttpClient 层** 有章法。

***

### 八、小结

记四层：**Loader 挂载 → 中间件洋葱 → router → controller/service**。新人按目录找文件；老人改需求时先问 **该动 extend / 中间件 / service 哪一层**，避免在 controller 里堆业务。同仓前后端目录约定见《从 0 到 1 实战：pnpm 同仓 + Vue3 Vite + Egg.js BFF》。
