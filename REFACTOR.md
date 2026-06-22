# Component Refactor Tracker

Living plan for reducing technical debt in large components. Standards live in
[AGENTS.md → Component Standards](AGENTS.md#component-standards-vue-3--ts); this file is the
**process + status board**.

Each feature below is scoped so it can be picked up cold in a **fresh conversation** — point the
agent at this file and the feature's row, and it has everything it needs.

---

## Guiding principles

1. **Behavior-preserving first.** The app must look and behave identically after a refactor. No
   functional changes, no output changes, no markup-class renames that affect styling.
2. **Primary goal: reduce complexity per file.** Split large components into focused
   sub-components, composables, and utils.
3. **Reuse is a sub-goal.** Extracting shared logic is great, but don't contort a refactor to chase
   reuse that isn't there.
4. **Surface, don't smuggle, modernization.** If you spot a cleaner pattern, a likely bug, or dead
   code, **note it** (in the PR description and/or the feature's "Findings" notes) rather than
   silently changing behavior. The user decides whether to action it.
5. **No test suite exists.** Verification is type-check + lint + manual. Extract logic in a
   _testable shape_ (pure functions, composables) so tests can be added later. Type-check is a
   gate for when the refactor is well under way / near complete — not something to run after every
   small edit. (The user watches the IDE for type errors in-flight and will flag them.)
6. **Refactor in small, independently verifiable stages.** Prefer a sequence of small extractions —
   each leaving the app in a working, manually-confirmable state — over one big-bang rewrite. With
   no test suite to localize a regression, the size of a single step is the size of your debugging
   haystack. Keep each step to _one seam_ so that if behavior breaks, the cause is obviously the
   last thing you did. Checkpoint (commit, or pause for the user to eyeball) between stages so a
   single step can be reverted without losing the rest. Big-bang is acceptable only for a genuinely
   atomic change that can't be decomposed — the rare exception, called out explicitly.

---

## Verification protocol (every refactor)

Run before considering a feature done:

```bash
npm run type-check    # vue-tsc --noEmit — must pass clean
npm run lint          # eslint . — must pass clean
npm run format        # prettier --write .
```

Then **manual verification** in `npm run dev`, using the feature's manual-check list (each feature
row specifies what to click/observe). Confirm light + dark theme, and mobile + desktop breakpoints
where the component is responsive.

A refactor that touches rendering is **not done** until it's been eyeballed in the running app.

---

## Per-feature refactor recipe

Follow these steps for each feature. They assume a fresh conversation.

1. **Read this file's principles + the feature row.** Note the listed seams and risks.
2. **Read the target file end to end** (`<template>`, `<script>`, `<style>`). Map responsibilities:
   what state, what derived data, what event handlers, which template regions, which CSS blocks.
3. **Identify seams** — self-contained regions that can become sub-components, and logic clusters
   that can become composables/utils. Confirm against the seams suggested in the row (they may be
   stale; trust the code).
4. **Scan connected/related components.** Don't analyze the target in isolation. Look at what it
   imports, what imports it, and its siblings that do similar work (e.g. the timeline pair, the
   shared tooltip, a modal + its existing composable). For each, ask:
    - Is there **duplicated or near-duplicated logic** that should be extracted once and shared,
      rather than extracted into this component's private composable?
    - Would a sub-component or composable being created here be **reusable by a neighbor**, and
      should it therefore live in a shared location (`src/composables/`, `src/utils/`, a shared
      component) instead of the feature's folder?
    - Will this refactor **leave a sibling diverging** in a way worth folding into scope (or noting
      as a follow-up row)?
      Decide deliberately whether to pull a neighbor into scope, extract shared code both can adopt,
      or just record the opportunity. **Widening scope needs the user's sign-off in step 5** — flag
      it; don't silently expand the refactor.
5. **Propose the split to the user** (file list: new components/composables, what moves where, and
   any connected-component scope from step 4) **and wait for confirmation** before editing. This
   matches the repo's "outline first for larger changes" workflow.
6. **Extract in small, ordered stages — one seam per stage** (see principle 6). After each stage,
   leave the app working and confirm the relevant behavior still holds before moving on; pause for
   the user to eyeball when a stage changes rendering. Order that tends to work: utils/composables
   first (pure logic), then sub-components (template + their CSS), then thin the orchestrator. Run
   the full `type-check`/`lint` gate once the refactor is well under way / near complete, not after
   every edit.
7. **Move CSS with its markup.** When a region becomes a sub-component, its scoped styles go with
   it. Watch for selectors that reach across the old boundary — note them.
8. **Run the full verification protocol** above.
9. **Record findings** — any surfaced modernization ideas, suspected bugs, follow-ups, or
   connected-component opportunities you deferred — in the feature's notes below and the commit/PR
   body.
10. **Update the status table**: set to ✅ Settled, fill the "Result" column (final line counts /
    new files), and check off the manual list.
11. **Commit** with a `refactor:` prefix. One feature per PR keeps diffs reviewable.

### Definition of "Settled"

- Target file meaningfully reduced in complexity (and ideally under the ~300-line soft target, or a
  documented reason it can't be).
- `type-check`, `lint`, `format` all clean.
- Manually verified in light/dark + relevant breakpoints.
- No behavior change (or any intentional change explicitly called out and approved).
- Findings recorded; table updated.

---

## Status board

Status legend: ⬜ Not started · 🟡 In progress · ✅ Settled · ⏭️ Skipped (intentionally left as-is)

Priority: ordered roughly by size × tangle. Tackle top-down; they're largely independent.

| #   | Feature / file                                                                  | Lines (T/script/style) | Status | Result                        | Priority |
| --- | ------------------------------------------------------------------------------- | ---------------------- | ------ | ----------------------------- | -------- |
| 1   | [CalendarDay.vue](src/components/Calendar/CalendarDay/CalendarDay.vue)          | 1320 / ~494 / ~820     | ✅     | 226 (orchestrator); see notes | P1       |
| 2   | [TimelineEvent.vue](src/components/Calendar/TimelineEvent/TimelineEvent.vue)    | 931 / ~424 / ~469      | ✅     | 428 (orchestrator); see notes | P1       |
| 3   | [EventTooltip.vue](src/components/Calendar/EventTooltip.vue)                    | 795 / ~347 / ~290      | ⬜     | —                             | P2       |
| 4   | [Calendar.vue (page)](src/pages/Calendar.vue)                                   | 525 / ~213 / ~265      | ⬜     | —                             | P2       |
| 5   | [EventFilterOptions.vue](src/components/CalendarOptions/EventFilterOptions.vue) | 516                    | ⬜     | —                             | P2       |
| 6   | [EventTimeline.vue](src/components/Calendar/EventTimeline.vue)                  | 453                    | ⬜     | —                             | P3       |
| 7   | [EditEventColorModal.vue](src/components/Calendar/EditEventColorModal.vue)      | 430                    | ⬜     | —                             | P3       |
| 8   | [eventTypes.ts](src/utils/eventTypes.ts)                                        | 747                    | ⬜     | —                             | P3       |
| 9   | [eventPokemon.ts](src/utils/eventPokemon.ts)                                    | 566                    | ⬜     | —                             | P3       |
| 10  | [EventTimeDisplay.vue](src/components/Calendar/EventTimeDisplay.vue)            | 353                    | ⬜     | —                             | P4       |
| 11  | [EventOptions.vue](src/components/CalendarOptions/EventOptions.vue)             | 331                    | ⬜     | —                             | P4       |
| 12  | [HideEventModal.vue](src/components/Calendar/HideEventModal.vue)                | 308                    | ⬜     | —                             | P4       |

**Explicitly out of scope** (large but they're data, not logic — leave alone unless asked):
`constants/pokemonFormMap.ts`, `constants/validAnimatedSprites.ts`, `constants/validStaticSprites.ts`,
`constants/pokemonEntries.ts`.

---

## Feature notes

Per-feature scratch space. Fill the seams during step 3 and findings during step 8. Suggested
seams below are **initial hypotheses from the first survey** — verify against the live code.

### 1. CalendarDay.vue

- **Why:** Largest file; ~820 lines of scoped CSS in one component; dense template with multi-day
  bar positioning logic, major-event handling, single-day events, loading skeleton, tooltips.
- **Suggested seams (verify):**
    - `MultiDayEventBar.vue` — the multi-day bar slot region + its positioning/`:style`/`:class` CSS.
    - `useCalendarDayEvents.ts` — `calendarEvents`, `majorDailyDisplayEvents`, week-boundary and
      slot-positioning helpers (`getWeekBoundaries`, `getEventSlotTop`, `getEventPosition`, etc.).
    - Possibly a single-day events region component.
    - Promote to a `CalendarDay/` folder once it has 2+ parts.
- **Manual checks:** ✅ multi-day bars span/position correctly across week boundaries; grouped events;
  badges/overflow counts; major event daily display; loading skeleton; tooltips on hover (desktop)
  and tap (touch); past-event styling; highlight-on-hover sync. (Verified light + dark, mobile +
  desktop breakpoints across stages 5 & 6.)
- **Realized split** (CalendarDay.vue 1320 → **226-line orchestrator**):
    - Sub-components in `src/components/Calendar/CalendarDay/`: `CalendarDay.vue` (orchestrator),
      `MultiDayEventBar.vue` (280), `SingleDayEvent.vue` (577).
    - Composables in `src/composables/`: `useCalendarDayLayout.ts` (255 — week boundaries, compact-slot
      packing, bar positioning/classes/sizing; exports the shared `EventSlot` type),
      `useCalendarDaySingleEvents.ts` (98 — single-day list + major-daily projections),
      `useDailyEventDisplay.ts` (59 — per-event helpers: source id, variant, display name, details),
      `useCalendarDayEventInteraction.ts` (48 — shared hover/tooltip/tap handlers),
      `useEventHighlightDebounce.ts` (44 — **shared with TimelineEvent**, replaced a duplicated impl).
    - Util `src/utils/eventDisplay.ts` (29 — `getEventDisplayName`/`getEventCount`/`shouldShowBadge`/
      `shouldShowMultiDaySprites`).
    - Shared `.calendar-event-badge` base moved to global `src/styles/style.scss` (alongside the other
      global calendar-event styles).
- **Findings:**
    - **Dead CSS removed (~95 lines):** `.composite-*`, `.tooltip-wrapper`, `.segment-content`,
      `.composite-event-container` and the `.*.composite-*` cap overrides — no markup referenced them.
    - **Dead computed field removed:** `calendarEvents.multiDayEvents` (+ its `multiDay` filter/sort)
      was computed but never read — the rendered multi-day list comes from `eventSlots` via the layout
      composable.
    - **Dead selector dropped:** `.multi-day-event-bar:hover .event-name-container` (multi-day bars
      have no `.event-name-container` element).
    - **`SingleDayEvent.vue` is 577 lines (over the ~300 soft target):** ~440 of those are scoped CSS,
      dominated by the `.major-daily-display-event` card variants across 5 breakpoints + the
      `.spotlight-bonus-icons` block. It's one cohesive region (the major-daily entry is the same
      `.single-day-event` element with extra classes/`::after`, not a separable template seam).
      _Follow-up option:_ lift the major-daily-card CSS into an SCSS partial if it grows further.
    - **Behavior note (debounce):** highlight debounce is now per-bar/per-block (each instance owns its
      timeout) instead of one shared timer per cell. Equivalent for sibling elements (browser fires
      `mouseleave` before `mouseenter`); only differs under overlapping/nested hover, which doesn't occur.
    - **Possibly-dead `:deep(.event-toggle-button)` rules** (now in both sub-components) — `EventToggleButton`
      isn't rendered here; left intact (behavior-preserving), worth confirming before removal.
    - **Connected-component follow-up:** [CalendarGrid.vue](src/components/Calendar/CalendarGrid.vue)
      has its own duplicate `EventSlot` interface; it could adopt the one now exported from
      `useCalendarDayLayout.ts`.
    - **Tooling (incidental):** `eslint .` was scanning `dist/`; added `@eslint/compat` +
      `includeIgnoreFile('.gitignore')` so ESLint mirrors `.gitignore`.

### 2. TimelineEvent.vue

- **Why:** 931 lines, uses `lang="scss"`; single event row in the timeline with heavy state.
- **Manual checks:** ✅ header (badge color, expand chevron hover-fade, palette/hide buttons when
  expanded); ✅ collapsed multi-day raid schedule (compact per-day boss list); ✅ expanded raid
  schedule (day sections, all-day/timed label colors, time pills, tier groups, animated sprites);
  ✅ fallback tier groups; ✅ shadow-raid overlay; ✅ inline pokemon row + overflow; ✅ highlight-on-
  hover (xxl sidebar). (Verified light + dark across stages 4 & 5.)
- **Realized split** (TimelineEvent.vue 931 → **428-line orchestrator**, promoted to
  `src/components/Calendar/TimelineEvent/`):
    - Sub-components in `TimelineEvent/`: `TimelineEvent.vue` (orchestrator — keeps the card shell +
      major-timeline CSS + body name/spotlight + bottom link), `TimelineEventHeader.vue` (141 —
      badge/color-edit/hide/expand header bar + its CSS), `TimelineRaidSchedule.vue` (179 — expanded
      schedule, both day-section and fallback-tier variants, + all `.schedule-*`/`.tier-*` CSS),
      `TimelineCollapsedSchedule.vue` (63 — compact per-day boss list for the non-active card).
    - Composable `src/composables/useTimelineEvent.ts` (158 — display computeds, action handlers,
      and the guarded highlight debounce; takes `(props, emit)`).
    - Util `src/utils/timelineSchedule.ts` (232 — `buildTimelineScheduleDaySectionsWithTierGroups`
      and `buildCollapsedScheduleDayGroups` plus the private time-sort/label helpers; exports the
      `TimelineScheduleDaySection` and `CollapsedScheduleDayGroup` types).
    - Shared into `src/utils/raidTierGroups.ts`: `sortTierLabel` + `buildTierGroupsFromBosses`
      (were **byte-identical duplicates** in `EventTooltip.vue` — both now import them).
- **Findings:**
    - **Dedup done (connected component):** [EventTooltip.vue](src/components/Calendar/EventTooltip.vue)
      had identical `sortTierLabel`/`buildTierGroupsFromBosses` copies; both files now use the shared
      versions in `raidTierGroups.ts`. EventTooltip's _schedule-day_ builder genuinely diverges
      (no `raidHours`, different default labels, `sortKey: 0`) so it was left in place — not shareable.
    - **Cross-boundary CSS:** the card-shell rule `.timeline-event-card:hover .expand-toggle` now
      reaches the child header via `:deep(.expand-toggle)`. `--event-color` (inline on the card) still
      cascades into all children since CSS custom properties ignore scoping.
    - **Two schedule components, not one:** collapsed vs. expanded render in different slots with
      different layouts, so a single component with a `variant` branch was avoided. The trivial 3-line
      `.tier-images` rule is duplicated in each (not worth centralizing).
    - **Orchestrator still 428 lines (over the ~300 soft target):** ~258 of those are scoped CSS,
      almost entirely the cohesive card shell — `.timeline-event-card` + the `major-timeline`
      gradient/`::after` mask variants across 3 breakpoints + dark theme. This is the orchestrator's
      own card surface, not a separable seam. _Follow-up option:_ lift the major-timeline card CSS to
      an SCSS partial if it grows.
    - **Spotlight bonus icons (deferred):** the `.spotlight-bonus-icons` block here duplicates the
      _logic_ of [SpotlightBonusIcons.vue](src/components/Calendar/CalendarDay/SpotlightBonusIcons.vue)
      but with different styling (15px inline row vs. 13px absolutely-positioned in calendar cells).
      Left as-is to avoid disturbing the just-settled CalendarDay component; a shared icon-only
      component (size prop, consumer-owned positioning) is a possible follow-up.
    - **Typing smell (noted, not changed):** `(event as any)._isGrouped` in the bottom-link guard.

### 3. EventTooltip.vue

- **Why:** 795 lines; shared tooltip content rendered from multiple call sites.
- **Suggested seams (verify):** sub-sections of tooltip body; formatting logic → util/composable.
- **Manual checks:** tooltip content across event types (raids, spawns, research, seasonal).
- **Findings:** _(none yet)_

### 4. Calendar.vue (page)

- **Why:** 525-line page orchestrator; likely mixing layout, header controls, and wiring.
- **Suggested seams (verify):** extract toolbar/header regions; move orchestration logic to
  composables.
- **Manual checks:** month navigation, URL sync, options panel, overall layout.
- **Findings:** _(none yet)_

### 5. EventFilterOptions.vue

- **Why:** 516 lines of filter UI.
- **Suggested seams (verify):** per-category filter group sub-component; selection logic → composable.
- **Manual checks:** toggling event types, category groups, persistence, toasts.
- **Findings:** _(none yet)_

### 6. EventTimeline.vue

- **Suggested seams (verify):** timeline layout vs. row rendering; shares concerns with #2.
- **Findings:** _(none yet)_

### 7. EditEventColorModal.vue

- **Suggested seams (verify):** color-picker (`@jaames/iro`) wrapper component; modal logic →
  `useEditColorModal` (already exists — check overlap).
- **Findings:** _(none yet)_

### 8. eventTypes.ts

- **Why:** 747 lines mixing the `EVENT_TYPES` record, the type union, and many helper functions.
- **Suggested seams (verify):** split data (`EVENT_TYPES`, keys, categories) from behavior
  (date parsing, grouping, sorting, major-event helpers). Keep public import paths stable or update
  all call sites.
- **Findings:** _(none yet)_

### 9. eventPokemon.ts

- **Suggested seams (verify):** per-event-type resolver functions could split by category; keep
  `getEventPokemonImages()` as the single entry point.
- **Findings:** _(none yet)_

### 10–12

- Scope when reached. Likely smaller, may turn out to be ⏭️ if already cohesive.
