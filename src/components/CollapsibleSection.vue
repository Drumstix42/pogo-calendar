<template>
    <div class="collapsible-section" :class="{ open: !isCollapsed, closed: isCollapsed }">
        <div
            v-if="!hideHeader"
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

            <div v-if="$slots.headerActions" class="header-actions" @click.stop>
                <slot name="headerActions" />
            </div>

            <button class="btn btn-icon-ghost btn-sm collapse-toggle" aria-label="Toggle section">
                <ChevronDown v-if="isCollapsed" :size="16" class="transition-transform" />
                <ChevronUp v-else :size="16" class="transition-transform" />
            </button>
        </div>

        <Transition v-if="!hideHeader" name="collapse">
            <div v-if="!isCollapsed" class="section-content" :class="contentClass">
                <slot />
            </div>
        </Transition>

        <!-- When hideHeader is true, always show content without transition -->
        <div v-if="hideHeader" class="section-content" :class="contentClass">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';

interface Props {
    title: string;
    storageKey?: string;
    contentClass?: string;
    hideHeader?: boolean;
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

    &.closed .section-header {
        border-bottom: 1px solid var(--bs-tertiary-bg);
    }
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
    cursor: pointer;
    background-color: var(--bs-tertiary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    transition: background-color 0.2s ease;
}

.section-header:hover {
    background-color: var(--bs-secondary-bg);
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
    flex: 1;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
}

.collapse-toggle {
    padding: 0.25rem;
    flex-shrink: 0;
}

.collapse-toggle .transition-transform {
    transition: transform 0.2s ease;
}

.section-content {
    padding: 0.8rem 0;
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
    max-height: 100dvh;
}
</style>
