# @pi-lab/permissions

Permission system extension for pi coding agent.

## Install

```bash
pi install npm:@pi-lab/permissions
```

## Configuration

两个配置文件位置，规则合并后统一按优先级匹配：

- `~/.pi/agent/permissions.json` — 全局
- `.pi/permissions.json` — 项目

```json
{
  "rules": [
    {
      "description": "禁止 rm -rf",
      "priority": 10,
      "match": { "tool": "bash", "params": { "command": "rm\\s+-rf" } },
      "action": "deny"
    },
    {
      "match": { "tool": "bash", "params": { "command": "sudo" } },
      "action": "ask"
    },
    {
      "match": { "tool": "*" },
      "action": "allow"
    }
  ]
}
```

### Rule 字段

| 字段 | 类型 | 必选 | 说明 |
|------|------|------|------|
| `match.tool` | string | ✓ | 工具名，`"*"` 匹配所有 |
| `match.params` | object | - | 参数名 → 正则，所有条件需同时满足 |
| `action` | string | ✓ | `allow` / `deny` / `ask` |
| `priority` | number | - | 默认 0，越大越先匹配 |
| `description` | string | - | 拦截时返回给 LLM 的原因 |

### 匹配顺序

1. 按 `priority` 降序
2. 相同 priority：`deny` > `ask` > `allow`
3. 第一条命中的规则生效，无匹配默认 allow

### ask 模式

弹窗提供四个选项：
- **Allow** — 允许本次
- **Allow always** — 会话内相同调用都允许（不持久化）
- **Deny** — 拒绝本次
- **Deny always** — 会话内相同调用都拒绝（不持久化）
