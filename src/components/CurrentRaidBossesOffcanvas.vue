<template>
    <div class="offcanvas-header">
        <h5 class="offcanvas-title mb-0 d-flex align-items-center gap-2">
            <CalendarDays :size="16" class="flex-grow-0" />
            Current Raid Bosses
        </h5>
        <button class="btn btn-icon-ghost btn-sm" @click="$emit('close')" aria-label="Close raid boss details">
            <X :size="16" />
        </button>
    </div>
    <div class="offcanvas-body">
        <CurrentRaidBossesDetail class="raid-bosses-detail-fill" />
    </div>
</template>

<script setup lang="ts">
import { CalendarDays, X } from '@lucide/vue';

import CurrentRaidBossesDetail from '@/components/CurrentRaidBossesDetail.vue';

defineEmits<{
    close: [];
}>();
</script>

<style scoped>
.offcanvas-header {
    background-color: var(--bs-tertiary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
}

.offcanvas-title {
    font-weight: 600;
    color: var(--bs-body-color);
}

.offcanvas-body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0;
}

.raid-bosses-detail-fill {
    flex: 1 1 auto;
    min-height: 0;
}

/* `.raid-bosses-tier-list` / `.raid-bosses-bottom-link` live in the CurrentRaidBossesDetail child;
   reach in via :deep() to place the padding this offcanvas body needs. */
.raid-bosses-detail-fill :deep(.raid-bosses-tier-list) {
    padding: 1rem 1rem 0 1rem;
}

.raid-bosses-detail-fill :deep(.raid-bosses-bottom-link) {
    padding: 0.5rem 1rem calc(1rem + env(safe-area-inset-bottom)) 1rem;
}

.btn {
    padding: 0.37rem;
}
</style>
