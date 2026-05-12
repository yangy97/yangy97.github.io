---
url: /blog/2025/11/16/headless-playwright-architecture-tracing-ci/index.md
---
Playwright 不只是「能点页面的脚本」：它把 ==Browser → Context → Page== 分层、内置 **自动等待**、**Trace/视频** 与 **多浏览器** 抽象。下面从 **架构、选择器策略、Tracing 排障、CI  flaky 治理** 写深一点，并带 **可直接改写的示例**。

***

### 一、Browser / Context / Page 各管什么

| 概念 | 职责 | 典型用途 |
|------|------|----------|
| ==Browser== | 进程级浏览器实例 | 启动 Chromium/Firefox/WebKit |
| **BrowserContext** | **隔离** 的会话：Cookie、Storage、权限 | 多用户并行、无痕、不同 `baseURL` |
| **Page** | 单个标签页 | `goto`、点击、断言 |

**为什么要 Context**：E2E 里「用户 A / 用户 B」并行测登录态，用 **两个 Context** 比开两个 Browser **轻得多**。同一 Context 内多 Page 则 **共享 Cookie**（同用户多 Tab 场景）。

**示例：单测文件里隔离登录态**

```typescript
import { test, expect } from '@playwright/test';

test.describe('订单流', () => {
  test.use({ storageState: 'playwright/.auth/user.json' }); // 前置脚本登录后落盘

  test('下单成功', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByRole('button', { name: '提交订单' })).toBeEnabled();
  });
});
```

`storageState` 本质是 **序列化 Cookie + LocalStorage**，复用时要清楚 **是否污染用例**（必要时每用例新开 Context）。

***

### 二、选择器：优先角色与可访问名，少用脆弱 CSS

Playwright 推荐 **`getByRole`、`getByLabel`、`getByText`**（与 Testing Library 理念一致），避免 `#app > div:nth-child(3)` 这类 **布局一变就碎** 的选择器。

**示例：表单**

```typescript
await page.getByLabel('邮箱').fill('u@example.com');
await page.getByRole('button', { name: '注册' }).click();
```

**反例**：`page.click('.btn-primary')` —— 页面换主题类名全挂。

***

### 三、自动等待 vs `waitForTimeout`：为什么禁止瞎 sleep

Playwright 对 **点击、填充** 会等 **元素可交互**（attached + visible + stable + enabled）。\
滥用 `page.waitForTimeout(3000)` 只会 **拉长 CI** 且 **仍可能 race**。

**正确姿势**：断言页面状态，例如导航后：

```typescript
await page.goto('/orders');
await expect(page.getByRole('heading', { name: '我的订单' })).toBeVisible();
```

***

### 四、Tracing：一次失败用例「可回放」

开启 Trace 后，失败时得到 **时间线 + DOM 快照 + 网络 + Console**，比截图单张 **信息量高一个数量级**。

**playwright.config.ts 片段**

```typescript
export default defineConfig({
  use: {
    trace: 'on-first-retry', // 或 retain-on-failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0,
});
```

**排障流程**：CI  artifact 下载 `trace.zip` → `npx playwright show-trace trace.zip`，看 **哪一步慢了、哪个请求 4xx**。

***

### 五、CI 稳定化 checklist

1. **固定时区与语言**：`timezoneId: 'Asia/Shanghai'`，避免「昨天/今天」边界 flaky。
2. **拦截第三方**：用 `page.route` mock 广告/统计脚本，减少 **外部网络** 抖动。
3. **资源并行**：`workers` 与机器 CPU 匹配；过度并行导致 **浏览器争用** 反而慢。
4. **测试数据**：优先 **自造数据 + teardown** 或 **隔离租户**，避免和别人抢同一条订单。

***

### 六、与 Puppeteer 的粗粒度对比（选型用）

| 维度 | Puppeteer | Playwright |
|------|-----------|------------|
| 默认浏览器 | Chromium 为主 | Chromium / Firefox / WebKit |
| 多页面/上下文 | 有 | 一等公民 + 更好 fixture |
| 断言 | 常配 Jest 手写 | `@playwright/test` 内置 expect |
| Trace | 需自建 | 内置 Trace Viewer |

**已有大量 Chrome-only 脚本** → Puppeteer 仍合理；**新 E2E 套件** 多数团队选 Playwright。

***

### 七、收束

无头 Playwright 深入点 = **Context 隔离 + 语义化选择器 + Trace 排障 + CI 去 sleep**。先把 **失败可观测** 做好，再谈用例数量翻倍。
