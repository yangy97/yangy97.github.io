---
url: /blog/2026/05/25/interview-network-security-cache/index.md
---
SHEIN、富途面里 **HTTP 状态码、缓存、CORS、XSS** 出现频率高。本篇按 **面试答法** 整理，细节链到本站安全与网络文。

***

### 一、状态码（常问 subset）

| 码 | 含义 | 面试一句话 |
|----|------|------------|
| 301 | 永久重定向 | SEO 权重转移 |
| 302 | 临时重定向 | 可能改 method（历史坑） |
| 304 | 协商缓存命中 | Not Modified，用本地 |
| 307/308 | 严格重定向 | 不改 method |
| 401 | 未认证 | 跳登录 / 刷新 token |
| 403 | 无权限 | 已登录但不够权 |
| 502/504 | 网关/超时 | 后端或链路问题 |

***

### 二、强缓存 vs 协商缓存

**强缓存**：`Cache-Control: max-age` / `Expires`（前者优先）\
→ 不发请求，200 from disk/memory cache

**协商缓存**：`ETag` / `Last-Modified`\
→ 请求带 `If-None-Match` / `If-Modified-Since` → 304

前端静态资源：**文件名 hash + max-age 很长**；`index.html` **no-cache**。

见 [网络与静态资源性能](/2023/07/21/frontend-performance-network-assets/)。

***

### 三、跨域

**同源**：协议+域名+端口相同。

**CORS**：服务端 `Access-Control-Allow-Origin`；带 Cookie 要 `Credentials: true` 且 Origin 不能 `*`。

**其他**：开发 Vite proxy；生产 **BFF 同源**；JSONP（老，不推荐）。

详见 [CORS 与 Cookie](/2026/05/22/frontend-cors-credentials-cookie-guide/)。

***

### 四、简单请求 vs 预检

**简单请求**：GET/HEAD/POST + 简单头 + 简单 Content-Type。

否则 **OPTIONS 预检** → 通过后再发真实请求。

富途面常考：带 `Authorization` 的 POST → **预检**。

***

### 五、SSL/TLS

HTTPS = HTTP + TLS。\
面试说清：**证书校验身份、对称加密传数据、TLS1.2+**（小程序 iOS ATS 同理，见 uni-app 旧坑文）。

***

### 六、XSS 场景题

**题**：URL 参数回填表单有风险吗？\
有——反射型 XSS。

**预防**：输出编码、不用不可信 `v-html`、CSP、HttpOnly Cookie。

见 [XSS/CSP 深入](/2026/05/22/frontend-security-xss-csp-iframe-sandbox/)。

***

### 七、WebSocket

**常问**：项目里怎么用？

答：长连接、服务端 push；注意 **心跳、重连、鉴权**（query token 或首帧 auth）。\
Egg 实践：[WebSocket 与 Socket.io](/2026/05/13/eggjs-websocket-socketio-auth-rooms/)。

***

### 八、小结

网络题 **画请求链 + 说头字段** 比背定义强。安全题强调 **存储型/反射型区别 + 具体防御**。
