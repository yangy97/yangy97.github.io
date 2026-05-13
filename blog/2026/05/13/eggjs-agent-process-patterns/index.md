---
url: /blog/2026/05/13/eggjs-agent-process-patterns/index.md
---
Egg 的 **Agent** 是介于 master 与 worker 之间的常驻进程：**单例**，用来做不适合在多 Worker 重复跑的琐事（监听文件、维护客户端连接池的一层调度）。滥用会把 Agent 变成第二个单体。**本篇列清单：推荐场景 vs 反模式**，并与 **`egg-development`** 下的行为差异对齐心智模型。

***

### 一、推荐放进 Agent 的事

* **同一主机仅需一份的连接**：例如某些 SDK 官方示例要求在进程级 singleton。
* **与 Worker 的 IPC**：下发配置增量、聚合轻量指标（注意频率）。
* **本地开发辅助**：watch 重建（开发插件场景）。

***

### 二、不要放进 Agent 的事

* **扛 HTTP/QPS**：Agent 只有一份，会成为瓶颈与单点。
* **长耗时 CPU 任务**：阻塞 Agent 会影响集群协调。
* **大量内存缓存**：Agent OOM 会拖垮整节点。

这类应：**独立微服务 / 队列消费者 / Node Worker Thread**。

***

### 三、与 Worker 通信的心智

`messenger` 发送消息要 **幂等**、**可丢失补偿**（进程重启）。不要把它当可靠队列——需要 **Redis Stream / MQ**。

***

### 四、观测

Agent 也要有 **metrics + logger**，否则线上「Agent 挂了一半逻辑」难以察觉。启动日志明确打印 **订阅了哪些 topic**。

***

### 五、示例：`agent.js` 里只做「单例初始化」（节选）

```js
// agent.js —— 示意：维护跨 Worker 共享的配置监听（仍以官方模板为准）
module.exports = agent => {
  agent.messenger.on('egg-ready', () => {
    agent.logger.info('[agent] workers reported ready');
  });
};
```

Worker 侧 **`process.send({ action: 'xxx' })`** 或通过 **`agent.messenger`** 双向通信——高频路径仍应交 MQ。

***

### 六、反例清单（复盘用语）

| 症状 | 常见错误 |
|------|-----------|
| Agent CPU 长期飙高 | 在 Agent 跑报表聚合 |
| 发布卡住 | `beforeClose` 无限等待 |
| 内存单调涨 | Agent 级全局 Map 无 LRU |

***

### 七、小结

把 Agent 想成 **「集群级的单例守护」**，而不是「另一个放业务的地方」。需要横向扩展的逻辑一律回 **Worker + 外部状态**。
