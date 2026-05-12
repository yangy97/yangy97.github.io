---
url: /blog/2025/06/11/enterprise-ingress-traffic-forwarding/index.md
---
用户请求到达业务 Pod 之前，通常会经过 ==DNS → 边缘/CDN（可选）→ 四层负载均衡 → 七层网关/Ingress → Service → Pod==。这一层负责 **TLS 终结、路由、限流、鉴权前置、灰度权重**，是企业里 **运维 + 平台 + 业务后端** 的交界。下面分 **概念、组件分工、转发与会话、灰度、常见问题** 写深一点。

***

### 一、四层（L4）与七层（L7）在干什么

| 层级 | 典型产品/概念 | 决策依据 |
|------|----------------|----------|
| ==L4== | SLB、NLB、LVS | **IP:Port**、连接转发、健康检查 TCP；不解析 HTTP Host |
| **L7** | Nginx、Envoy、Ingress Controller、API Gateway | **路径/Host/Header**、路由、限流、WAF、JWT 校验 |

**直觉**：L4 管 **连接落到哪台机器**；L7 管 **这个 HTTP 请求该进哪个服务/版本**。

***

### 二、常见拓扑（简化）

```
客户端
  → DNS（GSLB / 健康路由）
  → 边缘 WAF/CDN（可选）
  → 公网入口 LB（L4）
  → Ingress / API Gateway（L7）
  → Kubernetes Service（ClusterIP/NodePort/Headless）
  → Pod（多副本）
```

云厂商 **CLB + Ingress** 或 **ALB 直接绑 Ingress** 都是常见变体，细节以云文档为准。

***

### 三、Ingress / Gateway 上常做的「企业级」能力

1. **路由**：`Host` + `Path` 前缀路由到不同 Service（多租户、多环境路径隔离）。
2. **TLS**：证书集中管理（cert-manager）、**强制 HTTPS**、HSTS（按安全要求）。
3. **限流**：按 IP / Header / 消费者配额；防 **突发与爬取**。
4. **超时与重试**：**网关超时** 必须小于或协调 **客户端超时**，避免 **重试风暴**（幂等接口才重试）。
5. **灰度/金丝雀**：按 **权重** 或 **Header/Cookie** 把流量切到新版本（需 Ingress/网格支持）。

***

### 四、负载均衡与健康检查

* **健康检查路径**：如 `/healthz`，应 **轻量**（不查重依赖，或异步缓存结果）。
* **不健康实例摘除**：避免 **把流量打到已死 Pod**。
* **会话保持（Sticky Session）**：有状态会话时要谨慎；**更推荐** 服务端会话外置（Redis）或 **JWT 无状态**。

***

### 五、转发相关 Header（排障必备）

| Header | 用途 |
|--------|------|
| `X-Forwarded-For` | 客户端 IP 链（**不可盲信**，需可信代理覆盖） |
| `X-Forwarded-Proto` | 原始 scheme（http/https） |
| `X-Request-Id` / Trace ID | **全链路追踪** 关联 |

**应用** 应从网关 **统一注入** `X-Request-Id`，日志与追踪系统对齐。

***

### 六、Nginx 反向代理片段（示意）

```nginx
upstream app {
  least_conn;
  server 10.0.1.10:8080;
  server 10.0.1.11:8080;
}

server {
  listen 443 ssl;
  server_name api.example.com;

  location / {
    proxy_pass http://app;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 2s;
    proxy_read_timeout 30s;
  }
}
```

生产环境往往再加 **限流模块**、**WAF**、**mTLS**（服务间）。

***

### 七、Kubernetes Ingress 示意（概念）

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-svc
                port:
                  number: 80
```

金丝雀常由 **Ingress 控制器扩展**（如 Nginx Ingress `canary` annotation）或 **Service Mesh** 完成。

***

### 八、Service Mesh（何时值得上）

**Istio / Linkerd** 等把 **mTLS、重试、熔断、按版本路由** 下沉到数据面。收益：**多语言微服务统一策略**；成本：**Sidecar 资源与运维复杂度**。\
**中小团队** 往往 **Ingress + 好规范** 就够；**大规模异构微服务** 再评估 Mesh。

***

### 九、常见坑

1. **body 缓冲**：大上传经 Nginx 时注意 `client_max_body_size` 与超时。
2. **WebSocket / SSE**：需 `proxy_http_version 1.1`、`Upgrade` 头。
3. **双重压缩**：CDN 与应用都 gzip → 浪费 CPU；通常 **一端做**。
4. **长连接与滚动发布**：旧连接仍可能打到旧 Pod → 结合 **优雅下线（preStop）**。

***

### 十、与监控的关系

入口层指标（QPS、延迟、5xx、限流命中）是 **SLO 的第一现场**；详见《企业级流量监控与可观测性实践》。

***

### 十一、收束

企业级接入 = **L4 高可用 + L7 策略化路由 + TLS 与限流 + 可灰度可追踪**。先把 **拓扑与 Header 契约** 画在白板上，再选具体 Ingress 控制器。
