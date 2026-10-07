<template>
    <div class="no-events">
        <p>{{ message }}</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    message: string;
}>();
</script>

<style scoped>
.no-events {
    text-align: center;
    padding: 2rem;
    color: var(--bs-secondary-color);
}

.no-events p {
    margin: 0;
    font-style: italic;
}
</style>
