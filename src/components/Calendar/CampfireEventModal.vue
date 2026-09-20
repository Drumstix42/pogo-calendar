<template>
    <BaseModal :show="show" title="Campfire Event Text" scrollable size="lg" @close="closeModal">
        <small class="text-muted d-block mb-3"
            >Placeholders <code class="placeholder-token">{{ pokemonNamePlaceholder }}</code> and
            <code class="placeholder-token">{{ eventTypePlaceholder }}</code> can be used below.</small
        >

        <div class="field-group">
            <div class="d-flex justify-content-between align-items-center">
                <label class="form-label mb-0">Title Template</label>
                <button type="button" class="btn btn-link btn-sm p-0" @click="resetTitleTemplate">Reset to default</button>
            </div>
            <input v-model="titleTemplate" type="text" class="form-control" placeholder="{{pokemonName}} {{eventType}}" />
            <small class="text-muted d-block">Resolves to: {{ resolvedTitle || '—' }}</small>
        </div>

        <div class="field-group">
            <div class="d-flex justify-content-between align-items-center">
                <label class="form-label mb-0">Static Summary Text</label>
                <button type="button" class="btn btn-link btn-sm p-0" @click="resetBodyTemplate">Reset to default</button>
            </div>
            <textarea v-model="bodyTemplate" class="form-control" rows="4" placeholder="Meetup location, bonuses, rules, etc."></textarea>
            <small class="text-muted">Saved as your default shared/static summary text for next time.</small>
        </div>

        <div class="field-group">
            <label class="form-label d-block">Pokémon</label>
            <div v-for="row in pokemonRows" :key="row.id" class="pokemon-row mb-2">
                <input v-model="row.name" type="text" class="form-control" placeholder="Pokémon name" />
                <span v-if="row.name.trim() && !resolvedPokemon(row.name)" class="not-found-badge">Not found</span>
                <button type="button" class="btn btn-icon-ghost btn-sm" aria-label="Remove Pokémon" @click="removeRow(row.id)">
                    <X :size="16" />
                </button>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="addRow()">
                <Plus :size="14" class="me-1" />
                Add Pokémon
            </button>
        </div>

        <div class="field-group">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="output-label form-label mb-0 d-flex align-items-center gap-2">
                    <span>Output</span>
                    <span class="char-count" :class="{ 'char-count-over': isOverCharLimit }">
                        {{ outputLength.toLocaleString() }} / {{ CAMPFIRE_CHAR_LIMIT.toLocaleString() }}
                    </span>
                </label>
                <button type="button" class="btn btn-primary btn-sm" :disabled="!outputText" @click="copyOutput">
                    <Copy :size="14" class="me-1" />
                    Copy
                </button>
            </div>
            <textarea ref="outputTextareaEl" class="form-control output-text" rows="10" readonly :value="outputText"></textarea>
            <small v-if="isOverCharLimit" class="text-muted">
                Over the Campfire event summary limit ({{ CAMPFIRE_CHAR_LIMIT.toLocaleString() }} characters) - trim the text before posting.
            </small>
        </div>

        <div class="field-group">
            <label class="form-label d-block mb-2">Output Options</label>
            <div class="form-check">
                <input
                    id="campfireIncludeVulnerabilities"
                    v-model="campfireTemplateStore.includeVulnerabilities"
                    class="form-check-input"
                    type="checkbox"
                />
                <label class="form-check-label" for="campfireIncludeVulnerabilities">Vulnerabilities</label>
            </div>
            <div class="form-check">
                <input id="campfireIncludeCP" v-model="campfireTemplateStore.includeCP" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="campfireIncludeCP">Hundo CP</label>
            </div>
            <div class="form-check ms-3">
                <input
                    id="campfireIncludeWeatherBoostedCP"
                    v-model="campfireTemplateStore.includeWeatherBoostedCP"
                    class="form-check-input"
                    type="checkbox"
                    :disabled="!campfireTemplateStore.includeCP"
                />
                <label class="form-check-label" for="campfireIncludeWeatherBoostedCP">Weather Boosted CP</label>
                <small class="text-muted d-block">Not relevant for Max Battles.</small>
            </div>
            <div class="form-check">
                <input id="campfireIncludeMaxCP" v-model="campfireTemplateStore.includeMaxCP" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="campfireIncludeMaxCP">Max CP (includes Mega Max CP)</label>
            </div>
        </div>

        <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button type="button" class="btn btn-secondary flex-grow-1" @click="closeModal">Close</button>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { Copy, Plus, X } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

