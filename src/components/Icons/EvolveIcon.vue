<template>
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Center filled circle (nucleus) -->
        <circle cx="12" cy="12" r="3" fill="currentColor" />

        <!-- Two thin orbital rings - one more horizontal, one more vertical -->
        <ellipse cx="12" cy="12" rx="8.5" ry="3.8" stroke="currentColor" stroke-width="0.9" fill="none" opacity="0.8" transform="rotate(-10 12 12)" />
        <ellipse cx="12" cy="12" rx="8.5" ry="3.8" stroke="currentColor" stroke-width="0.9" fill="none" opacity="0.8" transform="rotate(80 12 12)" />

        <!-- Two electrons (small gray dots) -->
        <circle cx="5" cy="6" r="1.2" fill="currentColor" opacity="0.7" />
        <circle cx="19" cy="19" r="1.2" fill="currentColor" opacity="0.6" />
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
