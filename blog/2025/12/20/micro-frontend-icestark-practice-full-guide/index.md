---
url: /blog/2025/12/20/micro-frontend-icestark-practice-full-guide/index.md
---
[icestark](https://micro-frontends.ice.work/) 是飞冰 ==微前端体系== 的一部分，与 **ice.js** 应用、**微模块** 等文档同站维护。主应用、子应用、**权限与布局** 的写法以 [官方文档](https://micro-frontends.ice.work/) 与当前 `@ice/*` 包版本为准。本篇给出 **可开工的顺序** 与 **常见落地点**，具体 **API/包名** 从文档与脚手架生成物核对。

***

### 一、何时走 icestark

* 已选或计划选 ==ice.js 3== 作 **中后台** 主技术栈。
* 需要 **子应用** 以 **独立仓库** 发版，同时 **主应用菜单、布局、登出** 在 **iceworks/飞冰** 体系内统管。
* 与 **仅 qiankun** 的对比：icestark 更强调 **和 ice 工程** 的整体配合；若主应用已是 **Vite+Vue3 自研** 且无 ice，通常 **不强行** 为了 icestark 重造主工程。

***

### 二、创建主应用（ice.js）

**1）用官方脚手架**（命令以 [ice 官网](https://ice3.alibaba-inc.com/) 当前为准）：

```bash
# 常见形态（以文档为准，可能为 npm create ice 等）
npm create @ice/app@latest icestark-main
cd icestark-main
```

**2）安装微前端能力**

安装 **`@ice/stark` 或文档指定的包**（包名、版本、入口注册方式以 **icestark 快速开始** 为准），例如：

```bash
npm i @ice/stark
```

在 **应用根入口**（ice 3 的 `src/app` 或 `src/document` 配置旁，**以生成项目为准**）中 **注册子应用列表**，常见配置项包括：

* **子应用 name / id**；
* **子应用 `entry`（`index.html` 地址）**；
* **activePath 或 path 规则**（和 **主应用路由、菜单** 一致）；
* **沙箱/预加载** 等开关（见文档 **API** 表）。

**3）在布局中预留子应用 **Outlet** 区域**

* 子应用 **激活时** 的 **挂载点** 一般在 **主布局** 的 **content 区**；**菜单** 仍由主应用数据驱动。
* **与微模块** 混用时：先分清 **「子 SPA」** 与 **「页面内模块」** 的路由，不要两套都抢同一个 path。

***

### 三、子应用：ice 子应用或标准 SPA

**1）icestark 子应用**（若脚手架提供 `create-ice child` 等）

* 用官方 **子应用模板**，自带 **与主应用约定的生命周期/导出**、**publicPath** 等，**优先用模板** 减少和文档的偏差。

**2）标准 Vue/React 子应用**

* **新仓库优先用 Vite 起子 SPA**（`npm create vite@latest`），`base` / 路由 basename 与 **主应用** 为子域分配的路径 **一致**；**Webpack 老项目** 只要 **`entry` 的 `index.html` 能拉到 chunk** 即可，流程不赘述。
* 子应用需按 icestark 文档导出的 **`provider` / 生命周期\`（名称以文档为准，可能与 qiankun 类似** bootstrap/mount/unmount\*\*）\*\* 对接。
* **`router` basename** 与主应用为子应用分配的路径（如 `/child-a`）**一致**；**静态资源** 在 **独立访问** 与 **嵌入** 时均可加载（见子应用章节的 **环境变量** 说明）。

***

### 四、本地联调

1. 子应用 **`npm start`**，浏览器 **单独** 打开子应用 `localhost` 正常。
2. 主应用 **配置 `entry: http://localhost:子应用端口/`**，启动主应用。
3. 从主应用 **菜单** 点进子应用路由，**Network** 看 **子应用 `index.html` 与 `chunk`** 全为 200。
4. **刷新子路由**：主应用需 **history fallback**；子应用 **basename** 正确。

***

### 五、常见问题与处理

| 问题 | 原因 | 处理 |
|------|------|------|
| **子应用 404/白屏，主站菜单有** | `entry` **错环境** 或子站 **子路径** 没配好 | 主应用子应用表 **`entry` 用当前环境变量**；**子站单开** 能访问再填表 |
| **ice 主应用能跑，一装 `@ice/stark` 就起不来** | **包版本/入口注册** 与 **ice3 当前文档** 不一致 | **严格照脚手架生成物** 改；勿混 **ice2 教程** |
| **子应用 Vite `base` 与主应用 path 对不齐** | **basename** 三处\*\*（主路由、子 `base`、子 router）\*\* 未统一 | RFC 里写死 **一个 path 常量** 三处引用 |
| **微模块 与 子 SPA 抢路由** | **两套概念** 配到**同一路径** | 分 **子应用 outlet** 与 **微模块** 的 **path 空间**，见飞冰文档 |

***

### 六、部署与多环境

* 子应用 **独立** 发版到 **CDN/OSS**；主应用 **子应用表** 里 `entry` 用 **各环境变量** 注入（dev/staging/prod）。
* 若用 **内网包管理平台**，`entry` 可 **只改配置** 不 **重打主包**（视你们的发布系统而定）。

***

### 七、与 qiankun 选型的差别（一句话）

* **icestark + ice**：**一条龙的工程体验**，适合 **定 ice 为主** 的团队。
* **qiankun**：**框架无关主应用** 多，**社区文章** 多，**不绑 ice**。技术评审里写清 **主栈是否长期 ice** 即可定案。

***

### 八、小结

icestark 落地 **= 按官方脚手架与 `@ice/stark` 配子应用表 + 子应用 basename/entry 一致 + 先模板再自研 SPA**。**不要照抄** 网上旧版 ice2 的示例与 ice3/ icestark 新 API 混用，以 **你项目里 `package.json` 的 major 版本** 对应的文档为准。
