<template>
    <div class="field-group">
        <CollapsibleSection title="Configure Event Image" storage-key="campfireEventModal/image-pokemon" content-class="pt-2">
            <template #icon>
                <Settings :size="18" />
            </template>
            <div class="section-panel mb-0">
                <div class="d-flex justify-content-between align-items-center">
                    <label class="form-label mb-0">Title</label>
                    <button type="button" class="btn btn-link btn-sm p-0" @click="resetImageTitle">Reset to default</button>
                </div>
                <textarea v-model="imageTitle" class="form-control mb-1" rows="2" placeholder="Event type"></textarea>
                <small class="text-muted d-block mb-3">Press Enter for a manual line break (up to {{ TITLE_MAX_LINES }} lines).</small>

                <label class="form-label d-block">Image Pokémon</label>
                <PokemonNameRow v-for="row in imagePokemonRows" :key="row.id" v-model="row.name" class="mb-2" @remove="removeImageRow(row.id)" />
                <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    :disabled="imagePokemonRows.length >= MAX_IMAGE_POKEMON"
                    @click="addImageRow()"
                >
                    <Plus :size="14" class="me-1" />
                    Add Pokémon
                </button>
                <small class="text-muted d-block mt-1">Up to {{ MAX_IMAGE_POKEMON }} Pokémon per image.</small>

                <label for="campfireSpriteScale" class="form-label small d-block mt-3">Sprite Scale Size: {{ spriteScalePercent }}%</label>
                <div class="sprite-scale-range" :style="{ '--default-position': spriteScaleDefaultPosition }">
                    <input
                        id="campfireSpriteScale"
                        v-model.number="spriteScalePercent"
                        type="range"
                        class="form-range"
                        :min="MIN_SPRITE_SCALE_PERCENT"
                        :max="MAX_SPRITE_SCALE_PERCENT"
                        step="5"
                    />
                    <span class="sprite-scale-default-tick" aria-hidden="true"></span>
                </div>

                <label class="form-label d-block mt-3">Bottom Text</label>
                <textarea
                    v-model="imageCustomBottomText"
                    class="form-control"
                    rows="2"
                    placeholder="Custom caption (overrides CP/bonus text)"
                ></textarea>
                <small class="text-muted d-block">
                    Leave blank to auto-show Hundo CP per Pokémon (up to {{ MAX_IMAGE_CP_LINES }}) or event bonus text. With more than 2 Pokémon, type
                    a caption as seen fit. Press Enter for a manual line break (up to {{ MAX_IMAGE_CP_LINES }} lines).
                </small>
            </div>
        </CollapsibleSection>

        <div class="d-flex flex-column align-items-center mt-3">
            <div class="event-image-preview">
                <img v-if="badgeImageUrl" :src="badgeImageUrl" alt="Generated event image" class="event-image-preview-img" />
                <span v-else class="text-muted small">{{ isGeneratingBadge ? 'Generating…' : 'No preview available' }}</span>
            </div>
            <a v-if="badgeImageUrl" :href="badgeImageUrl" :download="badgeImageFilename" class="btn btn-secondary btn-sm mt-2">
                <Download :size="14" class="me-1" />
                Download Image
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Download, Plus, Settings } from '@lucide/vue';
import { watchThrottled } from '@vueuse/core';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { usePokemonRowList } from '@/composables/usePokemonRowList';
import { useCampfireTemplateStore } from '@/stores/campfireTemplate';
import { useEventsStore } from '@/stores/events';
import { usePokemonDataStore } from '@/stores/pokemonData';
import { resolveCampfireEventPokemonNames } from '@/utils/campfireEventText';
import { CP_DIVIDER, TITLE_MAX_LINES, generateEventBadge } from '@/utils/eventBadgeImage';
import { getEventSpriteEffect } from '@/utils/eventPokemon';
import { type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';
import { calculateRaidCP } from '@/utils/pokemonCP';
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
const eventsStore = useEventsStore();
const pokemonDataStore = usePokemonDataStore();

const MAX_IMAGE_POKEMON = 3;
const MAX_IMAGE_CP_LINES = 2;
const MIN_SPRITE_SCALE_PERCENT = 25;
const MAX_SPRITE_SCALE_PERCENT = 125;
const DEFAULT_SPRITE_SCALE_PERCENT = 100;
// 0-1 position of the default along the track, for the tick mark under the slider.
const spriteScaleDefaultPosition = (DEFAULT_SPRITE_SCALE_PERCENT - MIN_SPRITE_SCALE_PERCENT) / (MAX_SPRITE_SCALE_PERCENT - MIN_SPRITE_SCALE_PERCENT);

const { rows: imagePokemonRows, addRow: addImageRow, removeRow: removeImageRow, setNames: setImagePokemonNames } = usePokemonRowList();
const imageTitle = ref('');
const imageCustomBottomText = ref('');
const spriteScalePercent = ref(DEFAULT_SPRITE_SCALE_PERCENT);

const eventTypeName = computed(() => getEventTypeInfo(props.event.eventType).name);

function resetImageTitle() {
    imageTitle.value = eventTypeName.value;
}

// Re-seed the form from the event's resolved Pokemon each time the modal opens.
watch(
    () => props.show,
    isOpen => {
        if (!isOpen) return;

        setImagePokemonNames(resolveCampfireEventPokemonNames(props.event).slice(0, MAX_IMAGE_POKEMON));
        imageTitle.value = eventTypeName.value;
        imageCustomBottomText.value = '';
        spriteScalePercent.value = DEFAULT_SPRITE_SCALE_PERCENT;
    },
    { immediate: true },
);

const imagePokemonNames = computed(() =>
    imagePokemonRows.value
        .map(row => row.name.trim())
        .filter(Boolean)
        .slice(0, MAX_IMAGE_POKEMON),
);
const badgeBackgroundColor = computed(() => eventsStore.eventMetadata[props.event.eventID]?.color ?? '#333333');

// Built from char codes, not a literal \u escape range - editor/tooling round-trips keep mangling
// that into raw invisible combining-mark bytes.
const COMBINING_MARKS_PATTERN = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, 'g');

