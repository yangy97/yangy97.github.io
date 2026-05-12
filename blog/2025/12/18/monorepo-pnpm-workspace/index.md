---
url: /blog/2025/12/18/monorepo-pnpm-workspace/index.md
---
\==Monorepo== 指多个包/应用放在 **同一个 Git 仓库** 里统一版本管理与协作。**pnpm** 通过 **workspace** 把本地包链接起来，安装快、磁盘省。这篇写最小可运行概念与常见目录，不绑定某一套 turbo/nx（可后续再加）。

***

### 一、为什么有人用 Monorepo

* \==共享代码==：组件库、工具函数、`eslint-config`、`tsconfig` 基座一处维护。
* **原子提交**：一次 PR 同时改前端与 BFF，避免版本漂移。
* **统一规范**：lint、测试、CI 模板一套。

代价：**仓库变大**、CI 要会做 **变更检测**（只测改动的包），否则全量跑很慢。

***

### 二、pnpm workspace 最小配置

仓库根 `package.json`：

```json
{
  "private": true,
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test"
  }
}
```

根目录 `pnpm-workspace.yaml`：

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

于是 `apps/web`、`packages/ui` 等互为 **workspace 包**，本地依赖可写 `"@scope/ui": "workspace:*"`。

***

### 三、常见目录（示例）

```text
apps/
  web/              # Vue/React 前端应用
  server/           # Egg/Nest 等 Node 服务
packages/
  ui/               # 共享组件库
  utils/            # 共享工具
  eslint-config/    # 统一 ESLint 配置包
```

**原则**：**可发布的包**与**仅内部使用的应用**分清楚；包名用 **scope**（如 `@my/ui`）避免 npm 冲突。

***

### 四、依赖提升与幽灵依赖

pnpm 默认 **严格**：子包只能访问 **自己 package.json 声明的依赖**，减少「隐式用到兄弟的依赖」的 bug。若迁移自 npm/yarn，可能出现缺依赖报错——**正确修法**是在该子包 `package.json` 里 **显式声明**，而不是关严格模式偷懒。

***

### 五、和 Vue / Egg 的衔接

* 前端 **Vite** 应用放在 `apps/web`，共享 UI 在 `packages/ui`，通过 workspace 引用。
* Egg 服务在 `apps/server`，公共常量、类型可抽到 `packages/shared`。

构建顺序若存在依赖（如先 build `ui` 再 build `web`），在根 `package.json` 用脚本编排或使用 **turbo / nx** 做拓扑排序。

***

### 六、收束

Monorepo 解决的是 **协作与复用**；成本是 **工具链与纪律**。从小仓库两块 `apps` + 一两个 `packages` 起步，比一上来大而全更可持续。Vue 单应用目录习惯见《Vue + Vite：项目目录怎么摆》；Egg 分层见《Egg.js：目录、Loader 与分层在干什么》。
