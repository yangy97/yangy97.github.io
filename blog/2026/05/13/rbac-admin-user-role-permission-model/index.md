---
url: /blog/2026/05/13/rbac-admin-user-role-permission-model/index.md
---
RBAC（Role-Based Access Control）在后台系统里常被简化成「给用户勾选菜单」。一旦要做 **API 级鉴权**、**多租户**、**临时授权**，就需要清晰的 **概念模型**。本篇给一套 **可落地的表结构与语义**，不绑定具体框架。

***

### 一、最小完备集合

1. **Subject**：人类用户 / 服务账号 / API Key（扩展 ABAC 时再细分）。
2. **Role**：职位包（运营主管、财务审核）。
3. **Permission**：原子能力，建议 **`resource:action`**（`order:approve`）稳定字符串。
4. **Resource（可选显式表）**：菜单路由、按钮 id、数据实体——用于 **前后端对齐** 与审计展示。

关系：**用户 ↔ 角色** 多对多；**角色 ↔ 权限** 多对多。**禁止**把权限直接挂用户（特殊情况用 **break-glass 临时角色** 更可审计）。

***

### 二、权限颗粒度：别太碎也别太粗

* **太粗**：`admin:true` —— 无法职责分离。
* **太碎**：每个按钮一项 —— 运维成本高。

实践：**接口层用权限码**；**UI 层用 permission 集合推导按钮显隐**。同一权限可驱动两者。

***

### 三、约束（SoD）示例

互斥角色：**「制单」与「复核」** 不能同属一人。实现：**角色组约束表** 或在分配 API 做校验。

***

### 四、演进：权限版本号

发布新接口时老 JWT / 会话里的权限快照可能过期：维护 **`perm_version`**，变更后 **强制刷新会话** 或 **短时失效**。

***

### 五、示例：最小表结构（MySQL 风味）

```sql
CREATE TABLE sys_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  username VARCHAR(64) NOT NULL,
  UNIQUE KEY uk_tenant_user (tenant_id, username)
);

CREATE TABLE sys_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  code VARCHAR(64) NOT NULL,
  UNIQUE KEY uk_tenant_role (tenant_id, code)
);

CREATE TABLE sys_permission (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(128) NOT NULL, -- e.g. order:approve
  UNIQUE KEY uk_perm_code (code)
);

CREATE TABLE sys_user_role (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE sys_role_permission (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);
```

租户型 SaaS 务必 **`tenant_id` 进唯一键与查询谓词**，否则极易串租户。

***

### 六、示例：接口鉴权中间件（Egg/Koa 思路）

```js
// middleware/rbac.js —— 示意：路由 meta.requiredPermissions = ['order:approve']
async function rbac(options = {}) {
  const required = options.required || [];
  return async (ctx, next) => {
    const granted = await ctx.service.rbac.getPermissions(ctx.state.user.id);
    const ok = required.every(p => granted.includes(p));
    if (!ok) return ctx.throw(403, 'FORBIDDEN');
    await next();
  };
}
```

Controller 或路由表声明 **`required`**，避免手写散落 `if`。**数据权限**仍应在 Service **拼接 WHERE**，middleware 只做 **粗粒度 API 门闸**。

***

### 七、职责分离（SoD）校验示例

```js
async function assertSeparation(userId, newRoleIds) {
  const forbiddenPairs = [ [ 'ROLE_ORDER_CREATE', 'ROLE_ORDER_APPROVE' ] ];
  const roles = await loadRoleCodes(userId, newRoleIds);
  for (const [ a, b ] of forbiddenPairs) {
    if (roles.has(a) && roles.has(b)) throw new Error('SoD violated');
  }
}
```

也可落 **`role_exclusion` 表**：`(role_a_id, role_b_id)`，分配时用 **`JOIN` 检测冲突**。

***

### 八、小结

RBAC 的核心不是表有几张，而是 **权限码是不是稳定契约**。先钉 **`resource:action` + 角色绑定 + 审计**，再谈前端菜单树——否则永远是「菜单能对上，接口却裸奔」。
