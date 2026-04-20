# @pi-lab/permissions

A permission system extension for [pi coding agent](https://shittycodingagent.ai). Intercepts tool calls and enforces allow / deny / ask rules defined in a JSON config file.

## Install

```bash
pi install npm:@pi-lab/permissions
```

## Configuration

Rules are loaded from two locations and merged into a single list:

- `~/.pi/agent/pi-lab/permissions.json` — global
- `.pi/pi-lab/permissions.json` — project

```json
{
  "rules": [
    {
      "message": "Block rm -rf",
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

### Rule fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `match.tool` | string | ✓ | Tool name, or `"*"` to match all tools |
| `match.params` | object | — | Param name → regex pattern. All conditions must match. |
| `action` | string | ✓ | `allow`, `deny`, or `ask` |
| `priority` | number | — | Defaults to `0`. Higher values are evaluated first. |
| `message` | string | — | Reason returned to the LLM when a call is blocked. |

### Matching order

1. Rules sorted by `priority` descending
2. Same priority: `deny` > `ask` > `allow`
3. First matching rule wins. No match defaults to `allow`.

### ask mode

A dialog prompts the user with four options:

- **Allow** — allow this call once
- **Allow always** — allow identical calls for the rest of the session (not persisted)
- **Deny** — deny this call once
- **Deny always** — deny identical calls for the rest of the session (not persisted)
