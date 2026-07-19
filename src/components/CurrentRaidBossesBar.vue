<template>
    <template v-if="calendarSettings.showCurrentRaidBosses">
        <VMenu
            v-if="raidsStore.tierGroups.length"
            v-model:shown="menuShown"
            :disabled="isTouchDevice"
            placement="bottom"
            :delay="{ show: 100, hide: 100 }"
            :distance="4"
            :auto-hide="false"
            @apply-show="openRaids"
            @apply-hide="closeRaids"
        >
            <div
                class="raid-bosses-summary"
                role="button"
                tabindex="0"
                aria-label="View current raid boss details"
                @click="handleClick"
                @keydown.enter="handleClick"
                @keydown.space.prevent="handleClick"
            >
                <div v-for="tier in raidsStore.tierSummary" :key="tier.tier" class="tier-chip">
                    <div class="tier-icon-wrapper">
                        <img v-if="RAID_TIER_ICONS[tier.tier]" :src="RAID_TIER_ICONS[tier.tier]" :alt="tier.label" class="tier-egg-icon" />
                        <Egg v-else :size="18" class="tier-egg-fallback-icon" />
                        <span class="tier-count-badge">{{ tier.count }}</span>
                    </div>
                </div>
            </div>

            <template #popper>
                <div class="raid-bosses-popper">
                    <div class="raid-bosses-popper-title">
                        <CalendarDays :size="18" />
                        <span>Current Raid Bosses</span>
                    </div>
                    <CurrentRaidBossesDetail class="raid-bosses-popper-detail" />
                </div>
            </template>
        </VMenu>

        <!-- No data yet (queued behind other fetches, in flight, or not yet attempted) - shows
             indefinitely until the fetch resolves, whether or not `loading` happens to be true
             at this instant. Hidden once we have a definitive answer (loaded-but-empty, or errored). -->
        <div v-else-if="showSkeleton" class="raid-bosses-summary is-skeleton placeholder-glow" aria-hidden="true">
            <span class="placeholder tier-chip-skeleton"></span>
            <span class="placeholder tier-chip-skeleton"></span>
            <span class="placeholder tier-chip-skeleton"></span>
            <span class="placeholder tier-chip-skeleton"></span>
        </div>

        <!-- Desktop hover/click also writes `raidsOpen` (via the VMenu apply-show/hide above), so the
             drawer must be explicitly gated on touch - same reasoning as EventDetailDrawer's :show. -->
        <CurrentRaidBossesDrawer :show="raidsOpen && isTouchDevice" @close="closeRaids" />
    </template>
</template>

<script setup lang="ts">
import { CalendarDays, Egg } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useRaidsStore } from '@/stores/raids';
import { RAID_TIER_ICONS } from '@/utils/currentRaidBosses';

import CurrentRaidBossesDetail from '@/components/CurrentRaidBossesDetail.vue';
import CurrentRaidBossesDrawer from '@/components/CurrentRaidBossesDrawer.vue';

const calendarSettings = useCalendarSettingsStore();
const raidsStore = useRaidsStore();
const { isTouchDevice } = useDeviceDetection();
const { raidsOpen, openRaids, closeRaids } = useUrlSync();

// Desktop popper's own shown state - synced to the `?raids=1` URL param via apply-show/apply-hide.
const menuShown = ref(false);

// No definitive answer yet - covers the fetch actually being in flight, and also the window where
// it's merely queued behind other fetches (see useCalendarDataRefresh), when `loading` is still false.
const showSkeleton = computed(() => !raidsStore.lastFetched && !raidsStore.error);

// Desktop: VMenu (above) handles hover/click. Touch: open the bottom-sheet drawer instead.
function handleClick() {
    if (!isTouchDevice.value) return;
    openRaids();
}

// Auto-open on page load when deep-linked via ?raids=1 (desktop only - touch uses the drawer, which
// is directly bound to `raidsOpen` above).
onMounted(() => {
    if (!isTouchDevice.value && raidsOpen.value) {
        menuShown.value = true;
    }
});
</script>

<style scoped>
.raid-bosses-summary {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.35rem 1rem;
    border-radius: 999px;
    border: 1px solid var(--bs-border-color);
    background-color: var(--bs-tertiary-bg);
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        transform 0.1s ease;
}

@media (pointer: fine) {
    .raid-bosses-summary:not(.is-skeleton):hover {
        background-color: var(--bs-secondary-bg);
        border-color: color-mix(in srgb, var(--bs-body-color) 25%, var(--bs-border-color));
    }
}

.raid-bosses-summary.is-skeleton {
    cursor: wait;
}

.tier-chip-skeleton {
    display: inline-block;
    width: 22px;
    height: 22px;
    border-radius: 50%;
}

.raid-bosses-summary:active {
    transform: scale(0.97);
}

.raid-bosses-summary:focus {
    outline: 2px solid var(--bs-focus-ring-color);
    outline-offset: 1px;
}

.tier-chip {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.tier-icon-wrapper {
    position: relative;
    display: inline-flex;
}

.tier-egg-icon {
    width: 22px;
    height: 22px;
    object-fit: contain;
}

.tier-egg-fallback-icon {
    color: var(--bs-body-color);
}

.tier-count-badge {
    position: absolute;
    bottom: -4px;
    right: -6px;
    min-width: 14px;
    padding: 0 3px;
    border-radius: 999px;
    background-color: var(--bs-secondary-bg);
    color: var(--bs-body-color);
    font-size: 0.65rem;
    font-weight: 600;
    line-height: 14px;
    text-align: center;
    box-shadow: 0 0 0 1px var(--bs-tertiary-bg);
}

/* Desktop popper - fixed title + scrollable body, like EventTooltip's `.is-scrollable` variant. */
.raid-bosses-popper {
    display: flex;
    flex-direction: column;
    width: max(280px, 30vw);
    max-width: 360px;
    max-height: min(45dvh, 480px);
}

.raid-bosses-popper-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
    padding: 0.4rem 0.8rem 0.6rem;
    font-size: 1rem;
    line-height: 1rem;
    font-weight: 700;
    color: color-mix(in srgb, var(--bs-body-color) 85%, transparent);
    border-bottom: 1px solid var(--bs-border-color);
}

.raid-bosses-popper-detail {
    flex: 1 1 auto;
    min-height: 0;
}

/* `.raid-bosses-tier-list` / `.raid-bosses-bottom-link` live in the CurrentRaidBossesDetail child;
   reach in via :deep() to place the padding this popper needs. */
.raid-bosses-popper-detail :deep(.raid-bosses-tier-list) {
    padding: 0.6rem 0.8rem 0 0.8rem;
}

.raid-bosses-popper-detail :deep(.raid-bosses-bottom-link) {
    padding: 0.5rem 0.8rem 0.6rem 0.8rem;
}
</style>
