<template>
    <div class="spotlight-bonus-icons">
        <EvolveIcon v-if="category === 'evolve'" :size="13" class="evolve-icon" />
        <TransferIcon v-else-if="category === 'transfer'" :size="13" />
        <img v-if="iconUrl" :src="iconUrl" class="bonus-type-icon" />
    </div>
</template>

<script setup lang="ts">
import EvolveIcon from '@/components/Icons/EvolveIcon.vue';
import TransferIcon from '@/components/Icons/TransferIcon.vue';

interface Props {
    category: string | undefined;
    iconUrl: string | null | undefined;
}

defineProps<Props>();
</script>

<style scoped>
.spotlight-bonus-icons {
    z-index: 10;
    pointer-events: none;
    position: absolute;
    right: 0;
    bottom: 2px;
    color: var(--bs-body-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    padding: 0 1px;
    background-color: color-mix(in srgb, var(--calendar-cell-bg) 90%, transparent);
    border-radius: 8px;
    filter: grayscale(20%);

    @media (min-width: 576px) {
        right: 2px;
        bottom: 3px;
    }

    @media (min-width: 992px) {
        position: relative;
        top: 2px;
        right: auto;
        bottom: auto;
        gap: 3px;
    }

    @media (min-width: 1200px) {
        flex-direction: row;
    }
}

.calendar-day.today .spotlight-bonus-icons {
    background-color: color-mix(in srgb, var(--calendar-today-bg) 90%, transparent);
}

.spotlight-bonus-icons > svg {
    flex-shrink: 0;
    background-color: color-mix(in srgb, var(--calendar-cell-bg) 50%, transparent);
    border-radius: 50%;
}

.spotlight-bonus-icons .bonus-type-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    object-fit: contain;
    /* background-color: color-mix(in srgb, var(--calendar-cell-bg) 50%, transparent);
    border-radius: 50%; */
    filter: drop-shadow(1px 1px 1px color-mix(in srgb, black 40%, transparent));
}

.evolve-icon {
    color: #aa403a;
}

[data-bs-theme='dark'] .evolve-icon {
    color: #ee726e;
}
</style>
