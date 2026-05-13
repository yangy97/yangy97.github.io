---
url: /blog/2025/07/13/micro-frontend-iframe-postmessage-bff/index.md
---
当 ==遗留系统完全不可改构建==、或 **合规要求强隔离**（不同安全域数据），**iframe** 仍是最稳的集成手段。代价是 **URL 同步、登录态、高度自适应、弹层遮罩** 要自己做。下面给 **可拷贝的协议与代码骨架**。

***

### 一、何时值得用纯 iframe

| 适合 | 不适合 |
|------|--------|
| 第三方页面、老系统 ==只给 URL== | 需要 **丝滑 SPA 级** 路由与动画 |
| **严格跨域**、禁止脚本级沙箱 | 同一团队 **高频协作** 的多个现代 SPA（优先考虑 qiankun 类） |

***

### 二、postMessage 协议设计（实际操作）

**定契约**：`type` 枚举、`version`、`payload`、`source`（iframe id）、`requestId`（可选，用于 RPC 风格回调）。

```ts
// shared/protocol.ts（主应用与子应用可各复制一份常量，或通过 npm 私有包共享）
export const MSG = {
  READY: 'app:ready',
  TOKEN: 'auth:token',
  ROUTE: 'nav:route',
  RESIZE: 'ui:resize',
} as const;

export type BridgeMessage = {
  v: 1;
  type: typeof MSG[keyof typeof MSG];
  payload?: unknown;
  requestId?: string;
};
```

**子应用（iframe 内）** 通知已就绪并请求 token：

```ts
window.parent.postMessage(
  { v: 1, type: 'app:ready', payload: { path: location.pathname } },
  'https://parent.example.com', // 必须显式目标源，禁止 '*'
);
```

**主应用** 监听与校验来源：

```ts
window.addEventListener('message', (ev: MessageEvent) => {
  if (ev.origin !== 'https://child.example.com') return;
  const data = ev.data as BridgeMessage;
  if (data?.v !== 1 || data.type !== 'app:ready') return;
  ev.source?.postMessage(
    { v: 1, type: 'auth:token', payload: { token: getToken() } },
    ev.origin as string,
  );
});
```

**安全**：永远 **`origin` 白名单**；业务数据能走 **BFF** 就不要在 postMessage 里传大对象。

***

### 三、高度自适应（避免双滚动条）

子应用在 **内容变化** 后测量 `document.body.scrollHeight`，通知主应用设置 iframe `height`：

```ts
function notifyHeight() {
  const h = document.documentElement.scrollHeight;
  window.parent.postMessage({ v: 1, type: 'ui:resize', payload: { height: h } }, PARENT_ORIGIN);
}
new ResizeObserver(notifyHeight).observe(document.body);
```

主应用：`iframe.style.height = payload.height + 'px'`，并设 **`overflow: hidden`** 防止外层再滚一层。

***

### 四、登录态：BFF 优先于 postMessage 传 token

**推荐**：主应用与子应用 **同站 cookie**（由 **BFF 反代** 到子域或路径），iframe 内 **直接 xhr 同域 API** 带 cookie。\
**不得已** 才用 postMessage 传 **短期 access token**（短 TTL + **仅 HTTPS**），并在子应用内存持有，**不落 localStorage**（降低 XSS 面）。

***

### 五、URL 与书签（可选增强）

* **主应用 URL 为准**：如 `/legacy/*` 对应 iframe `src` 的 query；子应用 **hash 路由** 时把 hash 同步到主应用 query。
* **history 子应用**：通过 postMessage 让主应用 **`history.replaceState`**，避免用户分享链接失效。

***

### 六、常见问题与处理

| 问题 | 原因 | 处理 |
|------|------|------|
| **收不到 `message` 或数据错** | **`origin` 未校验** 误用 `*`，或 **父子都 listen 未校验 `source`** | 生产**必须白名单**；`event.origin` 与 `event.source` 与信任列表比对 |
| **内嵌 https 子页被拦** | **混合内容**（主 https、子 http） | **子域全 https** 或**反代**到同主域路径 |
| **postMessage 传大对象卡顿** | **结构化克隆** 成本、**频繁同步** 业务树 | 只传 **id/版本号**；**状态以接口为准** |
| **高度自适应与内部滚动干架** | **iframe** 上又包一层 **overflow:auto** | 主应用**只**管 iframe **高度**；**子页内部** 自己管滚动区 |
| **BFF 已设 Cookie，子 iframe 内仍 401** | **SameSite/第三方 cookie** 策略、**跨站 iframe** 限制 | 能 **同站反代** 用 **第一方 Cookie** 最好；否则 **短期 token** + **子域** 按安全评审 |
| **安全审计不通过** | 协议里**明文敏感字段**、**`postMessage` 用 `*`** | **字段最小化**、**版本号+签名** 可选、**CSP/iframe allow** 与 **安全** 一起评审 |

***

### 七、小结

iframe 方案 **工程量在上层协议与 BFF**，不在 iframe 本身。与 **wujie** 等「强隔离」框架对比时：若 **完全不能掌控子应用脚本**，iframe 仍是底线；若能改一点构建，再评估 **wujie / qiankun** 换体验。
