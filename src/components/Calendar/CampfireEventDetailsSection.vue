<template>
    <div class="field-group">
        <CollapsibleSection title="Configure Event Details" storage-key="campfireEventModal/event-details" content-class="pt-2">
            <template #icon>
                <Settings :size="18" />
            </template>
            <div class="section-panel mb-0">
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
                    <small class="text-muted">Saves as your global summary text for <strong>all</strong> events.</small>
                </div>

                <div class="field-group">
                    <label class="form-label d-block">Pokémon</label>
                    <PokemonNameRow v-for="row in pokemonRows" :key="row.id" v-model="row.name" class="mb-2" @remove="removeRow(row.id)" />
                    <button type="button" class="btn btn-secondary btn-sm" @click="addRow()">
                        <Plus :size="14" class="me-1" />
                        Add Pokémon
                    </button>
                </div>
            </div>
        </CollapsibleSection>
    </div>

    <div class="field-group">
        <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="output-label form-label mb-0 d-flex align-items-center gap-2">
                <span>Output</span>
                <span class="char-count">
                    <span :class="{ 'char-count-over': isOverCharLimit }">{{ outputLength.toLocaleString() }}</span> /
                    {{ CAMPFIRE_CHAR_LIMIT.toLocaleString() }}
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
        <template v-if="showCpOptions">
            <div class="form-check">
                <input id="campfireIncludeCP" v-model="campfireTemplateStore.includeCP" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="campfireIncludeCP">Hundo CP</label>
            </div>
            <div class="form-check ms-4">
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
        </template>
        <div v-else-if="eventBonuses.length > 0" class="form-check">
            <input id="campfireIncludeEventBonus" v-model="campfireTemplateStore.includeEventBonus" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="campfireIncludeEventBonus">Show Event Bonuses</label>
            <small v-if="showsBonusOnImage" class="text-muted d-block">
                Shows "{{ eventBonuses[0] }}" in the Output text, and in the image footer.
            </small>
            <small v-else class="text-muted d-block">Shows the event's bonuses in the output text (not on the image).</small>
        </div>
        <div class="form-check">
            <input
                id="campfireIncludePokemonDetails"
                v-model="campfireTemplateStore.includePokemonDetails"
                class="form-check-input"
                type="checkbox"
            />
            <label class="form-check-label" for="campfireIncludePokemonDetails">Pokémon Details</label>
            <small class="text-muted d-block">Summary details below event text.</small>
        </div>
        <div class="form-check ms-4">
            <input
                id="campfireIncludeWeakness"
                v-model="campfireTemplateStore.includeWeakness"
                class="form-check-input"
                type="checkbox"
                :disabled="!campfireTemplateStore.includePokemonDetails"
            />
            <label class="form-check-label" for="campfireIncludeWeakness">Weakness</label>
        </div>
        <div class="form-check ms-4">
            <input
                id="campfireIncludeMaxCP"
                v-model="campfireTemplateStore.includeMaxCP"
                class="form-check-input"
                type="checkbox"
                :disabled="!campfireTemplateStore.includePokemonDetails"
            />
            <label class="form-check-label" for="campfireIncludeMaxCP">Max CP (includes Mega Max CP)</label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Copy, Plus, Settings } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

