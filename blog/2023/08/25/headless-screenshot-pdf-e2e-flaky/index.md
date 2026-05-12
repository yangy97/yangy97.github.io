---
url: /blog/2023/08/25/headless-screenshot-pdf-e2e-flaky/index.md
---
截图、PDF、打印 CSS、整页滚动截屏，是无头浏览器 ==最高频的工程需求==（报表归档、合规留痕、视觉回归）。另一类痛点是 **flaky**：本地绿、CI 红。下面分 **API 差异、字体与布局坑、视觉对比策略、flaky 分类治理** 展开，并附 **示例代码**。

***

### 一、截图：viewport、全页与元素级

\==Playwright==

```typescript
await page.screenshot({ path: 'shot.png', fullPage: true });
await page.locator('.chart').screenshot({ path: 'chart.png' });
```

**要点**

* **fullPage: true** 会滚动拼接长页，**懒加载图片** 可能只截到占位 → 需先 **滚动触发加载** 或 mock 数据。
* **动画**：GIF/CSS 动画会导致 **像素抖动**。截图前可 `page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' })`（按场景）。

***

### 二、PDF：打印 CSS 与分页

`page.pdf()` 走 **打印** 渲染路径，和屏幕 **不是同一套布局**（`@media print`、分页符）。

**示例**

```typescript
await page.pdf({
  path: 'report.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
});
```

**常见坑**

* **背景色丢失**：必须 `printBackground: true`，且 CSS 里避免依赖「屏幕专用」hack。
* **中文字体**：CI 容器若缺字体，PDF 方块字 → Dockerfile 安装 **Noto CJK** 或内嵌子集字体（授权合规前提下）。

***

### 三、视觉回归：像素 diff 与「语义」回归

工具链常见：**Playwright `expect(page).toHaveScreenshot()`**、Percy、Chromatic。\
像素对比对 **字体抗锯齿、亚像素滚动** 敏感。

**缓解**

* **固定 viewport** 与 **deviceScaleFactor**。
* **截组件** 而非整页。
* **阈值**：`threshold`、`maxDiffPixels`（按产品接受度调）。

**示例**

```typescript
await expect(page).toHaveScreenshot('homepage.png', {
  maxDiffPixels: 100,
});
```

***

### 四、Flaky 分类：不是「重试两次」就完事

| 类型 | 表现 | 处理方向 |
|------|------|----------|
| **竞态** | 偶尔点按钮时 DOM 未就绪 | 用 **自动等待** + 断言可见，去掉 sleep |
| **数据** | 依赖「恰好存在」的订单 | 测试内 **创建数据** 或 **固定 seed** |
| **时间** | 午夜、夏令时、相对日期文案 | **冻结时间** `page.clock` 或 mock `Date` |
| **外部** | 第三方脚本、广告 | **route 拦截** 或 block 域名 |
| **资源** | CI 慢导致超时 | 调 **timeout** 与 **拆分用例** |

**反模式**：`retries: 5` 掩盖不稳定——**根因仍在**，只是 **更难发现**。

***

### 五、示例：冻结时间减少「相对日期」 flaky

Playwright 新 API（视版本）：

```typescript
await page.clock.install();
await page.clock.setFixedTime(new Date('2026-04-24T12:00:00'));
await page.goto('/dashboard');
await expect(page.getByText('今日')).toBeVisible();
```

（若版本无 `clock`，可用 **环境变量** 让业务代码读「当前时间」注入。）

***

### 六、收束

无头截图/PDF = **打印路径 + 字体 + 动画** 三件事先想清楚；视觉回归 = **缩小对比区域 + 合理阈值**。Flaky **先分类再修**，重试只是 **止血绷带**。
