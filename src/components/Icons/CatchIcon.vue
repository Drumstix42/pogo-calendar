<template>
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Pokeball -->
        <circle cx="12" cy="12" r="8" stroke="currentColor" opacity="0.8" stroke-width="1.5" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" opacity="0.8" stroke-width="1.5" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" opacity="0.8" stroke-width="1.5" fill="currentColor" />

        <!-- Single larger 5-point star in top left -->
        <path d="M5 1 L6.5 5.5 L11 6.5 L7 9.5 L8 14 L5 11 L2 14 L3 9.5 L-1 6.5 L3.5 5.5 Z" fill="currentColor" opacity="0.9" />
    </svg>
</template>
<script setup lang="ts">
interface Props {
    size?: number;
}

withDefaults(defineProps<Props>(), {
    size: 15,
});
</script>
