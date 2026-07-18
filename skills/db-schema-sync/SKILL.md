---
name: db-schema-sync
description: Use when the user asks to create, regenerate, or reconcile the database schema doc (DB-SCHEMA.md) — bootstrap a new one, refresh it after schema changes, or review drift between the doc and the actual schema sources.
---

# DB Schema Sync

Keep `DB-SCHEMA.md` — a Mermaid ER diagram plus per-column purpose docs and a
relations narrative — in sync with the schema sources. This is the judgment pass
the mechanical `db-schema-guard` hook cannot do: the hook only nags when a schema
file changed and the doc didn't; this skill actually builds and reconciles the doc.

## The doc: `DB-SCHEMA.md`

One canonical file per repo, at the **root of the repo's dedicated DB folder** (e.g.
`db/`, `database/`, `migrations/`). Its presence toggles the `db-schema-guard` hook
on for the repo.

Format:

```markdown
---
status: CURRENT            # CURRENT | DRAFT | STALE
sources:                   # globs/paths this doc is generated from
  - db/migrations/**/*.sql
  - app/models/**/*.py
patterns: []               # optional: extra hook trigger regexes for this repo
---

# Database Schema

## ER Diagram
​```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS {
        uuid id PK
        text email
        timestamptz created_at
    }
    ORDERS {
        uuid id PK
        uuid user_id FK
        numeric total
    }
​```

## Tables

### users
Purpose: application accounts.

| column | type | purpose | notes |
|---|---|---|---|
| id | uuid | primary key | gen_random_uuid() |
| email | text | login identity | unique |
| created_at | timestamptz | signup time | |

## Relations
- `orders.user_id` → `users.id`: each order belongs to one user; users have many orders.
```

## Flow

1. **Locate.** Find `DB-SCHEMA.md` in the repo.
   - None found → this repo hasn't opted in. Offer to **bootstrap** (step 2). Ask
     where the dedicated DB folder is if it's not obvious.
2. **Bootstrap** (no doc yet). Read the schema sources — SQL migrations/`*.sql`, ORM
   models, Alembic `versions/*.py`. Reconstruct the current schema (apply migrations
   in order; migrations mutate, so the latest state is the sum, not any single file).
   Generate the doc: Mermaid `erDiagram` (every table, columns with types + `PK`/`FK`,
   relationship edges with cardinality), per-table purpose + `column | type | purpose |
   notes` table, and a relations narrative. Set `sources` frontmatter. Write it to the
   DB folder root.
3. **Sync / regenerate** (doc exists). Re-read the sources. For each table and column,
   verify against the doc: ACCURATE | DRIFTED (doc says X, schema now says Y) | ORPHANED
   (doc describes a table/column that no longer exists). Cite evidence (file:line or
   migration name). For large schemas, dispatch subagents per source group; they read
   sources, you synthesize.
4. **Report & fix.** One table: table/column, verdict, drift summary. Propose the doc
   edit as a diff — never rewrite the doc wholesale without showing it. Apply approved
   edits. Set `status` (CURRENT after a clean sync). Preserve human-written `purpose`
   text for columns that still exist — only regenerate structure and fill gaps.

## Rules

- The doc explains **purpose** (why a column/table exists, what it means), not just
  shape. Preserve that prose across regenerations; don't flatten it to type dumps.
- A `purpose` note isn't drift just because a column's type changed — update the type,
  keep the intent unless the intent actually changed.
- Never delete the doc or a table section without asking; ORPHANED entries are proposed
  for removal, not removed.
- Verdicts must cite evidence — an unverified ACCURATE is worthless.
- Migrations are cumulative: derive current state by applying them in order, not by
  reading the newest file alone.
