---
url: /blog/2025/04/24/micro-frontend-mainstream-landscape-and-choice-2026/index.md
---
**微前端**（在浏览器里组合多个独立交付的前端应用，各自可独立开发部署）不是单一框架，而是一组 **运行时编排 + 构建共享** 的模式。常见分两档：**应用级**（整站或子路由挂载完整 SPA，多团队并行发版）与 **模块级**（远程 chunk、按需加载组件/页面）。应用级常涉及 **主应用/基座**（壳：菜单、登录、子应用容器）、**子应用**（导出 `bootstrap/mount/unmount` 生命周期）、**HTML Entry**（通过子应用 `index.html` 拉资源）、**JS 沙箱**（隔离 `window` 污染）与 **activeRule**（路由命中时激活子应用）；模块级则以 **Module Federation（MF，模块联邦）** 的 **`exposes` / `remotes` / `shared`** 为核心。**BFF**（Backend For Frontend，为前端聚合接口的后端层）常在壳与子应用、网关之间统一鉴权与 Cookie。选型时先分清「要整页子 SPA 还是远程模块」，再对照隔离强度与改造预算。

下面按 **国内常见落地** → **国际/插件化** → **基建增强** 列主流方案，并给 **可操作选型流程**。

***

### 一、应用级编排（多团队、多仓库、独立部署）

整页子应用由 **主应用** 注册、按路由 **activeRule** 挂载；**qiankun**（蚂蚁，基于 **single-spa** 生命周期 + HTML Entry + 沙箱）、**Garfish**（字节，运行时 + 插件 + 预加载）、**wujie**（腾讯，Web Components + 类 iframe 强隔离）、**micro-app**（京东，`<micro-app>` 标签化）、**icestark**（飞冰，与 ice.js 布局配套）均属此类；遗留系统几乎不可改时可用 **iframe + postMessage**，鉴权走 **BFF**。

