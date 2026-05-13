---
url: /blog/2026/05/13/eggjs-extend-context-helper-deep/index.md
---
`app/extend/` 是 Egg 里最容易「顺手往里塞全局」的地方：**ctx.xxx**、**app.xxx**、**helper.xxx** 一旦泛滥，类型推导与单测都会痛。本篇聚焦 **Loader 何时合并 extend**、**三类挂载的差异**、以及 **和插件 extend 的优先级直觉**（细节以当前 Egg 版本文档为准）。

***

### 一、三类 extend 各解决什么问题

| 挂载对象 | 典型用途 | 反模式 |
|---------|---------|--------|
| **context** | 单次请求内辅助：`ctx.getBizUser()`、链路字段快照 | 在 ctx 上缓存跨请求单例（Worker 内会变共享可变状态） |
| **application** | 进程级：`app.queue`、`app.metricsRegistry` | 把本该短生命周期的对象塞进 app 且不销毁 |
| **helper** | 视图 / 模板侧格式化（若仍 SSR 片段）；也可给 Controller 当「纯函数外壳」 | 在 helper 里直连 DB（绕过 Service 分层） |

**要点**：extend 里的方法多数是 **懒绑定或合并到原型**——心理上当成「给类加实例方法」，而不是随意全局函数仓库。

***

### 二、执行顺序与插件 extend

插件同样可以声明 extend。合并策略可理解为：**框架默认 → 插件 → 应用**，后者覆盖同名需谨慎。团队规范建议：

* **禁止业务团队直接在应用 extend 覆盖插件同名 API**；若必须 monkey patch，写 ADR 并在集成测试里覆盖。
* **公共能力封装进内部插件**（`egg-xx-internal`），应用侧只做薄封装，便于多仓一致升级。

***

### 三、命名与类型：避免「上帝 ctx」

常见退化：`ctx.$order`、`ctx.$payment`、`ctx.$audit` 几十个 getter。缓解：

1. **领域收口**：`ctx.domain.order.findById()`（由一个 factory 在 extend context 上挂 **单一入口**）。
2. **TypeScript**：用 **declaration merging** 或 **`Awaited<ReturnType<typeof createOrderApi>>`** 一类窄接口描述 ctx 增补；不要把整个业务模块类型打进全局。
3. **单元测试**：extend 若依赖 `app.config`，优先 **抽出纯函数** 再在 extend 里委托，测试直接测纯函数。

***

### 四、和 middleware / service 的边界

* **middleware**：横切、顺序敏感、可能短路响应。
* **extend context**：给「当次请求」补充 **语法糖访问器**，不应内含复杂业务流程。
* **service**：业务与事务边界所在。

经验：**能在 Service 里一行写清的，不要写成 ctx 魔法方法**——否则新人调试时栈太深。

***

### 五、Loader 何时载入 extend（心智模型）

Egg 在启动阶段按 **应用 → 插件** 顺序加载各类扩展：同名方法后者覆盖前者（具体合并规则以当前版本文档为准）。因此排查「谁在改写 `ctx.curl`」时，不止要看 `app/extend/context.js`，还要枚举 **`egg-*` 插件**是否注入了同名属性。**请求生命周期内**，extend 方法与普通原型方法一致：`this` 指向当前 Context / Application 实例。

***

### 六、示例：`context` 薄封装 vs 隐式状态（节选）

下面左侧是 **推荐**：把「解析租户 id」收成一行调用，内部仍读 `ctx.headers`，但不缓存可变业务对象。

```js
// app/extend/context.js —— 仅示意，项目可按 TS 改写
module.exports = {
  async getTenantId() {
    const raw = this.get('x-tenant-id');
    const id = parseInt(raw, 10);
    if (!Number.isFinite(id)) this.throw(400, 'invalid tenant');
    return id;
  },
};
```

下面右侧是 **典型反例**：在 ctx 上挂 **`Map` 缓存响应体**，跨请求若忘了隔离会变成泄漏源（Egg 每请求新 Context，但若有人误把引用挂到 `global` / `app` 仍会出事）。

```js
// 不推荐：在 ctx 上堆积「半持久」缓存且无上限
// this._bizCache = this._bizCache || new Map(); // 若迁移到 app 则万劫不复
```

更稳妥：进程级缓存一律 **`app.cache`** + **LRU**，键包含 **租户 id + 版本号**。

***

### 七、单测策略：`egg-mock` 下如何验证 extend

对 extend 中的纯函数逻辑，优先 **`exports.helperFn = ...`** 在同文件导出并在单元测试直接 `require`。必须通过 Context 集成验证时：用 **`app.mockContext()`** 造请求上下文，再断言 **`await ctx.getTenantId()`** 在缺失头时抛 400。避免在 extend 里直连真实 Redis——改为注入 **`ctx.service.cache`**，便于 `mm(service, 'cache.get', ...)` 级别的桩替换。

***

### 八、小结

extend 是 **缩小样板代码** 的利器，也是 **隐式依赖** 的放大器。把它限定在「访问器 + 薄委托」，重型逻辑留在 Service / 领域模块，再配合类型与规范约束命名与 Loader 优先级排查习惯，才能在规模化团队里长期可读。
