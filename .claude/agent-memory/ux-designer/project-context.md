---
name: project-context
description: Core facts about LAST SCAN game — platform, UX pillars, horror design approach, UI style
metadata:
  type: project
---

LAST SCAN is a web-based (Three.js / WebGL) found-footage LIDAR horror game. Single session ~20-30 min. Player is an autonomous scanning unit in a residential property.

**Core UX pillars:**
- Diegetic Matterport-style UI — no external HUD; all UI is in-world
- No jump scares — horror is quiet, environmental, architectural
- Perception stripping: progressively removing player's ability to predict space
- Player fantasy: "the slow vertigo of a map you used to trust"
- Inverted reward: 100% scan coverage = bad ending; the UI steers the player wrong on purpose

**UI structure (§11):**
- Tabs: Scan · Dollhouse · Log (tab-based, not overlay)
- Top bar, sidebar with coverage ring, error bar at bottom
- Aesthetic: dark background, monospace, clinical green/amber/red

**Key deception system:** the Dollhouse map is a derived, lagging view of floor plan truth — UNKNOWN → KNOWN_STALE → KNOWN_CURRENT mask states. Anomaly rooms are never shown. Coverage ring frames higher coverage as "good" but true win condition is LOW coverage.

**Reports to:** art-director (visual UX), game-designer (gameplay UX)
**Coordinates with:** ui-programmer, gameplay-programmer (Three.js engine)

**Why:** The design depends on earned trust then quiet betrayal — UX must make the early map feel genuinely useful so its degradation lands as horror, not as a bug.
**How to apply:** All dollhouse UX decisions must ask "does this protect the earned-trust phase?" and "does this make the degradation feel intentional vs. broken?"
