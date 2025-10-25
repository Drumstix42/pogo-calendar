<template>
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Top arrow pointing left -->
        <path d="M18 8 L4 8 M4 8 L7.5 4.5 M4 8 L7.5 11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Bottom arrow pointing right -->
        <path
            d="M6 16 L20 16 M20 16 L16.5 12.5 M20 16 L16.5 19.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
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
