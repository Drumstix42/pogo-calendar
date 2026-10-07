<template>
    <div class="offcanvas-body">
        <CurrentRaidBossesDetail class="raid-bosses-detail-fill" />
    </div>
</template>

<script setup lang="ts">
import CurrentRaidBossesDetail from '@/components/CurrentRaidBossesDetail.vue';
</script>

<style scoped>
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
</style>
