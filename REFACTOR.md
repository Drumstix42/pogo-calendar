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

| #   | Feature / file                                                                                     | Lines (T/script/style)  | Status | Result                            | Priority |
| --- | -------------------------------------------------------------------------------------------------- | ----------------------- | ------ | --------------------------------- | -------- |
| 1   | [CalendarDay.vue](src/components/Calendar/CalendarDay/CalendarDay.vue)                             | 1320 / ~494 / ~820      | ✅     | 226 (orchestrator); see notes     | P1       |
| 2   | [TimelineEvent.vue](src/components/Calendar/TimelineEvent/TimelineEvent.vue)                       | 931 / ~424 / ~469       | ✅     | 428 (orchestrator); see notes     | P1       |
| 3   | [EventTooltip.vue](src/components/Calendar/EventTooltip/EventTooltip.vue)                          | 795 / ~347 / ~290       | ✅     | 382 (orchestrator); see notes     | P2       |
| 4   | [Calendar.vue (page)](src/pages/Calendar.vue)                                                      | 525 / ~213 / ~265       | ✅     | 312 (orchestrator); see notes     | P2       |
| 5   | [EventFilterOptions.vue](src/components/CalendarOptions/EventFilterOptions/EventFilterOptions.vue) | 516                     | ✅     | 114 (orchestrator); see notes     | P2       |
| 6   | [EventTimeline.vue](src/components/Calendar/EventTimeline/EventTimeline.vue)                       | 542                     | ✅     | 74 (orchestrator); see notes      | P3       |
| 7   | [EditEventColorModal.vue](src/components/Calendar/EditEventColorModal.vue)                         | 430                     | ✅     | 211 (orchestrator); see notes     | P3       |
| 8   | [eventTypes.ts](src/utils/eventTypes.ts)                                                           | 849 (board's 747 stale) | ✅     | 449 (types + registry); see notes | P3       |
| 9   | [eventPokemon.ts](src/utils/eventPokemon.ts)                                                       | 566                     | ⬜     | —                                 | P3       |
| 10  | [EventTimeDisplay.vue](src/components/Calendar/EventTimeDisplay.vue)                               | 353                     | ⬜     | —                                 | P4       |
| 11  | [EventOptions.vue](src/components/CalendarOptions/EventOptions.vue)                                | 331                     | ⬜     | —                                 | P4       |
| 12  | [HideEventModal.vue](src/components/Calendar/HideEventModal.vue)                                   | 363                     | ✅     | 220; adopted BaseModal (in #7)    | P4       |

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
- **Manual checks:** tooltip content across event types (raids, spawns, research, seasonal) at all four
  call sites — CalendarDay single-day + multi-day bar, `SeasonDailyChip`, `EventDetailOffcanvas`
  (the `:scrollable="false"` variant). Confirm sticky schedule headers while scrolling, grouped-day
  tooltips, and the Timeline sidebar (expanded day-sections + fallback tiers, collapsed card) since it
  now shares the tier-image leaf. Light + dark.
- **Realized split** (EventTooltip.vue 795 → **382-line orchestrator**, promoted to
  `src/components/Calendar/EventTooltip/`):
    - Sub-components in `EventTooltip/`: `EventTooltip.vue` (orchestrator — root shell, grouped + single
      event cards, the major-tooltip mask CSS, body/extras/bottom-link), `EventTooltipHeader.vue` (101 —
      type-name bar + color-edit + hide button, owns its modal handlers + CSS),
      `EventTooltipScheduleSections.vue` (143 — the `.schedule-section` list with a `labelMode` prop
      covering both the `fallback` variant (single/grouped, day-name aware, inline label color) and the
      `plain` variant (multi-day schedule, pre-formatted `labelText`, CSS-driven all-day color); owns all
      `.schedule-section*`/`.schedule-label`/`.schedule-time` CSS).
    - Shared component `src/components/Calendar/RaidTierGroupImages.vue` (45 — the `.tier-group` →
      `.tier-images` → `PokemonImage` loop). **Adopted by both EventTooltip and
      [TimelineRaidSchedule.vue](src/components/Calendar/TimelineEvent/TimelineRaidSchedule.vue)** (180 →
      144), replacing 7 near-duplicate loops total. Owns only the identical `.tier-images` rule; each
      consumer keeps its own `.tier-group`/`.tier-label` values via `:deep()` (tooltip 0.8rem labels vs.
      timeline 0.75rem — left un-unified to stay behavior-preserving).
    - Composable `src/composables/useEventTooltip.ts` (167 — `(props)`-bound schedule/tier resolution +
      display helpers: parent-name lookup, per-event tier/section builders, `scheduleDaySectionsWithTierGroups`,
      `getMajorTooltipClass`, `isShadowRaid`, `scheduleTargetDayName`, `highlightDayOfWeek`).
    - Util `src/utils/eventTooltipSchedule.ts` (113 — pure `buildFullRaidScheduleDaySections(event, useAnimated)`
        - the `TooltipScheduleSection`/`TooltipScheduleDaySection` types). Deliberately **not** merged with
          `timelineSchedule.ts` (diverges: no `raidHours`, plain default labels, `sortKey: 0`).
- **Findings:**
    - **Scope adjusted (no `EventTooltipGroupedEvents.vue`):** the proposed grouped-events component was
      dropped after implementation showed the grouped and single event cards **share ~90 lines of CSS**
      (`.event-time-info` + the `major-tooltip-*` mask variants across 3 breakpoints + dark, `.event-content`,
      `.event-text`, `.grouped-event-name`, `.parent-event-name`). Splitting them would duplicate that
      cohesive card surface across two scoped files — a maintenance hazard, not a complexity win. Both cards
      stay in the orchestrator; the schedule-section list (the genuinely-repeated seam) was extracted instead.
    - **Orchestrator still 382 lines (over the ~300 soft target):** ~190 of those are the cohesive event-card
      scoped CSS (above). Like #1/#2's card shells, this is one surface, not a separable seam.
    - **Cross-boundary CSS handled with `:deep()`:** sticky-header backgrounds key off the root
      `.event-tooltip.is-scrollable` but the `.schedule-section-header` now lives in the child, so those
      rules became `.event-tooltip.is-scrollable :deep(.schedule-section-header)`. Base `.tier-group`/
      `.tier-label` styling reaches the leaf the same way; the `.schedule-section`-contextual tier margins
      moved into the schedule-sections child.
    - **`getScheduleLabelStyle` simplified on the way out:** the old helper ignored its `label` arg (only
      `isAllDay` mattered) and both fallback `<span>` branches produced identical inline styles — collapsed
      to one span + one `labelStyle(isAllDay)` in the child.
    - **Typing smell (carried over, not changed):** `(event as any)._isGrouped` guards in the template.
    - **Follow-up option:** the tier-image leaf could fully own `.tier-group`/`.tier-label` if the tooltip
      (0.8rem) and timeline (0.75rem) label sizes + group gaps were unified — a small intentional visual
      tweak, deferred to avoid changing the just-settled Timeline component's output here.

### 4. Calendar.vue (page)

- **Why:** 525-line page orchestrator mixing self-contained UI regions (time-offset banner, filter
  summary, two teleported offcanvas wrappers) with data-fetch lifecycle and overlay/keyboard wiring.
  The bulk was CSS — most of it owned by the two offcanvas regions, not the page layout.
- **Manual checks:** ✅ month navigation + URL sync; ✅ options offcanvas open/close (gear, backdrop,
  `Esc`, close button), slide-in, **slider-interacting** state, mobile full-width; ✅ event-detail
  bottom drawer on touch (open/backdrop-close/close button + body scroll lock); ✅ time-offset banner
  (set a manual offset → label/value/tz + Reset); ✅ filter summary (counts/pluralization, desktop
  tooltip, touch "Tap to open" line, click scrolls to filters); ✅ timeline sidebar layout at ≥1400px.
  _(Verify light + dark, mobile + desktop.)_
- **Realized split** (Calendar.vue 525 → **312-line orchestrator**; keeps the page-grid layout +
  CSS, store/modal wiring, settings↔URL sync, `selectedEvent` computeds, Escape handler):
    - Sub-components in `src/components/Calendar/`: `TimeOffsetIndicator.vue` (60 — banner + its
      `effectiveTimezoneLabel` helper, reads `calendarSettings`), `FilterSummary.vue` (62 — filter
      summary button + its `v-if` guard, reads `eventFilter`/`isTouchDevice`, emits `open-filters`),
      `CalendarOptionsOffcanvas.vue` (77 — Teleport/Transition/backdrop wrapping `CalendarOptions`;
      `:show` + `@close`), `EventDetailDrawer.vue` (92 — Teleport/Transition/backdrop wrapping the
      existing `EventDetailOffcanvas`; `:show`/`:event`/`:is-single-day`/`:target-date` + `@close`).
    - Composable `src/composables/useCalendarDataRefresh.ts` (45 — on-mount events/seasons fetch +
      `liveHour`/`windowFocused` refetch watches; encapsulates `useCurrentTime`/`useWindowFocus`/
      `useSeasonsStore`).
    - Shared `.offcanvas-fade-*` backdrop-fade base lifted to global `src/styles/style.scss` (used by
      both offcanvas wrappers); each wrapper keeps its own panel-transform rules scoped.
- **Findings:**
    - **Constraint preserved (cross-component CSS):** `CalendarOptions.vue` has a **global** `<style>`
      block (`.slider-interacting .calendar-options-offcanvas` / `.calendar-options-backdrop`) reaching
      the page's offcanvas. Class names were kept identical in `CalendarOptionsOffcanvas.vue` so those
      rules still apply. Worth noting for any future rename.
    - **Modernization applied (approved, mild behavior change):** the manual `keydown`
      `addEventListener`/`removeEventListener` (onMounted/onUnmounted) → VueUse `useEventListener`; the
      body-overflow `watchEffect` → VueUse `useScrollLock(document.body)` driven by a `watchEffect`. Both
      `onMounted`/`onUnmounted` hooks were removed. `useScrollLock` changes the lock _mechanism_ (adds
      iOS touch handling, restores original overflow on unmount) — intentional, verify body scroll lock
      on touch.
    - **Left intentionally in the orchestrator:** the settings↔URL two-way sync + `isInitialSync`/100ms
      delay (drives the slide-in animation on a deep-linked `?settings=1` load) and the Escape-priority
      handler (tooltips → blocking overlays/native color picker → close settings). Cohesive page glue,
      entangled with `useUrlSync`/modals/`selectedEventId`; extracting to a composable would need a wide
      interface (and `useUrlSync` can't be called twice — it double-registers its month/year watchers)
      for no real complexity win. _Stage 6 deliberately skipped._

### 5. EventFilterOptions.vue

- **Why:** 516 lines of filter UI (timeline toggle + All/None stats + category filter grid + hidden-events
  list), CSS-dominated.
- **Manual checks:** ✅ toggling event types; ✅ All/None buttons + count text; ✅ hover-highlight on calendar
  (body `data-filter-hover-event-type`); ✅ palette color-edit button (custom-color dot); ✅ hidden-events list +
  show; ✅ "Apply filters to Timeline" switch; persistence. (Verified light + dark, mobile + desktop.)
- **Realized split** (EventFilterOptions.vue 516 → **114-line orchestrator**, promoted to
  `src/components/CalendarOptions/EventFilterOptions/`; keeps the timeline toggle, All/None stats bar,
  helper text + their CSS, composes grid + hidden-list):
    - Sub-components in `EventFilterOptions/`: `EventTypeFilterGrid.vue` (74 — grid container + category
      groups + the body-attr hover-highlight handlers + grid CSS; renders the item), `EventTypeFilterItem.vue`
      (230 — the single filter `<label>`: checkbox area + colored content + palette color-edit button + all
      `.filter-item*`/`.filter-content`/`.filter-color-edit-btn` CSS), `HiddenEventsList.vue` (116 — hidden-events
      region + its CSS).
    - Composable `src/composables/useHiddenEvents.ts` (60 — `{ hiddenEvents, showHiddenEvent }`; single source
      of truth via the stores, consumed by both orchestrator (count) and `HiddenEventsList` (render + action)).
    - Util `src/utils/eventTypeGroups.ts` (36 — pure `groupEventTypesByCategory()` + `CATEGORY_DISPLAY_NAMES`;
      kept out of the already-overloaded `eventTypes.ts` (row #8)).
- **Findings:**
    - **Highlight stays grid-owned** via native event fallthrough (`@mouseenter`/`@mouseleave` on
      `<EventTypeFilterItem>`), keeping the `data-filter-hover-event-type` body-attribute coupling in one place;
      the global consumer at `style.scss:310` is untouched.
    - **`eventGroups` is now a plain const** (was a `computed`) — it derives only from the static `EVENT_TYPES`,
      so behavior is identical. The new util also replaces the old convoluted reverse-lookup-by-title category
      sort with a direct key-ordered sort.
    - **Dead code removed:** the no-op `ref="filterGridContainer"` (no matching `ref()` in script);
      the `.hidden-events-title` CSS rule (no markup referenced it); a commented-out
      `.filter-color-edit-btn.has-custom-color` block.
    - **Typing tightened:** `showHiddenEvent`'s `event: any` → `PogoEvent | null` (via `useHiddenEvents`), and
      the helper now takes the whole `HiddenEventEntry` instead of three redundant args.
    - **Convention/cleanup (approved):** `handleTimelineFilterToggle` arrow → `function` declaration; redundant
      double `eventMetadata[id]` read collapsed to the local `metadata` var.
    - **`EventTypeFilterItem.vue` is 230 lines (over the ~300 soft target is fine, but ~175 are CSS):** one
      cohesive styled element, not a separable seam — same situation accepted in #1–#3.

### 6. EventTimeline.vue

- **Why:** 542 lines (board's 453 was stale) mixing three concerns: event categorization/grouping
  data, imperative scroll-into-view on expand, and per-category rendering with most of the CSS.
- **Manual checks:** ✅ four categories render with count badges (Today / Ongoing / Upcoming &
  Future date-grouped); ✅ collapse/expand persists (`timeline/category-<key>`); ✅ expand-event
  scrolls into view (standalone + ≥1400px sidebar — different scroll containers); ✅ sticky category
  headers park at correct offset (standalone under navbar vs. sidebar); ✅ "No single-day events
  today" message + "N events hidden by filters" indicator; ✅ fade transitions. (Verified light + dark.)
- **Realized split** (EventTimeline.vue 542 → **74-line orchestrator**, promoted to
  `src/components/Calendar/EventTimeline/`; keeps the `.event-timeline` shell + sticky CSS-var defs +
  `.timeline-events`/`.no-events`, composes the category loop):
    - Sub-component in `EventTimeline/`: `TimelineCategorySection.vue` (248 — one `CollapsibleSection`:
      title slot, both render variants (flat list for Today/Ongoing, date-grouped for Upcoming/Future),
      no-events-today message, hidden-events indicator + all category-level CSS). Props
      `(category, categoryEvents, dateGroups, totalCount, hiddenCount, activeEventId)`, emits `activate`.
    - Composable `src/composables/useTimelineCategories.ts` (194 — `filteredEvents`, the `eventData`
      categorization+counts, `groupedByDate`, the 3 extracted computeds, and the exported
      `eventCategories` const + `TimelineDateGroup` type).
    - Composable `src/composables/useTimelineActiveEvent.ts` (30 — `activeEventId` + `setActiveEvent`
      with the scroll-on-expand; `setActiveEvent` arrow → `function` per convention).
    - Util `src/utils/timelineScroll.ts` (51 — pure `getScrollContainer`/`scrollCardIntoView` +
      `TIMELINE_TITLE_BUFFER_PX`; no Vue reactivity → testable).
- **Findings:**
    - **Sticky CSS vars cross the new boundary cleanly:** `--tl-sticky-top` etc. stay defined on
      `.event-timeline` in the orchestrator and inherit into `TimelineCategorySection` (custom props
      ignore scope), so the child's `:deep(.timeline-category-header) { top: var(--tl-sticky-top) }`
      still resolves. No change needed.
    - **Dead/non-functional CSS (moved as-is, behavior-preserving):** `.category-section-content`
      `{ padding: 0 !important }` never matched — it targets the class `CollapsibleSection` applies
      inside _its own_ template scope, so the parent's scoped selector can't reach it. The real
      padding reset is `:deep(.section-content)`. Candidate for removal (in both this and any consumer).
    - **Cleanups:** dropped the two constant `:key` bindings on the inner TransitionGroups (redundant
      now that each category is its own instance); removed the dead commented-out
      `.date-group { overflow: hidden; }` block.
    - **No dedup with #2:** the scroll logic here is bespoke (scrollable-container + sticky-buffer
      aware); the other `scrollIntoView` call sites use the native `el.scrollIntoView()` — not shareable.
- **Fixes applied (post-refactor, approved):**
    - **Empty-state bug fixed:** the `v-if="Object.keys(categorizedEvents).length === 0"` guard was
      _always false_ (the categorized record always has all four keys), so "No upcoming events found"
      was unreachable. Replaced with a `hasAnyEvents` computed (true when any category total > 0; based
      on totals so a fully-filtered view still shows its per-category hidden indicators). **Visible
      behavior change:** the message now renders when the 60-day window genuinely has no events.
    - **`groupedByDate` narrowed:** now typed `Partial<Record<…>>` and only builds the UPCOMING/FUTURE
      keys it ever populated; the orchestrator passes `groupedByDate[key] ?? []` (TODAY/ONGOING got `[]`
      before too — behavior-preserving).
    - **Record-init dedup:** the three identical four-key records in `eventData` now come from an
      `emptyCategoryRecord<T>(fill)` helper.
- **Deferred:**
    - **`.category-section-content` dead CSS** — non-functional `:deep`-scope mismatch (real reset is
      `:deep(.section-content)`); left in place, safe to delete later.
    - **`sortEventsByTimingAndPriority` `any`-typed metadata** — best fixed alongside relocating
      `EventMetadata` in **#8** (details recorded under #8's notes).
- **Connected-component dedup done (`useDisplayTime`):** the
  `liveMinute.value.add(manualTimeOffsetHours * 60, 'minute')` (`displayNow`) + `.startOf('day')`
  (`displayToday`) expression was duplicated across 8 sites. Extracted to
  `src/composables/useDisplayTime.ts` (`{ displayNow, displayToday }` computeds) and adopted by
  `App.vue`, `CalendarGrid.vue`, `CalendarHeader.vue`, `EventTimeDisplay.vue`, `SeasonDailyChip.vue`,
  `stores/seasons.ts`, `stores/events.ts` (its private `getDisplayNow()` now returns `displayNow.value`),
  and `useTimelineCategories.ts`. Behavior-preserving; the stores call the composable at setup (no new
  import cycle — `useDisplayTime` only depends on `calendarSettings` + `useCurrentTime`).

### 7. EditEventColorModal.vue

- **Why:** 430 lines mixing the modal shell (Teleport/Transition/backdrop + Escape + offcanvas
  `inert` handling), the `@jaames/iro` picker (instance lifecycle + hex input + validation, all
  interlocked), and the modal-specific preview/default/save UI. ~218 of those lines were CSS,
  ~140 of which was a modal shell **duplicated near-verbatim** in `HideEventModal.vue` (#12).
- **Manual checks:** ✅ picker wheel + value slider; ✅ hex typing (valid updates wheel/New preview,
  invalid shows red border); ✅ Current bar resets to original, swatch / "Set to Default" reset to
  default; ✅ Save persists (and removes the override when equal to default); ✅ Escape / backdrop /
  X close; ✅ scrollable layout on a short viewport; ✅ opening from the options offcanvas suspends
  its focus trap (`inert`). (Verified light + dark, mobile + desktop.)
- **Realized split** (EditEventColorModal.vue 430 → **211-line orchestrator**; keeps preview
  comparison, default swatch + "Set to Default", save, reset handlers, and the open-snapshot watch):
    - Shared component `src/components/BaseModal.vue` (195 — generic modal shell: Teleport/Transition/
      backdrop/dialog/content/header + close button + Escape + backdrop-click + `inert` handling + all
      shell CSS). Props `show`/`title`/`scrollable`/`inertSelector`; `close` emit; default body slot.
      Lives at the **components root** alongside `CollapsibleSection.vue`/`ThemeSelector.vue` (app-wide,
      zero calendar coupling). **Adopted by both EditEventColorModal and `HideEventModal.vue` (#12).**
    - Sub-component `src/components/Calendar/ColorPickerField.vue` (156 — iro wheel/value-slider + hex
      input as `v-model:modelValue` (hex string); owns the iro instance lifecycle, `handleHexInput`/
      `isValidHex`, `isHexInputValid`, and the picker/hex/`:deep(.IroSlider)` CSS). iro now inits/destroys
      on the child's own mount/unmount (it mounts with the modal's `v-if`), so the parent watch only
      snapshots the color + nothing else. The default-color button is passed in via the default slot.
    - Util `src/utils/dom.ts` (6 — `setElementInert(el, inert)`, a Vue-free `el?.toggleAttribute('inert', …)`
      helper; new generic-DOM home, as no existing domain util fit).
- **Findings:**
    - **Dead CSS removed:** the `.modal-body p` rule had no `<p>` in this modal's body (it was carried
      over from the shared shell; the real `<p>` consumer is HideEventModal, which kept its own copy).
    - **Behavior note (picker lifecycle):** the iro picker is now created/destroyed by `ColorPickerField`'s
      mount/unmount instead of a `show`-watch + `nextTick`. Equivalent (the field only renders inside the
      modal's `v-if="show"`); reset/default/hex all flow through `v-model` (parent reassigns `currentColor`
      → child's `modelValue` watch drives the iro instance, guarded against redundant sets).
    - **`inert` is the right primitive (no library):** there is **no focus-trap library** in the repo; the
      offcanvas is a plain Teleport using Bootstrap `.offcanvas` CSS classes. `inert` is the modern platform
      primitive for "suspend a subtree," so no VueUse/`useFocusTrap` change was warranted.
    - **Cross-boundary CSS:** all shell selectors moved to `BaseModal`. Slotted body content keeps its
      styles in each consumer; HideEventModal's `.modal-body p` still resolves because Vue scopes only the
      rightmost selector (`.modal-body p[data-v-hide]` matches BaseModal's `.modal-body` + the slotted `p`).

### 8. eventTypes.ts

- **Why:** 747 lines mixing the `EVENT_TYPES` record, the type union, and many helper functions.
- **Suggested seams (verify):** split data (`EVENT_TYPES`, keys, categories) from behavior
  (date parsing, grouping, sorting, major-event helpers). Keep public import paths stable or update
  all call sites.
- **Carried-in opportunities (from #6):**
    - **`sortEventsByTimingAndPriority(events, eventMetadata: Record<string, any>)` typing
      (eventTypes.ts:533):** the `any`-typed metadata should be `Record<string, EventMetadata>`.
      `EventMetadata` currently lives in `stores/events.ts` (line ~58), so typing it directly from
      here would be backwards layering (util → store) — even a type-only import only avoids the
      _runtime_ cycle, not the smell. The clean fix is to **relocate `EventMetadata` into
      `eventTypes.ts`** (or a shared `types` module) as part of this split, then the param types itself
      naturally. Worth checking whether `EventMetadata`'s own deps (`EventTypeInfoWithoutColor`, etc.)
      already live here, which would make the move low-friction.
    - **Note the layering rule generally:** several `utils/` consumers pass `eventsStore.eventMetadata`
      into helpers here; centralizing the `EventMetadata` type in this file (not the store) keeps the
      dependency direction store → util.
- **Manual checks:** pure-util split, behavior-preserving — no rendering/markup/CSS changed. Smoke-check
  the calendar grid (single-day + multi-day bars, grouped events render), the timeline sidebar (category
  sort/timing order), major-event variant badges, spotlight/CP badges, and the event tooltip/extras. Type
  union + registry unchanged, so colors/priorities/categories are untouched.
- **Realized split** (eventTypes.ts 849 → **449-line module**; keeps the domain-model interfaces,
  the `EVENT_TYPES` registry table, `EventTypeKey`, `TimelineCategory`/`TimelineCategoryKey`, and
  `getEventTypeInfo` — the symbols imported nearly everywhere, so ~40 `PogoEvent`/`EventTypeKey`/
  `EVENT_TYPES` import lines stayed stable). All call sites updated (no barrel; per repo convention).
  Five focused pure-util siblings under `src/utils/`:
    - `eventDate.ts` (46 — `parseEventDate`, `formatEventTime`, `isMultiDayEvent`, `isSameDayEvent`;
      owns its own `dayjs.extend(utc)`).
    - `eventMajor.ts` (37 — `MAJOR_CALENDAR_EVENT_TYPES` + variant types/helpers).
    - `eventSubtype.ts` (70 — `EVENTS_WITH_SUBTYPE`/`isEventWithSubtype`/`getRaidSubType`/
      `getRaidSubTypePriority` + `hasEventExtras`).
    - `eventSort.ts` (48 — `sortEventsByPriority`, `sortEventsByTimingAndPriority`).
    - `eventGrouping.ts` (248 — `EventGroup`/`CalendarEventDisplay` types + `shouldGroupEvents`/
      `groupEventsByType`/`getGroupedEvents`/`hasGroupedEvents`/`getGroupedEventsCount`/`getEventsForDate`/
      `getCalendarEventsForDate`).
- **EventMetadata relocated (carried-in #6 opportunity, done):** `EventMetadata` + `RaidBossTierGroup`
  moved from `stores/events.ts` into `eventTypes.ts`; `sortEventsByTimingAndPriority`'s param tightened
  from `Record<string, any>` → `Record<string, EventMetadata>`. Fixes the store→util layering smell. The
  store now imports both types back from `eventTypes.ts`. Used `import type { Dayjs }` (type-only) for the
  date fields so no runtime `dayjs` import was reintroduced into the now-lighter `eventTypes.ts`.
- **Findings:**
    - **Type-only import cycle (benign):** `eventTypes.ts` now imports `type SpotlightBonusInfo` from
      `spotlightBonus.ts`, which imports `type PogoEvent` back. Purely type-level (erased at compile),
      no runtime cycle; vue-tsc is clean.
    - **Dead grouping trio removed (follow-up #2, ~190 lines):** `shouldGroupEvents`, `groupEventsByType`,
      and `getCalendarEventsForDate` had **no callers** (the calendar grouping migrated into the events
      store long ago — per `groupEventsByType`'s own TODO). Deleted along with the now-orphaned
      `EventGroup`/`CalendarEventDisplay` types; `eventGrouping.ts` shrank **248 → 41 lines** (now just
      `getGroupedEvents`/`hasGroupedEvents`/`getGroupedEventsCount`/`getEventsForDate`) and dropped its
      `useEventTypeColorsStore`/`formatEventName`/`getEventTypeInfo`/`sortEventsByPriority`/`eventDate`
      imports.
    - **Grouping-augmentation fields typed (follow-up #1):** added `_isGrouped`/`_groupedEvents`/
      `_displayName` as optional internal fields on `PogoEvent` (stamped by the events store). Removed
      **all 15 `(event as any)._*` casts** across `eventGrouping.ts`, `eventDisplay.ts`, `events.ts`,
      `CalendarGrid.vue`, `EventTooltip.vue`, `TimelineEvent.vue`, `EventDetailOffcanvas.vue`,
      `MultiDayEventBar.vue`. Resolves the typing smell flagged in #2/#3 too. (`_isMajorDailyDisplay`/
      `_sourceEventID` left on `DailyMajorDisplayEvent`, which already types them.)
    - **Type-only import cycle (benign):** `eventTypes.ts` now imports `type SpotlightBonusInfo` from
      `spotlightBonus.ts`, which imports `type PogoEvent` back. Purely type-level (erased at compile),
      no runtime cycle; vue-tsc is clean.
    - **Likely-dead export:** `getMajorCalendarEventVariantLabel` (eventMajor.ts) has no callers
      (pre-existing — not introduced here). Candidate for removal.
    - **Cleanups (follow-up #3):** dropped the dead `color: '#757575'` field from the `getEventTypeInfo`
      fallback (its return is `EventTypeInfoWithoutColor` — the live grey fallback for unmapped events is
      owned by `eventTypeColors.ts` `getEventTypeColor()`, untouched). Made `sortEventsByPriority` +
      `sortEventsByTimingAndPriority` **pure** (`[...events].sort(...)`) — all 3 callers already pass
      fresh arrays and consume the return value, so behavior-preserving; removes a latent mutation
      footgun for a shared util.
    - **`eventTypes.ts` still 449 lines, but ~200 is the `EVENT_TYPES` data table** and ~210 is domain
      interfaces — data + types, not logic (comparable to the explicitly-out-of-scope constant files).
      The behavioral tangle is gone. Could shrink further by moving the domain-model interfaces to a
      `types`-only module, but that would churn the ~30 `PogoEvent` type-import sites for little gain.

### 9. eventPokemon.ts

- **Suggested seams (verify):** per-event-type resolver functions could split by category; keep
  `getEventPokemonImages()` as the single entry point.
- **Findings:** _(none yet)_

### 10–11

- Scope when reached. Likely smaller, may turn out to be ⏭️ if already cohesive.

### 12. HideEventModal.vue

- **Settled as part of #7.** Adopted the shared `src/components/BaseModal.vue` extracted there,
  dropping its duplicated shell template + handlers (`handleBackdropClick`/`handleKeydown`/show-watch/
  `onBeforeUnmount`) and ~140 lines of shell CSS (363 → 220). Body content (hide buttons, timeline-filter
  switch, cancel) + their styles stay local.
- **Intentional visual change (approved):** the close (X) button was restyled from the local
  fade-on-hover `.btn-close` to the shared `btn-icon-ghost` (the house style used in 11 other
  components) that `BaseModal` standardizes on. Verified light + dark, mobile + desktop.
- **Kept local:** `.modal-body p` text styling (its `<p>` is the only one across both modals; resolves
  against BaseModal's slotted `.modal-body` via Vue's rightmost-selector scoping).
- **Pre-existing (not changed):** the `.form-check-input:checked`/`:focus` rules here duplicate global
  `style.scss` rules — left as-is (behavior-preserving); candidate for cleanup if #12 is revisited.
