<template>
    <div class="raid-bosses-detail">
        <div class="raid-bosses-tier-list">
            <div v-for="tierGroup in raidsStore.tierGroups" :key="tierGroup.tier" class="tier-detail-group">
                <RaidTierHeader :label="tierGroup.label" :icon-size="20" underline />
                <RaidTierGroupImages
                    :groups="tierGroup.groups"
                    :height="50"
                    event-type="raid-battles"
                    :use-animated="calendarSettings.useAnimatedImages"
                />
            </div>
        </div>

        <div class="raid-bosses-bottom-link">
            <a
                href="https://leekduck.com/raid-bosses/"
                target="_blank"
                rel="noopener noreferrer"
                class="link-neutral link-underline-opacity-0 link-underline-opacity-100-hover d-inline-flex align-items-center gap-1"
                style="font-size: 0.75rem"
            >
                View on LeekDuck <ExternalLink :size="12" />
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ExternalLink } from '@lucide/vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useRaidsStore } from '@/stores/raids';

import RaidTierGroupImages from '@/components/Calendar/RaidTierGroupImages.vue';
import RaidTierHeader from '@/components/Calendar/RaidTierHeader.vue';

const calendarSettings = useCalendarSettingsStore();
const raidsStore = useRaidsStore();
</script>

<style scoped>
.raid-bosses-detail {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.raid-bosses-tier-list {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

.raid-bosses-bottom-link {
    flex-shrink: 0;
    padding-top: 0.5rem;
}

.tier-detail-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 1rem;
}

.tier-detail-group:first-child {
    margin-top: 0;
}

/* `.tier-label` lives in the RaidTierHeader child, whose underline replaces dividers between groups. */
:deep(.tier-label) {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: color-mix(in srgb, var(--bs-body-color) 82%, transparent);
}

/* `.tier-group` lives in the RaidTierGroupImages child - one per tier detail group (the normal-boss
   row, and the shadow-boss row when present); reach in via :deep(). */
:deep(.tier-group) {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 0.35rem;
}
</style>
