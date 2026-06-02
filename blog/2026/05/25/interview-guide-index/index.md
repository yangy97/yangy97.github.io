---
url: /blog/2026/05/25/interview-guide-index/index.md
---
原先《面试》一篇堆了多家公司的 raw 题单，不好检索。本篇是 **阅读地图**：按主题拆成 5 篇 **带答法指引** 的专题；原始公司记录保留在 [面试原始记录](/2023/08/04/interview/)。

***

### 一、专题拆分（推荐顺序）

| 专题 | 覆盖 | 链接 |
|------|------|------|
| JS / CSS / 浏览器基础 | 类型、数组、原型、BFC、事件循环 | [基础八股精讲](/2026/05/25/interview-javascript-css-fundamentals/) |
| Vue / React | 响应式、生命周期、hooks、vuex/pinia | [框架高频](/2026/05/25/interview-vue-react-framework-questions/) |
| 网络 / 缓存 / 安全 | 状态码、强协商缓存、CORS、XSS | [网络与安全](/2026/05/25/interview-network-security-cache/) |
| 工程化 / 移动端 / Node | Webpack、uni-app、适配、JSBridge、Node 循环 | [工程与移动端](/2026/05/26/interview-webpack-mobile-node/) |
| 项目 / 开放题 | 性能监控、团队角色、学习方法 | [项目与软技能](/2026/05/26/interview-project-and-soft-skills/) |

***

### 二、高频考点（多厂重复）

**几乎每次必问**

* Cookie / localStorage / sessionStorage
* Vue2 vs Vue3、响应式原理
* 前端性能优化（说 **指标 + 手段 + 项目例子**）
* 移动端适配（rem/vw/safe-area）
* 跨域与缓存
* 项目深挖：你负责什么、最难的是什么

**常考开放题**

* 怎么学习、职业规划、如何融入团队

***

### 三、和本站文章的对应关系

| 面试提到的点 | 站内延伸 |
|--------------|----------|
| JSBridge / App 内 H5 | [JSBridge 实战](/2026/05/27/mobile-h5-webview-jsbridge-native-interaction/) |
| 性能优化 | [性能优化总览](/2023/07/26/frontend-performance-overview/) |
| Webpack | [构建与工程化专题](/posts/categories/?id=cce9da) |
| XSS | [前端安全 XSS/CSP](/2026/05/22/frontend-security-xss-csp-iframe-sandbox/) |
| headless | [Playwright 架构](/2025/11/16/headless-playwright-architecture-tracing-ci/) |
| RBAC / 权限 | [07-后台与RBAC](/posts/categories/) |

***

### 四、答题结构（项目题）

```text
背景（业务一句话）→ 你的职责 → 技术方案 → 权衡 → 结果（最好有数据）→ 复盘
```

避免只堆名词；**「我做了什么」** 比 「我们知道 webpack」 重要。

***

### 五、原始面经

微众 / SHEIN / CVTE / 富途 等公司 **原题列表**（未改写为答案）：见 [面试原始记录](/2023/08/04/interview/)。

***

### 六、小结

先按专题补缺口，再用原始记录 **模拟自测**。AI 时代八股仍考，但 **项目闭环 + 排查思路** 权重更高，见[《AI 背景下，程序员何去何从》](/2026/05/23/ai-era-programmer-career-outlook/)。
