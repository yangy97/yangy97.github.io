---
url: /blog/2024/12/08/node-streams-backpressure-pipeline/index.md
---
Stream 是 Node 处理 ==大文件、高并发读写、上下游速度不一致== 的核心抽象。**背压（backpressure）** 解决「读太快写太慢内存爆掉」；**`pipeline`** 解决 **`pipe` 链上错误难处理** 的问题。本篇把概念收拢到可落地的工程判断。

***

### 一、四种流类型（速查）

| 类型 | 读 | 写 | 典型场景 |
|------|----|----|----------|
| ==Readable== | ✓ | | `fs.createReadStream`、HTTP 响应体 |
| **Writable** | | ✓ | `fs.createWriteStream`、HTTP 请求体 |
| **Duplex** | ✓ | ✓ | TCP socket |
| **Transform** | ✓ | ✓ | 中间做 gzip、加解密、换行切分 |

内部模式分 **流动模式（flowing）** 与 **暂停模式（paused）**；`pipe` 会自动切到 flowing 并处理背压。

***

### 二、背压是什么

当下游 **来不及消费** 时，上游应 **暂停推送**，直到下游 **`drain`**（可继续写）。

* \*\* Writable\*\*：`write(chunk)` 返回 `false` 表示 **内核缓冲区已满**，应暂停读或暂停 `write`，监听 **`drain`** 再恢复。
* **`pipe` 内部** 帮你做了这件事；**手写 `on('data')` + `write`** 时最容易 **忘记背压**，导致内存飙升。

**症状**：进程 RSS 暴涨、GC 频繁、OOM；日志里可能看到 **Readable 不停 data，Writable 跟不上**。

***

### 三、`pipe` 与错误

经典坑：**`a.pipe(b).pipe(c)`** 里 **`a` 出错不会自动销毁 `b/c`**，可能造成 **资源泄漏** 或 **挂起**。

* 旧代码常给每个流手动 `on('error', ...)`。
* **`stream.pipeline(a, b, c, cb)`**（或 `promises.pipeline`）会 **在出错时销毁相关流**（按实现清理），并把错误汇总到 **最终回调**。

**Node 10+** 起应优先 **`pipeline`** 处理 **链路与错误**。

***

### 四、`pipeline` + `async` 迭代

`Readable` 可作为 **AsyncIterable**；配合 `for await...of` 写起来像同步循环，但仍要注意：

* **大文件**：逐块处理，**不要** `await` 里再拼一个巨大字符串。
* **错误**：用 `try/catch` 包住迭代；或仍用 **`pipeline`** 统一收尾。

***

### 五、对象模式（objectMode）

`objectMode: true` 时 chunk 是 **任意 JS 对象**（如一行解析好的 JSON）。**highWaterMark** 含义从「字节」变成 **对象个数**，调参时要换脑子。

***

### 六、收束

Stream 三句话：**能 pipe 就别一次性读进内存**；**手写 data 事件要管背压**；**多段 pipe 用 pipeline 管错误与销毁**。上线前对大文件路径 **压测内存曲线**，比看代码更准。
