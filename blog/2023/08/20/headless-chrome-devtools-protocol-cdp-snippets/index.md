---
url: /blog/2023/08/20/headless-chrome-devtools-protocol-cdp-snippets/index.md
---
Puppeteer、Playwright 底层与 Chromium 对话，主要靠 ==Chrome DevTools Protocol（CDP）==：WebSocket 上 JSON-RPC，域如 **Page、Network、Runtime、Fetch**。理解 CDP 能解释 **「为什么无头能截屏」「如何 mock 网络」**，也能在 **框架不够用** 时直接 `session.send`。下面写 **模型、常见域、Node 侧示例与边界**。

***

### 一、CDP 是什么：按「域」组织的远程调试接口

每个 ==Domain== 下有 **Method** 与 **Event**。例如：

* **Page.navigate**：导航
* **Network.responseReceived**：收到响应（事件）
* **Runtime.evaluate**：在页面上下文执行 JS

无头浏览器启动时带 **`--remote-debugging-port`**（或 pipe），客户端连上后即可 **订阅事件 + 调方法**。

***

### 二、Puppeteer 里如何「下探」CDP

`page.target().createCDPSession()` 拿到 **CDPSession**，可调用任意未封装的命令。

**示例：在导航前拦截并修改请求头（概念演示）**

```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const client = await page.target().createCDPSession();

await client.send('Network.enable');
await client.send('Network.setExtraHTTPHeaders', {
  headers: { 'X-E2E-Test': '1' },
});

await page.goto('https://example.com', { waitUntil: 'networkidle2' });
await browser.close();
```

**注意**：不同 Puppeteer 版本 CDP 版本与 Chromium 绑定，**方法名** 以当前文档为准。

***

### 三、Session 隔离：为何「无痕」与「普通」行为不同

CDP 连接的 **Target**（页面、Worker 等）各自有 **session**。\
**BrowserContext** 在 Puppeteer 里对应 **独立 profile**：Cookie、Cache、权限 **不串**。\
自动化里 **混用同 Context** 容易导致 **登录态串台**——与 Playwright 那篇的 Context 论述一致。

***

### 四、无头检测：技术事实与合规边界

站点可通过 **WebDriver 特征、`navigator.webdriver`、Chrome headless 旧版指纹** 等做区分。讨论「绕过」容易触碰 **服务条款与法律风险**。

**工程上正当场景**：

* **测自己的站点**：在 **测试环境** 加 **固定 Header / 白名单 IP**，让自动化 **不必** 与反爬博弈。
* **合规爬虫**：遵守 **robots.txt**、频率限制、身份声明。

本文不展开对抗性技巧；若 E2E 在 **预发** 被 WAF 拦，应走 **平台侧放行规则**，而不是偷改浏览器指纹。

***

### 五、示例：监听响应状态辅助断言

用 CDP **Network** 域可在 **不改业务代码** 前提下，断言关键 API 返回 **200** 且 **耗时**。

```typescript
const client = await page.target().createCDPSession();
await client.send('Network.enable');

client.on('Network.responseReceived', (e) => {
  if (e.response.url.includes('/api/orders')) {
    // 可配合 Network.getResponseBody 取 body（需满足 CDP 条件）
  }
});
```

Playwright 里更推荐 **`page.waitForResponse`**，封装更稳：

```typescript
const respPromise = page.waitForResponse((r) =>
  r.url().includes('/api/orders') && r.status() === 200
);
await page.getByRole('button', { name: '刷新' }).click();
const resp = await respPromise;
```

***

### 六、小结

CDP 是 **无头浏览器的普通话**：要 **深度定制网络与调试**，用 CDP；日常 E2E **优先高阶 API**，减少与 Chromium 版本绑死的维护成本。
