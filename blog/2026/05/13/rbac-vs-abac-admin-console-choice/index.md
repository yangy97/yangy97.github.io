---
url: /blog/2026/05/13/rbac-vs-abac-admin-console-choice/index.md
---
**RBAC** 回答「你是谁的角色」；**ABAC** 回答「在当前上下文是否允许」。后台系统常见诉求：**按部门、数据标签、金额阈值** 动态放行——这已经触碰 ABAC。本篇给 **选型阈值** 与 **渐进演进**，避免一上来 Cel / OPA 全家桶。

***

### 一、纯 RBAC 够用的信号

* 权限集合 **变化低频**，且不依赖运行时属性。
* **数据隔离** 只靠粗粒度租户 id，不靠「同一接口不同行」。

***

### 二、必须掺 ABAC 的信号

* 「同角色不同可见数据」依赖 **部门树 / 区域 / 项目组**。
* 审批链依赖 **金额、SKU 类目、供应商评级**。
* **外包账号** 仅能访问指定客户集合——静态角色难以表达。

***

### 三、务实混合模型：RBAC + 少量属性规则

不建议一步到位通用策略语言。常见路径：

1. **RBAC** 决定 **能不能进 Controller**（粗）。
2. **数据范围（Data Scope）** 子系统在 Service 层拼接 **WHERE**（细）。
3. 极少数场景再上 **规则引擎**（如拒绝对高风险字段的批量导出）。

***

### 四、性能：决策缓存与批量预计算

ABAC 决策若每次都远程拉属性会拖垮接口。策略：

* **登录 / refresh** 时计算 **数据范围快照**（短期有效）。
* **批量操作** 走 **异步任务**，决策与校验在 worker 重做一遍。

***

### 五、示例：策略片段 JSON（自家 DSL / OPA 皆可类比）

```json
{
  "effect": "deny",
  "when": {
    "resource": "order",
    "action": "export",
    "attrs": { "amount_gt": 100000, "region": "EU" }
  },
  "unless_roles": ["ROLE_FIN_ADMIN"]
}
```

解释：**默认拒绝大额导出**，除非持有 **`ROLE_FIN_ADMIN`**。落地时可编译成 **函数链** 或喂给 **OPA/Rego**，关键是 **决策输入 schema 固定**（`subject, resource, action, env`）。

***

### 六、示例：RBAC + Data Scope 两段式伪代码

```js
async function can(ctx, action, resourceId) {
  const roles = await getRoles(ctx.user.id);
  if (!roles.some(r => r.allows(action))) return false;
  const scope = await getDataScope(ctx.user.id); // DEPT_SUBTREE | ALL | ...
  const row = await dao.get(resourceId);
  return scope.contains(row); // 部门闭包 / owner_id 比对
}
```

第一段回答 **API 能不能进**，第二段回答 **这一行能不能碰**。多数后台无需完整 ABAC，到这里已够用。

***

### 七、何时「必须」上通用引擎（自检清单）

* \[ ] 规则数量 **> 数百** 且 **交叉引用** 频繁，表格配置 UI 已失控
* \[ ] 合规要求 **文本化策略** 可签字归档
* \[ ] 需 **跨系统** 下发同一套策略（微服务网关 + 多个领域服务）

否则维持 **代码内枚举 + 少量 JSON 配置** 往往更易调试。

***

### 八、小结

先用 **RBAC + 数据范围** 解决 80% 后台场景；当规则无法用「角色 + WHERE 模板」表达时，再引入 **显式策略引擎**。过早抽象会把权限调试变成黑盒。
