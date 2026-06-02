---
url: /blog/2026/04/21/ai-team-collaboration-and-governance/index.md
---
个人用 AI 写代码和 ==团队== 用 AI，差别在于：**责任边界、风格一致性、安全与合规** 要可执行、可审计。这篇写 **轻量治理** 思路，适合小团队起步；并补 **落地模板、指标与反模式**，不是大企业全套治理框架。

***

### 一、建议有的「三份东西」

1. \==项目规则（Rules，写入仓库的 AI 默认行为约束）==：栈、目录、测试命令、禁止项——随仓库走，见[《Cursor 项目规则与工作流》](/2026/03/11/cursor-project-rules-and-workflow/)。
2. **任务手册（Skill，按场景加载的任务型 SOP 文档）**：发版、迁移、On-call——按场景加载，见[《Cursor Skill 怎么写、放哪、怎么用》](/2026/01/29/cursor-skills/)。
3. **评审清单**：合并前看什么，见[《与 AI 结对写代码时：审查清单与防翻车习惯》](/2026/02/28/ai-assisted-code-review/)。

三份都 **短、可版本化**，比写一份一百页的「AI 总则」更易执行。

#### 1.1 Rules 里建议写死的项（示例）

```markdown
- 包管理：pnpm；Node 20
- 测试：改 src/ 必跑 pnpm test:unit
- 禁止：未讨论就新增 >50KB 依赖
- 禁止：把 .env / 生产 URL 贴进对话
- 提交：Conventional Commits；PR 需链接 issue
```

#### 1.2 Skill 触发场景举例

| Skill | 何时加载 |
|-------|----------|
| release | 打 tag、写 changelog |
| migrate-db | Sequelize 迁移 |
| incident | On-call 第一步排查 |

***

### 二、Code Review 里多问一句

对 AI 辅助的 PR（Pull Request，代码合并请求），评审人可以习惯问：

* **需求覆盖**：是否只做了 happy path？
* **删除行**：红色部分是否删掉安全或兼容逻辑？
* **新依赖**：必要性、许可证、体积。
* **可观测性**：错误是否可 log、可区分用户错误与系统错误？
* **AI 痕迹**：是否存在 **不存在 API**、臆造配置项、过宽 try/catch？

不必歧视 AI 写的代码，但 **默认按同样标准甚至更严**——AI 放大的是 **产出速度**，不是 **责任转移**。

#### 2.1 PR 标签建议

* `ai-assisted`：作者声明用过 Copilot/Cursor
* `needs-security`：动到 auth、文件、支付
* `skip-ai`：安全热修，禁止 bot 自动改

***

### 三、提示词与模板放哪

* **通用片段**（Code Review 提示、写测试的约束）放在 **团队 Wiki 或仓库 `docs/`**，链接写进 Skill。
* **个人口头禅** 留在 User Rules，不要和团队规范打架。

变更 **走 PR**：谁改模板谁负责通知使用方——避免「silent drift」。

#### 3.1 仓库内推荐结构

```text
docs/
  ai/
    code-review-prompt.md
    test-generation-constraints.md
.cursor/
  rules/
    project.mdc
```

***

### 四、数据与合规（最小意识）

* **用户数据**进不进模型上下文、是否 **脱敏**，要有明确策略（PII（Personally Identifiable Information，个人可识别信息）默认不进第三方 API）。
* **日志**里默认不把完整 prompt/PII 打明文。
* 对外产品若用第三方模型 API，合同里 **数据留存与训练用途** 要核对（Enterprise 条款、零 retention）。
* **开源协议**：AI 生成代码与 GPL/AGPL 依赖混用时的合规，大团队需法务口径；小团队至少 **记录生成比例** 与 **license 扫描**（CI）。

更技术向的 **提示注入** 见[《提示注入与安全》](/2026/03/31/ai-prompt-injection-security/)。

***

### 五、协作节奏：谁对什么负责

| 角色 | 建议职责 |
|------|----------|
| 作者 | 声明 ai-assisted；自测；理解 diff |
| Reviewer | 按清单；不假设 AI 已测 |
| TL | 维护 Rules/Skill；季度更新 |
| 安全 | 抽测注入与 MCP 工具权限 |

**反模式**：「这是 AI 写的我不熟」——合并后 **维护责任在作者**。

***

### 六、可量化的小指标（可选）

不必上重型平台，先用 spreadsheet 也行：

* AI 辅助 PR 占比（自报）
* 此类 PR 的 \*\* revert 率 / 线上 bug 率\*\* 与人工 PR 对比
* Review 评论数是否显著下降（可能是 review 敷衍信号）
* 新依赖引入次数

目标不是「减少 AI」，而是 **发现流程空洞**（测试缺失、规则过期）。

***

### 七、 onboarding 新同学

1. 读 Rules + 跑通 `pnpm dev` / 测试
2. 用 Skill 完成一次 **文档级小任务**（如补单测）
3. 结对 Review 第一个 `ai-assisted` PR
4. 知道 **什么不能贴进对话**（密钥、客户数据、未公开财报）

***

### 八、与 RAG / 内部知识库

团队若做 **内部文档 RAG（检索增强生成）**：

* 权限与源系统 ACL（Access Control List，访问控制列表） **同步**（离职员工 doc 仍被检索 = 事故）
* 片段进 prompt 视为 **untrusted**（见注入文间接注入节）
* 版本：API 文档过期比没有更糟——标注 `last_reviewed`

见 [《检索增强与 Agent 工具调用》](/2026/04/18/ai-rag-and-agent-tools/)。

***

### 九、小结

团队用 AI 的核心不是「禁止用」或「随便用」，而是 **把默认可执行的东西写进仓库与评审习惯**，让个人效率与集体质量对齐。三份文档（Rules、Skill、Review 清单）+ 明确 **作者负责** + 最小合规意识，足够支撑十到几十人团队平稳使用一到两个 release 周期；再视指标决定是否加重治理。
