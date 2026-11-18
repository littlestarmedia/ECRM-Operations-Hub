# Prickles canon — install bundle (v1.0)

Source of truth: https://prickles.org/implementation
Canon: https://prickles.org/

Language: TypeScript
LLM target: Claude Code

## What's inside

- eslint.config.mjs — every lint rule the canon enforces, in one file.
- 9 per-pillar rule files for Claude Code (one per pillar).

Drop the lint config into your repo, point your agent at the per-pillar files, and the canon enforces itself.