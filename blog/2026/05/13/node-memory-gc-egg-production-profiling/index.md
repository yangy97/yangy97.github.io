---
url: /blog/2026/05/13/node-memory-gc-egg-production-profiling/index.md
---
Egg 应用常见的内存问题往往不是「GC 坏了」，而是 **闭包持有大对象**、**全局缓存无界**、**Promise 堆积**、或 **序列化超大 JSON**。本篇给一条 **可操作的排障路径**，工具以 **Node 内置 inspector / clinic / heapdump** 为例（版本差异自行核对文档）。

***

### 一、先区分：RSS vs heapUsed vs 外部内存

* **heapUsed 高**：典型 JS 对象泄漏或缓存。
* **RSS 高但 heap 正常**：Buffer、native 模块、或 **碎片**。
* **外部内存**：例如大量 **Buffer / TypedArray**。

监控里同时看 **`uv_threadpool` 队列**（虽非内存指标）辅助判断是否 **同步 FS/crypto** 拖尾。

***

### 二、抽样 heapdump 的时机

* **峰值后 plateau**：疑似泄漏。
* **发布新版本后**：对比两份 heap snapshot **Delta**，找 Retainers。

嫌疑 TOP：**`Map` 永久增长**、**定时器未 clear**、**event listener 重复 on**、**ctx 上挂了大数组**。

***

### 三、Egg 特有风险点

* **extend / app 单例缓存**：按 tenant 无限扩张。
* **HttpClient DNS/agent**：极端并发下的 socket 池（配合超时）。
* **日志 stringify  giant object**：一条日志拷贝了整个下游响应。

***

### 四、缓解先于重写

* **限制缓存条目 + LRU**
* **分页拉取代替一次性 load**
* **Worker 分摊 CPU + 隔离堆**

***

### 五、示例：`process.memoryUsage()` 打点（节选）

```js
setInterval(() => {
  const m = process.memoryUsage();
  app.logger.info('[heap]', {
    rss: m.rss,
    heapUsed: m.heapUsed,
    external: m.external,
    arrayBuffers: m.arrayBuffers,
  });
}, 60_000);
```

线上应由 **Prometheus `nodejs_heap`** 一类 exporter 承接；日志只适合抽样。**告警阈值**：`heap_used / heap_total` 连续高位且 GC 后不反弹——多半是真泄漏而非瞬时峰值。

***

### 六、生成 Heap Snapshot 的命令备忘（本地 / 容器）

```bash
# 对 PID 发送 USR1（取决于运行时选项），或使用 —inspect + Chrome DevTools
node --expose-gc --inspect index.js
# Chrome 打开 chrome://inspect → Take heap snapshot
# 对比两个快照 Search retaining path → "(compiled code)" / "Closure"
```

配合 **`global.gc()`**（仅 `--expose-gc`）在压测脚本里强制 GC，区分「泄漏」与「正常积压」。

***

### 七、Egg 典型泄漏复盘话术 → 代码模式

| 话术 | 可能代码 |
|------|-----------|
| 「发布时间后对内存」 | 某 middleware `setInterval` 未清理 |
| 「租户越多越高」 | `app.cacheTenant[tid] = hugeObj` 无 TTL |
| 「导出一次涨一节」 | 把整个 workbook `JSON.stringify` 进日志 |

***

### 八、小结

内存排查是 **证据驱动**：监控曲线 → snapshot → retainers 路径 → 代码归因。Egg 没有魔法泄漏点，多半是 **把请求级数据塞进了进程级容器**。
