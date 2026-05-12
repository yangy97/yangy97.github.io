---
url: /blog/2025/10/16/frontend-performance-budget-ci/index.md
---
性能预算 = 把 ==体验目标== 翻译成 **构建产物与流程约束**：超线要么 **解释**，要么 **拆分 PR**。CI 里 **gzip 体积** 稳定可复现；**Lighthouse 分数** 波动大，更适合 **定时任务** 或 **发布后 RUM**。本篇写：**为何卡体积、size-limit、LHCI、Monorepo、流程**。

***

### 一、为何优先「体积门禁」

| 门禁类型 | 稳定性 | 适合 PR |
|----------|--------|---------|
| 产物 gzip 大小 | 高 | 是 |
| 第三方 script 数量 | 中高 | 是 |
| Lighthouse LCP | 中 | 谨慎（阈值宽松） |
| 真实 RUM P95 | 高（业务） | 否（走监控告警） |

***

### 二、`size-limit` 配置（多 chunk）

`npm i -D size-limit @size-limit/file`

```json
{
  "size-limit": [
    {
      "name": "entry",
      "path": ["dist/assets/index-*.js", "dist/assets/index-*.css"],
      "gzip": true,
      "limit": "180 KB"
    },
    {
      "name": "vendor",
      "path": "dist/assets/vendor-*.js",
      "gzip": true,
      "limit": "400 KB"
    }
  ],
  "scripts": {
    "size": "npm run build && size-limit"
  }
}
```

\==通配== 与你们 Vite 输出文件名对齐；首版阈值 = **当前基线 + 10～15%**。

***

### 三、GitHub Actions 示例

```yaml
name: perf-budget
on: [push, pull_request]
jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run size
```

先跑两周 **`continue-on-error: true`** 收集误报，再收紧。

***

### 四、Lighthouse CI（可选）

`npm i -D @lhci/cli`

`lighthouserc.json` 示意：

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4173/", "http://localhost:4173/report"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.85 }]
      }
    }
  }
}
```

需 **起静态服务**（`vite preview`）再跑；**分数** 建议 **warn** 起步，避免阻塞。

***

### 五、依赖治理

* **Renovate / Dependabot**：升级可预期。
* **duplicate-package-checker-webpack-plugin** 或 **pnpm dedupe**：减重复 lodash。
* **禁止** `*` 版本依赖进主干（锁文件 + 评审）。

***

### 六、PR 模板（示例）

* \[ ] 本次变更对 **首包** 影响：+\_\_\_\_ KB gzip
* \[ ] 新增第三方脚本：\_\_ 个，owner：\_\_\_\_
* \[ ] 若超预算：原因 \_\_ / 回滚计划 \_\_

***

### 七、Monorepo

每个 `packages/*` 单独 `size-limit`；根 `pnpm -r run size`。避免 **子包胖、总览看不出来**。

***

### 八、收束

**体积 + 依赖 +（可选）LHCI** 组成 **三道闸**；线上体验用 **RUM** 闭环。预算要 **有人维护**，随业务重估。
