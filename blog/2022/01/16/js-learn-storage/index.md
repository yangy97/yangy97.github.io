---
url: /blog/2022/01/16/js-learn-storage/index.md
---
浏览器存储是前端面试与 **鉴权方案** 的常客。本篇在红宝书笔记基础上，补 **Cookie 属性链、Storage 边界、安全默认值**，并与 [Token 存储](/2023/05/22/frontend-auth-token-storage-refresh-xss/) 文衔接。

***

### 一、Cookie

> 单个 Cookie **约 4KB**（4096 字节量级）；每个域下 **数量也有限**（常见 50~180，因浏览器而异）。

#### 1.1 特点

1. **不区分大小写**：`mycookie` 与 `MYCookie` 视为同名。
2. **值须 URL 编码**：含中文、空格时用 `encodeURIComponent`。
3. **可设过期**：会话 cookie（关浏览器失效）或 `Expires` / `Max-Age`。

```http
Set-Cookie: session=abc; Max-Age=3600; Path=/; Domain=.example.com; Secure; HttpOnly; SameSite=Lax
```

#### 1.2 关键属性（工程必记）

| 属性 | 作用 |
|------|------|
| **HttpOnly** | JS 无法 `document.cookie` 读取——防 XSS 偷 session |
| **Secure** | 仅 HTTPS 发送 |
| **SameSite** | `Strict` / `Lax` / `None`——防 CSRF；`None` 须配 `Secure` |
| **Path / Domain** | 控制哪些 URL 会带上 cookie |

**鉴权 session 建议**：`HttpOnly + Secure + SameSite=Lax`（跨站 POST 登录场景再评估）。

#### 1.3 前端读写

```javascript
// 读：document.cookie 是一次性字符串，需自己 parse
document.cookie = `pref=${encodeURIComponent('dark')}; Max-Age=86400; Path=/`;

// 删：设过期时间为过去
document.cookie = 'pref=; Max-Age=0; Path=/';
```

复杂场景用库（`js-cookie`）或 **尽量不用 cookie 存前端状态**，只留给服务端 session。

***

### 二、Web Storage API

```javascript
localStorage.setItem('key', JSON.stringify(value));
const raw = localStorage.getItem('key');
const value = raw ? JSON.parse(raw) : null;
localStorage.removeItem('key');
localStorage.clear(); // 慎用：清整个源
```

| 方法 | 说明 |
|------|------|
| `getItem(name)` | 取字符串值 |
| `setItem(name, value)` | 存字符串（对象先 `JSON.stringify`） |
| `removeItem(name)` | 删除 |
| `key(index)` | 按序取下标名 |
| `clear()` | 清空（Firefox 对 sessionStorage 行为曾不一致，以现行为准） |

也可用属性语法：`sessionStorage.name`（与 `getItem('name')` 等价）。

***

### 三、sessionStorage vs localStorage

| | sessionStorage | localStorage |
|--|----------------|--------------|
| 生命周期 | **标签页/窗口** 关闭即清 | 持久，除非 JS 删或用户清站点数据 |
| 作用域 | 同源 **同标签** | 同源 **所有标签** 共享 |
| 容量 | 约 **5MB/源**（因浏览器而异） | 同左 |

**同源**：相同 **协议 + 域名 + 端口**；子域 **不** 共享（`a.example.com` ≠ `b.example.com`）。

```javascript
// 典型：表单草稿只在本 tab
sessionStorage.setItem('draft:order', JSON.stringify(form));

// 典型：主题/语言偏好
localStorage.setItem('theme', 'dark');
```

***

### 四、IndexedDB（补充）

红宝书后 Storage 家族还有 **IndexedDB**——大容量结构化存储（离线、附件缓存）。API 异步、偏 verbose，常用 **Dexie.js** 封装。PWA 离线见 [Service Worker 文](/2026/06/01/frontend-pwa-service-worker-basics/)。

***

### 五、安全与选型

| 存什么 | 推荐 | 避免 |
|--------|------|------|
| 登录 session | HttpOnly Cookie（服务端 Set-Cookie） | localStorage 存 JWT（XSS 可读） |
| 前端偏好 | localStorage | cookie 浪费带宽 |
| 敏感 PII | **不存前端** 或加密+短 TTL | 明文 localStorage |
| 多 tab 同步登录态 | Cookie 或 `storage` 事件广播 | 各 tab 各存各的 token |

跨域与凭证：[CORS 与 Cookie](/2023/05/22/frontend-cors-credentials-cookie-guide/)。

***

### 六、一句话

**Cookie 走网络、受属性约束，适合服务端 session；Storage 大但 JS 可读，只放非敏感偏好；鉴权默认 HttpOnly Cookie，别图省事把 JWT 扔 localStorage。**
