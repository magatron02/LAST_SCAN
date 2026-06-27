---
name: dollhouse-review
description: Adversarial UX critique of Floor Plan System GDD dollhouse map — 12 issues, 5 BLOCKING, delivered 2026-06-27
metadata:
  type: project
---

First full UX adversarial review of design/gdd/floor-plan-system.md dollhouse map UX.

BLOCKING issues found: 5
- Estimated node positions as navigation lure (Issue 1)
- No tab-access speed spec (Issue 2)
- Player position marker has no desync spec — undermines loop horror (Issue 4)
- Room-level vs node-level scan definition undefined (Issue 5)
- Coverage ring deception not protected by accessibility fallback (Issue 9)

IMPORTANT issues found: 4
- Desync scope undefined — room outline/label vs scan state only (Issue 3)
- No colorblind mode for mask states (Issue 6)
- UI Requirements section insufficient for programmer handoff (Issue 7)
- KNOWN_STALE visual has no differentiation floor — looks like UNKNOWN (Issue 10)

ADVISORY issues found: 3
- Tab-switch context loss on return (Issue 8)
- D_max 25s desync may read as a bug at late game (Issue 11)
- No player signal that desynced rooms exist vs truly unscanned (Issue 12)

Next action: author design/ux/dollhouse.md via /ux-design before UI epics.

**Why:** The GDD explicitly defers dollhouse UX to a future spec but provides no bridge guidance; critique identified gaps that will block programmer handoff.
**How to apply:** When dollhouse.md is authored, use this critique as the checklist of resolved issues.
