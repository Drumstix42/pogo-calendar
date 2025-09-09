import { POKEMON_NAME_TO_ID } from '@/constants/pokemonEntries';
import { VALID_ANIMATED_SPRITES } from '@/constants/validAnimatedSprites';
import { VALID_STATIC_SPRITES } from '@/constants/validStaticSprites';

// Type definitions
export type PokemonName = keyof typeof POKEMON_NAME_TO_ID;
export type PokemonId = number;
export type SpriteType = 'dream-world' | 'official-artwork' | 'home';

// Normalize Pokemon names for matching - smart Unicode normalization + gender symbols
function normalizePokemonName(name: string): string {
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

export function getPokemonSpriteUrl(pokemonNameOrId: string | number, suffix?: string): string | null {
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

    // Check if this static sprite exists before generating the URL
    if (!isValidStaticSprite(urlName)) {
        console.info('Could not find static sprite for:', pokemonNameOrId);
        return null;
    }

    return `https://raw.githubusercontent.com/mgrann03/pokemon-resources/refs/heads/main/graphics/pogo/${urlName}.png`;

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

    // Check if this animated sprite exists before generating the URL
    if (!isValidAnimatedSprite(urlName)) {
        console.info('Could not find animated sprite for:', pokemonNameOrId);
        return null;
    }

    return `https://raw.githubusercontent.com/mgrann03/pokemon-resources/main/graphics/ani/${urlName}.gif`;
}

export function getAllPokemonNames(): PokemonName[] {
    return Object.keys(POKEMON_NAME_TO_ID) as PokemonName[];
}

export function searchPokemon(partialName: string): PokemonName[] {
    const searchTerm = partialName.toLowerCase();
    return Object.keys(POKEMON_NAME_TO_ID).filter(name => name.toLowerCase().includes(searchTerm)) as PokemonName[];
}
