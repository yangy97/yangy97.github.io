---
url: /blog/2026/06/01/frontend-pwa-service-worker-basics/index.md
---
移动端 H5 有 [离线包](/2023/05/18/mobile-h5-offline-package-release-rollback/) 方案；标准 Web 侧对应 **PWA + Service Worker（SW）**。这篇讲 **何时值得做、缓存策略、更新与排障**，面向 Vite/Vue 中后台与 toC H5。

***

### 一、PWA 解决什么问题

| 能力 | 用户感知 | 工程代价 |
|------|----------|----------|
| **可安装** | 桌面/主屏图标，独立窗口 | manifest.json + 图标集 |
| **离线/弱网** | 壳能打开、静态资源可用 | SW 缓存策略 |
| **后台同步** | 表单断网后补传 | Background Sync（支持有限） |
| **推送** | 营销/订单通知 | Push API + 后端（iOS 近年才逐步开放） |

**不适合**：强实时交易、必须每次拉最新策略的合规页、纯内网且已有 App 离线包——**别为 KPI 硬上 PWA**。

***

### 二、最小文件集

```json
// public/manifest.webmanifest
{
  "name": "砚雪示例应用",
  "short_name": "砚雪",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1677ff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#1677ff" />
```

SW 脚本 **不能** 放在 CDN 跨域根（除非 CORS 特殊配置）；通常与站点 **同源** 注册。

***

### 三、Service Worker 生命周期

```text
register('/sw.js')
  → install（precache 静态资源）
  → waiting（若已有旧 SW）
  → activate（清理旧 cache）
  → fetch 事件拦截网络请求
```

**关键**：SW 更新是 **常驻进程** 模型——新版本 install 后默认 **等待** 直到所有 tab 关闭，才 activate。产品要有 **「发现新版本，点击刷新」** 提示（`skipWaiting` + `clients.claim()` 要谨慎，可能导致半新半旧资源）。

***

### 四、缓存策略选型

| 策略 | 行为 | 典型资源 |
|------|------|----------|
| **Cache First** | 先 cache，没有再网络 | 带 hash 的 JS/CSS/font |
| **Network First** | 先网络，失败用 cache | HTML、API JSON |
| **Stale While Revalidate** | 立刻返 cache，后台更新 | 头像、非关键 JSON |
| **Network Only** | 不缓存 | 鉴权 API、支付 |
| **Cache Only** | 仅 cache | 预缓存离线页 |

```javascript
// 简化 fetch 路由（Workbox 会封装更好）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (/\.(js|css|woff2)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request)); // 不缓存 API
  } else {
    event.respondWith(networkFirst(event.request));
  }
});
```

**和 HTTP 缓存关系**：SW 在 **浏览器 HTTP 缓存之后** 再拦一层；`Cache-Control: no-store` 的 API 仍不应进 SW cache。

***

### 五、Vite 集成（vite-plugin-pwa）

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt', // 或 autoUpdate
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/public\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'public-api' },
          },
        ],
      },
      manifest: { /* 同上 */ },
    }),
  ],
});
```

* `registerType: 'prompt'`：配合 UI 让用户确认更新（中后台推荐）。
* **base 路径**：GitHub Pages `/blog/` 部署时 manifest `start_url` 与 SW scope 要含 base（见 [Vite base 部署](/2023/04/02/vite-env-import-meta-base-deploy-path/)）。

***

### 六、与「离线包」方案对比

| | PWA / SW | App 内离线包 |
|--|----------|--------------|
| 适用 | 浏览器、可安装 H5 | 混合 App WebView |
| 更新 | 用户刷新 / prompt | 发版通道、回滚 |
| 审核 | 无应用商店 | 随 App |
| 能力 | 受浏览器限制 | 可配原生桥 |

混合 App 见 [架构方案](/2023/05/17/mobile-hybrid-app-architecture-schemes/)。

***

### 七、安全注意

* SW **同源**，脚本一旦被 XSS 注入替换，危害极大—— **CSP** 必须严（见 [XSS/CSP](/2023/05/22/frontend-security-xss-csp-iframe-sandbox/)）。
* **不要** cache 带 Cookie 的私有 API 响应到共享 cache name。
* HTTPS **强制**（localhost 开发除外）。

***

### 八、排障清单

1. Application → Service Workers：是否 activated、是否 skipWaiting 卡住。
2. Cache Storage：是否堆了旧版本 hash 文件。
3. 更新不生效：查 **多 tab**、CDN 是否缓存了 `sw.js`（应对 `sw.js` 设 `Cache-Control: no-cache`）。
4. iOS Safari：安装到主屏行为与推送能力与 Chrome 不同，要 **真机测**。
5. 体积：precache 过大拖慢 **首次 install**，只 precache 壳 + 关键 chunk。

***

### 九、一句话

PWA 的价值在 **可预期的离线壳 + 可控更新节奏**；Service Worker 是 **网络代理**，策略写错比没有 SW 更难排——先用 Workbox 默认配方，再按资源类型微调。
