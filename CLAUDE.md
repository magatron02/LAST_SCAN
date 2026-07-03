# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: Three.js (WebGL) — no game engine; vanilla JS + Vite
- **Language**: JavaScript (ES modules)
- **Version Control**: Git, trunk-based. Main repo: github.com/magatron02/LAST_SCAN, branch `ls_main`
- **Build System**: Vite
- **Asset Pipeline**: GLTF room geometry, JSON floor-plan data, Web Audio

> **Note**: This is a web game, not Godot/Unity/Unreal. The engine-specialist
> agents in this template are NOT used — route work to the engine-agnostic
> programmer agents. See `.claude/docs/technical-preferences.md`.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

@docs/engine-reference/three/VERSION.md

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md

## Quicksave Protocol — Cross-Machine Continuity

This project is worked on from **multiple machines** (e.g. a desktop and a Legion
laptop). Local Claude memory (`~/.claude/.../memory/`) is machine-local and does
NOT travel. The synced running log is **`production/worklog.md`** (committed to the
repo); `production/session-state/active.md` is also committed and travels too.

**When the user says `quicksave`:**
1. Append a new dated entry to `production/worklog.md` (newest at top) summarising,
   since the last entry: what was decided, what was built/changed, current state,
   and the immediate next step. Narrative summary — enough to resume cold, not a
   raw transcript.
2. Update `production/session-state/active.md` (local working state).
3. Consolidate local Claude memory if there is anything durable worth keeping.
4. Commit and push (`ls_main`) so the other machine can `git pull` and continue
   seamlessly.

**At session start on any machine:** read `production/worklog.md` first (top entry)
to recover context, then `production/session-state/active.md` if present.
