---
url: /blog/2026/06/02/enterprise-ops-primer-index/index.md
---
`enterprise-*` 系列写给 **要参与发版、对接运维、设计 BFF 的前端/全栈**。不是运维手册，而是 **「听到这些词时不懵 + 知道该找谁」**。每篇 enterprise 深文文首有 **术语框**；本篇是 **全系列地图**。

***

### 一、前端为什么要知道这些

```text
你写的 SPA ──► 构建产物 ──► CI 流水线 ──► 镜像/静态桶 ──► 网关/Ingress ──► 用户
                              ↑                    ↑
                           测试门禁            金丝雀/回滚
```

前端常踩坑：**history 路由 404**（网关没 fallback）、**staging 配错 API**（环境配置）、**只测 dev 没测 build**（CI 绿但线上白屏）。

***

### 二、术语速查（读 enterprise 文前过一遍）

| 术语 | 一句话 |
|------|--------|
| **CI** | 每次提交自动跑 lint/测试/构建 |
| **CD** | 构建通过后自动或半自动部署到环境 |
| **Pipeline / 流水线** | CI+CD 各阶段的编排 |
| **Artifact / 制品** | 构建产物：镜像、dist 包、Helm chart |
| **Promote** | 同一制品从 staging **晋升** 到 prod，不重新 build |
| **Quality Gate** | 不达标则 **阻断** 合并或部署（覆盖率、漏洞等） |
| **SAST / SCA / SBOM** | 静态代码扫描 / 依赖漏洞扫描 / 物料清单 |
| **OIDC** | CI 用短期身份访问云，替代长期 AccessKey |
| **K8s / Pod / Deployment** | 容器编排；Pod 是运行实例 |
| **Ingress** | K8s 里 HTTP 路由入口（类似 Nginx 虚拟主机） |
| **Service** | Pod 的稳定访问地址（ClusterIP 等） |
| **Helm** | K8s 应用的「模板 + values」打包 |
| **ConfigMap / Secret** | 非敏感 / 敏感配置注入容器 |
| **GitOps** | 用 Git 仓库声明期望状态，工具自动同步到集群 |
| **Blue/Green / Canary** | 蓝绿切换 / 小流量金丝雀 |
| **Feature Flag** | 代码已上线，功能按开关对用户可见 |
| **Metrics / Logs / Traces** | 指标 / 日志 / 链路追踪（可观测三板斧） |
| **SLO / P95 / P99** | 服务目标 / 95%、99% 分位延迟 |
| **RPO / RTO** | 灾备：可丢多少数据 / 多久恢复 |
| **零信任** | 默认不信任内网，每次访问都要验证身份与权限 |

***

### 三、推荐阅读顺序

| 顺序 | 文章 | 你会搞懂 |
|------|------|----------|
| 1 | [CI/CD 流水线](/2025/04/09/enterprise-cicd-pipeline-deep/) | 阶段、门禁、制品、Runner |
| 2 | [多环境与配置治理](/2025/07/13/enterprise-multi-env-config-governance/) | dev/staging/prod、Helm values |
| 3 | [前端 Docker 部署](/2026/06/01/docker-frontend-deployment-basics/) | 前端镜像怎么打（SPA） |
| 4 | [应用接入与流量转发](/2025/06/11/enterprise-ingress-traffic-forwarding/) | Ingress、history fallback、TLS |
| 5 | [发布策略](/2025/09/14/enterprise-release-strategies-canary-bluegreen/) | 金丝雀、蓝绿、Flag |
| 6 | [流量监控与可观测](/2025/08/14/enterprise-observability-traffic-monitoring/) | Prometheus、Trace、告警 |
| 7 | [API 安全与零信任](/2025/02/05/enterprise-api-security-zero-trust-basics/) | OAuth、JWT、网关鉴权 |
| 8 | [事故响应 On-Call](/2025/05/11/enterprise-incident-oncall-runbook/) | 线上出事谁做什么 |
| 9 | [备份与容灾 RPO/RTO](/2025/03/09/enterprise-backup-dr-rpo-rto/) | 备份策略 |

与性能交叉：[性能预算 CI](/2025/10/16/frontend-performance-budget-ci/)。

***

### 四、和前端工作的对应关系

| 前端动作 | 企业级环节 |
|----------|------------|
| 改 `VITE_*` 环境变量 | 构建期注入 vs 运行时注入（多环境文） |
| `base: '/blog/'` | Ingress 路径、CDN 前缀（网关文） |
| 提 PR | CI 门禁（lint/test/size-limit） |
| 说「预发没问题线上 404」 | promote 的制品是否同一 digest、缓存（CI 文） |
| 接 Sentry | RUM + Traces 分工（可观测文） |

***

### 五、一句话

**企业级系列 = 把「能跑 dev」扩成「能重复、可审计、可回滚地上线」**；前端不必会调 Helm，但要懂 **制品、环境、网关、观测** 在链路哪一环。
