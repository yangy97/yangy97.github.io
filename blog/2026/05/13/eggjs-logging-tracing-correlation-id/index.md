---
url: /blog/2026/05/13/eggjs-logging-tracing-correlation-id/index.md
---
Egg 内置基于 **log4js** 的日志体系：**应用日志 / 核心日志 / 调度日志** 分流已有预设。线上排障时，真正的痛点往往是 **跨进程 / 跨服务的一条 trace**，本篇写如何在 Egg 里把 **traceId（或 W3C traceparent）** 从入口打到 **ctx.curl**。

***

### 一、logger 层级怎么用才不噪声

* **`app.logger`**：进程级事件（启动、插件加载失败）。
* **`ctx.logger`**：绑定 **请求上下文**，应承载「本条 HTTP 业务轨迹」。
* **`agent.logger`**：常驻 Agent 进程上的订阅、心跳类日志。

规范建议：**一条请求的主故事线只用 ctx.logger**；不要把第三方库的 debug 直接开到 stdout 污染聚合检索——用独立 logger category + 采样。

***

### 二、traceId：从入口中间件开始

1. **读取上游**：若网关已注入 `x-request-id` / `traceparent`，middleware 优先透传。
2. **生成**：无则 `randomUUID()`；写入 **`ctx.traceId`**（extend context）并 **`ctx.set('X-Request-Id', id)`** 响应头便于浏览器侧关联。
3. **日志字段**：用 **child logger** 或 **统一 formatter** 把 traceId 打进每条结构化字段（JSON log）。

***

### 三、贯通 HttpClient（ctx.curl）

难点：`curl` 默认不知道你的 trace。做法：

* 给 **`ctx.curl` 包一层**（extend context 或自定义封装），自动合并 headers：`{ 'x-request-id': ctx.traceId }`，以及与下游约定的 baggage。
* **超时与重试**：日志里必须打印 **下游 URL（脱敏）+ 耗时 + 状态码 + traceId**，否则只看网关 502 无法归因。

***

### 四、与指标（metrics）对齐

日志擅长「个案」，指标擅长「分布」。同一 traceId 关联的事件，建议在关键点 **打点计数 / histogram**（如 `bff.downstream.latency`），并与日志字段共享 **route / tenant / status\_class**，便于在 Grafana 从指标钻日志。

***

### 五、示例：入口中间件写入 trace（节选）

```js
// app/middleware/trace.js
module.exports = () => {
  return async function trace(ctx, next) {
    const incoming = ctx.get('x-request-id') || ctx.get('traceparent');
    const traceId = incoming || require('crypto').randomUUID();
    ctx.traceId = traceId;
    ctx.set('x-request-id', traceId);
    const start = Date.now();
    await next();
    ctx.logger.info('[access]', {
      traceId,
      method: ctx.method,
      path: ctx.path,
      status: ctx.status,
      ms: Date.now() - start,
    });
  };
};
```

配置里把它排在 **`router` 之前、尽量靠前**，后续中间件与 Controller 才能共用同一 `ctx.traceId`。

***

### 六、示例：包装 `ctx.curl` 自动带头（节选）

若不便改全局 urllib 配置，可在 **`context` extend** 里保存原生 `curl`，再挂一层代理（类型项目可自行收窄声明）。

```js
// app/extend/context.js —— 示意
module.exports = {
  async curl(url, opts = {}) {
    opts.headers = {
      ...(opts.headers || {}),
      'x-request-id': this.traceId,
    };
    const t0 = Date.now();
    try {
      const res = await this.constructor.prototype.curl.call(this, url, opts);
      this.logger.info('[curl]', { traceId: this.traceId, url, cost: Date.now() - t0, status: res.status });
      return res;
    } catch (e) {
      this.logger.error('[curl.err]', { traceId: this.traceId, url, cost: Date.now() - t0, err: e.message });
      throw e;
    }
  },
};
```

注意：**勿把查询串里的 token、密钥打进 info 日志**；可对 URL 做 **`URL` 解析后删掉 `search`** 再打印。

***

### 七、小结

Egg 的日志设施「够用」，但要主动设计 **字段契约** 与 **trace 贯通**。把 traceId 当成 **一等公民**（middleware + curl 封装 + 结构化 formatter），比事后 ELK 里全文搜索文件名管用得多。
