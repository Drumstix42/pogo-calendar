<template>
    <div class="category-text d-flex align-items-center gap-2">
        <span class="badge rounded-pill bg-secondary">{{ count }}</span>
        <span class="category-title">{{ title }}</span>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title: string;
    count: number;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.category-text {
    flex-shrink: 0;
    font-size: 0.85rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: var(--bs-body-color);
    white-space: nowrap;

    .badge {
        font-size: 0.75rem;
        line-height: 1;
        padding: 0.25em 0.5em;
    }
}
</style>
