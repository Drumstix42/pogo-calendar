# PoGo Calendar — Agent Notes

Guidance for AI coding agents (Claude Code, Copilot, etc.) working in this repo. This is the
**single source of truth**: `CLAUDE.md` imports it via `@AGENTS.md`, and GitHub Copilot reads
`AGENTS.md` natively. These are high-level orientations — treat them as guidance, not strict rules.
Always read the actual code before making assumptions.

## Project Overview

Vue 3 + TypeScript calendar for Pokemon GO events. Events fetched from external API with Pokemon-themed UI.

## Keep this doc current

If you notice anything here that is outdated, inaccurate, or incomplete — a renamed/removed file, a
changed pipeline step, a new event type, a stale command — proactively flag it and suggest the fix.
When a code change alters behavior described here, propose the matching doc update in the same change.

## Working agreement

- **Scope first.** For a new feature or any change spanning multiple files/components, outline your
  approach and wait for confirmation before implementing. Implement smaller changes directly.
- **Do exactly what's asked** — don't add "improvements" beyond the specific request.
- **Surface, don't smuggle.** Note suspected bugs, dead code, or modernization ideas rather than
  silently changing behavior as part of an unrelated change. The user decides whether to action them.
- **Comments explain _why_, not _what_** — minimal, reserved for non-obvious logic.
- **Be concise** when communicating anything beyond the code changes themselves.
- **Verification:** there is no test suite. `npm run type-check` (vue-tsc) + `npm run lint` (eslint)
  are the gate — run them as a change nears completion, not after every edit; `npm run format`
  (prettier) before finishing.
- **Don't run dev servers or builds** (`npm run dev`, `npm run build`) unless explicitly asked — and
  don't prompt to run them. The verification gate above is the path; the user runs the app themselves.
- **Prefer the Bash tool over PowerShell** for shell commands.

## Commit messages

- Use a conventional prefix such as `fix:`, `feat:`, `chore:`, `refactor:`, or `docs:`.
- Keep the subject line under 50 characters and write it in the imperative mood.
- Use bullet points in the body for high-level functional changes and why they matter, focusing on
  user-facing impact.
- When the change scope is small, prefer a single concise bullet in the body.
- Avoid low-level implementation details in the commit body (file names, line counts, internal symbols).
- Prefer the git command line over tooling.
- Do not add a `Co-Authored-By` trailer or any AI attribution footer to commit messages.

## Tech stack

- **Vue 3 + TypeScript**, Composition API, `<script setup lang="ts">` everywhere.
- **Pinia** composition-style stores; persistence via VueUse `useLocalStorage` (keys in
  `src/constants/storage.ts`, all under the `pogo-calendar-` prefix).
- **Day.js** for dates; UTC→local always via `dayjs.utc(event.start).local()`.
- **Bootstrap 5** with custom SCSS theming via the `data-bs-theme` attribute; responsive
  mobile/desktop patterns using Bootstrap classes + media queries.
- **VueUse** breakpoints (`breakpointsBootstrapV5`); **FloatingVue** tooltips (touch disabled);
  **Lucide Vue** icons.

---

## Event data

