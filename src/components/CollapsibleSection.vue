<template>
    <div class="option-section collapsible-section">
        <div
            class="section-header"
            @click="toggleCollapsed"
            role="button"
            tabindex="0"
            @keydown.enter="toggleCollapsed"
            @keydown.space="toggleCollapsed"
        >
            <div v-if="$slots.icon" class="section-icon">
                <slot name="icon" />
            </div>

            <div class="section-title">{{ title }}</div>

            <button class="btn btn-icon-ghost btn-sm collapse-toggle" aria-label="Toggle section">
                <ChevronDown v-if="isCollapsed" :size="16" class="transition-transform" />
                <ChevronUp v-else :size="16" class="transition-transform" />
            </button>
        </div>

        <Transition name="collapse">
            <div v-show="!isCollapsed" class="option-content">
                <slot />
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';

interface Props {
    title: string;
    storageKey?: string;
}

const props = defineProps<Props>();

const calendarSettings = useCalendarSettingsStore();

const isCollapsed = computed(() => {
    if (!props.storageKey) {
        return false;
    }
    return calendarSettings.isCollapsibleSectionCollapsed(props.storageKey);
});

const toggleCollapsed = () => {
    if (props.storageKey) {
        calendarSettings.toggleCollapsibleSection(props.storageKey);
    }
};
</script>

<style scoped>
.collapsible-section {
    border: none;
    padding: 0;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
    background-color: var(--bs-secondary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    transition: background-color 0.2s ease;
}

.section-header:hover {
    background-color: var(--bs-tertiary-bg);
}

.section-header:focus {
    outline: 2px solid var(--bs-focus-ring-color);
    outline-offset: -2px;
}

.section-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--bs-body-color);
}

.section-title {
    font-weight: 600;
    color: var(--bs-body-color);
    font-size: 0.9rem;
    line-height: 1;
    flex: 1;
}

.collapse-toggle {
    padding: 0.25rem;
    flex-shrink: 0;
}

.collapse-toggle .transition-transform {
    transition: transform 0.2s ease;
}

.option-content {
    padding: 0.8rem 0.8rem;
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
    opacity: 1;
    max-height: 500px; /* Adjust based on your content height */
}
</style>
