---
url: /blog/2025/01/08/micro-frontend-theory-boundaries-routing/index.md
---
微前端不是「把一个大 SPA 拆成多个仓库」这么简单，而是 ==在浏览器里组合多个独立交付的前端应用==，同时处理 **路由、样式、JS 全局污染、版本共存、发布节奏**。下面从 **何时值得做、拆分维度、路由策略、应用间通信** 写理论层，并给 **决策表**。

***

### 一、为什么需要：组织与技术的交汇

| 驱动 | 说明 |
|------|------|
| ==团队规模== | 多团队 **并行发版**，不想共用一个巨型仓库流水线 |
| **技术异构** | 老系统 **Vue2**、新模块 **React18**，短期无法统一栈 |
| **增量迁移** | **绞杀者模式**：一块块替换遗留页面 |

**反模式**：团队 **<2 个前端**、发布 **周更同步** 仍上微前端 → **复杂度 > 收益**。

***

### 二、拆分维度：按路由 vs 按业务域

| 方式 | 优点 | 代价 |
|------|------|------|
| **子路径** `/app-a/*` | 与网关路由一致，SEO/书签友好 | 需统一 **basename** |
| **子域名** `a.xxx.com` | 天然 **cookie 域** 隔离 | **跨域**、登录态同步麻烦 |
| **同一页多挂载点** | 细粒度嵌入 | **协调布局**、**z-index** 战争 |

***

### 三、路由：主应用与子应用谁「拥有」URL

**方案 A：主应用统一路由（推荐常见）**

* 主应用 **Vue Router / React Router** 占顶层；子应用 **只认自己的 basename**。
* 子应用 **内部路由变化** 可 **同步到主应用 URL**（`history.pushState` 或 **框架封装**）。

**方案 B：iframe**

* **URL 不同步** 除非 postMessage 同步；**SEO/分享** 差，但 **隔离最强**。

***

### 四、通信：避免「全局 EventBus 地狱」

| 模式 | 适用 |
|------|------|
| **CustomEvent / 主应用 bus** | 低频、松耦合 |
| **Props 下发** | 主 → 子 **配置、主题、权限** |
| **共享全局 store（慎）** | 强耦合，**版本升级** 易炸 |
| **Backend For Frontend** | 数据 **以服务端为真**，前端只展示 |

**原则**：**能 REST/GraphQL 解决的，别用前端总线传业务状态**。

***

### 五、样式隔离：BEM / CSS Modules / Shadow DOM

* **命名约定**：团队自律 **BEM**，成本低。
* **CSS Modules / scoped**：构建期隔离，**子应用独立构建** 时天然分开。
* **Shadow DOM**：**强隔离**，但 **第三方组件**（如弹层挂 body）常 **穿透** 出问题。

***

### 六、资源与全局对象：`window`、单例库

多个子应用若 **各自打包一份 React**，可能 **hooks 报错**（**Invalid hook call**）。**策略**：**主应用 externals + 子应用 UMD** 或 **统一依赖提升**（见 Module Federation / 构建约定）。

***

### 七、实际操作：网关与子路径（Nginx 示意）

主应用与子应用若 **不同源**，需处理 **CORS** 与 **静态资源路径**。常见做法是 **同域反代**：浏览器只看见 `https://portal.example.com`，由网关把 `/app-a/` 转到子应用静态站或 Node BFF。

```nginx
# 仅示意：portal 主应用；/vue-app/ 反代到子应用构建产物或 dev server
location /vue-app/ {
  proxy_pass http://127.0.0.1:8081/vue-app/;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

子应用构建时 **`publicPath` / `base`** 必须带 **`/vue-app/`** 前缀，否则 **JS/CSS 会从根路径加载 404**。

***

### 八、实际操作：主应用向子应用下发配置（CustomEvent）

低频场景可用 **DOM 容器 data 属性 + 事件**，避免到处挂全局变量：

```html
<div id="subapp" data-api-base="https://api.example.com" data-locale="zh-CN"></div>
```

```ts
// 子应用 mount 后读取
const el = document.getElementById('subapp');
const apiBase = el?.dataset.apiBase;
window.dispatchEvent(new CustomEvent('subapp:ready', { detail: { name: 'order' } }));
```

主应用监听 `subapp:ready` 即可做 **埋点、菜单高亮** 等，比互相改 `window.__FOO__` 更可维护。

***

### 九、实际操作：拆仓库时的最小「契约」清单

在写第一行微前端代码前，建议团队对齐一张表（可放进 RFC）：

| 契约项 | 示例约定 |
|--------|----------|
| URL 前缀 | `/billing/*` 归属账单子应用 |
| 鉴权 | 主应用下发 token；子应用只读 **HttpOnly Cookie** 或 **Authorization 头** |
| 埋点 | 统一 `traceId`，由主应用注入 |
| 设计 Token | CSS 变量名前缀或主题对象 shape |
| 错误边界 | 子应用白屏时 **主应用兜底 UI** + **上报子应用 name/version** |

***

### 十、常见问题与处理（定方案阶段）

| 问题 | 处理思路 |
|------|----------|
| 小团队为「炫技」上微前端，**发布仍周更、单仓** | 先 **monorepo + 路由懒加载**；等 **多团队并行发版** 再评 |
| 子域名一箩筐，**Cookie/登录态** 对不齐 | 收敛到 **同站 + BFF** 发会话；或 **OAuth 中心化**，避免各子应用自造鉴权 |
| 全局 **`window` 上挂一堆业务变量** | 收口到 **BFF/接口**；前端只传 **id + 必要 token**，避免「谁都能改 `window`」 |
| 网关 **`/a/*` 反代** 了，**静态资源 404** | 子应用 **base/publicPath 与 Nginx 前缀** 一致；先 **单独打开子站** 再嵌入 |
| 样式「偶发」串台 | 定 **设计 Token（CSS 变量名）** + 沙箱/隔离方案二选一，别只靠口头 **BEM** |

***

### 十一、收束

微前端理论层 = **拆分是否值得 + 路由归谁 + 通信与全局单例策略**；落地时还要补上 **网关路径、publicPath、团队契约**。**主流方案索引** 见《微前端主流方案版图与选型（2026）》；实操系列见 **qiankun**、**single-spa**、**Module Federation**、**iframe + postMessage** 各篇。
