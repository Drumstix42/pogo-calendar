<template>
    <BaseModal :show="show" title="Campfire Event Text" scrollable size="lg" @close="closeModal">
        <CampfireEventImageSection :event="event" :show="show" />
        <CampfireEventDetailsSection :event="event" :show="show" />

        <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button type="button" class="btn btn-secondary flex-grow-1" @click="closeModal">Close</button>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { type PogoEvent } from '@/utils/eventTypes';

import BaseModal from '@/components/BaseModal.vue';
import CampfireEventDetailsSection from '@/components/Calendar/CampfireEventDetailsSection.vue';
import CampfireEventImageSection from '@/components/Calendar/CampfireEventImageSection.vue';

interface Props {
    show: boolean;
    event: PogoEvent;
}

interface Emits {
    (e: 'close'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function closeModal() {
    emit('close');
}
</script>
