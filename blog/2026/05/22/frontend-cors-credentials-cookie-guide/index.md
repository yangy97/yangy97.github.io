---
url: /blog/2026/05/22/frontend-cors-credentials-cookie-guide/index.md
---
「跨域失败」在 Network 里表现为 CORS 红字，但根因可能是 **Cookie 没带、预检失败、SameSite 不对**。本篇用 **简单模型 + 配置对照** 讲清。

***

### 一、同源 vs 跨域

同源 = **协议 + 域名 + 端口** 全同。\
`https://a.com` 请求 `https://api.a.com` → **跨域**。

***

### 二、简单请求 vs 预检

带自定义头 `Authorization`、 `Content-Type: application/json`（非简单类型）→ 浏览器先 **OPTIONS 预检**。

服务端需：

```http
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

**不能** `Allow-Origin: *` 与 `Credentials: true` 同用。

***

### 三、前端 fetch/axios

```typescript
axios.defaults.withCredentials = true;
```

跨域带 Cookie **必须** 双方配对：前端 credentials + 服务端 Allow-Credentials + 具体 Origin。

***

### 四、SameSite

| 值 | 行为 |
|----|------|
| Strict | 跨站几乎不发 Cookie |
| Lax | 顶级导航 GET 可带 |
| None | 跨站可带，**必须 Secure** |

App WebView / 子域 API 常需 `SameSite=None; Secure`。

***

### 五、开发环境 Vite 代理

```typescript
server: {
  proxy: {
    '/api': { target: 'http://localhost:7001', changeOrigin: true },
  },
},
```

浏览器视角 **同源**，无 CORS；生产仍要正确 CORS。

见[《Vite devServer 代理与 BFF 联调》](/2024/11/05/vite-server-proxy-hmr-bff-integration/)。

***

### 六、排障顺序

1. 是否跨域？
2. 是否预检？预检 404/405？
3. `withCredentials` 与 Allow-Origin 是否具体域名？
4. Cookie SameSite/Domain/Path？

***

### 七、小结

CORS = **Origin 白名单 + 预检 + 凭证配对 + SameSite**。Egg CSRF 见 Node 系列。
