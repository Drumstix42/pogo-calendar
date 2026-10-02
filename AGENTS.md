# PoGo Calendar — Agent Notes

Guidance for AI coding agents (Claude Code, Copilot, etc.) working in this repo. This is the
**single source of truth**: `CLAUDE.md` imports it via `@AGENTS.md`, and GitHub Copilot reads
`AGENTS.md` natively. These are high-level orientations — treat them as guidance, not strict rules.
Always read the actual code before making assumptions.

## Project Overview

Vue 3 + TypeScript SPA: a calendar/timeline of Pokémon GO events, with data scraped from LeekDuck.

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

## Release notes

GitHub releases are titled with the tag (`vX.Y.Z`). When asked to prep one, cover the commits since the
latest tag (`git tag --sort=-creatordate`) and hand back the text to paste. Don't create tags or releases.
Past release bodies (for reference): `curl -s "https://api.github.com/repos/Drumstix42/pogo-calendar/releases?per_page=3"`.

```markdown
**Full Changelog**: https://github.com/Drumstix42/pogo-calendar/compare/v<prev>...v<new>

### Feature

- Added ...

### Fix

- Fixed ...
```

- Sections in order `### Feature`, `### Fix`, `### Chore` (singular); omit empty ones. Skip `docs:` commits.
- Roughly one line per user-facing change, written for app users: "Added …", "… now …", "Fixed …". No
  trailing period. Use UI names (tooltips, timeline, event detail panel, Campfire Event Helper, Summary
  text) and concrete examples in parentheses — "(e.g. …)".
- Only list fixes users could have hit in the last release; a bug introduced and fixed within the same
  cycle isn't a fix.

## Tech stack

- **Vue 3 + TypeScript**, Composition API, `<script setup lang="ts">` everywhere.
- **Pinia** composition-style stores; persistence via VueUse `useLocalStorage` (keys in
  `src/constants/storage.ts`, all under the `pogo-calendar-` prefix).
- **Day.js** for dates. Always parse feed dates with `parseEventDate(str, calendarSettings.manualTimeOffsetHours)`
  (`src/utils/eventDate.ts`): `Z`-suffixed strings are UTC instants (converted to local); all others
  are LeekDuck "local time" and kept as wall-clock time.
- **Bootstrap 5** with custom SCSS theming via the `data-bs-theme` attribute; responsive
  mobile/desktop patterns using Bootstrap classes + media queries.
- **VueUse** breakpoints (`breakpointsBootstrapV5`); **FloatingVue** tooltips (touch disabled);
  **Lucide Vue** icons.

---

## Event data

