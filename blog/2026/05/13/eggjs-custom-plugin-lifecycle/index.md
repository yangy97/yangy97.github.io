---
url: /blog/2026/05/13/eggjs-custom-plugin-lifecycle/index.md
---
当同一套能力要在 **多个 Egg 应用**（BFF、开放平台、内部工具）复用时，自定义 **`egg-xx`** 插件优于复制 `app/extend`。本篇梳理：**configWillLoad → didLoad → willReady → didReady → serverDidReady → beforeClose** 各阶段适合做什么，以及 **`app.addSingleton`** 一类模式的取舍。

***

### 一、插件解决的不是「少几个文件」

而是 **依赖顺序**、**默认配置**、**可选降级**、**版本语义**。一个好的内部插件应：

* 暴露 **清晰的 config schema**（可用 TS / Joi 文档化）
* **fail fast**：缺必填密钥启动失败，而非运行时随机 undefined
* **最小侵入**：业务只用 **`app.xx`** 或 **`ctx.xx`** 的稳定 API

***

### 二、生命周期挂载点

* **configWillLoad**：合并远端动态配置（慎用，延迟启动）。
* **didLoad**：注册与其他插件的协作（读其他插件已挂载对象）。
* **willReady / didReady**：连接池预热、订阅外部 broker。
* **beforeClose**：关闭连接、flush 队列；设定 **超时**，避免进程悬挂。

不要在 **`didLoad`** 里开始扛 HTTP 流量级的定时任务——交给 **schedule** 或独立 worker。

***

### 三、singleton 与多实例

数据库、Redis、MQ 生产者常用 **单例**。**注意**：测试环境 **parallel** 跑单测时要支持 **mock / 替换**，否则全局污染。

***

### 四、发包与版本

内部插件建议 **semver**，破坏性改动 **大版本 + migration 文档**。应用侧 `config.default.js` 只填 **环境无关默认**，密钥走 env。

***

### 五、示例：最小自定义插件骨架（节选）

```js
// path/to/egg-metrics/app.js
module.exports = app => {
  app.addSingleton('metrics', createMetricsClient);
};
```

```js
// package.json name: egg-metrics
{
  "eggPlugin": { "name": "metrics" }
}
```

```js
// config/config.default.js
exports.metrics = { prefix: 'myapp' };
```

应用在 **`didReady`** 后即可 **`app.metrics.counter('http.requests').inc()`**。若初始化依赖 **`exports.didLoad`** 里读取 **`app.config.metrics`**，注意不要早于 **`configWillLoad`** 去读尚未合并的配置。

***

### 六、生命周期编排示例（决策表）

| 要做的事情 | 推荐钩子 | 原因 |
|-----------|---------|------|
| 注册 RPC client | `didLoad` | 其他插件可在 `willReady` 消费 |
| 订阅 MQ | `willReady` | 进程即将接收流量，连接失败应阻断启动 |
| HTTP server 已监听后的自检 | `serverDidReady` | 可做本机 `curl 127.0.0.1` |
| drain 队列 | `beforeClose` | SIGTERM 路径，设定 `setTimeout` 上限 |

***

### 七、小结

插件是 Egg 「约定优于配置」的延伸：**把横切能力产品化**。用好生命周期钩子，比在各个应用的 `app.js` 里写一串 `ready` 回调更可维护。
