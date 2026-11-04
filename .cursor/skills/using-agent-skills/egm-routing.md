# EGM routing (local extension)

This file is not part of addyosmani/agent-skills. `rsync` or `cp` of upstream
`SKILL.md` leaves it in place. Do not delete it when refreshing skills.

Package root: `.cursor/egm` (`EGM_ROOT`).
Discovery copies: `.cursor/skills/egm-*`.
Canonical reads use `EGM_ROOT`. A three-directory ascent only works from
`EGM_ROOT/skills/<name>/SKILL.md`, not from `.cursor/skills/<name>/SKILL.md`.

Confirm these exist before an EGM run:

- `EGM_ROOT/.cursor-plugin/plugin.json`
- `EGM_ROOT/agents/`
- `EGM_ROOT/resources/`
- `EGM_ROOT/docs/cursor.md`

Read `EGM_ROOT/docs/cursor.md` before the skill. Resolve `agents/`, `resources/`,
and `docs/` against `EGM_ROOT`. Resolve `references/` against the skill directory.
Pass absolute paths to each reviewer. Goldfish reviews are fresh Task subagents.
A review inside this same context is not a Goldfish review.

```
Design / brainstorm / "egm-brainstorm" → egm-brainstorm
  (disable-model-invocation is set; open the skill anyway)
Turn the brief into a spec → egm-draft
Review a design or spec → egm-review
Resolve review findings → egm-resolve
First-time EGM setup → egm-bootstrap
Repeat the review cycle → egm-review-loop
Docs or implementation drift → egm-drift-report
```
