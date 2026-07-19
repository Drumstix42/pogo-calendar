<template>
    <div class="raid-bosses-tier-list">
        <div v-for="tierGroup in raidsStore.tierGroups" :key="tierGroup.tier" class="tier-detail-group">
            <div class="tier-detail-header">
                <img v-if="RAID_TIER_ICONS[tierGroup.tier]" :src="RAID_TIER_ICONS[tierGroup.tier]" :alt="tierGroup.label" class="tier-detail-icon" />
                <Egg v-else :size="16" class="tier-detail-fallback-icon" />
                <span class="tier-detail-label">{{ tierGroup.label }}</span>
            </div>
            <RaidTierGroupImages
                :groups="tierGroup.groups"
                :height="40"
                event-type="raid-battles"
                :use-animated="calendarSettings.useAnimatedImages"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Egg } from '@lucide/vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useRaidsStore } from '@/stores/raids';
import { RAID_TIER_ICONS } from '@/utils/currentRaidBosses';

import RaidTierGroupImages from '@/components/Calendar/RaidTierGroupImages.vue';

const calendarSettings = useCalendarSettingsStore();
const raidsStore = useRaidsStore();
</script>

<style scoped>
.tier-detail-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 0.6rem;
}

.tier-detail-group:first-child {
    margin-top: 0;
}

.tier-detail-group:not(:first-child) {
    padding-top: 0.6rem;
    border-top: 1px solid color-mix(in srgb, var(--bs-body-color) 22%, transparent);
}

.tier-detail-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.tier-detail-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
}

.tier-detail-fallback-icon {
    color: var(--bs-body-color);
}

.tier-detail-label {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: color-mix(in srgb, var(--bs-body-color) 82%, transparent);
}

/* `.tier-group` lives in the RaidTierGroupImages child - one per tier detail group (the normal-boss
   row, and the shadow-boss row when present); reach in via :deep(). Indented (like
   TimelineRaidSchedule/EventTooltip) so the sprite rows sit under the tier title rather than flush
   with it. */
:deep(.tier-group) {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 0.35rem;
    padding-left: 0.5rem;
}
</style>
