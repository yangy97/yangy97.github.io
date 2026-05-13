---
url: /blog/2026/05/13/eggjs-production-cluster-graceful-shutdown-health/index.md
---
从「本地 `egg-bin dev`」到「K8s 滚动发布」，差距在 **进程信号**、**存量连接排空**、**探测接口**。本篇对齐：**SIGTERM 处理**、**liveness vs readiness**、以及与 **上游网关超时** 的配合。

***

### 一、优雅停机（graceful shutdown）

收到 **SIGTERM**：

1. **停止接受新连接**（框架层关闭 server）。
2. **等待在途请求完成**，设置 **上限时间**（如 30s）；超时强制退出。
3. **关闭 DB pool / Redis / MQ**，防止进程挂了连接泄漏。

Egg / cluster 下要确保 **每个 Worker** 都执行 cleanup；**Agent** 也要 **beforeClose**。

***

### 二、健康检查分层

| 探针 | 问的问题 | 典型实现 |
|-----|-----------|---------|
| **liveness** | 进程是否死锁 | 轻 ping，不做下游 |
| **readiness** | 能否接流量 | 可选检查 Redis/MySQL **连通非深度查询** |

**误区**：readiness 里跑 **重 SQL**，导致短时抖动全摘除——应改成 **异步 warmup + 缓存就绪标记**。

***

### 三、集群与工作进程数

**workers ≈ CPU 核心** 是起点；若有大量 IO，可 **略超配** 实测对比。**不要用过大**：上下文切换反噬。

***

### 四、配置与密钥

**十二因子**：镜像 **不可变**，配置来自 env。**不要在运行时写 `/config`**——与容器编排冲突。

***

### 五、示例：Kubernetes 探针片段（节选）

```yaml
livenessProbe:
  httpGet:
    path: /internal/live
    port: 7001
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /internal/ready
    port: 7001
  periodSeconds: 5
```

`/internal/live` 返回 **200 + OK**，不接 Redis；`/internal/ready` 可读 **`app.ready`** 标记，且在 **`didReady` 后置 true**。若在 **`serverDidReady`** 之前挂载 readiness=false，可避免 **还没监听端口就被摘掉流量以外的误判**——编排上要 **`initialDelaySeconds` 对齐冷启动时间**。

***

### 六、优雅停机伪代码（与 Egg HTTP Server 对齐思路）

```js
async function graceful(signal) {
  logger.warn(`received ${signal}`);
  server.close(() => logger.info('no more connections'));
  const deadline = setTimeout(() => process.exit(1), 30_000);
  await Promise.all([ closeDbPool(), closeRedis(), drainMq() ]);
  clearTimeout(deadline);
  process.exit(0);
}
process.on('SIGTERM', () => graceful('SIGTERM'));
```

Egg 内置封装略有不同，关键是：**先 close server，再关连接池**，顺序反了会出新请求打到已关闭的 DB。

***

### 七、workers 数量实操公式（起步）

`workers = Math.min(require('os').cpus().length, floor(memory_budget / per_worker_rss))`。例如容器 **2C / 4Gi**，单 Worker RSS **350Mi**，粗算 **不超过 floor(4Gi/350Mi) ≈ 11**，再受 CPU 约束压到 **2**，最后以 **压测 P99** 为准迭代。

***

### 八、小结

生产 Egg 「稳」来自三件事：**信号驱动的有序退出**、**不把重量级依赖塞进 readiness**、**workers 数跟着 CPU 与 IO 画像迭代**。上线前用 **人为 SIGTERM + 压测** 演练一轮，比在故障现场猜体面得多。
