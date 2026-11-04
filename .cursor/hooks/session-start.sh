#!/bin/bash
# Cursor sessionStart hook for the agent-skills router.
#
# Upstream hooks/session-start.sh emits a Claude/Codex envelope
# (hookSpecificOutput.additionalContext). Cursor reads top-level
# additional_context, so this script injects that field instead.
# Skill text still comes from .cursor/skills/using-agent-skills/SKILL.md.

cat >/dev/null

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
META="$ROOT/.cursor/skills/using-agent-skills/SKILL.md"
EGM="$ROOT/.cursor/skills/using-agent-skills/egm-routing.md"

if ! command -v jq >/dev/null 2>&1; then
  echo '{"additional_context":"agent-skills: jq is required for the session-start hook but was not found. Skills remain available under .cursor/skills."}'
  exit 0
fi

if [ ! -f "$META" ]; then
  echo '{"additional_context":"agent-skills: using-agent-skills meta-skill not found at .cursor/skills/using-agent-skills/SKILL.md."}'
  exit 0
fi

EGM_NOTE=""
if [ -f "$EGM" ]; then
  EGM_NOTE="$(cat "$EGM")"
fi

CONTENT="$(cat "$META")"
jq -cn \
  --arg context "agent-skills loaded. Route with the skill discovery flowchart, then read the matching skill under .cursor/skills/<name>/SKILL.md. EGM_ROOT is ${ROOT}/.cursor/egm.

${CONTENT}

${EGM_NOTE}" \
  '{additional_context: $context}'
