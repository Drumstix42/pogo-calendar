<template>
    <div class="raid-tier-header" :class="{ underlined: underline }">
        <img v-if="icon" :src="icon" alt="" class="raid-tier-icon" :style="{ width: `${iconSize}px`, height: `${iconSize}px` }" />
        <span class="tier-label">{{ label }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getRaidTierIcon } from '@/utils/raidTierGroups';

interface Props {
    label: string;
    iconSize?: number;
    // Off where section headers above already draw lines (detail views), which would read as busy.
    underline?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    iconSize: 18,
    underline: false,
});

const icon = computed(() => getRaidTierIcon(props.label));
</script>

<style scoped>
/* `.tier-label` text styling is owned by each consumer (sizes differ) and reaches in via :deep(). */
.raid-tier-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

/* A fading underline ties the content below to its tier title */
.raid-tier-header.underlined {
    padding-bottom: 0.3rem;
    border-bottom: 1px solid transparent;
    border-image: linear-gradient(to right, color-mix(in srgb, var(--bs-body-color) 28%, transparent), transparent 85%) 1;
}

.raid-tier-icon {
    flex: 0 0 auto;
    object-fit: contain;
}
</style>
