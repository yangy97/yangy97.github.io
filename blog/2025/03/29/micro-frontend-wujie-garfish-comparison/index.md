---
url: /blog/2025/03/29/micro-frontend-wujie-garfish-comparison/index.md
---
国内常见微前端方案除 ==qiankun== 外，还有 **腾讯 wujie（无界）**、**字节 Garfish**、**京东 micro-app** 等；底层差异集中在 **沙箱实现、样式隔离、对子应用（**Vite 为主**、Webpack 老栈）的适配、预加载策略**。下面做 **能力向对比** 与 **选型建议**（以公开文档为准，版本迭代快，接入前请对照官方）。

> **wujie / micro-app / Garfish** 的独立详版见：《微前端工程实践：wujie（无界）主应用、子应用与 bus 通信（详版）》《micro-app 标签化接入与数据传递（详版）》《Garfish 子应用表、沙箱与插件（详版）》。

***

### 一、能力轴：怎么对比

| 维度 | 关注点 |
|------|--------|
| ==隔离== | JS / 样式 / 路由是否 **可逆**、**第三方弹层** 是否翻车 |
| **性能** | 首屏、切换子应用、**多实例内存** |
| **工程** | **子应用无改造** vs **必须导出生命周期**、**Vite** 支持 |
| **通信** | props、全局 store、**window 代理** 边界 |
| **生态** | 文档、社区插件、**长期维护** |

***

### 二、qiankun（简述定位）

* **成熟**、案例多；**single-spa** 模型清晰。
* 子应用需 **生命周期** 与 **public path** 等适配；**Vite** 需社区插件。

***

### 三、wujie（无界）：WebComponent + iframe 思路变种

公开资料强调：**webcomponent 容器** + **子应用运行在 iframe**（或类 iframe 环境）带来的 **强隔离**，主应用通过 **代理** 同步路由与 **注入**。\
**优点**：**样式与 JS 隔离** 相对省心；**缺点**：**跨 iframe 的 DOM 通信、弹层挂载点** 要按文档处理 **deactive 激活** 等。

**适合**：**强隔离**、子应用 **不愿被改太多** 时评估。

