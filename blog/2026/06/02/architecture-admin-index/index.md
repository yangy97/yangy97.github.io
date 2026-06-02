---
url: /blog/2026/06/02/architecture-admin-index/index.md
---
`08-架构` 只有 5 篇，但跨度大：从 **OA Monorepo 脚手架** 到 **多地域门户权限**。缺少总览时，读者容易 **直接打开门户深文然后放弃**。本篇说明 **每篇解决什么问题、要先懂什么、建议阅读顺序**。

***

### 一、五篇文章各自解决什么

| 文章 | 解决什么问题 | 难度 |
|------|--------------|------|
| [动态表单与 ProTable](/2026/05/23/admin-dynamic-form-protable-patterns/) | 中后台 CRUD 怎么少写重复代码 | ⭐⭐ |
| [OA Monorepo 前端架构](/2023/09/01/oa-template-monorepo-frontend-architecture/) | 多包仓库、契约客户端、路由即菜单 | ⭐⭐⭐ |
| [BFF Protobuf RPC 客户端栈](/2026/05/16/bff-protobuf-rpc-client-stack-srpc-pattern/) | 浏览器只打 HTTP，BFF 怎么调内部 RPC | ⭐⭐⭐⭐ |
| [文件预览水印下载](/2026/05/23/frontend-file-preview-watermark-permission-download/) | 附件链路安全 | ⭐⭐⭐ |
| [多地域门户场景策略](/2026/05/14/portal-scene-strategy-multi-region-permissions/) | 一套代码多形态、权限三源合成 | ⭐⭐⭐⭐⭐ |

***

### 二、读前应先具备的概念

| 概念 | 一句话 | 不懂先读 |
|------|--------|----------|
| **中后台 / Admin** | 登录后的运营管理界面，重表格表单 | [ProTable 文](/2026/05/23/admin-dynamic-form-protable-patterns/) |
| **RBAC** | 按角色分配权限码 | [RBAC 导读](/2026/06/02/rbac-learning-path-index/) |
| **Monorepo** | 一个 Git 仓多个 package | [pnpm workspace](/2023/06/20/monorepo-pnpm-workspace/) |
| **BFF** | Backend For Frontend，为 UI 定制的 API 层 | 下文第三节 · [BFF RPC 文](/2026/05/16/bff-protobuf-rpc-client-stack-srpc-pattern/) |
| **Protobuf / RPC** | 二进制契约 + 内部服务调用，浏览器通常不直连 | [BFF RPC 文](/2026/05/16/bff-protobuf-rpc-client-stack-srpc-pattern/) |
| **动态路由** | 菜单/路由由接口下发，非写死在代码里 | [Vue Router 权限](/2026/05/20/vue-router4-permission-dynamic-menu/) |
| **Ticket / 签名 URL** | 短期授权访问文件，非永久 OSS 链接 | [文件预览文](/2026/05/23/frontend-file-preview-watermark-permission-download/) |

***

### 三、BFF 是什么（30 秒版）

```text
浏览器 ──HTTP/JSON──► BFF（Node/Java）──RPC/SQL──► 内部微服务
         ↑
    字段贴合 UI、聚合多接口、藏密钥
```

**不是** 把 Java 接口原样暴露给前端；**是** 减少往返、统一鉴权、适配多端。Protobuf 文讲的是 BFF **如何生成类型安全的 RPC 客户端**。

***

### 四、推荐阅读顺序

**路径 A：中后台脚手架（多数团队）**

1. [ProTable / 动态表单](/2026/05/23/admin-dynamic-form-protable-patterns/)
2. [RBAC 建模](/2026/05/13/rbac-admin-user-role-permission-model/) → [数据权限](/2026/05/13/rbac-data-scope-row-level-department-tree/)
3. [Vue Router 动态菜单](/2026/05/20/vue-router4-permission-dynamic-menu/)
4. [OA Monorepo 架构](/2023/09/01/oa-template-monorepo-frontend-architecture/)
5. [文件预览链路](/2026/05/23/frontend-file-preview-watermark-permission-download/)

**路径 B：大型门户 / 多地域（进阶）**

在路径 A 基础上，再读 [门户场景策略](/2026/05/14/portal-scene-strategy-multi-region-permissions/) —— 文首有 **场景策略 101**。

**路径 C：BFF / 内部 RPC**

1. [Egg 架构](/2023/04/20/eggjs-architecture-guide/)（Node 读者）
2. [BFF Protobuf RPC 栈](/2026/05/16/bff-protobuf-rpc-client-stack-srpc-pattern/)

***

### 五、与微前端、企业级的关系

* **微前端**：多个独立前端应用组合 → [微前端导读](/2025/04/24/micro-frontend-mainstream-landscape-and-choice-2026/)
* **企业级发版**：架构定完还要 **CI/网关/观测** → [企业级导读](/2026/06/02/enterprise-ops-primer-index/)
* **工程化总地图** → [工程化导读](/2026/06/02/engineering-learning-path-index/)

***

### 六、一句话

**中后台架构 = RBAC + 动态路由 +（可选）BFF +（可选）Monorepo**；门户深文是 **在前三者之上加「场景策略」**，别跳过基础直接读第五篇。
