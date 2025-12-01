import { POKEMON_NAME_TO_ID } from '@/constants/pokemonEntries';
import { POKEMON_FORM_MAP } from '@/constants/pokemonFormMap';
import { VALID_ANIMATED_SPRITES } from '@/constants/validAnimatedSprites';
import { VALID_STATIC_SPRITES } from '@/constants/validStaticSprites';

// Type definitions
export type PokemonName = keyof typeof POKEMON_NAME_TO_ID;
export type PokemonId = number;
export type SpriteType = 'dream-world' | 'official-artwork' | 'home';

// track logged missing sprites (to avoid spam)
const loggedMissingStaticSprites = new Set<string>();
const loggedMissingAnimatedSprites = new Set<string>();

// Normalize Pokemon names for matching - smart Unicode normalization + gender symbols
export function normalizePokemonName(name: string): string {
    return name
        .toLowerCase()
        .replace(/♀/g, 'f') // Female symbol → f
        .replace(/♂/g, 'm') // Male symbol → m
        .normalize('NFD') // Decompose accented characters (é → e + ́)
        .replace(/[\u0300-\u036f]/g, '') // Remove all combining diacritical marks
        .trim();
}

export function getPokemonId(name: string): number | null {
    const normalizedInput = normalizePokemonName(name);

    // Try direct normalized matching
    for (const [pokeName, id] of Object.entries(POKEMON_NAME_TO_ID)) {
        const normalizedStoredName = normalizePokemonName(pokeName);
        if (normalizedStoredName === normalizedInput) {
            return id;
        }
    }

    return null;
}

// Check if an animated sprite exists for the given sprite name
export function isValidAnimatedSprite(spriteName: string): boolean {
    return VALID_ANIMATED_SPRITES.has(spriteName.toLowerCase());
}

// Check if a static sprite exists for the given sprite name
export function isValidStaticSprite(spriteName: string): boolean {
    return VALID_STATIC_SPRITES.has(spriteName.toLowerCase());
}

// Get PokeMiners asset URL for a Pokemon using the form mapping
function getPokeMinersSpriteUrl(pokemonId: number, formSuffix?: string, shiny = false): string | null {
    const pokemon = POKEMON_FORM_MAP[pokemonId.toString()];

    if (pokemon === undefined) {
        return null;
    }

    let suffix = '';

    if (pokemon === null) {
        // Base form only
        suffix = '';
    } else if (formSuffix) {
        // Validate the form exists
        const normalizedForm = formSuffix.toUpperCase();
        const hasForm = pokemon.forms.some((f: string) => {
            const formWithoutF = f.substring(1);
            return formWithoutF === normalizedForm || f.toUpperCase() === normalizedForm;
        });

        if (hasForm) {
            // Ensure form starts with 'f'
            suffix = `.${formSuffix.startsWith('f') ? formSuffix : 'f' + formSuffix}`;
        } else {
            // Form not found, use default
            suffix = pokemon.default ? `.${pokemon.default}` : '';
        }
    } else {
        // No form specified, use default
        suffix = pokemon.default ? `.${pokemon.default}` : '';
    }

    const shinyPart = shiny ? '.s' : '';
    const filename = `pm${pokemonId}${suffix}${shinyPart}.icon.png`;

    return `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/Addressable%20Assets/${filename}`;
}

// Get available PokeMiners form suffixes for a Pokemon
export function getPokeMinersForms(pokemonId: number): string[] {
    const pokemon = POKEMON_FORM_MAP[pokemonId.toString()];
    if (!pokemon || pokemon === null) {
        return [];
    }
    return pokemon.forms || [];
}

// Check if a Pokemon has multiple PokeMiners forms
export function hasPokeMinersMultipleForms(pokemonId: number): boolean {
    const pokemon = POKEMON_FORM_MAP[pokemonId.toString()];
    return pokemon !== null && pokemon !== undefined && pokemon.forms && pokemon.forms.length > 0;
}

// Get the default PokeMiners form suffix for a Pokemon
export function getPokeMinersDefaultFormSuffix(pokemonId: number): string | null {
    const pokemon = POKEMON_FORM_MAP[pokemonId.toString()];
    if (!pokemon || pokemon === null) {
        return null;
    }
    return pokemon.default || null;
}

