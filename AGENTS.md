# PoGo Calendar — Agent Notes

Guidance for AI coding agents (Claude Code, Copilot, etc.) working in this repo.

**This file is the canonical source.** `CLAUDE.md` imports it via `@AGENTS.md`, and
[.github/copilot-instructions.md](.github/copilot-instructions.md) mirrors it for GitHub Copilot.
Deeper notes on subsystems, naming conventions, and edge cases. These are high-level orientations —
treat them as guidance, not strict rules. Always read the actual code before making assumptions.

## Keep these docs current

While working, if you notice anything in this file or
[.github/copilot-instructions.md](.github/copilot-instructions.md) that is outdated, inaccurate, or
incomplete — a renamed/removed file, a changed pipeline step, a new event type, a different CI
schedule, a stale command, etc. — proactively flag it and suggest the fix. When a code change alters
behavior these docs describe, propose the matching doc update in the same change. Edit **this file**
(the canonical source) and keep the Copilot mirror in sync.

---

## Event Data

Scraped from LeekDuck via [ScrapedDuck](https://github.com/bigfoott/ScrapedDuck):
`https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json`

`boss`/`spawn` lists in `extraData` can be empty for past or newly announced events — all handlers must degrade gracefully to title-based parsing.

### Event Types (`src/utils/eventTypes.ts`)

Each type has a `name`, `color`, `priority` (lower = higher on calendar), and `category`. The full `EventTypeKey` union and `EVENT_TYPES` record live here. Categories: `community-and-raids`, `research`, `seasonal-and-premium`, `events-and-misc`.

Adding a new event type: add an entry to `EVENT_TYPES`, then handle it in `getEventPokemonImages()` if it needs Pokemon images.

### Pokemon Image Resolution per Event Type (`src/utils/eventPokemon.ts`)

`getEventPokemonImages()` is the single entry point. Each event type checks `extraData` first, then falls back to title parsing. Boss/spawn data is preferred over title parsing when available.

#### Raid Day title parsing

Regex pattern captures the Pokemon name and an optional modifier (`Mega`, `Super Mega`, `Fusion`) between the name and "Raid Day". "Super Mega" is event marketing, not a game classification — treat it identically to "Mega": apply the mega suffix and prepend `"Mega "` to the display name.

`RAID_DAY_TITLE_EXCEPTIONS` skips events that match the pattern but have no single Pokémon.

### `parsePokemonNameAndSuffix()` — name → sprite slug

Handles prefix/suffix patterns: `Mega`, `Mega X/Y`, `Primal`, `Shadow` (no suffix — base sprite used), forme prefixes, and parenthetical forms.

Hard-coded special cases: `Deoxys (Normal)` → no suffix; `Genesect (<X> Drive)` → strips " Drive"; bare `Genesect` → normal form; `"crowned sword/shield"` → `crownedsword/crownedshield`.

---

## Sprite / CDN System (`src/utils/pokemonMapper.ts`)

Multi-tier fallback, chained at runtime in `PokemonImage.vue`:

| Tier | Source                                                       | Condition                                          |
| ---- | ------------------------------------------------------------ | -------------------------------------------------- |
| 1    | `mgrann03/pokemon-resources` — static PNGs                   | Name must be in `VALID_STATIC_SPRITES`             |
| 2    | `PokeMiners/pogo_assets` `Pokemon/` — `pm{id}.f{FORM}.icon.png` | ID + form must be in `POKEMON_FORM_MAP`          |
| 3    | `PokeMiners/pogo_assets` `Pokemon - 256x256/` — same filename | `@error` fallback; new assets sometimes land here first |
| 4    | `db.pokemongohub.net` — same filename as tier 2              | `@error` fallback; use when PokeMiners 404s        |
| 5    | LeekDuck `boss.image` (`fallbackImageUrl`)                   | `@error` fallback; last resort                     |

Tier 1 or 2 is the *primary* `imageUrl` chosen in `pokemonMapper.ts`; tiers 3–5 are appended in `PokemonImage.vue`'s `imageSources` and advanced through on `@error`. `getSprite256FallbackUrl()` (tier 3) and `getSpriteFallbackUrl()` (tier 4) both derive their URL via `swapUrlBase()` from the tier-2 PokeMiners URL — same filename, different folder/host (they return `null` when the primary isn't a tier-2 URL). PokeMiners form suffixes use `f` prefix + uppercase (e.g. `fMEGA`, `fBURN`). Known alias: `crownedsword`/`crownedshield` both map to `CROWNED`.

