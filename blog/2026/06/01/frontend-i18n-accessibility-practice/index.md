---
url: /blog/2026/06/01/frontend-i18n-accessibility-practice/index.md
---
出海产品、金融与政务项目常同时要求 **多语言** 与 **无障碍（a11y）**。本站此前缺这块专文；这篇给中后台/Vue 或 React 栈的 **可落地 checklist**，不替代 WCAG 正式审计。

***

### 一、国际化（i18n）分层

```text
文案层     locale JSON / PO
格式层     日期、数字、货币、复数
路由层     /en/xxx vs ?lang=en
服务端     Accept-Language、用户偏好持久化
```

#### 1.1 文案不要硬编码

```typescript
// vue-i18n 示例
const messages = {
  zh: { order: { title: '订单列表', count: '共 {n} 条' } },
  en: { order: { title: 'Orders', count: '{n} items' } },
};

// 复数：英文 one/other，中文常不需要 plural rules
t('order.count', { n: total }, total);
```

**键名规范**：`模块.页面.元素`，如 `billing.invoice.download`——避免 `text1`、`label2`。

#### 1.2 动态内容与占位符

* 用户输入 **不要** 拼进翻译串中间：`❌ t('hello') + name` → `✅ t('helloUser', { name })`
* HTML 片段用组件插槽或 `i18n-t`，避免 `v-html` 插翻译。
* **性别、敬语** 在部分语言需要分支，提前和产品确认，不要后期硬补。

#### 1.3 日期、数字、货币

用 **`Intl`** 或 dayjs/luxon 的 locale 插件，不要手写 `YYYY-MM-DD` 全球统一：

```typescript
new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY' }).format(1234.5);
new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date());
```

#### 1.4 路由与 SEO

| 策略 | 优点 | 注意 |
|------|------|------|
| 子路径 `/en/about` | CDN 友好、可索引 | 要 hreflang |
| 查询参数 `?lang=en` | 改动小 | SEO 弱 |
| 域名 `en.example.com` | 品牌清晰 | 证书与 CORS |

切换语言时 **保留当前路径** 或明确回首页；locale 写入 **cookie / 用户配置**，刷新不丢。

#### 1.5 工程集成要点

* **懒加载** locale 包：`import(\`./locales/${locale}.json\`)\`，首屏只加载默认语言。
* **CI**：缺失键检测脚本（对比 zh 与 en 的 key 集合）。
* **设计**：德语、法语比中文长约 30%，按钮宽度用 **min-width** 或弹性布局（见 [Flex/Grid](/2026/06/01/css-flexbox-grid-layout-practice/)）。
* **RTL**（阿拉伯语）：`dir="rtl"` + 逻辑属性 `margin-inline-start` 替代 `margin-left`。

***

### 二、无障碍（a11y）基础

目标：键盘可用、读屏可理解、对比度达标、焦点可见——受益不只残障用户，也包括 **键盘党与强光环境**。

#### 2.1 语义 HTML 优先

```html
<!-- ❌ div 假按钮 -->
<div onclick="submit()">提交</div>

<!-- ✅ -->
<button type="submit">提交</button>
```

导航用 `<nav>`，主内容 `<main>`，标题层级 **h1→h2 不跳级**。

#### 2.2 键盘与焦点

* 所有交互控件 **Tab 可达**；自定义组件补 `tabindex="0"` 与 `Enter/Space` 处理。
* **焦点陷阱**：Modal 打开时焦点进对话框，关闭回触发按钮——用组件库 `focus-trap` 或 Radix/Element Plus Dialog 默认行为。
* **`:focus-visible`**：鼠标点击不显示粗框，键盘导航显示清晰 outline，不要全局 `outline: none`。

#### 2.3 ARIA 使用原则

**第一规则**：能用原生元素就不造 ARIA。

| 场景 | 做法 |
|------|------|
| 图标按钮 | `aria-label="关闭"` 或 visually hidden 文本 |
| 加载中 | `aria-busy="true"`、`aria-live="polite"` |
| 表单错误 | `aria-invalid` + 错误文案 `id` 关联 `aria-describedby` |
| 动态 toast | `role="status"` 或 live region |

避免 **滥用 `role="button"`** 在 div 上却不处理键盘。

#### 2.4 颜色与对比度

* 正文对比度 **≥ 4.5:1**（WCAG AA）；大字号可 3:1。
* 错误态 **不要只靠红色**：加图标或文案「错误：…」。
* 暗色模式同步检查（见 [Design Token](/2026/05/24/design-token-theme-dark-mode-practice/)）。

#### 2.5 媒体与动效

* 图片：`alt` 有意义；装饰图 `alt=""`。
* 视频：字幕；自动播放默认 **muted** 且提供关闭。
* `prefers-reduced-motion`：减少 parallax 与大面积动画。

***

### 三、Vue / React 实践片段

```vue
<!-- Vue：Element Plus 等组件库大多带 a11y，仍要检查自定义 slot -->
<el-button :aria-label="t('common.close')" @click="close">
  <IconClose />
</el-button>
```

```tsx
// React：eslint-plugin-jsx-a11y 建议默认开启
<label htmlFor="email">{t('form.email')}</label>
<input id="email" aria-describedby={error ? 'email-err' : undefined} aria-invalid={!!error} />
{error && <span id="email-err" role="alert">{error}</span>}
```

**测试**：

* 自动化：`axe-core` + Playwright（见 [Playwright 架构](/2023/06/15/headless-playwright-architecture-tracing-ci/)）。
* 手工：**只用键盘** 走通下单/审批主路径；VoiceOver / NVDA 抽测首页与表单。

***

### 四、与合规、RBAC 的交叉

* 多语言 **权限文案** 仍走 RBAC 接口，前端只展示（见 [RBAC 建模](/2023/07/10/rbac-admin-user-role-permission-model/)）。
* 审计日志语言无关，存 **稳定 code** 而非展示文案。
* 隐私政策、Cookie 同意条 **必须可本地化**。

***

### 五、交付清单（可贴进 PR 模板）

* \[ ] 新增 UI 文案均进 locale 文件，无硬编码中文
* \[ ] 英（或第二语言）键齐全，CI 通过
* \[ ] 表单 label 关联、错误可读
* \[ ] 主路径键盘可操作，焦点可见
* \[ ] 图标按钮有 accessible name
* \[ ] 对比度 spot check（Light / Dark）
* \[ ] 动效尊重 `prefers-reduced-motion`

***

### 六、一句话

**i18n 是产品结构问题（键名、复数、布局留白），a11y 是默认工程质量（语义、键盘、对比度）**；两者都应在脚手架与 PR 清单里 **默认可检查**，而不是上线前突击。
