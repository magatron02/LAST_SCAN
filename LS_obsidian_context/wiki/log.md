<!-- llm-wiki-log-header-start -->
# Wiki Operation Log

Every ingest, lint run, and maintenance operation is recorded here automatically. For a better experience, use the **Operation History** panel:
- Cmd+P → "View operation history"
- Or open from Settings → Auto Maintenance → Operation History

---
## 2026-07-05 — Initial hand-authored ingest

**Method note (important):** the Karpathy LLM Wiki plugin is installed in this vault
(`.obsidian/plugins/karpathywiki/`) but its `llm_config_status` was `failed` — no LLM provider
was configured inside Obsidian's plugin settings. Its `Ingest` commands run entirely inside the
Obsidian app using that configured LLM; they aren't reachable from outside Obsidian.

Rather than leave the vault empty, Claude Code hand-authored the wiki pages directly, following
the plugin's own page schema exactly (`type: entity|concept|source` frontmatter, the same section
headings, the same `mentions_in_source` convention) so the result is structurally identical to
what a real ingest run would have produced — just curated by an LLM working from the project's
actual design documents in one pass, rather than the plugin's per-note extraction pipeline.

**One deviation from the plugin's normal behavior**, disclosed here rather than silently: the
plugin's `source_file` field is normally a `[[wikilink]]` to another note *inside the same vault*.
This wiki's actual sources (the ADRs and GDDs) live in the parent project folder
(`Last_Scan/docs/`, `Last_Scan/design/gdd/`), **outside** this vault
(`Last_Scan/LS_obsidian_context/`). Obsidian wikilinks don't resolve across vault boundaries, so
`source_file` in each `sources/` page is a **plain repo-relative path string**, not a working
wikilink — e.g. `docs/architecture/adr-0002-point-cloud-renderer.md`. Everything else
(`entities/`, `concepts/`, and the wikilink graph *between* those and `sources/` pages within this
vault) works exactly as the plugin describes.

**What was ingested:** 7 ADRs (`docs/architecture/adr-0001` through `adr-0007`), 8 GDDs
(`design/gdd/point-cloud-renderer.md` through `design/gdd/win-lose-ending.md`), the systems index,
and the master concept document (`design/gdd/LAST_SCAN_GDD.md`).

**What was produced:** 12 entity pages, 10 concept pages, 16 source pages, this log, and
[[index]].

**Not enabled:** the Schema layer (`wiki/schema/`) — optional, adds a controlled vocabulary on
top of the three core types. Skipped for this first pass (YAGNI until the wiki has enough pages
to need query reliability tuning — the plugin's own docs recommend Lint/Schema once a wiki
reaches ~30+ pages, which this one now has, so revisit if querying gets noisy).

**Known gap this wiki inherits from the source project:** Win/Lose & Ending's ending record has
no `anomaliesLogged` field despite the terminal-screen template needing one — this is flagged in
[[entities/Win-Lose-Ending]] and its source page, not silently fixed here.

---
## 2026-07-07 — Completion pass: production history, QA, UX, remaining systems

**What changed:** extended the 2026-07-05 pass (architecture phase + 3 MVP GDDs) to cover the
full project state. Ingested: `production/worklog.md` (full cross-machine timeline),
`production/session-state/active.md`, `production/gate-check-pre-production-2026-07-02.md`,
`production/qa/bug-audit-handoff-2026-06-27.md` + 3 bug reports, `design/ux/accessibility-requirements.md`,
`design/ux/interaction-patterns.md`, `design/registry/entities.yaml`, `docs/registry/architecture.yaml`,
`tools/verify-registry.mjs`, and the 2 remaining GDDs (Entity System, Win/Lose & Ending — sources
already existed from a partial 2026-07-05 pass, verified rather than re-authored).

**What was produced:** 6 new entity pages (UI/HUD, Audio System, Found-Footage Layer, Persistence,
Cycle/Meta Layer, Verify-Registry Tool), 18 new concept pages (design pillars:
Coverage-as-False-Comfort, Locked-Scan-State-Machine, No-Jump-Scares-Philosophy; architecture
patterns: Session-Lifecycle, Latest-Value-vs-Discrete-Events, Dependency-Injection-over-Singleton,
Capped-Delta-Time-Game-Clock, Authoritative-vs-Estimated-State, Frame-Budget-Allocation; process
methodology: Cross-System-Invariant-Documentation, Rules-Dont-Compose,
Blockers-Live-At-Inheritance-Boundary, Assert-The-What-Dont-Prove-The-How,
Acceptance-Criteria-Convention, GDD-Standard-8-Sections, Gate-Check-Process,
Traceability-TR-ID-System, Cross-Machine-Quicksave-Protocol), 11 new source pages (2 GDDs,
combined architecture-review history, both registries, worklog, session-state, gate-check, QA
bugs, 2 UX docs). `index.md` rewritten to reflect the complete 71-page state.

**Concurrency note:** this pass ran alongside what appears to have been continued activity on the
same vault in the same window — several files (the 4 "undesigned systems" entities, several
process-methodology concepts) were found already written, mid-pass, by the time this session
checked for them. Rather than duplicate or overwrite, this session verified each for quality/
consistency, resolved the one genuine duplicate (a combined "Undesigned-Systems" stub, superseded
by the finer-grained per-system pages), fixed 2 dangling wikilinks (a naming mismatch on
`Gate-Check-Process`), and confirmed **zero broken links** across all 71 pages before finalizing.
If you're resuming this vault from another machine/session, diff against this log before assuming
anything is missing — check `wiki/index.md`'s page counts first.

