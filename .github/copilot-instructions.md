# PoGo Calendar - AI Coding Agent Instructions

## CRITICAL WORKFLOW - MUST FOLLOW

1. **Assess the scope**: Determine if the request is a new feature/request OR a larger change that affects multiple files or components
2. **For new requests or larger changes**: First outline your approach and wait for user confirmation before implementing
3. **For smaller changes**: Implement directly while following all Development Standards
4. **Never add "improvements" beyond the specific request** - implement exactly what was asked
5. **Focus on code changes only** - do not run dev servers or builds unless specifically requested
6. **Use minimal comments** - let descriptive naming speak for itself, but add comments for complex logic (why, not what)
7. **Avoid overly pleasing language** - be concise and to the point when communicating (anything beyond code changes)
8. **Refer to the "Development Standards" section below for coding conventions and patterns**

## Project Overview

Vue 3 + TypeScript calendar for Pokemon GO events. Events fetched from external API with Pokemon-themed UI.

## Architecture

- **Vue 3 + TypeScript**: Composition API with `<script setup lang="ts">`
- **Pinia**: Composition style stores with `useLocalStorage` from VueUse
- **Day.js**: UTC timezone conversion - always use `dayjs.utc(event.start).local()`
- **Bootstrap 5**: Custom SCSS theming with `data-bs-theme` attribute

## Development Standards

- Use `<script setup>` syntax with TypeScript
- VueUse breakpoints: `breakpointsBootstrapV5`
- FloatingVue tooltips with touch disabled
- `DATE_FORMAT` constants for consistency
- CSS variables for theming
- Responsive design patterns (mobile/desktop components), with Bootstrap 5 classes and media queries
- For icons, use the Lucide Vue library
- Use `src/utils/pokemonMapper.ts` for Pokemon name normalization and ID lookup
- Don't set function return types unless it improves clarity
- Use `function` syntax over `const` when possible for consistency

## Commit Messages

- Use a conventional prefix such as `fix:`, `feat:`, `chore:`, `refactor:`, or `docs:`
- Keep the subject line under 50 characters and write it in the imperative mood
- Use bullet points in the body for high-level functional changes and why they matter, focusing on user-facing impact
- When the change scope is small, prefer a single concise bullet in the body
- Avoid low-level implementation details in the commit body
- Prefer git command line instead of tools

## Component Standards (large-file refactors)

Full standard: `AGENTS.md → Component Standards`. Active refactor tracker: `REFACTOR.md`.

- Soft target: `.vue` files under ~300 lines; flag over ~400. Goal is reduced complexity per file, not line golf. Large `<style scoped>` blocks count as bloat.
- Keep templates thin — push multi-branch ternaries / derived data into `computed` or composables. Lift inline `:style`/`:class` objects with >3 keys to a `computed`.
- Stateful/reusable logic → composable (`useX.ts`); pure helpers → `src/utils/`; persisted/global state → Pinia store.
- Split sub-components at clear seams (template region + its styles); move CSS with its markup. Promote to a folder when a component grows its own parts.
- Don't analyze a component in isolation — scan connected/related components (imports, importers, siblings doing similar work). Look for duplicated logic to extract once and share, and for new parts/composables that belong in a shared location because a neighbor could reuse them. Widening scope to a neighbor needs user sign-off; otherwise note it as a follow-up.
- Refactors are **behavior-preserving**: no functional/output changes. Surface modernization ideas and suspected bugs as notes — don't smuggle them into a refactor.
- Refactor in **small, independently verifiable stages** — one seam per step, app left working and manually confirmable between steps — not one big-bang rewrite. With no test suite, the size of a step is the size of the debugging haystack. Run `type-check`/`lint` as a near-complete gate, not after every edit.

## Critical Patterns

### Pinia Stores

Composition style stores. Make use of VueUse `useLocalStorage` for any automatic persistence:

```typescript
export const useCalendarSettingsStore = defineStore('calendarSettings', () => {
    const firstDayOfWeek = useLocalStorage<FirstDayOfWeek>(STORAGE_KEYS.FIRST_DAY_OF_WEEK, 'Sunday');
    return { firstDayOfWeek };
});
```

### Event System

- Events fetched from: `https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json`
- Event types defined in `src/utils/eventTypes.ts` with color/priority mappings
- Date handling uses Day.js with UTC timezone conversion: `dayjs.utc(event.start).local()`
- Event filtering and grouping controlled by multiple stores

### Pokemon Integration

- Pokemon sprites served from a multi-tier CDN chain with runtime `@error` fallback handled in `PokemonImage.vue` (static PNGs → PokeMiners `Pokemon/` → PokeMiners `Pokemon - 256x256/` → pokemongohub mirror → LeekDuck image)
- Use `src/utils/pokemonMapper.ts` for name normalization and ID lookup
- Sprite validation via `VALID_ANIMATED_SPRITES` and `VALID_STATIC_SPRITES` constants
- Smart Unicode normalization handles accented characters and gender symbols

### Key Files

- `src/stores/` - Pinia composition stores
- `src/utils/` - Event/Pokemon business logic
- `src/composables/useUrlSync.ts` - URL state synchronization
- `src/constants/storage.ts` - localStorage keys
