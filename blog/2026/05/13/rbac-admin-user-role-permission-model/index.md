---
url: /blog/2026/05/13/rbac-admin-user-role-permission-model/index.md
---
## **RBAC**（Role-Based Access Control，基于角色的访问控制）在后台里常被简化成「给用户勾选菜单」。一旦要做 **API 级鉴权**（每个接口校验权限码，不能只藏按钮）、**多租户**（SaaS 不同客户数据隔离）、**临时授权**，就需要清晰的概念模型。

### 一、最小完备集合

1. **Subject**（主体：谁在访问——人类用户、服务账号或 API Key）——以后若上 **ABAC**（基于属性的访问控制），再在 Subject 上挂部门、金额等属性。
2. **Role**（角色：权限的职位包，如运营主管）——便于批量分配，而不是给每人勾 200 个权限。
3. **Permission**（权限：最小原子能力码）——建议稳定字符串 **`resource:action`**，例如 `order:approve`；前后端、审计都认这一串，**不要**用中文文案当权限码。
4. **Resource**（资源：菜单路由、按钮 id、API 路径等，可选单独建表）——用来 **前后端对齐** 与审计展示「动了哪个对象」。

关系：**用户 ↔ 角色** 多对多；**角色 ↔ 权限** 多对多。**禁止**把权限直接挂用户（运维噩梦）；紧急情况用 **break-glass（破玻璃）临时角色**，必须留审计。

**和菜单的关系**：菜单/按钮只是权限的 **UI 投影**——用户看不见菜单，不代表接口不能调；**接口层必须验权限码**。**数据权限**（只能看本部门几行数据）是另一层，在 SQL 里拼 `WHERE`，见 [数据权限文](/2026/05/13/rbac-data-scope-row-level-department-tree/)。

***

### 二、权限颗粒度：别太碎也别太粗

* **太粗**：`admin:true` —— 无法职责分离。
* **太碎**：每个按钮一项 —— 运维成本高。

实践：**接口层用权限码**；**UI 层用 permission 集合推导按钮显隐**。同一权限可驱动两者。

***

### 三、约束（SoD）示例

**SoD**（Segregation of Duties，职责分离）：互斥角色不能同属一人，例如 **「制单」与「复核」**——自己批自己的单风险太高。实现：**角色组约束表** 或在分配角色的 API 里校验冲突。

***

### 四、演进：权限版本号

用户登录后，权限集合常会缓存在 **JWT**（JSON Web Token，自包含的登录凭证）或 **服务端 Session** 里。发布新接口、调整角色后，旧会话里的权限快照可能 **过期**。维护全局或用户级 **`perm_version`（权限版本号）**：角色绑定变更时递增，客户端/网关发现版本不一致就 **强制重新登录或拉权限**，避免「菜单已收权、接口仍能调」。

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

租户型 SaaS 务必在表里带 **`tenant_id`（租户 id，标识是哪家客户的数据）**，并写进唯一键与 **每条查询的 WHERE**——漏写一句 `tenant_id = ?` 就是典型的 **串租户** 事故。

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

Controller 或路由表声明 **`required`**，避免手写散落 `if`。**数据权限**仍应在 Service 层 **拼接 SQL WHERE**（决定返回哪些行）；middleware 只做 **粗粒度 API 门闸**（有/没有 `order:approve` 这类码），两者不能互相替代。

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
