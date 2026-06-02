---
url: /blog/2026/05/18/mobile-h5-app-login-session-cookie-itp/index.md
---
App 内 WebView 打开 H5 时，**登录态怎么同步** 是第一天就要定的事。Cookie 共享、Header 注入、Ticket 换 Session 三种模式各有坑——尤其 **iOS ITP** 会让「看起来对的 Cookie 方案」 silently 失效。

***

### 一、三种模式对比

| 模式 | 做法 | 优点 | 风险 |
|------|------|------|------|
| **Cookie 共享** | WebView 与 Native 同域 Cookie | H5 无感 | ITP、第三方 Cookie 限制 |
| **Header 注入** | Native 代发请求或 JSBridge 带 token | 可控 | token 泄露面 |
| **Ticket 换 Session** | H5 拿短期 ticket 调 BFF 换 HttpOnly Cookie | **推荐** | 多一次跳转 |

\==推荐==：**Ticket 换 Session + HttpOnly Cookie**；H5 不长期持有 refresh token。

***

### 二、Ticket 换 Session 时序

```text
1. 用户 App 已登录（Native 持 refresh）
2. Native 打开 WebView： https://m.example.com/entry?ticket=ONE_TIME_xxx
3. H5 entry 页 POST /auth/exchange { ticket }
4. BFF Set-Cookie: session=...; HttpOnly; Secure; SameSite=None
5. 302 到业务页（URL 去掉 ticket）
6. 后续 H5 请求自动带 Cookie
```

**ticket 特性**：一次性、60s 过期、绑定 openid/userId。

***

### 三、BFF 示例（Set-Cookie）

```javascript
// POST /auth/exchange
async function exchange(ctx) {
  const { ticket } = ctx.request.body;
  const userId = await redis.getdel(`ticket:${ticket}`);
  if (!userId) ctx.throw(401, 'invalid ticket');

  const sessionId = await createSession(userId);
  ctx.set('Set-Cookie', [
    `sid=${sessionId}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=86400`,
  ]);
  ctx.body = { ok: true };
}
```

`SameSite=None` **必须** 配 `Secure`；WebView 加载 HTTPS 页面。

***

### 四、iOS ITP 要点

* **跨站 Cookie** 在 WebView 里受限；尽量 **H5 与 API 同站**（如 `m.example.com` + `m.example.com/api`）
* 避免 iframe 嵌第三方登录
* 若 Cookie 仍丢失：改 **首屏同域 fetch + credentials: 'include'** 验证，不要假设 `document.cookie` 可见（HttpOnly 本就不该可见）

***

### 五、Android 差异

* CookieManager 与 WebView 实例要 **同一套**
* 清除缓存时 Cookie 可能被清——Native 侧监听登录态变化，必要时 **重新发 ticket**

***

### 六、与 JSBridge 配合

Native 登录成功后：

```javascript
Bridge.openWebView({
  url: `https://m.example.com/entry?ticket=${encodeURIComponent(ticket)}`,
});
```

H5 **不要** 把 ticket 存 localStorage；换完 session 立即 `history.replaceState` 清 URL 参数。

***

### 七、小结

App 内 H5 登录优先 **短期 ticket + HttpOnly session**；少把长期 token 暴露给 JavaScript。Bridge 协议见[《JSBridge 原理与实战》](/2026/05/27/mobile-h5-webview-jsbridge-native-interaction/)；架构选型见[《混合 App 架构》](/2026/05/17/mobile-hybrid-app-architecture-schemes/)。
