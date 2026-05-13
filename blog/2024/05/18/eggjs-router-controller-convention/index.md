---
url: /blog/2024/05/18/eggjs-router-controller-convention/index.md
---
Egg 推荐 ==`app/router.js` 集中声明==，由 **Controller** 表达 HTTP 语义。本篇在「能跑」之上补：**REST 资源路由**、**动态段与 query**、**Controller 与校验/错误的分工**，方便直接对照团队规范。

***

### 一、`router.js` 常见写法

#### 1）显式映射（最直观）

```js
module.exports = app => {
  const { router, controller } = app;
  router.get('/api/v1/users/:id', controller.user.show);
  router.post('/api/v1/users', controller.user.create);
  router.put('/api/v1/users/:id', controller.user.update);
  router.del('/api/v1/users/:id', controller.user.destroy);
};
```

* \==`:id`== → `ctx.params.id`（字符串）。
* **Query** → `ctx.query`，注意 **数组与重复 key** 的解析规则。

#### 2）`router.resources`（CRUD 一条龙）

```js
module.exports = app => {
  const { router, controller } = app;
  router.resources('users', { prefix: '/api/v1', controller: controller.user });
};
```

会生成 **index / new / create / show / edit / update / destroy** 等路由映射；**具体方法名、是否加 `router.resources` 的简写**，以当前 **`egg` + `egg-router` 版本文档为准**（不同大版本参数名可能略有差异）。**适合** 标准资源型接口；**不适合** 强 RPC 风格时硬套。

***

### 二、Controller 模板与职责

```js
const Controller = require('egg').Controller;

class UserController extends Controller {
  async show() {
    const { ctx } = this;
    const user = await ctx.service.user.findById(ctx.params.id);
    if (!user) ctx.throw(404, 'not found');
    ctx.body = { code: 0, data: user };
  }

  async create() {
    const { ctx } = this;
    // body 已由 bodyParser 解析到 ctx.request.body
    const payload = ctx.request.body;
    const id = await ctx.service.user.create(payload);
    ctx.status = 201;
    ctx.body = { code: 0, data: { id } };
  }
}

module.exports = UserController;
```

| Controller 做 | Controller 不做 |
|---------------|----------------|
| **取参、HTTP 状态、body 形状** | 大段 SQL、跨模块事务细节 |
| **调用 `ctx.service`** | 直接到处 `ctx.app.mysql.query` 散落 |
| **把业务异常映射成 4xx/5xx** | 在方法里复制粘贴相同校验逻辑（应抽 service 或校验层） |

***

### 三、参数与校验

* **类型**：query/body **默认都是弱类型**，`id` 可能是 `"123"`。
* **校验**：可引入 **`egg-validate`** 或 **Zod/Joi** 在 **controller 入口** 或 **独立校验函数** 中统一处理，失败返回 **422** + 字段级错误。
* **文件上传**：走 **multipart** 与单独字段约定，不要和 JSON body 混在同一文档里含糊过去。

**示例（概念）**：校验失败时 `ctx.status = 422; ctx.body = { code: 'VALIDATION_ERROR', errors: [...] }; return;`，与前端 **对齐一份错误结构**。

***

### 四、REST 与 RPC 风格怎么选

| 风格 | 优点 | 注意 |
|------|------|------|
| **REST + 资源** | 缓存、网关、OpenAPI 友好 | 动词过多时要拆子资源 |
| **POST /action** | 贴合领域动词 | 缓存差、文档要额外说明 |

对外 **OpenAPI** 时 REST 更省心；对内 BFF **RPC 式**也可以，但要 **统一前缀与版本**。

***

### 五、与中间件、Service 的衔接

* **鉴权**：中间件解析 Token，写入 **`ctx.state.user`**，controller 只判断 **是否存在**。
* **复杂业务**：controller **不超过几十行**，其余进 **`ctx.service.xxx`**，便于 **mockContext 单测**。

***

### 六、小结

路由 = **METHOD+PATH → controller 方法** 的表；controller = **HTTP 适配层**。下一篇《Service 层》讲 **事务与复用** 怎么落在 `ctx.service` 上。
