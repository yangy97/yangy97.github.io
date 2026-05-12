---
url: /blog/2024/10/18/node-http-agent-sockets-keepalive/index.md
---
`http`/`https` 请求背后是一条条 ==TCP 连接==。**Agent** 管理 **连接池、复用、并发上限**；不配好会出现 **端口耗尽（TIME\_WAIT）**、**对单域名串行**、或 **泄漏的 socket**。本篇对齐 **「请求很慢」** 与 **「压测才炸」** 的典型原因。

***

### 一、默认 Agent 在干什么

* \==`http.globalAgent`==（及 https 对应）维护 **对同一 host:port** 的 **空闲连接**，**Keep-Alive** 下可 **复用**，减少握手。
* 每个 Agent 有 **`maxSockets`**（每 host 最大并发）、**`maxFreeSockets`**（池里保留多少空闲）等（以当前 Node 文档为准）。

**症状**：高 QPS 调同一下游，若 **maxSockets 过小**，请求会在 **客户端排队**，表现为 **延迟尖刺** 而非下游慢。

***

### 二、连接复用 vs 新连接

| 场景 | 行为 |
|------|------|
| **Keep-Alive + 同 Agent** | 尽量 **复用** 已建立连接 |
| **每次 new Agent({ keepAlive: false })** 或 **显式禁用** | 易 **大量短连接**，**TIME\_WAIT** 堆积 |

**短连接风暴**：本机 **临时端口** 有限，**TIME\_WAIT** 未释放前 **无法复用**，表现为 **`connect EADDRNOTAVAIL`** 或 **间歇性失败**。

***

### 三、超时分层

建议 **分层设超时**，不要只设一个「总超时」：

| 层级 | 含义 |
|------|------|
| **连接建立** | TCP 握手完成 |
| **请求发送** | body 写完 |
| **响应头** | `headers` 到达 |
| **响应体** | 读完或流结束 |

Node 的 **`timeout`** 多与 **socket 空闲** 相关；**AbortController**（配合 fetch 或封装）用于 **取消**。各 HTTP 客户端（`axios`、`undici`）选项名不同，**要对表文档**。

***

### 四、HTTPS 与 TLS

* **会话复用**（session tickets 等）影响 **握手次数**。
* **证书校验**、**SNI**、**ALPN（HTTP/2）** 在 **客户端默认** 与 **自定义 agent** 时要一致。
* 内网自签证书：**不要**全局 `rejectUnauthorized: false`，用 **ca** 或 **企业信任链**。

***

### 五、背压与流式响应

**大响应体** 若 **`res` 不读**，TCP 窗口会满，下游 **阻塞**；**背压** 会沿链传播。使用 **Stream** 消费或 **`pipeline`**，避免 **`buffer` 整个 body** 除非确实需要。

***

### 六、收束

调下游 **先画连接模型**：**单 host 并发**、**是否 Keep-Alive**、**各层超时**。压测看 **本机 `ss`/端口** 与 **Agent 队列**，很多问题在 **客户端池** 就能定位。
