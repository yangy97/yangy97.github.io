---
url: /blog/2024/04/23/eggjs-middleware-context-onion/index.md
---
Egg 的请求管线建立在 ==Koa== 之上：**中间件** 是 `async (ctx, next) => {}`，`await next()` 把控制权交给 **下一层**，形成 **洋葱模型**（先入后出）。本篇补充 **真实文件长什么样**、**在 config 里怎么排序**、以及 **`ctx.throw` / 统一错误** 怎么和洋葱配合。

***

### 一、洋葱模型（执行顺序）

```
请求 → mw1 前 → mw2 前 → … → Controller → … → mw2 后 → mw1 后 → 响应
```

* \==先注册==的中间件 **越靠外**（越早碰到请求）；**响应阶段**沿 **相反顺序** 执行「后半段」。
* **`await next()`** 之前的代码在 **进入下游前** 执行；**之后** 的代码在 **下游返回后** 执行（若下游抛错，仍可能走到你 `try/finally` 里，取决于你是否捕获）。

***

### 二、中间件文件与配置（完整示意）

`app/middleware/cost.js`（签名以你使用的 Egg 版本脚手架为准，常见为 **二参高阶函数**）：

```js
module.exports = (options, app) => {
  return async function cost(ctx, next) {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
  };
};
```

`config/config.default.js` 里 **启用并排序**（名称与文件名一致，**数组顺序即执行顺序**）：

```js
module.exports = () => ({
  middleware: ['cost'],
});
```

**要点**：Egg 会把 `app/middleware/cost.js` 导出的 **高阶函数** 执行一次，得到真正的 Koa 中间件；需要 **注入 options**（与 `config` 里 `middleware.cost` 等对齐）时，用官方模板里的 **导出形式** 即可。

***

### 三、ctx 上常用什么

| 成员 | 典型用途 |
|------|----------|
| **ctx.request / ctx.response** | query、path、header、body（body 需解析中间件） |
| **ctx.params** | 路由动态段 `:id` |
| **ctx.service.xxx** | 调业务 Service |
| **ctx.state** | **中间件 → controller** 传递「已解析用户」等，避免污染 `ctx` 顶层 |
| **ctx.curl** | 服务端 HTTP 调用（见 HttpClient 篇） |
| **ctx.throw(status, msg)** | 抛出 HTTP 语义错误，交给 onerror 或统一处理 |

**query / params 全是字符串**，数值要自己 `Number()` 或用校验 schema。

***

### 四、错误怎么「冒泡」

* **Service / Controller** 里 **`throw new Error()`** 或 **`ctx.throw(404, 'Not Found')`**，可被 **上层中间件** 或框架 **onerror** 捕获。
* **若 catch 后吞掉** 且不再 `throw`，外层的 **统一错误格式** 可能 **失效**。团队应约定：**业务可预期错误** 用 **自定义错误类 + 状态码**；**未预期** 打日志后 **映射 500**。

**示例（controller 内）**：

```js
async show() {
  const { ctx } = this;
  const row = await ctx.service.user.find(ctx.params.id);
  if (!row) ctx.throw(404, 'user not found');
  ctx.body = { code: 0, data: row };
}
```

***

### 五、常见坑（排障清单）

1. **忘记 await**：`next()` 没 await，后半段与 controller **并发**，日志顺序乱、body 被覆盖。
2. **同一中间件多次 next()**：除非刻意，否则 **重复进入下游**。
3. **在 next 之前设置 body 又继续 next**：可能 **被内层覆盖** 或 **重复写入**。
4. **把重业务逻辑写进中间件**：中间件应 **薄**，复杂判断下沉 **service**，否则单测困难。

***

### 六、与 Loader、router 的关系

**Loader** 加载 `app/middleware/*.js`；**config.middleware** 决定 **是否生效与顺序**。**router** 在洋葱 **最内层附近** 将请求 dispatch 到 controller——所以 **鉴权中间件** 一般要放在 **router 之前**（全局 middleware 数组 **靠前**）。

***

### 七、小结

用好中间件 = **`await next()` + `ctx.state` + 错误要么 throw 要么统一约定**；线上查「谁改了 status/body」，从 **洋葱外到内** 逐层打日志比猜快。
