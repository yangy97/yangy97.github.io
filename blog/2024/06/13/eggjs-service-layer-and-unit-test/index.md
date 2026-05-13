---
url: /blog/2024/06/13/eggjs-service-layer-and-unit-test/index.md
---
\==Service== 承载 **领域逻辑**：被 **Controller**、**其他 Service**、**定时任务** 调用。用好 `ctx.service`，项目才不会变成 **「胖 controller + 到处 import DB」**。本篇用 **可运行的类结构** 说明 **互调、事务边界、单测**。

***

### 一、Service 类长什么样

```js
const Service = require('egg').Service;

class UserService extends Service {
  async findById(id) {
    const { ctx } = this;
    // 这里接 ORM、HTTP、缓存等
    return { id, name: 'demo' };
  }

  async create(payload) {
    const { ctx } = this;
    // 校验、去重、写库
    return 1001;
  }
}

module.exports = UserService;
```

\==调用==：`await ctx.service.user.findById('1')`（**文件名** `user.js` → **`user`**）。**不要** 在 Service 里设置 **`ctx.status`**——那是 HTTP 层，留给 Controller。

***

### 二、Service 互调

```js
class OrderService extends Service {
  async createWithUser(orderPayload, userPayload) {
    const { ctx } = this;
    const userId = await ctx.service.user.create(userPayload);
    return await this._createOrder({ ...orderPayload, userId });
  }

  async _createOrder(data) {
    // 私有方法用下划线约定即可
    return 2002;
  }
}
```

**原则**：**循环依赖**（A 调 B、B 调 A）出现时，抽 **第三 Service** 或 **领域函数模块**，否则初始化顺序与单测 mock 都会痛。

***

### 三、事务放哪

| 场景 | 做法 |
|------|------|
| **同一请求内多表写入** | **一个** Service 方法里 **开启事务 → 多步 → 提交/回滚**（具体 API 视 ORM 插件） |
| **跨服务跨请求** | **消息队列、Outbox、补偿**；不要指望 Service「 magically 分布式事务」 |

**反例**：在 controller 里开事务、再调两个 service——**事务边界泄漏**，复用接口时容易 **半提交**。

***

### 四、Controller vs Service 边界（再强调）

| 放 Controller | 放 Service |
|-----------------|------------|
| **HTTP 状态码**、分页参数从 query 读取 | **业务规则**、**领域计算** |
| **把 Service 错误映射** 成 404/409 | **与存储/下游交互** |

***

### 五、单测怎么落地（egg-mock）

思路：**起应用** → **mockContext()** → **调 `ctx.service.xxx`** → **断言返回值 / 抛错**。

```js
const { app } = require('egg-mock/bootstrap');

describe('test/service/user.test.js', () => {
  it('findById', async () => {
    const ctx = app.mockContext();
    const user = await ctx.service.user.findById('1');
    assert(user.id);
  });
});
```

**实践**：对 **外部 HTTP** 用 **mock 掉 `ctx.curl`** 或 **依赖注入封装**；对 **DB** 用 **测试库** 或 **事务回滚夹具**。不要把「集成测」全叫单元测，否则又慢又脆。

***

### 六、反模式清单

1. **Service 里直接读 `ctx.request`** 做一堆 HTTP 细节——应 **由 controller 收参** 再传 **纯数据**。
2. **同一逻辑复制** 到多个 controller——应 **下沉 service**。
3. **在 service 里缓存到全局变量**——多 worker 下 **不一致**，用 Redis。

***

### 七、小结

Service = **可复用的业务单元**；**事务与下游调用** 优先在这里收口。配合 **薄 controller**，项目规模上去后仍能 **单测 + 重构**。