import { useCampfireTemplateStore } from '@/stores/campfireTemplate';
import { usePokemonDataStore } from '@/stores/pokemonData';
import { useToastsStore } from '@/stores/toasts';
import { type CampfirePokemonEntry, buildCampfirePokemonEntry, formatCampfireEventText, resolveCampfireTemplate } from '@/utils/campfireEventText';
import { getEventPokemonImages } from '@/utils/eventPokemon';
import { type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';

import BaseModal from '@/components/BaseModal.vue';

interface Props {
    show: boolean;
    event: PogoEvent;
}

interface Emits {
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const campfireTemplateStore = useCampfireTemplateStore();
const pokemonDataStore = usePokemonDataStore();
const toastsStore = useToastsStore();

// Campfire's event summary field rejects text beyond this length
const CAMPFIRE_CHAR_LIMIT = 1000;

// Displayed literally in the template - can't be inlined there, Vue's mustache parser
// breaks on the nested `}}`.
const pokemonNamePlaceholder = '{{pokemonName}}';
const eventTypePlaceholder = '{{eventType}}';

// Names the image resolvers use as placeholders when no specific Pokemon is known - not real lookups.
const NON_POKEMON_PLACEHOLDER_NAMES = new Set(['Spotlight Pokemon', 'Max Battle']);

interface PokemonRow {
    id: number;
    name: string;
}

let nextRowId = 1;
const pokemonRows = ref<PokemonRow[]>([]);
const titleTemplate = ref(campfireTemplateStore.titleTemplate);
const bodyTemplate = ref(campfireTemplateStore.bodyTemplate);
const outputTextareaEl = ref<HTMLTextAreaElement | null>(null);

function resolvedPokemon(name: string) {
    return pokemonDataStore.searchCatchablePokemon(name.trim());
}

function addRow(name = '') {
    pokemonRows.value.push({ id: nextRowId++, name });
}

function removeRow(id: number) {
    pokemonRows.value = pokemonRows.value.filter(row => row.id !== id);
}

function resetTitleTemplate() {
    campfireTemplateStore.resetTitleTemplate();
    titleTemplate.value = campfireTemplateStore.titleTemplate;
}

function resetBodyTemplate() {
    campfireTemplateStore.resetBodyTemplate();
    bodyTemplate.value = campfireTemplateStore.bodyTemplate;
}

function closeModal() {
    emit('close');
}

// Re-seed the form from the event's resolved Pokemon and the saved templates each time the modal opens.
watch(
    () => props.show,
    isOpen => {
        if (!isOpen) return;

        const eventPokemonNames = [...new Set(getEventPokemonImages(props.event).map(image => image.name))].filter(
            name => !NON_POKEMON_PLACEHOLDER_NAMES.has(name),
        );

        pokemonRows.value = eventPokemonNames.map(name => ({ id: nextRowId++, name }));
        if (pokemonRows.value.length === 0) {
            addRow();
        }

        titleTemplate.value = campfireTemplateStore.titleTemplate;
        bodyTemplate.value = campfireTemplateStore.bodyTemplate;
    },
    { immediate: true },
);

// Persist template edits as the new defaults as the user types.
watch(titleTemplate, newValue => (campfireTemplateStore.titleTemplate = newValue));
watch(bodyTemplate, newValue => (campfireTemplateStore.bodyTemplate = newValue));

const pokemonNames = computed(() => pokemonRows.value.map(row => row.name.trim()).filter(Boolean));
const eventTypeName = computed(() => getEventTypeInfo(props.event.eventType).name);
const templateContext = computed(() => ({ pokemonNames: pokemonNames.value, eventTypeName: eventTypeName.value }));

const resolvedTitle = computed(() => resolveCampfireTemplate(titleTemplate.value, templateContext.value));
const resolvedBody = computed(() => resolveCampfireTemplate(bodyTemplate.value, templateContext.value));

const pokemonEntries = computed(() => {
    return pokemonNames.value
        .map(name => {
            const catchablePokemon = pokemonDataStore.searchCatchablePokemon(name);
            if (!catchablePokemon) return null;

            const battlePokemon = pokemonDataStore.searchBattlePokemon(name) ?? catchablePokemon;
            return buildCampfirePokemonEntry(name, catchablePokemon, battlePokemon);
        })
        .filter((entry): entry is CampfirePokemonEntry => entry !== null);
});

const outputOptions = computed(() => ({
    includeVulnerabilities: campfireTemplateStore.includeVulnerabilities,
    includeCP: campfireTemplateStore.includeCP,
    includeWeatherBoostedCP: campfireTemplateStore.includeWeatherBoostedCP,
    includeMaxCP: campfireTemplateStore.includeMaxCP,
}));

const outputText = computed(() => formatCampfireEventText(resolvedTitle.value, resolvedBody.value, pokemonEntries.value, outputOptions.value));
const outputLength = computed(() => outputText.value.length);
const isOverCharLimit = computed(() => outputLength.value > CAMPFIRE_CHAR_LIMIT);

async function copyOutput() {
    outputTextareaEl.value?.select();

    try {
        await navigator.clipboard.writeText(outputText.value);
        toastsStore.addToast({ type: 'success', title: '', message: 'Copied to clipboard' });
    } catch {
        toastsStore.addToast({ type: 'error', title: 'Copy failed', message: 'Select and copy the text manually.' });
    }
}
</script>

<style scoped>
.field-group {
    margin-bottom: 1.25rem;
}

.field-group:last-child {
    margin-bottom: 0;
}

.pokemon-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.placeholder-token {
    color: var(--bs-secondary-color);
    background-color: var(--bs-tertiary-bg);
    padding: 0.05em 0.35em;
    border-radius: 3px;
}

.not-found-badge {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--bs-danger);
    white-space: nowrap;
}

.output-text {
    font-family: var(--bs-font-monospace);
    font-size: 0.85rem;
}

.output-label {
    line-height: 1.1rem;
}

.char-count {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--bs-secondary-color);
}

.char-count-over {
    font-weight: 600;
    color: var(--bs-emphasis-color);
}
</style>
