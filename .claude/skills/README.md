# Skills in this project

These are third-party agent skills, copied in so they are versioned with the code.
All three sources are MIT licensed; each licence file sits beside this one.

| Source | Skills | Copied from | At commit |
| --- | --- | --- | --- |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) | 20, design and motion | `skills/` | (installed earlier) |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 26, engineering workflow | `skills/` | e997ac5 |
| [cursor/plugins, pstack](https://github.com/cursor/plugins/tree/main/pstack) | 59, rigor and principles | `harness/pstack/claude-code/skills/` (the Claude Code copy) | 41e4009 |

Also copied, because the skills call on them:

- `.claude/agents/`: five reviewer agents from agent-skills and two agents from pstack.
- `.claude/docs/harness/claude-code.md`: pstack's guide to its Cursor names in Claude Code. pstack skills link to it.

Left out:

- Hooks and slash commands from agent-skills. Hooks run shell scripts on their own, so they are a separate decision.
- pstack's guide and its `statechart` tool's own test corpus (3.9 MB).

To update a set, copy the same folder again from a newer commit.