**主应用接入示意（概念代码，以 [wujie 官方文档](https://wujie-micro.github.io/doc/) 为准）**：

```ts
import WujieVue from 'wujie-vue3'; // 或 wujie-react
import { bus } from 'wujie';

// 预加载
// preloadApp({ name: 'vue2', url: '//localhost:7101/' });

// 子应用通过 bus.$on / $emit 与主应用通信，避免直接互改 window
```

子应用侧通常需按文档配置 **生命周期** 或 **插件**（如 **degrade** 降级路径）；升级小版本时重点回归 **弹层类组件**（Select/Modal 是否挂到 body）。

***

### 四、Garfish

字节开源，提供 **运行时、预加载、插件体系**；与 **集团内基建** 结合紧，对外 **文档与社区** 需自行评估。选型时重点看：**子应用接入成本**、**与现有构建链** 是否匹配。

**Garfish 主应用注册（示意）**：

```ts
import Garfish from 'garfish';

Garfish.run({
  basename: '/',
  domGetter: '#subApp',
  apps: [
    {
      name: 'react16',
      activeWhen: '/react16',
      entry: 'https://cdn.xxx.com/react16/index.html',
    },
  ],
});
```

子应用需导出 Garfish 要求的 **生命周期**（与 qiankun 类似：**provider 模式**）；具体字段名以 [Garfish 文档](https://www.garfishjs.org/) 为准。

***

### 五、micro-app（京东）

[micro-app](https://micro-zoe.github.io/micro-app/) 由京东零售开源，基于 **Web Components** 封装子应用，强调 **接入成本低**（类使用标签）、**JS 沙箱** 与 **样式隔离** 的一体化方案，并持续迭代对 **Vite** 等构建工具的支持。

| 特点 | 说明 |
|------|------|
| **使用方式** | 主应用中以自定义元素（如 `<micro-app>`）挂载子应用入口，配置 **name / url / baseroute** 等 |
| **隔离** | 内置 JS 沙箱与样式隔离思路；具体边界以官方文档与版本为准 |
| **定位** | 与 qiankun、wujie 同属「应用级微前端」选型池，适合与团队栈、部署形态一起评估 |

**适合**：希望 **标签化接入**、与 **京东系实践** 或社区案例对标时纳入 POC；注意与业务线 **构建版本、路由模式（history/hash）** 对齐。

**Vue 主应用最小标签示例**：

```html
<micro-app
  name="child"
  url="http://localhost:3000/"
  baseroute="/child"
></micro-app>
```

子应用一般为 **独立部署的 SPA**；`baseroute` 需与子路由 **base** 一致。数据传递可用 **`data` 属性** 或框架提供的 **`micro-app` 通信 API**（见官方「数据通信」章节）。

***

### 六、Module Federation（再提）

**不是**完整「微前端框架」，而是 **模块联邦**；适合 **组件级** 共享。与 **应用级** 方案 **可组合**，不要 **二选一神话**。

***

### 七、选型示例（虚构场景）

| 场景 | 倾向 |
|------|------|
| 多团队 **独立部署**、**技术栈混** | qiankun / Garfish / **micro-app** 等 **应用级** |
| **设计系统** 多项目共享 **组件** | **MF** |
| **遗留系统** 几乎不能动、只要 **嵌页面** | **iframe** 或 **wujie 类强隔离** |
| **小团队** 仅 **代码分割** 就够 | **不要用微前端** |

***

### 八、其他主流方案（索引）

| 名称 | 背景/类型 | 一句话 |
|------|-----------|--------|
| **single-spa** | 路由级编排框架 | qiankun 的底层之一，**应用注册与生命周期** 标准 |
| **icestark** | 飞冰 / 阿里 | 与 **ice.js**、布局方案结合紧，适合已用飞冰体系 |
| **EMP** | 腾讯 / MF 之上 | 在 **Module Federation** 上叠 **CLI、共享依赖治理** |
| **Piral** | 国外插件化 | **pilets** 插件模型，偏 **extensible shell** |
| **Nx Module Federation** | Monorepo | 在 **Nx** 里生成 host/remote，**图依赖 + CI** |
| **iframe + BFF** | 非框架 | **最强隔离**，用 **postMessage** 与 **同源网关** 补体验 |

更全的对比与选型流程见同系列《微前端主流方案版图与选型（2026）》。

***

### 九、各方案常见问题速览

| 方向 | 典型问题 | 处理 |
|------|----------|------|
| **qiankun** | 子应用 **白屏/资源 404** | **`base`/`entry`/`网关`** 三处同前缀；先 **子站单开** 再嵌套 |
| **wujie** | **弹层/全屏** 点不了 | 查文档 **degrade、挂载、激活**；UAT 覆盖 **富文本/Modal** |
| **micro-app** | 装了却不加载 | **最早** `start()`，**`name` 唯一**，核对 **`url` 可访问** 与 CORS |
| **Garfish** | **bridge** 和 React/Vue 大版本不搭 | 用 **官方模板** 锁 **@garfish/bridge-**\* 与主栈 |
| **MF** | **双份 React、Invalid hook call** | **`shared: { singleton: true }`** 与 **依赖版本** 在 lockfile 层对齐 |
| **iframe** | **postMessage 无响应、串数据** | **`origin` 白名单**；**协议/字段 `version` 可演进**；敏感数据走 **BFF** |
| **通用** | **登出/登录态在子站不对** | **Cookie 域、SameSite、BFF 收口** 一次评审，不要各子应用各写一套 |

***

### 十、小结

没有 **银弹**：先 **画边界（路由/发布/数据）**，再选 **隔离强度与工程改造量**。**POC** 用真实子应用 **跑通挂载/卸载/登录态** 再定案。
