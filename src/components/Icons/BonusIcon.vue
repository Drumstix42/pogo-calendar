<template>
    <Zap :size="size" fill="currentColor" class="bonus-icon-mark" />
</template>

<script setup lang="ts">
import { Zap } from '@lucide/vue';

interface Props {
    size?: number;
}

withDefaults(defineProps<Props>(), {
    size: 13,
});
</script>

<style scoped>
.bonus-icon-mark {
    flex-shrink: 0;
    color: var(--bonus-indicator-color);
}
</style>