Feeds come from the [Drumstix42 fork of ScrapedDuck](https://github.com/Drumstix42/ScrapedDuck)
(upstream: `bigfoott/ScrapedDuck`), `data` branch, under
`https://raw.githubusercontent.com/Drumstix42/ScrapedDuck/refs/heads/data/`:

| File              | Store     |
| ----------------- | --------- |
| `events.min.json` | `events`  |
| `raids.min.json`  | `raids`   |
| `season.json`     | `seasons` |

- **Fix data shape upstream.** The user owns the fork; prefer fixing feed issues there (e.g. slug
  normalization) over massaging data in the app. Suggest it rather than adding app-side workarounds.
- Events without `start`/`end` (e.g. unannounced Spotlight Hours) are dropped at fetch.
- `boss`/`spawn` lists in `extraData` can be empty for past or newly announced events — all handlers
  must degrade gracefully to title-based parsing.
- Sample feed snapshots live in `planning/events*.json` (not shipped); use them to check data shapes.
  They were captured over time (higher number = newer) while events were still being announced and
  finalized, so older ones aren't reliable for an event's actual contents. For facts about a specific
  event, use the newest snapshot, the live feed (URL above), or the LeekDuck page itself.

### Event types (`src/utils/eventTypes.ts`)

- `eventType` = **primary** type (from LeekDuck's events list page). `eventTypes` = every tag on the
  event's page, primary first (e.g. `event` + `location-specific`, `wild-area` + `ticketed-event`).
  `eventTypes` is optional — read it via `getEventTypes()` / `getSecondaryEventTypes()` /
  `hasEventType()`, never directly.
- **Primary drives behavior:** filters, color, calendar priority, grouping. **Secondary tags are
  display/search only:** chips (`EventTypeTags.vue`), search terms, location detection. Don't filter
  on secondary tags — a deliberate decision: LeekDuck tags the same event format inconsistently
  (Rocket "Taken Over" events are sometimes primary `team-go-rocket`, sometimes `event` +
  `team-go-rocket`), so tag-based filtering would confuse users.
- `EVENT_TYPES` entries (`name`, `color`, `priority` — lower = higher on calendar, `category`) each
  become a filter. `EVENT_TAG_TYPES` holds `name` + `color` for tag-only slugs (never primary), which
  stay out of the filters but remain color-customizable via their chips. Unknown slugs fall back to a
  title-cased name and gray (`getEventTypeInfo()` / `getDefaultEventTypeColor()`).
- **Adding a type:** an `EVENT_TYPES` entry (or `EVENT_TAG_TYPES` if it's only ever secondary); add
  it to `$event-types` in `src/styles/style.scss` (filter hover highlighting); handle it in
  `getEventPokemonImages()` if it needs Pokémon images.

### Generated and runtime-only events

Not every event in the store came from the feed — check for these before assuming feed shape:

- **Pseudo sub-events** (`src/utils/eventSubEvents.ts`), generated in `fetchEvents()` from the
  `raidSchedule` / `spotlightSchedule` of primary-`event` parents. Marked with
  `extraData.isRaidHourSubEvent` / `isSpotlightSubEvent` + `parentEventId`; IDs are
  `${parentID}-raid-hour-${date}-${i}` / `${parentID}-spotlight-hour-${date}-${i}`; they copy the
  parent's `eventTypes`.
- **Grouping markers** `_isGrouped` / `_groupedEvents` / `_displayName`, stamped by the store when
  "group similar events" is on (`src/utils/eventGrouping.ts`).
- **Major daily projections** (below): `_isMajorDailyDisplay` + `_sourceEventID`, ID
  `${sourceID}-daily-${date}`. Resolve back to the source event via `useDailyEventDisplay()`
  (`getSourceEventID()` / `getEventForDetails()`) before looking up metadata or details.

### Bonuses (`src/utils/eventBonuses.ts`)

`extraData.bonuses` holds every event page's "Bonuses" section as `EventBonusGroup`s in page order
(`title` null = general bonuses; titled = ticket/tier/time-window extras; `*` markers in item text point
at `notes`). `getEventBonusGroups()` is the single source for the detail views (`EventBonuses.vue`) and
the Campfire Output text, with two exceptions:

- **Spotlight Hour** builds its group from `spotlight.bonus` so it keeps our local bonus-type icon (the
  feed item has no image). The calendar-cell icons (`SpotlightBonusIcons`) read `eventMetadata`, not this.
- **Season** is skipped — `SeasonBonuses.vue` renders the same items (plus Daily Discoveries) from
  `extraData.season`.

The legacy `communityday.bonuses` / `bonusDisclaimers` duplicate the new data and are only read for
search. `raidSchedule[].bonuses` is unrelated (per-day raid notes → `raidHourBonuses` on sub-events).

### Major events (`src/utils/eventMajor.ts`)

`MAJOR_CALENDAR_EVENT_TYPES` = `pokemon-go-fest`, `pokemon-go-tour`, `wild-area`. Instead of
multi-day bars they render as a box per day in each calendar cell (`useCalendarDaySingleEvents`),
with raid bosses scoped to that day's `raidSchedule`.

- **Global vs location-specific** — `getMajorCalendarEventVariant()`: a location tag
  (`location-specific` / `in-person-event`, via `isLocationSpecificEvent()`) wins; otherwise
  "global"/"finale" in the ID/name/link → global; otherwise location-specific. A missing tag does
  **not** mean global — LeekDuck leaves some city events untagged (e.g. 2025 GO Fest cities).
- **Watermark** — `getEventWatermarkClass()` returns classes for the shared partial
  `src/styles/_event-watermark.scss` (globe = global, map pin = location-specific). Major events
  always get one; non-major events get the pin only when location-tagged. Each host (tooltip,
  timeline card, single-day cell) tunes size/opacity/color via `--event-watermark-*` vars: major =
  tinted with the type color, non-major = gray. The major box styling (gradient background, thick
  border) is separate and major-only; non-major single-day cells with a pin only get a taller
  `min-height` so the pin fits.

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

Sprite overlays (`SPRITE_EFFECTS`: Dynamax clouds, Shadow aura, Gigantamax) come from two places:
an **event-level** effect (`getEventSpriteEffect()` — Max Mondays, Dynamax Max Battle titles, Shadow
Raids), and a **per-sprite** effect that wins over it. Boss lists derive the per-sprite effect from
the boss name prefix via `splitSpriteEffectPrefix()` (`Dynamax X`, `Shadow X`), so prefixed bosses
inside any event type (e.g. Dynamax Dialga in a Wild Area schedule) get their overlay.

Sprite downloads can be held off: on touch devices `CalendarMonthPager.vue` keeps the neighbor
months mounted for swiping, and they render sprites as same-size empty boxes until a swipe heads
their way (`provideSpriteLoading()` / `useSpriteLoading()` in `PokemonImage.vue`). Check this first
when a calendar sprite looks "missing".

---

## Stores (`src/stores/`)

| Store (file)       | Responsibility                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `events`           | Fetches the events feed, generates sub-events, applies grouping, caches per-event `eventMetadata`   |
| `eventFilter`      | Persists disabled (primary) type keys + hidden event IDs                                            |
| `eventTypeColors`  | Persists per-type color overrides; defaults via `getDefaultEventTypeColor()`                        |
| `calendarSettings` | Persisted display prefs: first day of week, grouping, sprite toggles, font size, manual time offset |
| `raids`            | Current raid bosses feed                                                                            |
| `seasons`          | Season feed (daily discoveries, season bonuses); keeps neighbors so boundary weeks resolve          |
| `pokemonData`      | Lazily loaded Pokémon stats for CP calculations (`mgrann03/pokemon-resources`)                      |
| `campfireTemplate` | Persisted Campfire event text template                                                              |
| `eventHighlight`   | Hovered/focused event for cross-component highlighting                                              |
| `theme`            | Light/dark/system theme, persisted                                                                  |
| `toasts`           | Ephemeral toast queue                                                                               |
| `userMessages`     | Dismissible banners with version-keyed persistence                                                  |
| `app`              | Checks `/version.json` to detect a newer deployed build (update prompt)                             |

## URL state (`src/composables/useUrlSync.ts`)

The URL is the source of truth for navigation and open panels/modals, so they're shareable and work
with back/forward. Opening pushes a history entry; closing replaces it. Follow the same pattern for
any new panel or modal.

- `month` (1-based in the URL, 0-based internally per Day.js) + `year`; cleared on the current month.
- `settings=1`, `raids=1` — panels.
- `event` (+ optional `eventDay`) — selected event (detail panel / tooltip deep link).
- Modals: `addToCalendar`, `campfire`, `hideEvent` (event ID); `editColor` (event type key).

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

## Where things live

- `src/utils/` — pure event/Pokémon logic (no Vue reactivity)
- `src/composables/` — stateful `useX()` logic
- `src/stores/` — Pinia stores (above)
- `src/styles/` — global SCSS + shared partials (e.g. `_event-watermark.scss`)
- `src/constants/storage.ts` — localStorage keys
- `planning/` — feed snapshots and planning notes (not shipped)
