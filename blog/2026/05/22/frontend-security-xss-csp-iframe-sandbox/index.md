---
url: /blog/2026/05/22/frontend-security-xss-csp-iframe-sandbox/index.md
---
**XSS**（Cross-Site Scripting，跨站脚本注入） 仍是前端 **最常见安全事故**。**CSP**（Content-Security-Policy，内容安全策略）、输出编码、**iframe sandbox**（沙箱隔离子文档） 不是「运维配置」，而是 **和模板、富文本、微前端** 绑在一起的工程决策。

***

### 一、XSS 类型

| 类型 | 来源 | 防御 |
|------|------|------|
| 存储型（持久化恶意脚本） | 后端存的用户内容 | 出库编码 + CSP |
| 反射型 | URL 参数 | 不 `v-html` 插 URL |
| DOM 型 | 前端拼 HTML | 禁止 innerHTML 插不可信串 |

Vue 默认 **转义文本插值**；危险在 `v-html`、富文本编辑器、`dangerouslySetInnerHTML`（React）。

***

### 二、输出编码

```vue
<!-- 安全：文本 -->
<div>{{ user.name }}</div>

<!-- 危险：不可信 HTML -->
<div v-html="userBio"></div>
```

富文本：**DOMPurify** 白名单消毒后再 `v-html`。

***

### 三、CSP 示例

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data:;
  frame-ancestors 'self';
  base-uri 'self';
```

**注意**：`'unsafe-inline'` 削弱 script 防护；逐步改 **nonce/hash**。微前端多脚本源时要 **统一 CSP 策略**（见 iframe 微前端文）。

***

### 四、iframe sandbox

```html
<iframe
  src="https://child.example.com"
  sandbox="allow-scripts allow-same-origin"
></iframe>
```

* 不加 `allow-top-navigation` 防 **钓鱼跳转**
* 不可信第三方：**尽量 sandbox 全开拒绝，只放必要权限**

***

### 五、微前端注意

子应用脚本注入、**全局变量污染**、postMessage **origin 校验**——见[《iframe + postMessage + BFF》](/2025/07/13/micro-frontend-iframe-postmessage-bff/)。

***

### 六、checklist

* \[ ] 无不可信 `v-html`
* \[ ] CSP 上报 `report-uri`
* \[ ] Cookie `HttpOnly`（XSS 偷不到 session）
* \[ ] 依赖 `npm audit` + 供应链

***

### 七、小结

前端安全 = **默认转义 + 富文本消毒 + CSP + iframe 最小权限**。鉴权见下一篇。
