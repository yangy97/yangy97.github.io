---
url: /blog/2026/05/22/frontend-auth-token-storage-refresh-xss/index.md
---
**SPA**（Single Page Application，单页应用） 鉴权核心矛盾：**JavaScript 能读到的 token 就能被 XSS 偷走**。本篇对比 **localStorage**（持久键值）/ **sessionStorage**（会话键值）/ **Cookie**（可 HttpOnly）/ **内存**（刷新丢失），并给 **双 token 刷新** 流程。

***

### 一、存储对比

| 方式 | XSS | CSRF | 刷新页面 |
|------|-----|------|----------|
| localStorage | 高危 | 低 | 仍在 |
| 内存变量 | 中（XSS 当期可窃） | 低 | 丢失 |
| HttpOnly Cookie | **JS 不可读** | 需 SameSite/CSRF token | 可持久 |

\==推荐==：**access**（短效访问令牌） 短期内存或 Cookie；**refresh**（长效刷新令牌） HttpOnly + 服务端轮转。

***

### 二、双 token 刷新（BFF 友好）

```text
登录 → Set-Cookie refresh (HttpOnly)
     → body 返回 access (短，如 15min)

请求 → Authorization: Bearer access
401   → POST /auth/refresh（Cookie 自动带 refresh）
     → 新 access
```

前端 **axios 拦截器** 401 队列单飞（同小程序 401 队列思路）。

***

### 三、Pinia 里放什么

* 放 **user profile、permissions**
* **不要** 长期把 refresh token 放 localStorage
* access 若放内存，刷新页需 **silent refresh** 或跳登录

***

### 四、JWT 注意

* 前端 **不解密验签** 当权威；权限以 **服务端 + 接口** 为准
* JWT 过大放 header 有性能问题；敏感声明别放 payload

与《RBAC + JWT + Redis》后台文配合阅读。

***

### 五、App WebView

见[《App 内 H5 登录态》](/2026/05/18/mobile-h5-app-login-session-cookie-itp/)；**ticket 换 session** 优于把 refresh 交给 H5。

***

### 六、小结

防偷会话 = **HttpOnly + 短 access + 刷新单飞 + 治 XSS**。CORS/Cookie 见下一篇。
