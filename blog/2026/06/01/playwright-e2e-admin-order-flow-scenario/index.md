---
url: /blog/2026/06/01/playwright-e2e-admin-order-flow-scenario/index.md
---
已有 [Playwright 架构与 Tracing](/2025/11/16/headless-playwright-architecture-tracing-ci/) 讲 Browser/Context/Trace；本篇补 **一条可拷贝的中后台业务链**：**登录态复用 → 列表筛选 → 表单提交 → 断言 Toast/路由**，并带 **Page Object 与 CI 配置**。架构细节请看前文，这里专注 **场景编排**。

***

### 一、场景与验收标准

**用户故事**：运营登录后台 → 打开订单列表 → 按状态筛选 → 新建订单 → 看到成功提示 → 列表出现新单。

**E2E 断言**（smoke 级）：

* \[ ] 未登录访问 `/orders` 跳转登录
* \[ ] 登录后列表可见表头「订单号」
* \[ ] 筛选「待支付」后 URL 或请求参数含 `status=pending`
* \[ ] 提交表单后 toast「创建成功」且列表首行 ID 匹配

单元/集成层测校验规则；E2E **只锁主路径**，见 [测试策略](/2023/05/22/frontend-testing-strategy-unit-integration-e2e/)。

***

### 二、项目结构

```text
e2e/
  playwright.config.ts
  .auth/
    user.json          # globalSetup 登录后 storageState
  pages/
    LoginPage.ts
    OrderListPage.ts
    OrderFormPage.ts
  tests/
    order-flow.spec.ts
  global-setup.ts
```

```bash
pnpm create playwright
pnpm exec playwright install chromium
```

***

### 三、globalSetup：登录一次，全用例复用

```typescript
// e2e/global-setup.ts
import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByLabel('用户名').fill(process.env.E2E_USER!);
  await page.getByLabel('密码').fill(process.env.E2E_PASS!);
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL('**/dashboard');
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
  await browser.close();
}

export default globalSetup;
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    storageState: 'e2e/.auth/user.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

`.auth/user.json` **进 .gitignore**；CI 用 secrets 跑 globalSetup。

***

### 四、Page Object

```typescript
// e2e/pages/OrderListPage.ts
import { type Page, expect } from '@playwright/test';

export class OrderListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/orders');
    await expect(this.page.getByRole('heading', { name: '订单列表' })).toBeVisible();
  }

  async filterByStatus(label: string) {
    await this.page.getByRole('combobox', { name: '订单状态' }).click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async clickCreate() {
    await this.page.getByRole('button', { name: '新建订单' }).click();
  }

  async expectFirstRowOrderId(id: string) {
    await expect(this.page.getByRole('row').nth(1)).toContainText(id);
  }
}
```

```typescript
// e2e/pages/OrderFormPage.ts
export class OrderFormPage {
  constructor(private page: Page) {}

  async fillAndSubmit(data: { sku: string; qty: number }) {
    await this.page.getByLabel('SKU').fill(data.sku);
    await this.page.getByLabel('数量').fill(String(data.qty));
    await this.page.getByRole('button', { name: '提交' }).click();
  }

  async expectSuccessToast() {
    await expect(this.page.getByRole('alert')).toContainText('创建成功');
  }
}
```

***

### 五、完整用例

```typescript
// e2e/tests/order-flow.spec.ts
import { test, expect } from '@playwright/test';
import { OrderListPage } from '../pages/OrderListPage';
import { OrderFormPage } from '../pages/OrderFormPage';

test.describe('订单主路径', () => {
  test('筛选并新建订单', async ({ page }) => {
    const list = new OrderListPage(page);
    const form = new OrderFormPage(page);

    await list.goto();
    await list.filterByStatus('待支付');

    await list.clickCreate();
    const orderId = `E2E-${Date.now()}`;
    await page.getByLabel('订单号').fill(orderId);
    await form.fillAndSubmit({ sku: 'SKU-001', qty: 2 });
    await form.expectSuccessToast();

    await list.goto();
    await list.expectFirstRowOrderId(orderId);
  });
});
```

**稳定点**：

* 用 `getByRole` / `getByLabel`，不用 `.btn-primary`（见架构文）。
* 用 `expect(...).toBeVisible()` 替代 `waitForTimeout`。
* 动态数据用 `Date.now()` 或 API 预置，避免硬编码冲突。

***

### 六、网络与 MSW 边界

E2E 默认打 **真实或 staging API**。若必须 mock：

* 用 `page.route('**/api/orders', ...)` **仅在本用例** stub，别全局 mock 导致测不到集成。
* 表格/表单 **校验逻辑** 仍应在 Vitest + MSW 层测（见 [中后台表格测试](/2026/05/21/frontend-admin-table-form-testing-msw/)）。

***

### 七、CI 与 Flaky 治理

```yaml
# .github/workflows/e2e.yml 片段
- run: pnpm exec playwright test
  env:
    E2E_BASE_URL: ${{ vars.STAGING_URL }}
    E2E_USER: ${{ secrets.E2E_USER }}
    E2E_PASS: ${{ secrets.E2E_PASS }}
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

* **重试**：`retries: process.env.CI ? 2 : 0`——只缓解 flake，根因仍要修。
* **并行**：`fullyParallel: true` + 每用例独立数据，避免抢同一订单号。
* **Trace**：失败下载 trace，用 `pnpm exec playwright show-trace` 回放（见 [Tracing 文](/2025/11/16/headless-playwright-architecture-tracing-ci/)）。

***

### 八、与 AI 辅助测试

AI 适合根据 Page Object **生成用例骨架**；你必须审：

* selector 是否 role-based
* 是否漏 `await`
* 是否 mock 过宽

模板见 [AI 辅助写测试](/2026/05/19/ai-assisted-testing-vitest-playwright/)。

***

### 九、一句话

**E2E 业务场景 = globalSetup 登录态 + Page Object + 一条 smoke 验收链 + CI trace**；测通主路径即可，别把单元测试搬进 Playwright。
