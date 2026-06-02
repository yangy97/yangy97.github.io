---
url: /blog/2026/05/21/claude-code-zero-to-one-tutorial/index.md
---
**Claude Code** 是 Anthropic 推出的终端/IDE 编程 Agent（智能体，可自主读仓库、改文件、跑命令的多步 AI 运行时）：能读仓库、改多文件、跑命令、按任务拆步执行。它和「网页聊天写代码」最大的差别是：**默认拥有项目上下文与工具权限**——你要学会的是 **怎么给边界、怎么验收**，而不是把它当搜索引擎。

本篇按 **安装 → 首次跑通 → 日常工作流 → 进阶配置 → 常见坑** 的顺序，带你从 0 到能稳定用在真实仓库里。

***

### 一、它是什么、和 Cursor 怎么选

| 维度 | Claude Code | Cursor（Agent 模式） |
|------|-------------|----------------------|
| 运行形态 | 终端 CLI（Command Line Interface，命令行界面） + 可选 IDE 插件 | 以 IDE 为主 |
| 模型 | Claude 系列（Sonnet / Opus 等） | 多模型可选 |
| 强项 | 长任务、多文件 refactor（重构）、脚本化流水线 | 编辑体验、内联补全、可视化 diff |
| 适合 | 喜欢终端、CI/脚本集成、大改动 | 日常编码、小步迭代 |

**不是二选一**：很多团队 **Cursor 写小改、Claude Code 跑大任务**（迁移、批量重命名、补测试）。下文假设你已有 Node 18+ 环境。

***

### 二、安装与首次启动

**1. 安装 CLI**

```bash
# 官方推荐：npm 全局安装（版本以官网为准）
npm install -g @anthropic-ai/claude-code

# 验证
claude --version
```

**2. 登录 / API Key**

首次运行 `claude` 会引导 OAuth（开放授权协议）或粘贴 API Key（调用模型 API 的密钥，视你账号类型而定）。企业环境常见做法：

* 用 **组织分配的 Key**，不要写进仓库；
* 在 shell 配置里 export，或走 **密钥管理器**。

**3. 在项目根目录启动**

```bash
cd your-project
claude
```

进入交互后，可以用自然语言描述任务，例如：

> 读一下 `package.json` 和 `src/router`，列出所有路由及其懒加载方式，不要改文件。

**原则**：第一轮先 **只读探索**，确认它理解目录再开写。

***

### 三、核心概念（5 分钟建立心智模型）

1. \==工作区==：当前目录及子目录；通过 `.gitignore` 与 ignore 规则决定哪些文件不可见。
2. **工具调用（Tool Use，Agent 读文件、跑命令等结构化动作）**：读文件、搜索、编辑、执行终端命令——每次调用你通常需要 **确认或放行**（视设置而定）。
3. **Plan / Act**：复杂任务会先列计划再动手；你可以在中途 **打断、修正方向**。
4. **上下文窗口（Context Window，单次可喂给模型的 token 上限）**：超大仓库要 **指定路径**，否则检索会漏模块。

和[《Cursor 项目规则与工作流》](/2026/03/11/cursor-project-rules-and-workflow/)同理：把 **栈、测试命令、禁止目录** 写进项目说明，Claude Code 也会稳定很多。

***

### 四、推荐工作流（可复用的四步）

**Step 1 — 写清任务边界**

好的提示包含：**目标、范围、验收、禁止项**。

```text
目标：给 UserService 补单元测试，覆盖率到 80%+
范围：只改 tests/ 和 src/services/user.ts，不动 API 层
验收：pnpm test user 全绿；pnpm lint 无新增 error
禁止：不要改 package.json 依赖版本
```

**Step 2 — 让它先读再改**

```text
先阅读 src/services/user.ts 和现有 tests/user.test.ts，
列出缺失的分支，等我确认后再写测试。
```

**Step 3 — 小步提交**

每完成一个子目标就 **git commit**（或至少 `git diff` 审一遍）。Agent 一次改太多文件时，回滚成本很高。

**Step 4 — 用 CI 命令验收**

规则里写死的命令和本地一致，例如：

```bash
pnpm check   # lint + typecheck + test
```

***

### 五、项目级配置：CLAUDE.md

在仓库根目录放 **`CLAUDE.md`**（或官方文档指定的规则文件名），相当于 Project Rules：

```markdown
# 项目约定

- 包管理：pnpm，Node 20
- 测试：vitest，`pnpm test`
- 目录：业务逻辑在 src/modules/，禁止在 components 里直接 fetch
- 提交前必须：`pnpm lint && pnpm test`
```

**写什么**：栈版本、目录含义、测试/lint 命令、敏感目录禁止修改。**别写**：长篇历史——链到 wiki 即可。

***

### 六、常见任务示例

**1. 批量重构**

```text
把所有 axios 直接调用迁移到 src/api/ 下的封装函数，
保持行为不变，每改一个模块跑对应测试。
```

**2. 读不懂的遗留代码**

```text
解释 src/legacy/billing/ 的调用链，输出 mermaid 序列图，
不要改代码。
```

**3. 写迁移脚本**

```text
写一个 scripts/migrate-user-avatar.ts：
从旧表读 avatar_url，上传到 OSS，写回新字段；
加 --dry-run，默认不写入。
```

**4. 修 CI 失败**

把 **完整失败日志** 贴进去，并指明 **哪条 workflow、哪个 job**。

***

### 七、权限与安全

* **命令执行**：生产库连接串、`.env` 不要被 Agent 读进上下文；用 `.claudeignore` / `.gitignore` 排除。
* **依赖升级**：单独 PR，不要和业务改动混在一个 Agent 会话里。
* **Secrets**：禁止把 Key 写进 CLAUDE.md 或对话；CI 用 OIDC / 密钥注入。

更系统的威胁模型见[《AI 提示词注入与安全》](/2026/03/31/ai-prompt-injection-security/)。

***

### 八、常见问题

| 现象 | 处理 |
|------|------|
| 改错文件 | 缩小范围；在提示里写 **绝对路径** |
| 测试通过但逻辑错 | 补充 **边界用例** 到验收标准 |
| 上下文丢失 | 新开会话，粘贴 **任务摘要 + 当前 diff** |
| 和团队规范冲突 | 维护 CLAUDE.md，变更走 PR |

***

### 九、小结

Claude Code 的价值不在「替你想」，而在 **把读仓库、改多文件、跑命令串成一条可验收的流水线**。从 0 到 1 只需：**装好 CLI → 项目根启动 → 写清边界 → 小步 diff → 用同一套 test/lint 兜底**。

下一步可配合[《Cursor 项目规则与工作流》](/2026/03/11/cursor-project-rules-and-workflow/)统一 Rules，以及《AI 背景下程序员何去何从》想清楚 **哪些事交给 Agent、哪些必须自己把关**。
