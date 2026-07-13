---
type: entity
created: 2026-07-05
updated: 2026-07-10
sources: ["[[sources/LAST-SCAN-Concept-Doc]]", "[[sources/Systems-Index]]"]
tags: [product, game]
aliases: ["Last Scan", "LSC project"]
---

# LAST SCAN

## Basic Information
- Type: product (video game)
- Source: [[sources/LAST-SCAN-Concept-Doc]]

## Description
A web-based (Three.js/WebGL) found-footage LIDAR horror game. The player is an autonomous
scanning unit (call sign `LSC-004`) documenting a residential property; the entire visual output
is a point cloud, styled after Matterport Pro3 spatial-capture scans. Core loop: navigate → scan
nodes → survive an antagonist [[entities/The-Antagonist-Entity|entity]] that must not enter the
scan data. Single session, single ending, ~20–30 minutes.

Four pillars govern every design decision in the project: diegetic Matterport UI (see
[[concepts/Diegetic-UI]]), no jump scares, horror from the familiar made wrong, and a
found-footage framing (see [[concepts/Found-Footage-Framing]]) implying this is a *recovered*
session, not a live one.

The game's signature mechanical idea is the [[concepts/Inverted-Reward|Inverted Reward]]: the
displayed objective ("scan every node") is a trap — the true win condition requires the player to
deliberately disobey it.

**Tech stack**: Three.js r171 (WebGL2), vanilla JS ES modules, Vite build, Vitest tests, HTML/CSS
overlay for UI panels. No physics engine (kinematic collision only), no external HUD library.

## Related Entities
- [[entities/Point-Cloud-Renderer]] — the entire visual language
- [[entities/FPS-Movement]] — how the player navigates
- [[entities/Floor-Plan-System]] — the property layout and its deliberate unreliability
- [[entities/Scan-Node-System]] — the authoritative scan-progress ledger
- [[entities/Orchestrator]] — the event bus every system communicates through
- [[entities/Scan-Mechanic]] — the locked 360° capture verb
- [[entities/Entity-System]] — spawns/positions/behaves the antagonist
- [[entities/Win-Lose-Ending]] — evaluates which of 4 outcomes occurred
- [[entities/The-Antagonist-Entity]] — the in-fiction threat itself
- [[entities/UI-HUD]] — Presentation layer; Designed 2026-07-10, the last of 9/9 MVP systems
- [[entities/Audio-System]], [[entities/Found-Footage-Layer]] — Vertical Slice tier, not started
- [[entities/Persistence]], [[entities/Cycle-Meta-Layer]] — Alpha tier, not started
- [[entities/Verify-Registry-Tool]] — the automated cross-GDD registry consistency checker

## Related Concepts
- [[concepts/Inverted-Reward]]
- [[concepts/Perception-Stripping]]
- [[concepts/Diegetic-UI]]
- [[concepts/Found-Footage-Framing]]
- [[concepts/Event-Bus-Architecture]]

## Mentions in Source
- "You are an autonomous scanning unit assigned to update spatial data of a residential property that humans cannot access. No explanation is given for why. Your objective: scan every node. Do not let the entity appear in your scan data." — [[sources/LAST-SCAN-Concept-Doc]]
- "The horror is in the implication: this is a routine process." — [[sources/LAST-SCAN-Concept-Doc]]