// NFD first so accented letters degrade to their base form instead of disappearing entirely.
function slugify(text: string): string {
    return text
        .normalize('NFD')
        .replace(COMBINING_MARKS_PATTERN, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const badgeImageFilename = computed(() => `${slugify(props.event.name) || 'campfire-event'}.png`);

// Only Spotlight Hour's single bonus fits on the image - other events' bonus lists are text-output only.
const imageBonusText = computed(() => getSpotlightBonusText(props.event));

// Priority: custom caption, then the bonus, then auto CP lines. An event with a bonus never falls
// back to CP lines when the bonus is turned off - CP isn't relevant there either way.
const imageBottomLines = computed(() => {
    // A manual line break (literal `\n`) forces a split here, same as the title.
    const customLines = imageCustomBottomText.value
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .slice(0, MAX_IMAGE_CP_LINES);
    if (customLines.length > 0) return customLines;

    if (imageBonusText.value) {
        return campfireTemplateStore.includeEventBonus ? [imageBonusText.value] : [];
    }

    if (!campfireTemplateStore.includeCP || imagePokemonNames.value.length === 0 || imagePokemonNames.value.length > MAX_IMAGE_CP_LINES) {
        return [];
    }

    return imagePokemonNames.value
        .map(name => {
            const pokemon = pokemonDataStore.searchCatchablePokemon(name);
            if (!pokemon) return null;

            // No thousands separators here - keeps the image text cleaner than the copyable text output.
            const cp = calculateRaidCP(pokemon.stats);
            return campfireTemplateStore.includeWeatherBoostedCP ? `${cp.level20Max} ${CP_DIVIDER} ${cp.level25Max}` : `${cp.level20Max}`;
        })
        .filter((line): line is string => line !== null);
});

// Max Monday/Shadow Raids classify the effect at the event level - resolvers strip the name prefix.
const badgeDefaultEffect = computed(() => getEventSpriteEffect(props.event));

const badgeImageUrl = ref<string | null>(null);
const isGeneratingBadge = ref(false);

// Only one render runs at a time; a change mid-render just queues one more pass with the latest values.
// (Discarding in-flight renders as stale instead meant that while dragging - when every render outlasts
// the throttle interval - none ever finished, so the preview froze until input stopped.)
let isRendering = false;
let needsRerender = false;
let isUnmounted = false;

async function regenerateBadge() {
    if (isRendering) {
        needsRerender = true;
        return;
    }

    isRendering = true;
    isGeneratingBadge.value = true;

    do {
        needsRerender = false;

        const blob = await generateEventBadge({
            title: imageTitle.value,
            backgroundColor: badgeBackgroundColor.value,
            pokemonNames: imagePokemonNames.value,
            bottomLines: imageBottomLines.value,
            defaultPokemonEffect: badgeDefaultEffect.value,
            spriteScale: spriteScalePercent.value / 100,
        });

        if (isUnmounted) return;

        if (badgeImageUrl.value) {
            URL.revokeObjectURL(badgeImageUrl.value);
        }
        badgeImageUrl.value = blob ? URL.createObjectURL(blob) : null;
    } while (needsRerender);

    isRendering = false;
    isGeneratingBadge.value = false;
}

// Render once immediately so the preview isn't delayed on open; after that, throttle so dragging the
// size slider or typing stays live without re-rendering the whole canvas on every tick/keystroke.
// `trailing` guarantees a final render once input stops, so the preview always lands on the last value.
regenerateBadge();
watchThrottled([imageTitle, imagePokemonNames, imageBottomLines, badgeBackgroundColor, spriteScalePercent], regenerateBadge, {
    throttle: 100,
    trailing: true,
});

onBeforeUnmount(() => {
    isUnmounted = true;
    if (badgeImageUrl.value) {
        URL.revokeObjectURL(badgeImageUrl.value);
    }
});
</script>

<style scoped>
/* Duplicated in CampfireEventDetailsSection.vue - Vue's scoped CSS can't reach into a sibling. */
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

.sprite-scale-range {
    position: relative;
}

/* Marks the default value under the track. The thumb's center only travels between half a thumb-width
   in from each end (Bootstrap's thumb is 1rem), so the tick is placed along that inset span. */
.sprite-scale-default-tick {
    position: absolute;
    top: calc(100% - 0.5rem);
    left: calc(0.5rem + (100% - 1rem) * var(--default-position));
    width: 2px;
    height: 6px;
    transform: translateX(-50%);
    border-radius: 1px;
    background-color: var(--bs-secondary-color);
    pointer-events: none;
}

.event-image-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    aspect-ratio: 1 / 1;
    border-radius: 0.5rem;
}

.event-image-preview-img {
    width: 100%;
    height: 100%;
}
</style>
