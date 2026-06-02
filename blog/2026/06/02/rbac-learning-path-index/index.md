---
url: /blog/2026/06/02/rbac-learning-path-index/index.md
---
后台权限文章容易写成 **「直接上表结构」**，没做过权限系统的读者会懵：**菜单、按钮、接口、数据行** 到底几层？本篇是 `07-后台与RBAC` 的 **101 + 阅读顺序**；五篇正文在关键术语**首次出现处**有括号简要说明。

***

### 一、RBAC 四个字在说什么

**Role-Based Access Control（基于角色的访问控制）**：

```text
用户 ──拥有──► 角色 ──拥有──► 权限码 ──控制──► 能做什么
```

* **用户（Subject）**：登录的人或服务账号。
* **角色（Role）**：职位包，如「运营」「财务审核」。
* **权限（Permission）**：原子能力，建议稳定字符串 `资源:动作`，如 `order:approve`。
* **资源（Resource）**：菜单路由、按钮 ID、API 路径——用于 **前后端对齐**。

**不是**：给每个用户勾选 200 个菜单 checkbox 就完事。\
**而是**：接口层必须鉴权；菜单只是权限的 **UI 投影**。

***

### 二、三层权限别混

| 层级 | 控制什么 | 典型实现 | 前端表现 |
|------|----------|----------|----------|
| **路由 / 菜单** | 能否进入某页 | 路由 meta + 菜单树过滤 | 侧栏不显示 |
| **操作 / 按钮** | 能否点「删除」「审批」 | 权限码 `v-permission` | 按钮隐藏或 disabled |
| **数据 / 行级** | 能否看到 **哪几行** 数据 | SQL WHERE 部门树 | 列表只出本部门单 |

**常见事故**：菜单藏了，接口仍返回全量数据 → **越权**。数据权限必须在 **Service/DAO** 拼条件，见 [数据范围文](/2026/05/15/rbac-data-scope-row-level-department-tree/)。

***

### 三、术语速查

| 术语 | 一句话 |
|------|--------|
| **租户 tenant\_id** | SaaS 多客户隔离；查询必带 |
| **SoD** | 职责分离，互斥角色不能同人（制单≠复核） |
| **break-glass** | 临时提权，须审计 |
| **perm\_version** | 权限变更版本，迫使会话刷新 |
| **JWT 里塞什么** | 宜放 identity + 角色摘要，**不宜**塞全量权限树 |
| **菜单剪枝** | 无权限的菜单节点从树中移除 |
| **ABAC** | 按属性（部门、地域）决策；比 RBAC 灵活，复杂度高 |

***

### 四、五篇阅读顺序

| 顺序 | 文章 | 重点 |
|------|------|------|
| 1 | [RBAC 建模](/2026/05/13/rbac-admin-user-role-permission-model/) | 表结构、权限码契约、SoD |
| 2 | [RBAC vs ABAC 选型](/2026/05/13/rbac-vs-abac-admin-console-choice/) | 何时上 ABAC |
| 3 | [数据权限（行级）](/2026/05/13/rbac-data-scope-row-level-department-tree/) | 部门树、WHERE |
| 4 | [权限缓存与菜单 JWT](/2026/05/13/rbac-permission-cache-menu-jwt-redis/) | Redis、版本号、剪枝 |
| 5 | [审计与越权防控](/2026/05/13/rbac-audit-log-privilege-escalation-detection/) | 日志、告警 |

前端配合：[Vue Router 动态权限](/2026/05/20/vue-router4-permission-dynamic-menu/)、[ProTable](/2026/05/23/admin-dynamic-form-protable-patterns/)。

***

### 五、与架构目录的关系

大型门户在 RBAC 之上还有 **场景策略**（同一套代码，不同产品形态不同菜单）→ [门户架构](/2026/05/14/portal-scene-strategy-multi-region-permissions/)。先读完本目录 1～3 再读门户文。

***

### 六、一句话

**RBAC = 稳定权限码 + 角色绑定 + 接口鉴权 +（可选）行级数据范围**；菜单是结果不是起点。
