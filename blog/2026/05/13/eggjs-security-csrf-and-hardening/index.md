---
url: /blog/2026/05/13/eggjs-security-csrf-and-hardening/index.md
---
`egg-security` 集成了 helmet 一类 HTTP 头、CSRF、safeRedirect 等能力。**管理后台 + 同源 SPA** 与 **开放 API + 移动客户端** 对 CSRF 的需求截然不同；本篇按场景拆解 **什么时候该关、关了用什么补偿**，避免「复制禁用 csrf 的祖传配置」。

***

### 一、CSRF 在 Egg 里防护的是什么

典型：**浏览器携带会话 Cookie** 时，恶意站点诱导用户发起 **状态变更请求**。Egg 通过 **token / referer 白名单**（具体策略以版本文档为准）校验「请求是否来自可信前端」。

纯 **JWT Bearer（Authorization 头）**、且 **不依赖 Cookie 会话** 的 API，往往 **不需要 CSRF**——但要确认没有「双轨」：例如 JWT + refresh cookie 混用又关掉校验。

***

### 二、Vite 代理同域开发 vs 生产分开域

* **开发**：浏览器打到 `localhost:5173`，API 经代理到 Egg，同源 Cookie 行为接近生产同源部署。
* **生产前后端分域**：Cookie 要 **`SameSite=None; Secure`** 才可能跨站携带，同时 CSRF 策略要与 **网关 CORS**、**凭证模式**一致——这块是事故高发区，建议画一张 **Cookie + CORS + CSRF** 矩阵评审。

***

### 三、headers 加固清单（与业务并行）

除 CSRF 外， routinely 检查：

* **HSTS**（全站 HTTPS 后）
* **`X-Content-Type-Options: nosniff`**
* **`X-Frame-Options` / CSP frame-ancestors**（管理后台是否允许嵌 iframe）
* **`Referrer-Policy`**（避免敏感 query 泄露）

Egg 可通过 security 配置批量开启；**CSP** 若过严会破坏内嵌报表，需要 **nonce/hash** 精细化策略而非一刀切关掉。

***

### 四、safeRedirect 与开放重定向

后台常见「登录后跳 `redirect` query」。务必：

* **白名单域名**或 **只允许相对路径**。
* 日志记录 **非法 redirect 尝试**（疑似钓鱼）。

***

### 五、示例：`config` 中拆分环境与路由（节选）

```js
// config/config.default.js —— 结构示意，字段名以 egg-security 文档为准
exports.security = {
  csrf: {
    enable: true,
    ignoreJSON: false,
    // 忽略纯 JSON API（若前端从不带 Cookie，可评估关闭 CSRF；混用时严禁盲抄）
  },
  domainWhiteList: [],
  ssrf: { ipBlackList: ['10.0.0.0/8'] },
};
```

```js
// config/config.local.js —— 本地联调可放宽，但不要合并进生产镜像
exports.security = {
  csrf: { enable: false },
};
```

**实践**：用 **`process.env.EGG_SERVER_ENV`** 或自定义 flag 区分「纯移动端 API 集群」与「浏览器 BFF 集群」，两类进程的 `security` **不应共用同一文件**——否则要么误伤 App，要么门户裸奔。

***

### 六、Cookie / CORS / CSRF 对照示例（文字推演）

典型浏览器场景：**前端 `https://admin.example.com`**，API **`https://api.example.com`**。

1. 前端 `fetch(..., { credentials: 'include' })` 携带 Cookie。
2. CORS 需 **`Access-Control-Allow-Credentials: true`** 且 **`Allow-Origin` 不可为 `*`**，必须是具体源。
3. Cookie 需 **`SameSite=None; Secure`** 才可能跨主域发送（仍受浏览器策略演进影响）。
4. 此时 CSRF **必须开启** 或使用 **双重 Cookie + custom header** 等等价机制。

若改为 **`Authorization: Bearer`** 且不发送 Cookie，CSRF 威胁面下降，但仍需防 **XSS 盗 token**——转义输出与 CSP 仍是主线。

***

### 七、小结

安全插件不是「开了就完事」，而是 **和你的会话模型绑定**。先固定：**会话放 Cookie 还是纯 Header**、**是否跨域**、**是否有第三方嵌入**，再决定 CSRF 与其他头的组合；否则会在「开发能登、生产偶发 403」里来回拧配置。
