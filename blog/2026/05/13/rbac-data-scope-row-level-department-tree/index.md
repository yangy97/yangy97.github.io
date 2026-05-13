---
url: /blog/2026/05/13/rbac-data-scope-row-level-department-tree/index.md
---
接口鉴权通过后，用户仍可能 **看见不该看的行**。数据权限常见模型：**全部 / 本部门及子部门 / 仅本人 / 自定义列表**。本篇写 **约束下发通道**、**SQL 拼接陷阱**、以及 **审计如何记录 scope**。

***

### 一、Scope 类型枚举

```text
ALL
DEPT_SUBTREE       # 用户所属部门 id + 子孙
SELF_ONLY
CUSTOM_LIST:id...  # 显式业务集合（项目组）
```

角色可绑定 **默认 scope**；用户可有 **覆盖**（慎用，需双人复核）。

***

### 二、部门树查询：内存 vs SQL

* **规模小**：登录时加载 **祖先链缓存** 到 Redis。
* **规模大**：用 **闭包表 / materialized path / 递归 CTE**（MySQL 8+）在查询侧过滤。

避免 **N 层 OR**，优先 **JOIN dept\_closure** 一类稳定结构。

***

### 三、拼接 WHERE 的安全

**禁止字符串拼接原始 id**——用 **参数绑定**。同一 Service 方法根据 scope **分支构造 QueryBuilder**，单元测试覆盖四类 scope。

**导出任务**：异步导出必须 **重新计算 scope**，不能用前端传来的过滤条件信任。

***

### 四、跨表关联

「订单可见」往往关联「客户→销售→部门」。两种路线：

* **冗余 dept\_id 到订单**（写入时维护，查询快）。
* **运行时 join**（灵活，索引压力大）。

***

### 五、示例：MySQL 8 递归 CTE 求「某部门及子孙」

```sql
WITH RECURSIVE sub AS (
  SELECT id FROM org_department WHERE id = :rootId
  UNION ALL
  SELECT d.id FROM org_department d
  INNER JOIN sub ON d.parent_id = sub.id
)
SELECT o.*
FROM biz_order o
WHERE o.dept_id IN (SELECT id FROM sub);
```

`:rootId` 绑定参数；**禁止**字符串拼接 id 列表。

***

### 六、闭包表思路（频繁查询时）

```sql
CREATE TABLE org_closure (
  ancestor_id BIGINT NOT NULL,
  descendant_id BIGINT NOT NULL,
  depth INT NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);
```

判断 **`row.dept_id` 是否在用户可见集合**：`JOIN org_closure c ON c.descendant_id = o.dept_id AND c.ancestor_id IN (:allowedRoots)` —— 单次索引友好，维护成本在 **部门变更时重算闭包**。

***

### 七、Sequelize `where` 组合示例（节选）

```js
const Op = ctx.model.Sequelize.Op;
const subtreeIds = await deptService.subtreeIds(userDeptId);
const where = { deptId: { [Op.in]: subtreeIds } };
return ctx.model.Order.findAll({ where });
```

**SELF\_ONLY**：`where = { ownerUid: ctx.user.id }`。**CUSTOM\_LIST**：`where = { projectId: { [Op.in]: await userProjects(uid) } }`。

***

### 八、审计字段建议

每次列表 / 导出接口在审计表写 **`scope_kind`**（如 `DEPT_SUBTREE`）、**`scope_param`**（根部门 id）、**`row_count`**，纠纷时可证明「当时按何种范围过滤」。

***

### 九、小结

数据权限是 RBAC 的下半场：**API 权限决定能不能调用接口，数据 scope 决定返回集合**。把它做成 **显式枚举 + 参数化 SQL**，并在审计日志记录 **生效 scope**，才能在纠纷时可回放。
