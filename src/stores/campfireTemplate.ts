import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { STORAGE_KEYS } from '@/constants/storage';

export const DEFAULT_CAMPFIRE_TITLE_TEMPLATE = '{{pokemonName}} {{eventType}}';
export const DEFAULT_CAMPFIRE_BODY_TEMPLATE = '';

/**
 * Persists the user's default Campfire event text template (title + static meetup blurb).
 * `{{pokemonName}}`/`{{eventType}}` are resolved against the modal's current event at generation time.
 */
export const useCampfireTemplateStore = defineStore('campfireTemplate', () => {
    const titleTemplate = useLocalStorage<string>(STORAGE_KEYS.CAMPFIRE_TITLE_TEMPLATE, DEFAULT_CAMPFIRE_TITLE_TEMPLATE);
    const bodyTemplate = useLocalStorage<string>(STORAGE_KEYS.CAMPFIRE_BODY_TEMPLATE, DEFAULT_CAMPFIRE_BODY_TEMPLATE);

    // Pokemon Details toggles - persisted, since they're a stable preference independent of event type.
    const includePokemonDetails = useLocalStorage<boolean>(STORAGE_KEYS.CAMPFIRE_INCLUDE_POKEMON_DETAILS, true);
    const includeWeakness = useLocalStorage<boolean>(STORAGE_KEYS.CAMPFIRE_INCLUDE_WEAKNESS, true);
    const includeMaxCP = useLocalStorage<boolean>(STORAGE_KEYS.CAMPFIRE_INCLUDE_MAX_CP, true);

    // CP/Spotlight toggles - NOT persisted. Their sensible default depends on the current event's type
    // (e.g. Weather Boosted CP defaults off for Max Battles), so the modal re-derives these each time
    // it opens rather than carrying a stale value over from whatever event was open last.
    const includeCP = ref(true);
    const includeWeatherBoostedCP = ref(true);
    const includeSpotlightBonus = ref(true);

    function resetTitleTemplate() {
        titleTemplate.value = DEFAULT_CAMPFIRE_TITLE_TEMPLATE;
    }

    function resetBodyTemplate() {
        bodyTemplate.value = DEFAULT_CAMPFIRE_BODY_TEMPLATE;
    }

    return {
        titleTemplate,
        bodyTemplate,
        includePokemonDetails,
        includeWeakness,
        includeCP,
        includeWeatherBoostedCP,
        includeMaxCP,
        includeSpotlightBonus,
        resetTitleTemplate,
        resetBodyTemplate,
    };
});
