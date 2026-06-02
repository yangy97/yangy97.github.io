---
url: /blog/2026/05/19/claude-code-advanced-mcp-rules-ci/index.md
---
[《Claude Code 从 0 到 1》](/2026/05/21/claude-code-zero-to-one-tutorial/)解决「能用」；进阶要解决 **和团队仓库、外部系统、CI（Continuous Integration，持续集成）怎么闭环**。本篇串 **MCP（Model Context Protocol，模型上下文协议）接事实源 → Rules 定边界 → CI 当验收闸** 的完整流水线。

***

### 一、目标架构

```text
Claude Code（Anthropic 终端编程 Agent）
  ├── CLAUDE.md（硬规则，项目级 AI 约束文档）
  ├── MCP Servers（数据库/文档/工单/监控）
  └── 终端命令 = 与 CI 相同的 pnpm check
         │
         ▼
    GitHub Actions（同一套 check）
```

**单一真相源**：Rules 里写的命令 = `package.json` = CI yaml。

***

### 二、MCP 接入示例

`.cursor/mcp.json` 或 Claude Code 对应配置（路径以产品文档为准；MCP 让 AI 以标准方式调用外部工具）：

```json
{
  "mcpServers": {
    "postgres-readonly": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://readonly@..."]
    }
  }
}
```

**原则**

* 生产库只读；写操作走 **迁移 PR**
* MCP 返回的是 **事实**；模型总结是第二层
* 密钥不进仓库，走环境变量

详见[《MCP 配置与安全》](/2026/02/18/mcp-config-and-security/)。

***

### 三、CLAUDE.md 进阶片段

```markdown
## 验收（与 CI 一致）
合并前必须绿：pnpm lint && pnpm typecheck && pnpm test

## MCP
- 查表结构用 postgres-readonly，不要猜字段
- 不要执行 DROP/DELETE 除非我明确说「迁移 PR」

## 禁止
- 不要改 .github/workflows 除非任务标题含 ci:
```

***

### 四、典型工作流

**1. 修 bug**

```text
用 MCP 查 orders 表结构 → 读 src/orders → 写复现测试 → 修代码 → pnpm test orders
```

**2. 小功能**

```text
先列 plan → 我确认 → 分 2 个 commit → 每个 commit 后 pnpm check
```

**3. 对接外部 API**

```text
MCP 拉 OpenAPI / 内部 wiki → 生成 client → 不要手写 URL 字符串散落
```

***

### 五、CI 联动

```yaml
# .github/workflows/check.yml  excerpt
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
```

Claude Code 会话里 **最后一句话固定**：「跑 pnpm check，贴失败日志，修到绿为止。」

可选：PR 模板要求 **AI 辅助说明**（改了啥、测了啥）。

***

### 六、团队治理

* MCP 与 Rules 变更 **走 Code Review**
* 定期删 Rules 里过时的栈描述
* 敏感目录 `.claudeignore`：`.env*`、`secrets/`

***

### 七、小结

进阶用法 = **MCP 供事实 + Rules 供边界 + CI 供信任**。入门见[《Claude Code 从 0 到 1》](/2026/05/21/claude-code-zero-to-one-tutorial/)；工具对比见[《Cursor / Claude Code / Copilot 怎么分工》](/2026/05/19/ai-coding-tools-cursor-claude-copilot-comparison/)。
