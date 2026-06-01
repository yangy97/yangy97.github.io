---
url: /blog/2026/05/22/frontend-testing-strategy-unit-integration-e2e/index.md
---
测试不是越多越好，而是 **在对的层花对的成本**。本篇给 **测试金字塔（前端版）**、各层职责、与现有 Playwright/Vitest 文的衔接。

***

### 一、金字塔

```text
        ┌ E2E ┐          少：登录、下单、核心审批
       ┌─集成─┐         中：页面 + MSW API
      ┌──单测──┐        多：util、store、composable
```

***

### 二、各层定义

| 层 | 测什么 | 工具 | 速度 |
|----|--------|------|------|
| 单测 | 纯函数、Pinia action、composable | Vitest | 毫秒 |
| 集成 | 组件 + mock API | Vitest + MSW | 秒级 |
| E2E | 真浏览器、真环境 | Playwright | 分钟 |

***

### 三、选型原则

* **bug 贵在哪层**，就在哪层补测试
* flaky E2E → 先下沉到 MSW 集成
* **性能预算 CI** 与 smoke E2E 并行，不互相替代

***

### 四、PR 闸口建议

```text
PR 必过：lint + typecheck + unit（Vitest）
 nightly：E2E @smoke
 发版前：核心 E2E 全量 + 性能预算
```

***

### 五、覆盖率

* 不追求 100%；**核心域 80%+** 更有性价比
* 覆盖 **分支** 而非行数刷绿

***

### 六、与 AI 协作

AI 生成单测草稿 → 人删假测试 → CI 绿才 merge。见[《AI 辅助写测试》](/2026/05/19/ai-assisted-testing-vitest-playwright/)。

***

### 七、延伸阅读

* [《Vitest + Vue Test Utils 从 0 到 1》](/2026/05/21/vitest-vue-test-utils-zero-to-one/)
* [《中后台表格与表单测试》](/2026/05/21/frontend-admin-table-form-testing-msw/)
* [《Headless Playwright 架构与 CI》](/2025/11/16/headless-playwright-architecture-tracing-ci/)
* [《Playwright E2E：登录到下单全链路》](/2026/06/01/playwright-e2e-admin-order-flow-scenario/)
