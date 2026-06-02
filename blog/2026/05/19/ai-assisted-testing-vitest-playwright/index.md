---
url: /blog/2026/05/19/ai-assisted-testing-vitest-playwright/index.md
---
AI 写测试 **快但不准**——边界条件、异步时序、mock（测试替身，隔离外部依赖）范围常错。正确姿势是：**人定验收清单，AI 出草稿，CI（Continuous Integration，持续集成）裁决**。本篇给 **单测 / 集成 / E2E** 三类提示模板与审查要点。

***

### 一、三层别混

| 层 | 工具 | AI 适合生成 |
|----|------|-------------|
| 单元 | Vitest（Vite 原生单元测试框架） | 纯函数、util、store action |
| 集成 | Vitest + MSW（Mock Service Worker，拦截 HTTP 的测试 mock 库） | API 层、composable |
| E2E | Playwright（浏览器端到端自动化测试） | 关键路径 smoke（需人工审 selector） |

不要叫 AI 「写一个测一切的文件」。

***

### 二、Vitest 提示模板

```text
目标：为 src/utils/formatMoney.ts 写 Vitest 单测
范围：只新建 tests/formatMoney.test.ts
用例必须包含：0、负数、NaN、超大数、非数字字符串
禁止：改 src/ 下实现，除非测试暴露明确 bug 并说明
验收：pnpm test formatMoney 全绿
```

**审查清单**

* \[ ] 是否 **假阳性**（没 assert 行为）
* \[ ] mock 是否 **过宽**（mock 了整个 axios（HTTP 客户端库））
* \[ ] 异步是否 `await` / `flushPromises`（等待微任务队列清空）

***

### 三、MSW + 组件

```text
为 OrderList.vue 写测试：MSW mock GET /api/orders
覆盖：空列表、loading、错误 toast、分页下一页
使用 @vue/test-utils，不要 **snapshot**（快照测试，比对整段渲染输出）整页
```

AI 常错：**没 reset handlers** → 加 `afterEach(() => server.resetHandlers())`。

***

### 四、Playwright 提示

```text
写 e2e/login.spec.ts：登录成功进入 /dashboard
用 data-testid，不要脆弱 CSS
不要 hardcode 真实密码，用 process.env.E2E_USER
```

**必须人审**：**selector**（定位器，如 `data-testid`）是否稳定、是否测了 **关键断言** 而非只 `toHaveURL`。

***

### 五、AI 在 CI 里的位置

```yaml
- run: pnpm test
- run: pnpm exec playwright test --grep @smoke
```

可选 job：`claude -p "fix failing tests from attached log"` **仅在测试 job 失败后** 触发，且 PR 需人 merge。

***

### 六、反模式

* 让 AI **删失败测试** 换绿
* 无断言的 `expect(true).toBe(true)`
* E2E 测 **第三方** 不可控页面
* 把 AI 生成的 mock 当 **API 契约**

***

### 七、小结

AI 是 **测试草稿机**；**测什么、测多深** 是人定的。细节见[《Vitest + Vue Test Utils 从 0 到 1》](/2026/05/21/vitest-vue-test-utils-zero-to-one/)[《测试策略：单测、集成与 E2E》](/2026/05/22/frontend-testing-strategy-unit-integration-e2e/)。
