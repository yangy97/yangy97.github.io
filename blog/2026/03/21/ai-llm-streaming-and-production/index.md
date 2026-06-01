---
url: /blog/2026/03/21/ai-llm-streaming-and-production/index.md
---
把大模型接进业务服务时，==流式（SSE / chunked）== 和 **非流式** 的差别不只是「打字机效果」：还牵涉网关超时、客户端缓冲、计费和排障。这篇面向 **要自己接 API 的同学**，不讲具体云厂商字段，只讲 **通用注意点** 与可拷贝的骨架代码。

***

### 一、流式在协议层大致做了什么

客户端发起请求后，服务端 ==边生成边推送== token 或分片；浏览器或 App 用 **EventSource（SSE）** 或 **fetch + ReadableStream** 消费。对用户是体验问题，对工程是：

* **连接占用时间变长**：比一次性 JSON 更易触发 **代理 / 负载均衡的 idle timeout**。
* **错误发生得更晚**：首包可能 200，中途断流才暴露问题，要有 **中途失败** 的 UI 与日志策略。
* **计费与限流**：有的按 **输出 token** 计，流式同样累计；要在网关层做 **用户级 / 租户级配额**。

#### 1.1 SSE 响应头（服务端）

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

`X-Accel-Buffering: no` 告诉 Nginx **不要缓冲 body**，否则用户迟迟看不到首字。

#### 1.2 浏览器 fetch 消费（前端）

```typescript
async function streamChat(body: unknown, signal: AbortSignal, onDelta: (text: string) => void) {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6);
        if (payload === '[DONE]') return;
        const json = JSON.parse(payload);
        onDelta(json.delta ?? '');
      }
    }
  }
}
```

用户切换会话时 **`AbortController.abort()`**，避免服务端继续算无效 token。

***

### 二、超时层级：由内向外递减

```text
客户端 UI 取消          ~ 用户耐心（可配 60s 无 token 提示）
Node/BFF  upstream      ~ 120s（大于模型 P99）
Nginx proxy_read_timeout ~ 略小于 BFF，便于 BFF 先收口
云 LB idle timeout      ~ 检查是否 < 长回答时间
```

**反模式**：最外层网关 30s，内层 BFF 180s——客户端已断，内层仍在计费。

#### 2.1 Nginx 片段

```nginx
location /api/chat/ {
  proxy_pass http://bff:3000;
  proxy_http_version 1.1;
  proxy_set_header Connection '';
  proxy_buffering off;
  proxy_read_timeout 120s;
  proxy_send_timeout 120s;
}
```

***

### 三、生产环境建议默认带上这些

1. **上游超时**：大于「模型最坏情况」，并 **小于** 网关最外层超时；中间层逐级递减，避免「客户端已断、服务端还在算」。
2. **客户端取消**：用户关闭页面或切换会话时 **AbortController** 取消 fetch，减少无效算力。
3. **幂等与请求 ID**：同一会话重发时带 **client\_request\_id**，便于日志对齐，避免重复扣费争议（依厂商能力）。
4. **结构化日志**：记录 `model`、`latency_first_token`、`latency_total`、`status`、`truncated`（是否触顶 max\_tokens），**不要**把用户完整 prompt 打进明文日志（合规与脱敏）。
5. **背压与队列**：高峰时对 `/chat` 做 **排队 + 429**，保护 GPU 池；别无限接受长连接。
6. **降级路径**：流式失败自动 retry 一次非流式短答，或返回「服务繁忙」模板。

#### 3.1 日志字段示例

```json
{
  "event": "llm_completion",
  "request_id": "req_abc",
  "user_id_hash": "u_***",
  "model": "gpt-4o",
  "latency_ttft_ms": 820,
  "latency_total_ms": 12400,
  "input_tokens": 512,
  "output_tokens": 980,
  "truncated": false,
  "status": "ok"
}
```

`ttft`（time to first token）是体验与排障的核心指标。

***

### 四、和「同步一次返回 JSON」怎么选

| 场景 | 更常见选择 | 原因 |
|------|------------|------|
| 聊天、长回答展示 | 流式 | 首字快、可中途取消 |
| 工具编排、严格 JSON 给下游解析 | 非流式或「流式但只收完整 buffer 再 parse」 | 避免半段 JSON |
| 批量离线任务 | 非流式 + 队列 | 简化重试与对账 |
| 移动端弱网 | 流式 + 断线续传策略 | 产品复杂度高，可选非流式 |

**半段 JSON 问题**：若必须流式展示又要把 JSON 交给执行器，用 **两阶段**——阶段一 stream 给用户看；阶段二模型输出结束后再 `JSON.parse` 全文，失败则不让工具执行。

***

### 五、重试与 idempotency

| 错误类型 | 是否重试 | 说明 |
|----------|----------|------|
| 429 / 503 | 是（指数退避 + jitter） | 尊重 `Retry-After` |
| 400 参数错误 | 否 | 修参数 |
| 中途断流 | 视产品 | 可续写 prompt「继续上文」或整段重试 |
| 内容审核拦截 | 否 | 换 prompt 或人工 |

写操作（发邮件、下单）**不要**因模型超时就自动重试同一 tool call——要 **幂等键**。

***

### 六、排障时先看什么

1. **首 token 延迟**：高则可能是排队、冷启动或网络；区分「模型慢」与「网关慢」。
2. **中途断流**：查代理 body 缓冲、Nginx `proxy_read_timeout`、云厂商流式限制。
3. **内容被截断**：是否触达 `max_tokens` 或上下文上限；产品侧要有「续写」或「总结」策略。
4. **Chrome 有字、Safari 无字**：查 SSE / chunked 与中间层缓冲。
5. **账单突增**：是否未 abort、是否 retry 风暴、是否 cache miss 导致重复长上下文。

***

### 七、与[《AI 编程助手》](/2026/01/08/ai-coding-assistant/)系列的关系

编辑器里用模型多是产品封装好的；**自己接 API** 时上面这些才会变成工单。更偏 **安全与注入** 见[《提示注入与安全》](/2026/03/31/ai-prompt-injection-security/)；偏 **向量与检索** 见[《向量与相似度》](/2026/04/11/ai-embedding-vectors-basics/)。\
容器与 Nginx 部署见 [《前端 Docker 部署》](/2026/06/01/docker-frontend-deployment-basics/)。

***

### 八、一句话

流式 LLM 上线 = **长连接 + 取消 + 分层超时 + TTFT 可观测**；先把网关和 Abort 配对，再优化打字机 UI。
