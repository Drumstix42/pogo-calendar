<template>
    <div v-if="tags.length" class="event-type-tags">
        <component
            :is="editable ? 'button' : 'span'"
            v-for="tag in tags"
            :key="tag.key"
            :type="editable ? 'button' : undefined"
            class="event-type-tag"
            :class="{ 'is-editable': editable }"
            :style="{ backgroundColor: tag.color }"
            :title="editable ? `Customize ${tag.name} color` : undefined"
            @click.stop="editable && editColorModal.openModal(tag.key)"
        >
            {{ tag.name }}
        </component>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useEditColorModal } from '@/composables/useEditColorModal';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { type PogoEvent, getEventTypeInfo, getSecondaryEventTypes } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
    // Clicking a chip opens the color editor for that type; off where another modal is already open.
    editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    editable: true,
});

const editColorModal = useEditColorModal();
const eventTypeColorsStore = useEventTypeColorsStore();

const tags = computed(() =>
    getSecondaryEventTypes(props.event).map(key => ({
        key,
        name: getEventTypeInfo(key).name,
        color: eventTypeColorsStore.getEventTypeColor(key),
    })),
);
</script>

<style scoped>
.event-type-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 3px;
}

.event-type-tag {
    display: inline-flex;
    align-items: center;
    /* Matches the timeline header's .event-type-badge */
    padding: 3px 8px;
    border: none;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
    line-height: 1;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
}

.event-type-tag.is-editable {
    cursor: pointer;
    transition:
        filter 0.2s ease,
        transform 0.2s ease;
}

.event-type-tag.is-editable:hover {
    filter: brightness(1.15);
    transform: scale(1.05);
}

.event-type-tag.is-editable:active {
    transform: scale(0.95);
}
</style>
