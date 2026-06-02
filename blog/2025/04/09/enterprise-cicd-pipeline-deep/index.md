---
url: /blog/2025/04/09/enterprise-cicd-pipeline-deep/index.md
---
企业级 CI/CD 关心的不只是「能自动部署」，而是：==可重复、可审计、可回滚、可分环境验证==，并在 **质量 / 安全 / 合规** 上设 **门禁**（Quality Gate：不达标就 fail，阻止合并或上线）。下文表格里的英文缩写会在 **同一行或紧接段落** 说明含义。

***

### 一、流水线典型阶段（逻辑分层）

| 阶段 | 目的 | 常见步骤 |
|------|------|----------|
| ==Source== | 可追溯 | 分支策略、Commit 关联工单、签名提交（可选） |
| **Build** | 可复现制品 | 安装依赖、编译、单测、**确定性构建**（锁文件） |
| **Static Analysis** | 早发现问题 | Lint、类型检查、**SAST**（Static Application Security Testing，静态扫源码漏洞）、Secret 扫描、**SCA**（Software Composition Analysis，扫第三方依赖 CVE） |
| **Test** | 分层验证 | 单测 → 集成/契约 → **E2E**（End-to-End 端到端浏览器测试，可选 nightly） |
| **Package** | 不可变制品 | 镜像 **digest**（内容哈希，标识唯一二进制）、**Helm chart**（K8s 应用模板包）、**SBOM**（Software Bill of Materials，依赖清单） |
| **Deploy（按环境）** | 可控上线 | dev → staging → prod；人工审批或策略审批 |
| **Post-deploy** | 闭环 | 冒烟、**合成监控**、指标对比、自动回滚（可选） |

**原则**：**越靠左越便宜**——在 PR 阶段拦住问题，比在生产救火便宜一个数量级。

***

### 二、制品（Artifact）与不可变部署

* **同一次构建**产出的镜像 / 静态资源 / Helm 包，**晋升（promote）** 到 staging、prod 等环境——**不要**每个环境重新 `pnpm build`（否则容易出现「预发测的是 commit A，线上跑的是 commit B」）。
* 镜像 tag 建议用 **digest** 或 `版本+构建号`，避免生产只用 `latest`（无法精确回滚）。
* **SBOM** 可与 **SCA** 工具联动，做许可证与漏洞审计。

***

### 三、密钥与配置：绝不写进仓库

| 做法 | 说明 |
|------|------|
| **CI 变量** | 敏感值用平台「密文变量」，按 **环境** 作用域划分 |
| **短期凭证** | **OIDC**（OpenID Connect，CI 用短期身份令牌换云厂商凭证，避免把 AccessKey 写进仓库） |
| **运行时注入** | **K8s Secret**（Kubernetes 密钥对象）/ **Vault**（集中密钥管理）/ 云 KMS |
| **配置分层** | `values-dev.yaml` / `values-prod.yaml`，**非敏感** 与 **敏感** 分离 |

**反模式**：把生产数据库 URL 明文写在 `docker-compose.yml` 并提交。

***

### 四、质量门禁（Quality Gates）示例思路

1. **测试**：覆盖率 **阈值**（按模块逐步提高）、关键路径 **必测**。
2. **安全**：高危漏洞 **阻断**、中危 **限期修复**。
3. **性能**：前端 **size-limit**（见性能系列）、API **性能基线**（可选）。
4. **合规**：许可证 **黑名单**、禁止依赖 **copyleft 误用**（视公司法务）。

门禁过严会导致 **绕过文化**——阈值要与团队共识，并 **定期复盘误杀率**。

***

### 五、数据库变更与 CI/CD

* **迁移脚本**（**Flyway** / **Liquibase** 等数据库版本工具）与 **应用发布** 的顺序要有规范：常见 **expand/contract**——先 **加** 新字段且兼容旧代码 → 发新版应用 → 再 **删** 旧字段，避免停机迁移。

***

### 六、发布策略（与接入层配合）

| 策略 | 含义 | 适用 |
|------|------|------|
| **Rolling** | 逐实例替换（K8s 默认滚动更新） | 默认、简单 |
| **Blue/Green** | 蓝绿两套完整环境，一切流量切到新环境 | 秒级回滚，占双倍资源 |
| **Canary** | **金丝雀**：先导 1%～5% 流量到新版本，指标正常再放大 | 风险敏感、有监控支撑 |
| **Feature Flag** | **特性开关**：代码已部署，按用户/比例决定功能是否可见，与发版频率解耦 |

金丝雀需要 **入口层权重** + **监控阈值自动晋升/回滚**（见[《应用接入与流量转发》](/2025/06/11/enterprise-ingress-traffic-forwarding/)篇）。

***

### 七、Runner 与隔离

* **共享 Runner**：成本低，注意 **租户隔离**（容器、网络策略）。
* **专属 Runner**：合规或重型构建（Android/iOS、大前端 monorepo）。
* **缓存**：依赖缓存加速构建，但要 **缓存键** 与 **锁文件** 一致，避免脏缓存。

***

### 八、GitHub Actions 极简骨架（示意）

```yaml
name: ci
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm test
      - run: npm run build
```

生产部署 job 往往单独 **environment**，加 **required reviewers**。

***

### 九、与「企业级」其它能力的关系

* **流量怎么进服务**：网关、Ingress、负载均衡 → 见[《企业级应用接入与流量转发》](/2025/06/11/enterprise-ingress-traffic-forwarding/)。
* **上线后怎么知道健康**：指标、日志、追踪 → 见[《企业级流量监控与可观测性实践》](/2025/08/14/enterprise-observability-traffic-monitoring/)。

***

### 十、小结

企业级 CI/CD = **流水线结构化 + 制品与密钥治理 + 门禁可执行 + 发布策略与数据迁移有章可循**。工具换皮不换骨：**先把流程和责任人写清**，再选 GitLab 还是 Argo CD。
