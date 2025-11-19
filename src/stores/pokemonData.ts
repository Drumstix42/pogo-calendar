import { defineStore } from 'pinia';
import { ref } from 'vue';

import { type CPResult, type PokemonData, calculateRaidCP, cleanPokemonName } from '@/utils/pokemonCP';
import { normalizePokemonName } from '@/utils/pokemonMapper';

const POKEMON_DATA_URL = 'https://raw.githubusercontent.com/mgrann03/pokemon-resources/refs/heads/main/pogo_pkm.min.json';

interface PokemonDataState {
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;
}

/**
 * Pinia store for Pokemon data used in CP calculations
 * Lazily loads data from GitHub when first needed
 */
export const usePokemonDataStore = defineStore('pokemonData', () => {
    const pokemonData = ref<PokemonData[]>([]);
    const state = ref<PokemonDataState>({
        isLoading: false,
        isLoaded: false,
        error: null,
    });

    /**
     * Load Pokemon data from GitHub
     * This is called lazily when first needed and caches the result
     */
    async function loadPokemonData(): Promise<void> {
        // Don't reload if already loaded or currently loading
        if (state.value.isLoaded || state.value.isLoading) {
            return;
        }

        state.value.isLoading = true;
        state.value.error = null;

        try {
            const response = await fetch(POKEMON_DATA_URL);

            if (!response.ok) {
                throw new Error(`Failed to fetch Pokemon data: ${response.status} ${response.statusText}`);
            }

            const data: PokemonData[] = await response.json();
            pokemonData.value = data;
            state.value.isLoaded = true;

            console.info(`Loaded ${data.length} Pokemon entries for CP calculations`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error loading Pokemon data';
            state.value.error = errorMessage;
            console.error('Error loading Pokemon data:', error);
        } finally {
            state.value.isLoading = false;
        }
    }

    /**
     * Search for a catchable Pokemon by name, stripping Mega/Primal prefixes
     * Returns the base form that can actually be caught/encountered
     */
    function searchCatchablePokemon(pokemonName: string): PokemonData | null {
        if (!state.value.isLoaded || pokemonData.value.length === 0) {
            return null;
        }

        // Strip Mega/Primal prefixes - these forms can't be caught, only base forms
        let searchName = pokemonName;
        if (searchName.startsWith('Mega ')) {
            searchName = searchName.substring(5); // Remove "Mega "
        } else if (searchName.startsWith('Primal ')) {
            searchName = searchName.substring(7); // Remove "Primal "
        }

        // Normalize the search name using our existing mapper normalization
        const normalizedSearch = normalizePokemonName(searchName);
        const cleanSearch = cleanPokemonName(searchName);

        // Try exact match first (with form)
        for (const pokemon of pokemonData.value) {
            const fullName = `${pokemon.name}${pokemon.form !== 'Normal' ? ` ${pokemon.form}` : ''}`;
            const normalizedFullName = normalizePokemonName(fullName);
            const cleanFullName = cleanPokemonName(fullName);

            if (normalizedFullName === normalizedSearch || cleanFullName === cleanSearch) {
                return pokemon;
            }
        }

        // Try base name match (ignore form)
        for (const pokemon of pokemonData.value) {
            const normalizedBaseName = normalizePokemonName(pokemon.name);
            const cleanBaseName = cleanPokemonName(pokemon.name);

            if (normalizedBaseName === normalizedSearch || cleanBaseName === cleanSearch) {
                // Prefer Normal form if available
                if (pokemon.form === 'Normal') {
                    return pokemon;
                }
            }
        }

        // Return first match with base name (any form)
        for (const pokemon of pokemonData.value) {
            const normalizedBaseName = normalizePokemonName(pokemon.name);
            const cleanBaseName = cleanPokemonName(pokemon.name);

            if (normalizedBaseName === normalizedSearch || cleanBaseName === cleanSearch) {
                return pokemon;
            }
        }

        return null;
    }

    /**
     * Get CP values for a Pokemon by name
     * Automatically loads data if not already loaded
     * @param pokemonName - Name of the Pokemon (e.g., "Rayquaza", "Mega Latias")
     * @returns CP result with level 20 and 25 max values, or null if not found/not loaded
     */
    async function getPokemonCP(pokemonName: string): Promise<CPResult | null> {
        // Ensure data is loaded
        if (!state.value.isLoaded) {
            await loadPokemonData();
        }

        // If loading failed or data is empty, return null
        if (!state.value.isLoaded || pokemonData.value.length === 0) {
            return null;
        }

        const pokemon = searchCatchablePokemon(pokemonName);
        if (!pokemon || !pokemon.stats) {
            return null;
        }

        return calculateRaidCP(pokemon.stats);
    }

    /**
     * Preload Pokemon data (optional - can be called on app init)
     * Non-blocking, fires and forgets
     */
    function preloadData(): void {
        loadPokemonData().catch(error => {
            console.error('Error preloading Pokemon data:', error);
        });
    }

    return {
        // State
        state,
        pokemonData,

        // Actions
        loadPokemonData,
        getPokemonCP,
        preloadData,
        searchCatchablePokemon,
    };
});
