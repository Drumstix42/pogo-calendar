# PoGo Calendar — Agent Notes

Companion to `.github/copilot-instructions.md`. Deeper notes on subsystems, naming conventions, and edge cases. These are high-level orientations — treat them as guidance, not strict rules. Always read the actual code before making assumptions.

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

Three-tier fallback, chained at runtime in `PokemonImage.vue`:

| Tier | Source                                               | Condition                                   |
| ---- | ---------------------------------------------------- | ------------------------------------------- |
| 1    | `mgrann03/pokemon-resources` — static PNGs           | Name must be in `VALID_STATIC_SPRITES`      |
| 2    | `PokeMiners/pogo_assets` — `pm{id}.f{FORM}.icon.png` | ID + form must be in `POKEMON_FORM_MAP`     |
| 3    | `db.pokemongohub.net` — same filename as tier 2      | `@error` fallback; use when PokeMiners 404s |

`getSpriteFallbackUrl()` derives the tier-3 URL via `swapUrlBase()` — same filename, different host. PokeMiners form suffixes use `f` prefix + uppercase (e.g. `fMEGA`, `fBURN`). Known alias: `crownedsword`/`crownedshield` both map to `CROWNED`.

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
