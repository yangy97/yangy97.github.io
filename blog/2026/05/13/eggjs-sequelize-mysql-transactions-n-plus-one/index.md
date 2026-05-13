---
url: /blog/2026/05/13/eggjs-sequelize-mysql-transactions-n-plus-one/index.md
---
`egg-sequelize` 把 Model 绑定进 **`ctx.model`**。本篇不写 Hello World，而写 **线上真金白银四类问题**：迁移不回滚、长事务锁表、`UPDATE … WHERE version` 乐观锁、以及列表页的 **N+1**。

***

### 一、迁移：向前兼容与回填

* **加列默认值**：大表在线 DDL 要考虑锁；优先 **nullable → 回填 → NOT NULL** 两阶段。
* **删列/改名**：先 **双写或兼容读取**，再删老字段——Egg 发布常与前端并行，粗暴改名会直接炸。
* **索引**：确认 **选择性** 与 **最左前缀**；后台筛选字段组合多时别盲目单项索引堆叠。

***

### 二、事务边界放在 Service

Controller **不写事务**；Service 方法 **`ctx.model.transaction(fn)`** 包住一组写入。**隔离级别**：默认 Repeatable Read（MySQL InnoDB）下注意 **幻读敏感的业务**（如配额扣减）是否要 Serializable 或用 **SELECT … FOR UPDATE** 收紧临界区。

**反模式**：在 middleware 里开事务——请求没到 Controller 就可能超时提交失败。

***

### 三、乐观锁：`version` 列与冲突语义

并发编辑后台表单：

```sql
UPDATE orders SET status=?, version=version+1 WHERE id=? AND version=?
```

影响行数为 0 表示冲突：**409 / 业务码 conflict**，前端提示刷新。Egg Service 层封装 **`updateWithOptimisticLock`**，避免每个 Controller 手写 WHERE。

***

### 四、N+1：include、分页与子查询

* **列表 + 关联头像**：`include` 限制属性、`subQuery: false` 谨慎（分页语义会变）。
* **计数**：`findAndCountAll` 在复杂 join 时 count 可能不准——拆分 **`COUNT(*)` 子查询** 或冗余计数字段。
* **大屏导出**：单独 reader、限速与异步任务；不要用同一个重型接口扛列表与导出。

***

### 五、示例：Service 层事务模板（节选）

```js
// app/service/order.js —— 示意
async transferFunds(fromId, toId, amount) {
  const { model } = this.ctx;
  return await model.transaction({ isolationLevel: model.Transaction.ISOLATION_LEVELS.REPEATABLE_READ }, async (t) => {
    const from = await model.Account.findByPk(fromId, { transaction: t, lock: t.LOCK.UPDATE });
    const to = await model.Account.findByPk(toId, { transaction: t, lock: t.LOCK.UPDATE });
    if (from.balance < amount) this.ctx.throw(422, 'insufficient');
    await from.update({ balance: from.balance - amount }, { transaction: t });
    await to.update({ balance: to.balance + amount }, { transaction: t });
  });
}
```

**要点**：`lock: UPDATE` 把「读-改-写」收束在同一临界区；若仅用默认 SELECT，两份余额可能被并发透支。**超时**：外层可由 **`promise-timeout`** 或自定义 **`SET SESSION innodb_lock_wait_timeout`**（慎用全局）限制长时间锁等待。

***

### 六、示例：乐观锁在 Sequelize 中的两种写法

**手写 WHERE（上文 SQL）**：

```js
const [ affected ] = await model.Order.update(
  { status: 'PAID', version: sequelize.literal('version + 1') },
  { where: { id, version: expectedVersion } },
);
if (affected === 0) this.ctx.throw(409, 'concurrent_edit');
```

**`increment` + `reload`**（需注意返回值语义）：仍以 **`WHERE version`** 为准，避免「读后丢失覆盖」。

***

### 七、N+1 示例：列表场景的反模式与改写思路

**反模式**：`for (const row of orders) { row.user = await User.findByPk(row.userId); }`

**改写 A**：`Order.findAll({ include: [{ model: User, attributes: ['id', 'name'] }] })`

**改写 B（超大列表）**：两步查询——先 `Order.findAll` 取出 `userId` 列表，`User.findAll({ where: { id: ids } })`，内存里 join；控制 **`ids` 去重后长度**，防止 IN 列表过长。

***

### 八、迁移示例：两阶段加 NOT NULL

```sql
-- 阶段 1：上线可读可写，允许 NULL
ALTER TABLE orders ADD COLUMN invoice_no VARCHAR(64) NULL;

-- 阶段 2：应用双写 + 回填脚本跑完
UPDATE orders SET invoice_no = CONCAT('INV-', id) WHERE invoice_no IS NULL;

-- 阶段 3：收紧约束
ALTER TABLE orders MODIFY invoice_no VARCHAR(64) NOT NULL;
```

***

### 九、小结

ORM 省力的是 CRUD，费力的是 **并发与一致性**。在 Egg 里把 **事务、乐观锁、查询形状** 收口到 Service，配合迁移纪律与列表场景的 **批量查询意识**，才能把 MySQL 从「能跑」推到「敢扩容」。
