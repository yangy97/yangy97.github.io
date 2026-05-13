---
url: /blog/2026/05/13/eggjs-websocket-socketio-auth-rooms/index.md
---
管理后台常见「工单进度推送」「协作光标」「告警条幅」。Egg 通过 **`egg-socket.io`**（或等价适配）把 Socket 挂进应用。本篇聚焦：**握手鉴权**、**房间粒度**、以及 **多 Worker / 多实例下如何用 Redis Adapter 广播**（组件名以官方文档为准）。

***

### 一、握手阶段就做 JWT / Cookie 校验

不要在 `connection` 后再懒校验——攻击者可滥占连接。**middleware / handshake auth** 验证：

* Token **签名与过期**
* **租户 / 用户** 与后台会话一致
* **速率限制**（同 IP 握手风暴）

失败直接 **disconnect + 日志**（含 traceId）。

***

### 二、房间：`user:{id}` 还是 `tenant:{id}:channel:{name}`

* **按用户**：适合「通知这个人」。
* **按资源**：适合「订阅这张工单」——断开时要 **leave**，避免泄漏他人更新。
* **管理后台慎用全局广播**：运维大屏可用，但要 **权限门槛** 与 **payload 脱敏**。

***

### 三、多 Worker：内存房间不可见

Socket.io 默认同进程内存维护房间；Egg cluster 下 **另一 Worker 收不到 emit**。解决：**Redis Adapter**（或消息队列中转），让所有进程订阅同一 channel。

注意：**At-most-once** 语义；关键状态仍以 **HTTP + 轮询补偿** 或 **客户端主动拉取快照** 兜底。

***

### 四、背压与 payload

大屏推送若每秒上千条，要做 **合并（debounce）**、**二进制协议**或 **只推 diff**。监控 **`connected_clients`**、**emit QPS**、**Redis 延迟**。

***

### 五、示例：握手鉴权（socket.io 风格伪代码）

```js
// app/io/middleware/auth.js —— 逻辑示意，API 以 egg-socket.io 为准
module.exports = app => {
  return async (ctx, next) => {
    const token = ctx.handshake.auth?.token || ctx.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
    try {
      const payload = app.jwt.verify(token);
      ctx.socket.user = { id: payload.sub, tenant: payload.tenant };
      await next();
    } catch (e) {
      ctx.socket.disconnect(true);
    }
  };
};
```

业务 emit 前 **`if (!socket.user) return`**；房间 join 使用 **`tenant:${user.tenant}:ticket:${id}`**，禁止客户端任意传房间名字符串不经校验。

***

### 六、Redis Adapter 配置直觉（文字）

多 Worker 时：**每个进程 `io.adapter(redisAdapter({ host, port }))`**，使得 **`io.to(room).emit`** 经由 Redis Pub/Sub 扇出到其他进程的 socket。**故障模式**：Redis 抖动 → 推送延迟；要有 **客户端心跳 + HTTP 拉快照** 兜底。不要在 Adapter 上承载 **大二进制附件**——附件走 OSS URL。

***

### 七、示例：房间泄漏自查

```js
socket.on('disconnecting', () => {
  for (const room of socket.rooms) {
    if (room === socket.id) continue;
    socket.leave(room);
  }
});
```

***

### 八、小结

WebSocket 在后台通常是 **增强体验** 而非唯一真相源。把 **鉴权前移到握手**、**房间建模对齐权限边界**、**集群下 Adapter** 三件事做对，比纠结帧格式更重要。
