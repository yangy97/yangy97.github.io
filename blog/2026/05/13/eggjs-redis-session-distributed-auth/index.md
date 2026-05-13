---
url: /blog/2026/05/13/eggjs-redis-session-distributed-auth/index.md
---
Egg 多 Worker **进程内存不共享**：Session 默认内存存储无法在多机横向扩展。生产路径通常是 **`egg-redis` + `egg-session`（或等价插件）** 把会话外置。本篇写 **键空间设计、TTL、踢人、与 JWT 的配合**，避免「JWT 里塞了整个用户模型」。

***

### 一、Redis Session 键怎么命名

建议包含：**前缀 `sess:`**、**sessionId**、必要时 **租户 id**（多租户隔离）。避免把整个 JWT 当 sessionId——太长且不利于轮换。

**TTL**：滑动过期 vs 固定过期要产品确认（记住我功能）。后台常需要 **强制下线**：在 Redis 存 **`sessionVersion` 或黑名单 jti**，校验时短路。

***

### 二、JWT 不是 Session 的替代品，而是不同分层

| 方案 | 优点 | 代价 |
|-----|------|------|
| **服务端 Session** | 吊销即时、payload 小 | Redis 可用性、序列化成本 |
| **JWT（访问令牌）** | 无状态校验快 | 吊销滞后，需要 jti + 黑名单或短 TTL + refresh |
| **混合** | Access JWT + Redis refresh/session meta | 实现复杂度上升 |

管理后台常见：**Access 短 JWT（5–15min）+ Redis 存 refresh / 设备维度**，兼顾审计与踢人。

***

### 三、集群与 sticky

若暂时无法外置 Session，网关 **session sticky** 能救命但不根治：**滚动发布 / Worker 重启** 仍会丢会话。长期仍应 **Redis**。

***

### 四、与安全插件联动

Session fixation：登录成功后 **轮转 sessionId**。Cookie 标记 **`httpOnly`、`secure`、`sameSite`** 与上文 CSRF 文档一致。

***

### 五、示例：Redis 键与踢人版本（节选）

```text
# Session 主体（Egg session 插件通常会加前缀，此处示意键语义）
sess:{tenantId}:{sessionId}   -> JSON { uid, rolesVer, ... }   TTL 滑动或固定

# 用户维度「会话世代」——登录成功递增；校验 session 时比对 generations
user:sessgen:{tenantId}:{uid} -> integer
```

踢掉某用户 **所有设备**：`INCR user:sessgen:{tenant}:{uid}`；JWT 方案则在 Redis 维护 **`jti` 黑名单** 或 **`tokenVersion`**，校验时 `GET user:tokver:{uid}` 与 claims 比对。

***

### 六、示例：Access 短 JWT + Refresh 存 Redis（伪代码）

```js
// 登录成功颁发
const access = jwt.sign(
  { sub: uid, tenant, permVer: 12, typ: 'access' },
  secret,
  { expiresIn: '10m' },
);
const refreshId = randomUUID();
await redis.set(
  `refresh:${tenant}:${refreshId}`,
  JSON.stringify({ uid, uaHash }),
  'EX',
  60 * 60 * 24 * 14,
);
return { access, refreshId }; // refreshId 经 httpOnly Cookie 或 secure storage 下发
```

刷新接口：`GET refresh` 校验 Cookie → 读 Redis → 轮转 **`refreshId`（一次性 refresh token）** → 签发新 access。这样可以 **服务端随时废除 refresh**，比单纯延长 access 过期时间更符合后台合规诉求。

***

### 七、Sticky Session 何时「看似够用」

两台 Worker、内存 Session、网关按 Cookie 哈希：**同一用户路由固定**，滚动发布时若 **逐个 Worker 排空** 仍可短暂可用；一旦 **扩容 / 缩容 / Worker crash**，会话丢失概率陡增。Redis Session 的成本是一次网络往返——多数后台远低于业务 SQL，不值得省。

***

### 八、小结

分布式会话的本质是 **把「谁已登录」变成可集中撤销的状态**。Egg 侧落地就是：**Redis 契约 + TTL 策略 + 强制下线通道**；JWT 只承载 **最小声明**，权限仍以服务端校验为准。