| 方案 | 维护方 / 生态 | 核心机制（简述） | 典型适用 |
|------|----------------|------------------|----------|
| ==[qiankun](https://qiankun.umijs.org/)== | 蚂蚁 / umijs | HTML Entry + JS 沙箱 + single-spa 生命周期 | 国内最多参考实现，Webpack/Vite 子应用均可 |
| **[single-spa](https://single-spa.js.org/)** | 社区 | 路由驱动的 **registerApplication**，框架无关 | 自研壳子、或与 qiankun 组合理解底层 |
| **[Garfish](https://www.garfishjs.org/)** | 字节 | 运行时 + 插件 + 预加载 | 字节系或与现有 Garfish 基建对齐 |
| **[wujie](https://wujie-micro.github.io/doc/)** | 腾讯 | Web Components + **类 iframe 强隔离** | 隔离要求高、子应用改造意愿低 |
| **[micro-app](https://micro-zoe.github.io/micro-app/)** | 京东 | **自定义元素** `<micro-app>` 标签化接入 | 希望主应用侧声明式配置、快速 POC |
| **[icestark](https://micro-frontends.ice.work/)** | 飞冰 / 阿里 | 与 **ice.js**、微模块布局配套 | 已选飞冰或希望一体化布局方案 |
| **iframe + BFF** | 无固定框架 | 浏览器原生隔离 + **postMessage** | 遗留系统几乎不可改、合规隔离 |

***

### 二、模块级联邦（组件/页面级远程加载）

**MF** 在运行时由 **Host（消费方）** 加载 **Remote（供应方）** 的 **`remoteEntry.js`**，通过 **`exposes`** 暴露、`remotes` 引用、`shared` 锁依赖单例——与 qiankun 的「整页子 SPA」互补，常用来拉 **设计系统** 或远程页面。

| 方案 | 说明 | 典型适用 |
|------|------|----------|
| **Module Federation**（[概念](https://webpack.js.org/concepts/module-federation/) 出自 Webpack 5；**工程上常用** [**Vite 联邦插件**](https://github.com/originjs/vite-plugin-federation) 等） | `exposes` / `remotes` / `shared` | 同技术栈多包、设计系统、远程页面；**新仓库优先 Vite 配联邦** |\
| **[Rspack MF](https://rspack.dev/)** | 概念对齐 Webpack 5 | 老 Webpack 迁 Rspack 时延续联邦 |
| **[EMP](https://empjs.dev/)** | 腾讯开源，**在 MF 上叠 CLI、依赖共享治理** | 多应用共享库版本治理、工具链统一 |
| **[Vite Federation](https://github.com/originjs/vite-plugin-federation)** 等 | 社区插件实现远程模块 | Vite 技术栈且接受社区维护风险 |
| **[Native Federation](https://www.npmjs.com/package/@angular-architects/native-federation)** | 与构建工具解耦的联邦思路（常见于 Angular 生态推广） | 评估与 **esbuild/Rspack** 组合时的对照组 |

***

### 三、Monorepo 与「微前端」边界

**Monorepo**（单仓多包，如 **pnpm workspace**、**Nx**）解决代码与依赖共享，**不等于** 运行时隔离；常与 **MF** 或 **qiankun** 组合，部署仍可按 app 拆分。

| 方案 | 与微前端关系 |
|------|----------------|
| **[Nx](https://nx.dev/) + Module Federation** | 一个仓库多应用，**图 + CI** 强；部署仍可按 app 拆分 |
| **pnpm workspace** | 解决 **依赖与代码共享**，不等于运行时隔离；常 **+ MF** 或 **+ qiankun** |

**误区**：「上了 pnpm workspace = 微前端」——多数情况只是 **单体拆分模块**，若没有 **独立部署与运行时组合**，不必硬套微前端复杂度。

***

### 四、国际与插件化壳

| 方案 | 特点 |
|------|------|
| **[Piral](https://piral.io/)** | **pilets** 插件模型，偏 **portal + 扩展点**，适合产品型扩展平台 |
| **[Bit](https://bit.dev/)** | 组件发布与消费（偏 **组件平台**），与应用级微前端常 **组合使用** 而非替代 |

***

### 五、可执行的选型流程（建议照做）

1. **是否真的需要**：独立发版频次、团队边界、技术栈差异 —— 若否，优先 **Monorepo + 路由懒加载**。
2. **隔离强度**：强（iframe/wujie）→ 中（qiankun 沙箱）→ 弱（MF 同页单例）。
3. **子应用改造预算**：能改生命周期 → qiankun / Garfish；尽量不改 → wujie / iframe / micro-app 标签化。
4. **POC 清单（一周内需跑通）**：登录态、路由刷新、卸载内存、弹层组件、灰度发布、回滚。

**选型后常见「翻车点」**：

| 翻车点 | 建议 |
|--------|------|
| **为技术而技术**，子应用**无人长期维护** | 立项时写清 **owner、SLA、回滚与值班** |
| **壳 + 联邦 + iframe 叠用**，**无人能说清谁提供 React 单例** | 用一页纸定 **单例、路由、Cookie 三个责任方** |
| **只联调 dev**，未用 **生产 build + CDN 路径** 验子应用/联邦 | **预发** 与线上一致 **`base` / `entry` / `remoteEntry`** |
| **跨团队靠口头** 约定 path、鉴权 | **BFF/网关契约** 或 **OpenAPI** 落库 |
| **监控只有主应用** | 子应用 **带 name+version 上报**；**独立** sourcemap/告警 至少一条线 |

更细的 **qiankun / MF / 理论边界** 见同目录下《微前端实践》《微前端与 Webpack Module Federation》等文。

**详版工程实践（可照着搭）**（分类在 **「大前端」** 下、可用标签 **`微前端`** 筛选；站点生成后 URL 为 `https://yangy97.github.io/blog/2026/04/22/<文件名去后缀>/`）：

* [《微前端工程实践：qiankun 从脚手架到联调与上线（详版）》](/2025/08/09/micro-frontend-qiankun-practice-full-guide/)
* [《微前端工程实践：wujie（无界）主应用、子应用与 bus 通信（详版）》](/2025/09/05/micro-frontend-wujie-practice-full-guide/)
* [《微前端工程实践：micro-app 标签化接入与数据传递（详版）》](/2025/10/01/micro-frontend-micro-app-practice-full-guide/)
* [《微前端工程实践：Garfish 子应用表、沙箱与插件（详版）》](/2025/10/28/micro-frontend-garfish-practice-full-guide/)
* [《微前端工程实践：Module Federation 双仓库从初始化到生产部署（详版）》](/2025/11/23/micro-frontend-module-federation-practice-full-guide/)
* [《微前端工程实践：icestark 与 ice.js 主应用、子应用配置（详版）》](/2025/12/20/micro-frontend-icestark-practice-full-guide/)

***

### 六、小结

**没有一张表能替你做决定**：同一公司不同 BU 也可能 **壳用 qiankun + 业务内 MF 拉设计系统**。把 **「应用级」与「模块级」** 分层设计，比争论「哪个框架最好」更有产出。