import { usePokemonRowList } from '@/composables/usePokemonRowList';
import { useCampfireTemplateStore } from '@/stores/campfireTemplate';
import { usePokemonDataStore } from '@/stores/pokemonData';
import { useToastsStore } from '@/stores/toasts';
import {
    type CampfirePokemonEntry,
    buildCampfirePokemonEntry,
    formatCampfireEventText,
    getCampfireEventBonuses,
    resolveCampfireEventPokemonNames,
    resolveCampfireTemplate,
} from '@/utils/campfireEventText';
import { type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';
import { getSpotlightBonusText } from '@/utils/spotlightBonus';

import PokemonNameRow from '@/components/Calendar/PokemonNameRow.vue';
import CollapsibleSection from '@/components/CollapsibleSection.vue';

interface Props {
    event: PogoEvent;
    /** Re-seeds the form from `event` each time this flips to true (the parent modal's `show`). */
    show: boolean;
}

const props = defineProps<Props>();

const campfireTemplateStore = useCampfireTemplateStore();
const pokemonDataStore = usePokemonDataStore();
const toastsStore = useToastsStore();

// Campfire's event summary field rejects text beyond this length
const CAMPFIRE_CHAR_LIMIT = 1000;

// Can't inline these in the template - Vue's mustache parser breaks on the nested `}}`.
const pokemonNamePlaceholder = '{{pokemonName}}';
const eventTypePlaceholder = '{{eventType}}';

const { rows: pokemonRows, addRow, removeRow, setNames: setPokemonNames } = usePokemonRowList();
const titleTemplate = ref(campfireTemplateStore.titleTemplate);
const bodyTemplate = ref(campfireTemplateStore.bodyTemplate);
const outputTextareaEl = ref<HTMLTextAreaElement | null>(null);

function resetTitleTemplate() {
    campfireTemplateStore.resetTitleTemplate();
    titleTemplate.value = campfireTemplateStore.titleTemplate;
}

function resetBodyTemplate() {
    campfireTemplateStore.resetBodyTemplate();
    bodyTemplate.value = campfireTemplateStore.bodyTemplate;
}

// Hundo/Weather Boosted CP don't apply to Community Day's or Spotlight Hour's wild encounter - hide
// the CP options entirely rather than showing an always-inapplicable checkbox for the life of the modal.
const showCpOptions = computed(() => props.event.eventType !== 'community-day' && props.event.eventType !== 'pokemon-spotlight-hour');

// Re-seed the form from the event's resolved Pokemon and the saved templates each time the modal opens.
watch(
    () => props.show,
    isOpen => {
        if (!isOpen) return;

        const eventPokemonNames = resolveCampfireEventPokemonNames(props.event);
        setPokemonNames(eventPokemonNames.length > 0 ? eventPokemonNames : ['']);

        titleTemplate.value = campfireTemplateStore.titleTemplate;
        bodyTemplate.value = campfireTemplateStore.bodyTemplate;

        // Not persisted (see the store) - re-derive a sensible default for this specific event's type.
        campfireTemplateStore.includeCP = showCpOptions.value;
        campfireTemplateStore.includeWeatherBoostedCP = props.event.eventType !== 'max-battles';
        campfireTemplateStore.includeEventBonus = true;
    },
    { immediate: true },
);

// Persist template edits as the new defaults as the user types.
watch(titleTemplate, newValue => (campfireTemplateStore.titleTemplate = newValue));
watch(bodyTemplate, newValue => (campfireTemplateStore.bodyTemplate = newValue));

const pokemonNames = computed(() => pokemonRows.value.map(row => row.name.trim()).filter(Boolean));
const eventTypeName = computed(() => getEventTypeInfo(props.event.eventType).name);
const eventBonuses = computed(() => getCampfireEventBonuses(props.event));
// Only Spotlight Hour's single bonus goes on the image - Community Day usually has too many to fit.
const showsBonusOnImage = computed(() => Boolean(getSpotlightBonusText(props.event)));
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
    includePokemonDetails: campfireTemplateStore.includePokemonDetails,
    includeWeakness: campfireTemplateStore.includeWeakness,
    includeCP: campfireTemplateStore.includeCP,
    includeWeatherBoostedCP: campfireTemplateStore.includeWeatherBoostedCP,
    includeMaxCP: campfireTemplateStore.includeMaxCP,
    bonuses: campfireTemplateStore.includeEventBonus ? eventBonuses.value : [],
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
/* Duplicated in CampfireEventImageSection.vue - Vue's scoped CSS can't reach into a sibling. */
.section-panel {
    background-color: var(--surface-panel);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.25rem;
}

.section-panel .field-group:last-child {
    margin-bottom: 0;
}

/* CollapsibleSection's header assumes it sits on the page background; nested in our panel, it needs
   the next surface step in instead. */
.section-panel :deep(.section-header) {
    background-color: var(--surface-input);
}

.field-group {
    margin-bottom: 1.25rem;
}

:deep(.form-control) {
    font-size: 0.85rem;
}

.placeholder-token {
    color: var(--bs-secondary-color);
    background-color: var(--surface-panel);
    padding: 0.05em 0.35em;
    border-radius: 3px;
}

.output-text {
    font-family: var(--bs-font-monospace);
}

.output-label {
    line-height: 1.1rem;
    font-size: 1.3rem;
    font-weight: 600;
}

.char-count {
    margin-top: 3px;
    margin-left: 4px;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--bs-secondary-color);
}

.char-count-over {
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-secondary-color) 40%, var(--bs-warning) 60%);
}
</style>
