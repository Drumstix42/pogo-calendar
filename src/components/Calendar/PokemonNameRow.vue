<template>
    <div class="pokemon-name-row">
        <input
            :value="modelValue"
            type="text"
            class="form-control"
            placeholder="Pokémon name"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="modelValue.trim() && !isFound" class="not-found-badge">Not found</span>
        <button type="button" class="btn btn-icon-ghost btn-sm" aria-label="Remove Pokémon" @click="$emit('remove')">
            <X :size="16" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue';
import { computed } from 'vue';

import { usePokemonDataStore } from '@/stores/pokemonData';

interface Props {
    modelValue: string;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'remove'): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const pokemonDataStore = usePokemonDataStore();

const isFound = computed(() => !!pokemonDataStore.searchCatchablePokemon(props.modelValue.trim()));
</script>

<style scoped>
.pokemon-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.not-found-badge {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--bs-danger);
    white-space: nowrap;
}
</style>
