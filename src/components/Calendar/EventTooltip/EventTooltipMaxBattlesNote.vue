<template>
    <div v-if="note" class="raid-boss-tiers">
        <div class="tier-group">
            <div class="tier-label">Max Battles</div>
            <div class="max-battles-note">
                <img src="/images/icons/max-battle-dynamax.png" alt="Dynamax Max Battles" class="max-battles-emblem" />
                <p class="max-battles-text">{{ note }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { type PogoEvent, hasOpenMaxBattlePool } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();

const note = computed(() => (hasOpenMaxBattlePool(props.event) ? props.event.extraData?.maxbattles?.description : null));
</script>

<style scoped>
.max-battles-note {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding-left: 0.5rem;
}

.max-battles-emblem {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    object-fit: contain;
}

.max-battles-text {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.35;
    color: color-mix(in srgb, var(--bs-body-color) 85%, transparent);
}
</style>
