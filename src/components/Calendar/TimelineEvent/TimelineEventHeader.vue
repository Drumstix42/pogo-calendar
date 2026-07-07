<template>
    <!-- Event type badge, actions, and toggle (clickable header) -->
    <div class="event-header-bar" @click="emit('toggle')">
        <div class="event-header-actions">
            <div class="event-type-badge">
                {{ eventTypeName }}
            </div>

            <!-- Action buttons (when expanded) -->
            <template v-if="isActive">
                <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10">
                    <template #popper>
                        <div class="tooltip-text">Add to calendar</div>
                    </template>
                    <button type="button" class="timeline-color-edit-btn" @click.stop="emit('addToCalendar')">
                        <BellPlus :size="13" />
                    </button>
                </VTooltip>

                <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10">
                    <template #popper>
                        <div class="tooltip-text">Customize event type color</div>
                    </template>
                    <button type="button" class="timeline-color-edit-btn" @click.stop="emit('editColor')">
                        <Palette :size="13" />
                    </button>
                </VTooltip>

                <div @click.stop>
                    <EventToggleButton :event-type="eventType" @hide="emit('hide')" />
                </div>
            </template>
        </div>

        <!-- Expand/collapse button (top-right) -->
        <button type="button" class="expand-toggle" @click.stop="emit('toggle')">
            <component :is="isActive ? ChevronsDownUp : ChevronsUpDown" :size="16" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { BellPlus, ChevronsDownUp, ChevronsUpDown, Palette } from '@lucide/vue';

import { type EventTypeKey } from '@/utils/eventTypes';

import EventToggleButton from '@/components/Calendar/EventToggleButton.vue';

interface Props {
    eventType: EventTypeKey;
    eventTypeName: string;
    isActive: boolean;
    isTouchDevice: boolean;
}

interface Emits {
    toggle: [];
    addToCalendar: [];
    editColor: [];
    hide: [];
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<style lang="scss" scoped>
.event-header-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 4px 4px;
    cursor: pointer;
    z-index: 3;

    .event-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .event-type-badge {
        padding: 3px 8px;
        margin-left: 4px;
        font-size: 0.7rem;
        font-weight: 500;
        line-height: 1;
        color: white;
        background-color: var(--event-color);
        border-radius: 4px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
    }

    .timeline-color-edit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3px;
        height: 20px;
        border: none;
        border-radius: 3px;
        background-color: color-mix(in srgb, var(--bs-body-color) 15%, transparent);
        color: var(--bs-body-color);
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
            background-color: color-mix(in srgb, var(--bs-body-color) 20%, transparent);
            transform: scale(1.05);
        }

        &:active {
            transform: scale(0.95);
        }
    }

    .expand-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px 3px;
        border: none;
        border-radius: 4px;
        background-color: color-mix(in srgb, var(--bs-body-color) 8%, transparent);
        color: var(--bs-body-color);
        cursor: pointer;
        opacity: 0.5;
        transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            background-color 0.2s ease;

        @media (pointer: fine) {
            &:hover {
                opacity: 1;
                background-color: color-mix(in srgb, var(--bs-body-color) 15%, transparent);
                transform: scale(1.05);
            }
        }

        &:active {
            transform: scale(0.95);
        }
    }
}
</style>