Scraped from LeekDuck via [ScrapedDuck](https://github.com/bigfoott/ScrapedDuck):
`https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json`

`boss`/`spawn` lists in `extraData` can be empty for past or newly announced events — all handlers
must degrade gracefully to title-based parsing.

### Event types (`src/utils/eventTypes.ts`)

Each type has a `name`, `color`, `priority` (lower = higher on calendar), and `category`. The full
`EventTypeKey` union and `EVENT_TYPES` record live here. Categories: `community-and-raids`,
`research`, `seasonal-and-premium`, `events-and-misc`.

Adding a new event type: add an entry to `EVENT_TYPES`, then handle it in `getEventPokemonImages()`
if it needs Pokemon images.

### Pokémon image resolution (`src/utils/eventPokemon.ts`)

`getEventPokemonImages()` is the single entry point. It runs per-event-type resolvers in priority
order; each returns an image array (decides the result) or `null` to fall through to the next branch.
Resolvers check `extraData` first (boss/spawn data preferred) and fall back to title parsing.

Split into focused sibling modules:

- `eventPokemon.ts` — the dispatcher + `hasExtraData` guard (re-exports `parsePokemonNameAndSuffix`
  and the image types for path stability).
- `eventPokemonResolvers.ts` — one `resolve<Type>Images()` per event-type branch; owns
  `RAID_DAY_TITLE_EXCEPTIONS` and the `GMAX_FORM_IN_TITLE` regex (title→form parsing only — the Gmax
  sprite-URL/filename mapping lives in `pokemonMapper.ts` via `getGigantamaxSpriteUrl()`).
- `eventPokemonNames.ts` — pure title→name parsing, including `parsePokemonNameAndSuffix` (prefix/
  suffix forms: Mega/Mega X-Y, Primal, Shadow, parenthetical forms) and several hard-coded special
  cases (Deoxys, Genesect, crowned forms). See the function for specifics.
- `eventSprite.ts` — name→sprite-URL layer.
- `eventPokemonTypes.ts` — leaf type module.

Title-parsing gotcha: for Raid Day, "Super Mega" is event marketing, not a game classification —
treat it identically to "Mega".

### Sprite / CDN system (`src/utils/pokemonMapper.ts`)

Multi-tier fallback, chained at runtime in `PokemonImage.vue`. Tier 1 or 2 is the _primary_
`imageUrl`; tiers 3–5 are appended in `imageSources` and advanced through on `@error`.

| Tier | Source                                                          | Condition                                               |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------- |
| 1    | `mgrann03/pokemon-resources` — static PNGs                      | Name must be in `VALID_STATIC_SPRITES`                  |
| 2    | `PokeMiners/pogo_assets` `Pokemon/` — `pm{id}.f{FORM}.icon.png` | ID + form must be in `POKEMON_FORM_MAP`                 |
| 3    | `PokeMiners/pogo_assets` `Pokemon - 256x256/` — same filename   | `@error` fallback; new assets sometimes land here first |
| 4    | `db.pokemongohub.net` — same filename as tier 2                 | `@error` fallback; use when PokeMiners 404s             |
| 5    | LeekDuck `boss.image` (`fallbackImageUrl`)                      | `@error` fallback; last resort                          |

`getSprite256FallbackUrl()` (tier 3) and `getSpriteFallbackUrl()` (tier 4) derive their URL from the
tier-2 PokeMiners URL via `swapUrlBase()` — same filename, different folder/host (`null` when the
primary isn't a tier-2 URL). PokeMiners form suffixes use `f` prefix + uppercase (`fMEGA`, `fBURN`);
alias `crownedsword`/`crownedshield` → `CROWNED`. Static sprite name: normalize (Unicode-aware —
handles accented characters and gender symbols) → strip non-alphanumeric → append suffix.

Gigantamax sprites are a **separate path**: `getGigantamaxSpriteUrl(name, formSlug?)` builds a URL
against a standalone CDN (HybridShivam) gated by `GIGANTAMAX_POKEMON_IDS`. It does **not** join the
tiered fallback above (the `@error` chain only derives from tier-2 URLs), so an unknown filename 404s
to the placeholder.

---

## Stores (`src/stores/`)

| Store              | Key responsibility                                                     |
| ------------------ | ---------------------------------------------------------------------- |
| `eventsStore`      | Fetches and caches raw event data                                      |
| `eventFilter`      | Persists disabled event type keys + hidden event IDs                   |
| `eventTypeColors`  | Persists per-type color overrides; falls back to `EVENT_TYPES` default |
| `calendarSettings` | First day of week, display options                                     |
| `eventHighlight`   | Tracks hovered/focused event for cross-component highlighting          |
| `theme`            | Light/dark/system theme, persisted                                     |
| `toasts`           | Ephemeral toast queue                                                  |
| `userMessages`     | Dismissible banners with version-keyed persistence                     |

## URL sync (`src/composables/useUrlSync.ts`)

Keeps `?month=M&year=Y` query params in sync with calendar navigation. Month is 1-based in the URL,
0-based internally (Day.js convention). Params are cleared when navigating back to the current month.

---

## Component standards (Vue 3 + TS)

Conventions we hold components to; they double as the target for the refactor effort tracked in
[REFACTOR.md](REFACTOR.md) (process + status detail lives there). Guidance, not hard gates — but a
file violating several at once is a refactor candidate.

- **Size:** soft target a `.vue` under ~300 lines; flag over ~400. The goal is reduced complexity per
  file, not line-count golf — don't shard a file into pieces that only make sense read together. Big
  `<style scoped>` blocks count as bloat.
- **Structure:** order is `<template>` → `<script setup lang="ts">` → `<style>`. Keep templates thin —
  push multi-branch ternaries, formatting, and derived data into `computed` or composables; lift
  inline `:style`/`:class` objects with more than ~3 keys to a `computed`. Typed `defineProps<Props>()`
  / `defineEmits<...>()`; declare a `Props` interface for anything non-trivial.
- **Where logic goes:** stateful/reusable logic → a composable (`src/composables/useX.ts`, a `useX()`
  factory returning refs/functions); pure stateless helpers → `src/utils/` (no Vue reactivity);
  persisted/global state → a Pinia store.
- **Seams & co-location:** split a sub-component at a self-contained region (template + its styles +
  ideally its own slice of logic); avoid prop-drilling splits. Promote a component to a folder once it
  grows its own parts, and move CSS with its markup. No barrel `index.ts` — keep explicit imports.
- **Connected components:** don't analyze a component in isolation — scan its imports, importers, and
  siblings doing similar work for logic to share once or parts that belong in a shared location.
  Widening scope to a neighbor needs user sign-off; otherwise note it as a follow-up.
- **Styling:** prefer existing CSS variables / theme tokens over hard-coded colors; respect
  `data-bs-theme`. Shared styling → an SCSS partial under `src/styles/`; per-component visuals stay
  scoped.

### Repo conventions to preserve (don't "modernize" away)

- `function foo()` over `const foo = () =>` for named declarations.
- Don't add function return types unless they improve clarity.
- `DATE_FORMAT` constants for date-formatting consistency.
- Minimal comments — explain _why_, not _what_.

## Key files

- `src/stores/` — Pinia composition stores
- `src/utils/` — event / Pokémon business logic
- `src/composables/` — reusable logic (e.g. `useUrlSync.ts`)
- `src/constants/storage.ts` — localStorage keys
