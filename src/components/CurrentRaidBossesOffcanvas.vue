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
        <div class="raid-bosses-scrollable">
            <CurrentRaidBossesDetail />
        </div>
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

.raid-bosses-scrollable {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom)) 1rem;
}

.btn {
    padding: 0.37rem;
}
</style>
