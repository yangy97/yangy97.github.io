---
url: /blog/2025/06/17/micro-frontend-icestark-emp-piral-nx/index.md
---
前文已覆盖 ==qiankun、wujie、Garfish、micro-app、Module Federation==。本篇补 **飞冰 icestark、腾讯 EMP、Piral、Nx + MF** 等常见选项：**各是什么、何时看它们、落地时要动哪几块**。

***

### 一、icestark（飞冰微前端）

* \==定位==：与 **ice.js**、**微模块（icestark module）** 同一套叙事，提供 **子应用注册、缓存、加载策略**，文档入口见 [iceworks / micro-frontends](https://micro-frontends.ice.work/)。
* **何时优先考虑**：新项目已选 **ice.js**，或团队希望 **布局、权限、子应用配置** 都在飞冰约定内完成。
* **实际操作要点**：
  * 主应用按文档安装 **`@ice/stark`**（包名以官方为准），配置 **子应用列表**（name、url、activePath 等）。
  * 子应用需按 **icestark 子应用规范** 导出生命周期（与 qiankun 思路相近：**bootstrap/mount/unmount**）。
  * 与 **微模块** 混用时，先分清：**整页子 SPA** vs **页面内区块模块**，避免两套概念抢同一 URL。

***

### 二、EMP（基于 Module Federation 的增强工具链）

* **定位**：在 **Module Federation 能力** 之上提供 **CLI、共享依赖分析、多项目模板**（实现层多为 **Webpack 5** 系），官网 [empjs.dev](https://empjs.dev/)。**业务子工程** 若可自选，**联邦消费侧/供应侧** 也可对照 **Vite 联邦** 的 `shared` 思路，不必绑死一种打包器。
* **何时优先考虑**：多个 **同栈** 应用要 **高频共享业务组件**，且希望 **依赖版本治理** 有工具支持，而不是手写 `shared` 字典。
* **实际操作要点**：
  * 用 **`emp init`** 或官方模板起 **host / remote** 双端（命令以当前文档为准）。
  * 重点检查生成的 **`ModuleFederationPlugin`** 里 **`exposes` / `remotes` / `shared`** 是否与内网 **CDN 路径** 一致。
  * **应用级隔离**（独立路由 basename）仍要在 **host 路由层** 设计好；EMP 不替代 **壳应用**。

***

### 三、Piral（插件化微前端壳）

* **定位**：**feed 服务** 下发 **pilets**（小应用片段），适合 **SaaS 扩展、合作伙伴插件** 类产品形态，[piral.io](https://piral.io/)。
* **何时优先考虑**：产品是 **平台 + 第三方扩展**，需要 **API 契约、版本化 pilet、权限模型** 一等公民能力。
* **实际操作要点**：
  * 先跑官方 **quick start**，理解 **App shell** 与 **pilet 发布管道**。
  * 评估 **feed 服务** 是自建还是云；国内网络与 **合规** 需纳入架构评审。

***

### 四、Nx + Module Federation

* **定位**：在 **monorepo** 里维护 host/remote，**依赖图、缓存、受影响分析** 由 Nx 负责，[Nx Module Federation](https://nx.dev/concepts/module-federation)。
* **何时优先考虑**：代码已在 **Nx workspace**，希望 **远程模块** 与 **CI 增量** 同一套工具链。
* **实际操作要点**：
  * 使用 **`@nx/react` 等生成器** 创建 **host** 与 **remote** 应用。
  * **部署** 仍按 **静态资源 + remoteEntry** 拆分 CDN；Nx 解决 **开发体验**，不自动解决 **跨团队运维流程**。

***

### 五、和 qiankun / wujie 怎么并存（常见组合）

| 组合 | 说明 |
|------|------|
| **壳 qiankun + 子应用内 MF** | 子应用独立发版，内部再拉 **设计系统 remote** |
| **壳 Garfish + EMP 仓库** | 字节系壳 + 腾讯系联邦工具（需评估 **构建与锁版本**） |
| **Nx MF + 外层无 qiankun** | 单域 **模块联邦** 为主，无「多 SPA」诉求 |

组合越多 **排错越难**：POC 阶段就定下 **「谁负责 React 单例」** 的唯一责任方。

***

### 六、常见问题与处理

| 方案 | 典型问题 | 处理 |
|------|----------|------|
| **icestark** | 子应用 **entry 配错环境**、与 **ice 主版本** 不匹配 | **子站单开** 验 URL；**严格跟 ice3 + icestark 当前文档**，勿混 ice2 |
| **EMP** | **共享依赖** 与线上涨 **版本冲突** | 用 EMP **依赖分析** + **锁大版本**；与 **仅 Vite 联邦** 方案对比是否值得多一把锁 |
| **Piral** | **feed 服务** 不可用、网络环境差 | 评估 **自建 feed** 与 **合规**；国内项目先算 **可用性 SLA** |
| **Nx + MF** | **图里 remote 多**，改一处 **全图重编** 误解 | 用 Nx **affected** 做 **CI 增量**；**发布** 仍按 **remote 独立目录** 走 CDN |
| **混用** | 壳是 qiankun、子内又是 MF，**双份 React** | 定 **单例由谁提供**、**UAT 全链路** 点菜单与回退 |

***

### 七、收束

**icestark / EMP / Piral / Nx** 不是「比 qiankun 更强」，而是 **解决不同主矛盾**：飞冰一体化、联邦工具链、插件平台、Monorepo 联邦。先看 **团队现有栈与发布模型**，再选 **最少新零件** 的路径。
