---
type: schema
created: 2026-07-07
updated: 2026-07-07
---

# Wiki Schema / Controlled Vocabulary

Reverse-engineered from the vocabulary already in organic use across the wiki's 71 pages
(17 entities, 28 concepts, 26 sources), rather than invented up front — added now because the
wiki crossed the plugin's own stated "~30+ pages" threshold where a documented vocabulary starts
paying for itself in query reliability. Not enforced by tooling (no LLM-ingest pipeline is
configured in this vault — see [[../log|log]]); this page is a reference, not a validator.

## Page types (frontmatter `type:`)

| Type | Folder | Count | Meaning |
|---|---|---|---|
| `entity` | `entities/` | 17 | A named thing: a system, the project itself, an in-fiction character, a tool, a library |
| `concept` | `concepts/` | 28 | A topic, pattern, formula, or process — not a single named thing |
| `source` | `sources/` | 26 | A summary of one real repo document, with a `source_file` pointer back to it |
| `index` | `index.md` | 1 | The single navigation root |
| `log` | `log.md` | 1 | Ingestion/authoring activity history |
| `schema` | `schema/config.md` | 1 | This page |

## Entity sub-types (`- Type:` line, first line of Basic Information)

- **system** — one of the 13 game systems in [[../sources/Systems-Index|Systems-Index]]. Always
  qualified with a layer (Foundation / Core / Feature / Presentation / Meta) and a tier (MVP /
  Vertical Slice / Alpha).
- **product** — [[../entities/LAST-SCAN|LAST SCAN]] (the game) and [[../entities/Three-js|Three.js]] (the rendering library)
- **character** — [[../entities/The-Antagonist-Entity|The Antagonist Entity]] — the one in-fiction (not code-system) entity
- **tool** — [[../entities/Verify-Registry-Tool|Verify-Registry Tool]] — build/CI tooling

## Common tags

Recurring categories, not an exhaustive enforced list: `system` `game` `product` `tool` ·
`architecture` `architecture-pattern` `event-bus` `state-machine` `data-pattern` ·
`review-pattern` `qa` `process` `collaboration` `workflow` · `documentation-standard`
`documentation-pattern` `acceptance-criteria` `testing` · `game-design` `design-pillar`
`design-thesis` `core-mechanic` `formula` · `production` `gate` `registry` `adr` ·
`not-started` `designed` `approved` `accepted` `proposed` (status-as-tag, used inconsistently —
prefer the frontmatter `status:` field or the entity's own "Basic Information" line as the
source of truth over these tags when they conflict).

## Status vocabulary (systems & ADRs)

`Not Started` → `In Design` / `Designed` → `Approved` (GDDs) — separately, ADRs use
`Proposed` → `Accepted`. These are two different lifecycles tracked on different artifact types;
do not conflate a GDD being "Designed" with its corresponding ADR being "Accepted" — see
[[../concepts/Architecture-Decision-Record-Process|ADR Process]].

## Section templates

- **Entity page**: Basic Information → Description → Related Entities → Related Concepts →
  Mentions in Source
- **Concept page**: Definition → Key Characteristics → Applications → Related Concepts →
  Related Entities → Mentions in Source
- **Source page**: Source → Core Content → Key Entities → Key Concepts → Main Points

## Known deviation from the plugin's default behavior

`source_file` in every `sources/` page is a **plain repo-relative path string**
(e.g. `docs/architecture/adr-0002-point-cloud-renderer.md`), not a working `[[wikilink]]` —
because the actual source documents live in the parent project folder (`Last_Scan/design/`,
`Last_Scan/docs/`, `Last_Scan/production/`), outside this vault
(`Last_Scan/LS_obsidian_context/`), and Obsidian wikilinks don't resolve across vault
boundaries. See [[../log|log]] for the full disclosure.
