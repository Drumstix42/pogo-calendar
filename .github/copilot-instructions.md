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