Static sprite name: normalize → strip non-alphanumeric → append suffix.

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

All persistence uses `useLocalStorage` from VueUse; keys are in `src/constants/storage.ts` under the `pogo-calendar-` prefix.

---

## URL Sync (`src/composables/useUrlSync.ts`)

Keeps `?month=M&year=Y` query params in sync with calendar navigation. Month is 1-based in the URL, 0-based internally (Day.js convention). Params are cleared when navigating back to the current month.

---

## Component Standards (Vue 3 + TS)

These are the conventions we hold components to. They double as the target for the ongoing
refactor effort tracked in [REFACTOR.md](REFACTOR.md). Treat them as guidance, not hard gates —
but when a file violates several at once, it's a refactor candidate.

### Size & complexity

- **Soft target: a `.vue` file stays under ~300 lines; flag anything over ~400.** Size alone isn't
  a bug, but a large file almost always hides multiple responsibilities.
- The goal of any split is **reduced complexity per file**, not line-count golf. Don't shard a file
  into pieces that only make sense when read together.
- Big `<style scoped>` blocks count toward bloat. CSS that describes a sub-region of the template
  usually belongs with the sub-component that owns that region.

### Single-file component structure

- Order is always `<template>` → `<script setup lang="ts">` → `<style>`.
- Keep templates thin. Move multi-branch ternaries, formatting, and derived data into `computed`
  or composables — the template should read as markup, not logic. Inline `:style`/`:class` objects
  with more than ~3 keys are a smell; lift them to a `computed`.
- Typed `defineProps<Props>()` / `defineEmits<...>()`. Declare a `Props` interface for anything
  non-trivial.

### Where logic goes

- **Stateful or reusable logic → a composable** (`src/composables/useX.ts`). Follow the existing
  pattern: a `useX()` factory returning refs/functions. Module-scoped state (singleton) is used
  deliberately in this repo (e.g. `useHideEventModal`) — keep state inside the function unless a
  single shared instance is actually intended.
- **Pure, stateless helpers → `src/utils/`.** No Vue reactivity in utils.
- **Persisted/global state → a Pinia store** (composition style + `useLocalStorage`).
- A composable extracted purely to shrink one component is fine — reuse is a bonus, not a
  requirement.

### Sub-components & folder co-location

- Split a sub-component at a **clear seam**: a self-contained region of template + its own
  styles + (ideally) its own slice of logic. Avoid "prop-drilling" splits that just move a tangle
  behind a `<Child :a :b :c :d :e>` wall.
- When a component grows its own family of parts/composables, **promote it to a folder**:
  ```
  Calendar/CalendarDay/
    CalendarDay.vue          # orchestrator
    MultiDayEventBar.vue     # extracted region
    useCalendarDayEvents.ts  # extracted logic
  ```
  Update all imports to the new path. Keep explicit imports (no barrel `index.ts`; matches current style).

### Styling

- Prefer existing CSS variables / theme tokens over hard-coded colors; respect `data-bs-theme`.
- Shared styling → an SCSS partial under `src/styles/`. Per-component visuals stay scoped.
- When extracting a sub-component, move the CSS that targets its markup along with it.

### Repo conventions to preserve (do not "modernize" away)

- `<script setup lang="ts">` everywhere.
- Prefer `function foo()` over `const foo = () =>` for named declarations.
- Don't add function return types unless they improve clarity.
- Day.js UTC→local: `dayjs.utc(event.start).local()`.
- VueUse breakpoints via `breakpointsBootstrapV5`; FloatingVue tooltips with touch disabled.
- Lucide Vue for icons; `pokemonMapper.ts` for name normalization / ID lookup.
- Minimal comments — explain *why*, not *what*.
