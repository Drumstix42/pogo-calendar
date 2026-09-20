import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';

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

    // Output content toggles - which parts of the per-Pokemon block to include
    const includeVulnerabilities = useLocalStorage<boolean>(STORAGE_KEYS.CAMPFIRE_INCLUDE_VULNERABILITIES, true);
    const includeCP = useLocalStorage<boolean>(STORAGE_KEYS.CAMPFIRE_INCLUDE_CP, true);
    const includeWeatherBoostedCP = useLocalStorage<boolean>(STORAGE_KEYS.CAMPFIRE_INCLUDE_WEATHER_BOOSTED_CP, true);
    const includeMaxCP = useLocalStorage<boolean>(STORAGE_KEYS.CAMPFIRE_INCLUDE_MAX_CP, true);

    function resetTitleTemplate() {
        titleTemplate.value = DEFAULT_CAMPFIRE_TITLE_TEMPLATE;
    }

    function resetBodyTemplate() {
        bodyTemplate.value = DEFAULT_CAMPFIRE_BODY_TEMPLATE;
    }

    return {
        titleTemplate,
        bodyTemplate,
        includeVulnerabilities,
        includeCP,
        includeWeatherBoostedCP,
        includeMaxCP,
        resetTitleTemplate,
        resetBodyTemplate,
    };
});