export function getPokemonSpriteUrl(pokemonNameOrId: string | number, suffix?: string): string | null {
    let pokemonName: string;
    let pokemonId: number | null = null;

    if (typeof pokemonNameOrId === 'string') {
        // Validate that the Pokemon name exists
        pokemonId = getPokemonId(pokemonNameOrId);
        if (!pokemonId) return null;
        pokemonName = pokemonNameOrId;
    } else if (typeof pokemonNameOrId === 'number') {
        // Find the Pokemon name from the ID
        const foundName = Object.entries(POKEMON_NAME_TO_ID).find(([, id]) => id === pokemonNameOrId);
        if (!foundName) return null;
        pokemonName = foundName[0];
        pokemonId = pokemonNameOrId;
    } else {
        return null;
    }

    // Clean Pokemon name for URL: use normalization + remove non-alphanumeric
    let urlName = normalizePokemonName(pokemonName).replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters (spaces, hyphens, apostrophes, etc.)

    // Add suffix if provided (for form variations)
    if (suffix) {
        urlName += suffix;
    }

    // Check if this static sprite exists in primary source
    if (isValidStaticSprite(urlName)) {
        return `https://raw.githubusercontent.com/mgrann03/pokemon-resources/refs/heads/main/graphics/pogo/${urlName}.png`;
    }

    // Fallback to PokeMiners using the form mapping
    if (pokemonId) {
        const pokeminersUrl = getPokeMinersSpriteUrl(pokemonId, suffix);
        if (pokeminersUrl) {
            return pokeminersUrl;
        }
    }

    // Only log if we haven't seen this missing sprite before
    if (!loggedMissingStaticSprites.has(urlName)) {
        console.info('Could not find static sprite for:', pokemonNameOrId);
        loggedMissingStaticSprites.add(urlName);
    }

    return null;

    /* const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other';

    switch (type) {
        case 'dream-world':
            return `${baseUrl}/dream-world/${id}.svg`;
        case 'official-artwork':
            return `${baseUrl}/official-artwork/${id}.png`;
        case 'home':
            return `${baseUrl}/home/${id}.png`;
        default:
            return `${baseUrl}/dream-world/${id}.svg`;
    } */
}

export function getPokemonAnimatedUrl(pokemonNameOrId: string | number, suffix?: string): string | null {
    let pokemonName: string;

    if (typeof pokemonNameOrId === 'string') {
        // Validate that the Pokemon name exists
        const pokemonId = getPokemonId(pokemonNameOrId);
        if (!pokemonId) return null;
        pokemonName = pokemonNameOrId;
    } else if (typeof pokemonNameOrId === 'number') {
        // Find the Pokemon name from the ID
        const foundName = Object.entries(POKEMON_NAME_TO_ID).find(([, id]) => id === pokemonNameOrId);
        if (!foundName) return null;
        pokemonName = foundName[0];
    } else {
        return null;
    }

    // Clean Pokemon name for URL: use normalization + remove non-alphanumeric
    let urlName = normalizePokemonName(pokemonName).replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters (spaces, hyphens, apostrophes, etc.)

    // Add suffix if provided
    if (suffix) {
        urlName += suffix;
    }

    // Check if this animated sprite exists in primary source
    if (isValidAnimatedSprite(urlName)) {
        return `https://raw.githubusercontent.com/mgrann03/pokemon-resources/main/graphics/ani/${urlName}.gif`;
    }

    // Fallback to PokeMiners using the form mapping (note: these are static PNGs, not animated)
    const pokemonId = typeof pokemonNameOrId === 'number' ? pokemonNameOrId : getPokemonId(pokemonNameOrId);
    if (pokemonId) {
        const pokeminersUrl = getPokeMinersSpriteUrl(pokemonId, suffix);
        if (pokeminersUrl) {
            return pokeminersUrl;
        }
    }

    // Only log if we haven't seen this missing sprite before
    if (!loggedMissingAnimatedSprites.has(urlName)) {
        console.info('Could not find animated sprite for:', pokemonNameOrId);
        loggedMissingAnimatedSprites.add(urlName);
    }

    return null;
}

export function getAllPokemonNames(): PokemonName[] {
    return Object.keys(POKEMON_NAME_TO_ID) as PokemonName[];
}

export function searchPokemon(partialName: string): PokemonName[] {
    const searchTerm = partialName.toLowerCase();
    return Object.keys(POKEMON_NAME_TO_ID).filter(name => name.toLowerCase().includes(searchTerm)) as PokemonName[];
}
