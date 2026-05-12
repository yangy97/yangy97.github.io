---
url: /blog/2024/07/08/node-async-error-unhandled-rejection/index.md
---
\==同步错误==走栈展开；**Promise/async** 的错误走 **reject**，若没人处理会变成 **`unhandledRejection`**。**EventEmitter** 的 `error` 事件未监听可能 **直接崩进程**（取决于 `emitter` 配置）。线上 **「错误吞了」** 和 **「进程莫名其妙退出」** 多半与这几条规则有关。

***

### 一、async/await 与 try/catch

* \==`await` 的 Promise reject== 会被 **同一 async 函数里的 try/catch** 捕获。
* **并行 `Promise.all`**：其中 **任一 reject** 会带崩整个 `all`；需要 **单条容错** 时用 **`allSettled`** 或 **各自 catch**。
* **非 async 回调里的 throw**：**不会**被外层 try/catch 捕获（已是 **另一轮调用栈**）。

***

### 二、`unhandledRejection` 与 `rejectionHandled`

* **未 await 的 Promise**：若 **没有 `.catch()`**，在事件循环某刻会触发 **`unhandledRejection`**。
* Node 新版本对 **未处理拒绝** 的策略趋严，**长期依赖「默认忽略」** 不可取。

**实践**：每个 **async IIFE**、**顶层异步** 都要有 **归宿**（`catch` 或统一封装）；库代码 **返回 Promise** 时文档写清 **是否可能 reject**。

***

### 三、EventEmitter 的 `error`

许多流、TCP、HTTP 继承 **EventEmitter**。若 **`error` 未监听**，默认行为是 **打印并可能退出**（类型与版本需查文档）。

**实践**：**每个**长生命周期流 **必须** `on('error', ...)` 或 **`pipeline`** 统一处理；**不要**只 `pipe` 不处理错误。

***

### 四、错误对象与分类

* **`Error` / `TypeError`**：附带 **`message`**、**`stack`**。
* **系统错误**（Node）：常有 **`code`**（如 `ENOENT`、`ECONNRESET`），适合 **分支重试/熔断**。
* **自定义错误**：继承 `Error`，加 **`code`/`status`**，避免 **字符串比较 message**。

**传递**：在 async 链中 **显式 reject**，少用 **`throw` 字符串**。

***

### 五、与可观测性衔接

* **结构化日志**：`err.code`、`requestId`、**上下游名称**。
* **指标**：拒绝率、未处理拒绝计数、进程重启次数。
* **边界**：在 **HTTP 中间件** 统一把 **业务错误** 映射为 **HTTP 状态码**，**不要**把 **堆栈** 返回给客户端（生产环境）。

***

### 六、收束

异步错误三件套：**await 链有 catch**、**Emitter 有 error**、**Promise 无漂浮**。再配 **统一日志与告警**，排障才有抓手；否则只剩 **「偶现 500」** 和 **「进程没了」**。