**Schema layer enabled** (`wiki/schema/config.md`), added at the tail end of this same pass — the
71-page total is well past the plugin's own "~30+ pages" threshold for when a documented
vocabulary starts paying for itself. Reverse-engineered from the page types, entity sub-types,
tags, status vocabulary, and section templates already in organic use across the vault, rather
than inventing a new one — a reference page, not an enforced validator (still no LLM-ingest
pipeline configured).

**Final verified state:** 71 content pages (17 entities, 28 concepts, 26 sources) + index + log +
schema. Zero dead links, zero orphan pages (all reachable from [[index]]).

---
## 2026-07-10 — Milestone pass: UI/HUD complete, all 9/9 MVP systems Designed

**What changed:** ingested `design/gdd/ui-hud.md`, completed since the 2026-07-07 pass (it existed
only as an in-progress skeleton at that point — Acceptance Criteria and Open Questions were not
yet written). This is the 9th and final MVP system GDD; **all 9 MVP systems are now Designed**,
closing the specific blocker the 2026-07-02 `/gate-check pre-production` FAILed on.

**What was produced:** 1 new source page ([[sources/GDD-UI-HUD]]); [[entities/UI-HUD]] rewritten
in full (was a "Not Started" stub referencing only [[sources/Systems-Index]], now reflects the
complete GDD — 9 Core Rules, 3 states, 48 Acceptance Criteria, the resolved cross-system
obligations). Updated in place: [[index]] (systems table, MVP progress line, "Current project
state," "How this wiki was built"), [[sources/Systems-Index]], [[sources/Session-State-Active]],
[[concepts/Coverage-as-False-Comfort]] (AC-SN31 now RESOLVED via `coverage_dominance_ratio`),
[[concepts/Gate-Check-Process]] (Applications section — design-phase blocker cleared, remaining
path is review/architecture only), [[entities/LAST-SCAN]], [[entities/Win-Lose-Ending]]
(`anomaliesLogged` gap now RESOLVED).

**Notable content from the source GDD:** a mid-session Core Rule numbering bug (an insertion
mis-labeled "7b" placed before the existing Rule 7) was self-caught and fixed by re-appending it
as a properly-numbered Rule 9 — recorded on [[entities/UI-HUD]] as a process note, not scrubbed
from the record.

**Final verified state:** 72 content pages (17 entities, 28 concepts, 27 sources) + index + log +
schema. No broken links introduced — all new/changed wikilinks point at pages confirmed to exist
in this pass.

---
## 2026-07-12 — Review-tracking pass: UI/HUD round-4 independent re-review

**What changed:** ingested `design/gdd/reviews/ui-hud-review-log.md` (new source file, not
previously ingested — did not exist as of the 2026-07-10 pass) and the round-4 revisions applied
to `design/gdd/ui-hud.md` the same session. [[entities/UI-HUD]] moved from Designed to **In
Review**: 4 review rounds have now run (2026-07-10 ×2, 2026-07-12 ×2), each finding and fixing 3–4
blockers same-session, matching this project's established `/design-review` pattern. Round 4 broke
the "clean on round 4" streak set by Floor Plan/Scan Node/Orchestrator — it found 3 new blockers
rather than confirming Approved, because round 3's late additions (a new Core Rule 10, plus
AC-UH53/UH54) hadn't yet been independently stress-tested.

**The headline change:** Core Rule 10 (`DOLLHOUSE_OPEN` behavior) was rewritten mid-review. Its
round-3 framing — "total awareness trade, no danger channel survives" — was shown in round 4 to be
mechanically a **free safe-harbor**: cross-referencing [[entities/Win-Lose-Ending]]'s own AC-WL08
(Movement Violation requires a `player:position` delta) revealed that a stationary player during
the modal cannot trigger it, and no scan can run mid-modal either, so nothing was actually being
traded away. The user re-decided the design (treated as new mechanical evidence, not
re-litigation of a settled call) to **safe-while-open, trap-on-close**: the blackout is honest
about what it withholds, but the real danger now explicitly lands on re-attach, not during. This
opened a new **Open Q#9** — a locomotion-suspension requirement placed on
[[entities/FPS-Movement]], which currently has no dollhouse-adjacent input state to enforce it.

**What was produced:** 1 new source page ([[sources/UI-HUD-Review-Log]], summarizing all 4 rounds).
Updated in place: [[entities/UI-HUD]] (status, 10th Core Rule, AC count 55→57, new Open Q#9
obligation), [[sources/GDD-UI-HUD]] (AC/Open-Question counts, Rule 10 history), [[entities/FPS-Movement]]
(new Open Q#9 section), [[sources/Systems-Index]] (status In Review), [[concepts/Coverage-as-False-Comfort]]
(added the pre-registered `coverage_dominance_ratio` fallback, playtest-pending caveat), [[index]]
(systems table, MVP progress line, "Current project state," "How this wiki was built").

**Not touched this pass, and why:** `production/session-state/active.md` and
`production/worklog.md` — the quicksave for this session runs immediately after this ingest, so
[[sources/Session-State-Active]] and [[sources/Project-Worklog]] are left for the *next* ingest
pass to pick up the post-quicksave state rather than being updated against a mid-session snapshot.

**Final verified state:** 73 content pages (17 entities, 28 concepts, 28 sources) + index + log +
schema. No broken links introduced.
