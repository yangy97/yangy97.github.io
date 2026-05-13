---
url: /blog/2024/03/28/eggjs-httpclient-schedule-ops/index.md
---
BFF 大量 ==调下游 HTTP==；后台需要 **定时对账、清缓存**。Egg 内置基于 **urllib** 的 **`ctx.curl`**（及 `app.curl`），配合 **`app/schedule`** 做 cron。本篇给 **可直接改的示例** 与 **线上必踩的坑**。

***

### 一、`ctx.curl` 基本用法

```js
// app/service/downstream.js
const Service = require('egg').Service;

class DownstreamService extends Service {
  async fetchUser(id) {
    const { ctx } = this;
    const url = `${ctx.app.config.downstream.baseURL}/users/${id}`;
    const res = await ctx.curl(url, {
      method: 'GET',
      dataType: 'json',
      timeout: 5000,
      headers: {
        'x-request-id': ctx.state.requestId || '',
      },
    });
    if (res.status !== 200) {
      ctx.throw(502, `upstream ${res.status}`);
    }
    return res.data;
  }
}

module.exports = DownstreamService;
```

\==配置==（`config.default.js` 里）：

```js
downstream: {
  baseURL: process.env.UPSTREAM_BASE || 'http://127.0.0.1:8080',
},
```

| 选项 | 说明 |
|------|------|
| **timeout** | 连接+响应总超时（按 urllib 文档细分） |
| **dataType: 'json'** | 自动解析 body |
| **retry** | 谨慎用于 **写接口**；读接口也要 **幂等** |

***

### 二、超时、重试与熔断

* **超时**：宁可 **短失败** 也不要 **拖满 worker**；BFF 常见 **比网关略短**。
* **重试**：仅对 **GET** 或带 **幂等键** 的写操作；**429/503** 可退避重试。
* **熔断**：高并发时在 **统一封装层**（或 sidecar）做，不要在每个 service 复制一套 if。

***

### 三、定时任务 `app/schedule/foo.js`

```js
const Subscription = require('egg').Subscription;

class CheckJob extends Subscription {
  static get schedule() {
    return {
      interval: '5m', // 或 cron: '0 */1 * * *'
      type: 'worker', // all: 每台 worker 都跑；worker: 指定一台（行为以文档为准）
      immediate: false,
    };
  }

  async subscribe() {
    const { ctx } = this;
    await ctx.service.demo.ping();
  }
}

module.exports = CheckJob;
```

**说明**：`egg-schedule` 的 **导出类名、`schedule` 静态配置、`type: worker|all`** 等以 **当前版本 README** 为准；若与你项目模板不一致，直接复制 **官方示例** 再改 `subscribe` 体即可。

**多实例部署**：`type: 'all'` 会导致 **每台机器都跑**——若任务 **不能并发**，要 **分布式锁**（Redis）、或 **独立 job 服务**、或 **K8s CronJob**。

***

### 四、健康检查

```js
// app/controller/health.js
const Controller = require('egg').Controller;

class HealthController extends Controller {
  async live() {
    this.ctx.body = 'ok';
  }
}
```

路由 `GET /health/live`，**不要依赖慢外部**；**readiness** 可再查 **DB 连接**（注意 **超时与降级**）。

***

### 五、日志与 requestId

* **access 日志**：框架层；业务日志用 **结构化字段**（`requestId`、`userId`）。
* **下游调用**：把 **trace id** 塞进 **header**，和网关 **对齐命名**（`traceparent` / `x-request-id` 等）。

***

### 六、小结

**ctx.curl + 显式超时 + 可观测字段** 是 BFF 的底线；**schedule** 先想清楚 **多实例语义**，再写业务。线上 **70%** 的「偶发慢」来自 **下游无超时** 与 **重试风暴**。
