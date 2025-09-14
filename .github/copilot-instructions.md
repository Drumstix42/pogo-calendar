# PoGo Calendar - AI Coding Agent Instructions

## Project Overview

Vue 3 + TypeScript calendar for Pokemon GO events. Events fetched from external API with Pokemon-themed UI.

## Architecture

- **Vue 3 + TypeScript**: Composition API with `<script setup lang="ts">`
- **Pinia**: Composition style stores with `useLocalStorage` from VueUse
- **Day.js**: UTC timezone conversion - always use `dayjs.utc(event.start).local()`
- **Bootstrap 5**: Custom SCSS theming with `data-bs-theme` attribute

## Development Standards

- When implementing a new request, or larger change, first outline the approach. Changes/iterations can be made based on feedback.
- Use `<script setup>` syntax with TypeScript
- Minimal comments - descriptive naming instead
- VueUse breakpoints: `breakpointsBootstrapV5`
- FloatingVue tooltips with touch disabled
- `DATE_FORMAT` constants for consistency
- CSS variables for theming
- Responsive design patterns (mobile/desktop components), with Bootstrap 5 classes and media queries
- Focus on code changes; no need to run dev servers or builds
- For icons, use the Lucide Vue library
- Use `src/utils/pokemonMapper.ts` for Pokemon name normalization and ID lookup

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

- Pokemon sprites served from external CDN with fallback validation
- Use `src/utils/pokemonMapper.ts` for name normalization and ID lookup
- Sprite validation via `VALID_ANIMATED_SPRITES` and `VALID_STATIC_SPRITES` constants
- Smart Unicode normalization handles accented characters and gender symbols

### Key Files

- `src/stores/` - Pinia composition stores
- `src/utils/` - Event/Pokemon business logic
- `src/composables/useUrlSync.ts` - URL state synchronization
- `src/constants/storage.ts` - localStorage keys
