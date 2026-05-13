---
url: /blog/2026/05/13/rbac-audit-log-privilege-escalation-detection/index.md
---
权限系统上线后，真正的风险来自 **人**：给自己加角色、导出全库、批量改价。审计不只是「记日志」，而要支持 **检索、告警、法务取证**。本篇给 **最小日志字段集** 与 **两类告警**。

***

### 一、审计事件最小字段

* **who**：用户 id、租户、源 IP、UA、（可选）设备指纹
* **what**：资源类型、资源 id、动作（READ/UPDATE/EXPORT/APPROVE）
* **when**：UTC 时间 + 服务端单调时钟保护
* **result**：成功/失败码
* **context**：请求 traceId、变更 diff（脱敏后）

**禁止**把密码、token、身份证写入 diff。

***

### 二、权限变更双轨记录

任何 **角色-权限**、**用户-角色** 变更写 **独立审计表**，并 **区分操作者**：本人 / 管理员 / 系统自动任务。支持 **回滚快照**（JSON 归档前后）。

***

### 三、越权检测启发式

1. **短时高频权限查询失败（403）**：试探攻击或前端 bug。
2. **低权限账号触发 EXPORT**：可能是接口漏拦。
3. **深夜批量 UPDATE**：结合 **地理位置异常**（若采集）。

对接 SIEM 时用 **固定 schema** 便于关联。

***

### 四、留存与合规

按法务要求设定 **留存周期**；GDPR/个人信息场景要做 **匿名化策略**。日志写入失败应 **降级阻断高风险操作** 而非静默丢失——至少在配置开关层面可选。

***

### 五、示例：结构化审计日志（JSON Lines）

```json
{
  "ts": "2026-05-13T08:01:02.003Z",
  "tenant": "acme",
  "actor_id": 1024,
  "action": "ROLE_ASSIGN",
  "target_type": "user",
  "target_id": 2048,
  "diff": {
    "before": ["ROLE_OPS"],
    "after": ["ROLE_OPS", "ROLE_FIN_READ"]
  },
  "trace_id": "7c9e…",
  "ip": "203.0.113.10",
  "result": "OK"
}
```

检索：`action=ROLE_ASSIGN AND target_id=2048`，可在 ELK 用 **keyword 字段**。

***

### 六、示例：简单告警规则（伪 PromQL / Elasticsearch）

* **频率**：`rate(audit_denied_total[5m]) > 50` 按 **actor\_id** 分组 —— 试探或前端 bug。
* **敏感动作**：`action in ("EXPORT_BULK", "ROLE_ASSIGN") AND hour UTC not in business_hours` —— 工单复核。

***

### 七、权限 diff 脱敏

变更前后对比 **禁止**放入完整手机号；可用 **`maskPhone(before)`**。对象深层 diff 用 **`json-diff` + maxDepth**，防止把整个 JSON blob 打进索引。

***

### 八、小结

RBAC 产品是 **策略 + 证据链**。把审计当成 **一等功能**（字段契约 + 检索索引 + 告警），而不是事后 printf，才能在事故复盘里回答「谁、在什么上下文、对哪些数据、成功与否」。
