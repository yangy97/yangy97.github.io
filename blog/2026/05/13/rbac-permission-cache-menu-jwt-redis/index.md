---
url: /blog/2026/05/13/rbac-permission-cache-menu-jwt-redis/index.md
---
每次请求扫库拼权限在 **QPS 稍高** 时就会成为瓶颈。本篇讨论三种缓存层级：**HTTP 内会话**、**Redis 侧权限集**、**JWT claims**，以及前端 **`routes → menuTree`** 合并时要注意的 **父子依赖**。

***

### 一、会话快照：`userId → permSetVersion`

登录后把 **`Set<permissionCode>`** 或 **布隆 + 负缓存** 放入 Redis，键附带 **`perm_version`**。变更角色绑定：

* **递增全局版本** 或 **用户级版本**，命中 miss 时重建。
* **踢人可选**：高风险后台在权限变更后 **强制下线**。

***

### 二、JWT claims：放什么不放什么

**可放**：用户 id、租户、**权限版本号**、常用角色 id（短）。

**慎放**：完整权限列表——token 体积膨胀 & 吊销滞后。

常组合：**JWT（身份） + Redis（权限展开）**。

***

### 三、菜单树合并

后端返回 **有序路由元数据**（含 `permRequired`）。前端：

1. **过滤** 无任一权限的节点。
2. **剪枝**：若父路由仅作分组且无组件，子全被剪掉则父删除。
3. **隐藏路由**：详情页路由可无菜单入口但仍需 **路由级守卫**。

静态路由 + 动态路由混用时，注意 **404 兜底顺序**。

***

### 四、失效策略

* **主动失效**：运营调权限后立即 bump version。
* **TTL 兜底**：防止逻辑 bug 导致永久脏缓存。

***

### 五、示例：Redis 缓存载荷（JSON）

```json
{
  "permVer": 17,
  "codes": ["order:read", "order:export"],
  "menuRev": "m20260201"
}
```

键：`perm:user:{tenant}:{userId}`，`TTL` 例如 **300s**。变更权限时 **`DEL`** 该键或 **`permVer++`** 令下一请求穿透重建。**击穿**：可加 **singleflight**（进程内 mutex keyed by userId）防止并发重建风暴。

***

### 六、示例：JWT Payload（精简）

```json
{
  "sub": "88421",
  "tenant": "acme",
  "pv": 17,
  "exp": 1735689600
}
```

`pv` 与 Redis `permVer` 不一致时：**刷新权限缓存** 或直接 **401 + 重新登录**。

***

### 七、前端路由守卫示意（Vue Router）

```ts
router.beforeEach(async (to, from, next) => {
  const need = to.meta.permissions as string[] | undefined;
  if (!need?.length) return next();
  const store = usePermissionStore();
  if (!store.loaded) await store.fetchPermissions();
  if (need.every(p => store.has(p))) next();
  else next({ name: 'Forbidden' });
});
```

**隐藏详情页**：`meta.hiddenInMenu: true` 仍要带 **`permissions`**，否则直接敲 URL 绕过菜单。

***

### 八、菜单剪枝算法骨架（伪代码）

```text
function prune(nodes, hasPerm):
  result = []
  for n in nodes:
    children = prune(n.children ?? [], hasPerm)
    selfOk = (n.required ⊂ hasPerm) // 任一策略可视业务定
    if selfOk or children.length:
      result.push({ ...n, children })
  return result
```

父节点 **纯分组无权限** 时：只要 **子节点非空** 就保留父——否则会出现「目录空了但仍占位」。

***

### 九、小结

缓存的目标不是「最快」，而是 **可解释的失效**。权限变更必须有一条 **从 DB → version → 网关/中间件** 的闭环，否则会出现「后台勾了勾，接口仍然 403/仍然 200」的双向事故。
