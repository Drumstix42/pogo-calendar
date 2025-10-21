import { POKEMON_NAME_TO_ID } from '@/constants/pokemonEntries';
import { VALID_ANIMATED_SPRITES } from '@/constants/validAnimatedSprites';
import { VALID_STATIC_SPRITES } from '@/constants/validStaticSprites';

// Type definitions
export type PokemonName = keyof typeof POKEMON_NAME_TO_ID;
export type PokemonId = number;
export type SpriteType = 'dream-world' | 'official-artwork' | 'home';

// track logged missing sprites (to avoid spam)
const loggedMissingStaticSprites = new Set<string>();
const loggedMissingAnimatedSprites = new Set<string>();

// Special handling for Pokemon with non-standard forms
// Maps Pokemon ID to their default static sprite URL from PokeMiners
const SPECIAL_STATIC_SPRITE_RULES: Record<number, string> = {
    849: 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/Addressable%20Assets/pm849.fAMPED.icon.png', // Toxtricity - defaults to Amped form
};

// Form-specific URLs for Pokemon with multiple forms
const FORM_SPECIFIC_STATIC_SPRITES: Record<string, string> = {
    'toxtricity-amped': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/Addressable%20Assets/pm849.fAMPED.icon.png',
    'toxtricity-low-key':
        'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/Addressable%20Assets/pm849.fLOW_KEY.icon.png',
};

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

    // Check for form-specific special rules first
    const formKey = suffix ? `${urlName}` : null;
    if (formKey && FORM_SPECIFIC_STATIC_SPRITES[formKey]) {
        return FORM_SPECIFIC_STATIC_SPRITES[formKey];
    }

    // Check if this static sprite exists in primary source
    if (isValidStaticSprite(urlName)) {
        return `https://raw.githubusercontent.com/mgrann03/pokemon-resources/refs/heads/main/graphics/pogo/${urlName}.png`;
    }

    // Check for special static sprite rules (base form with no suffix)
    if (!suffix && pokemonId && SPECIAL_STATIC_SPRITE_RULES[pokemonId]) {
        return SPECIAL_STATIC_SPRITE_RULES[pokemonId];
    }

    // Fallback to PokeMiners for base forms only (no suffixes)
    if (!suffix && pokemonId) {
        return `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/Addressable%20Assets/pm${pokemonId}.icon.png`;
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

    // Fallback to PokeMiners for base forms only (no suffixes) - note: these are static PNGs, not animated
    if (!suffix && typeof pokemonNameOrId !== 'string') {
        // We have a numeric ID, try PokeMiners as fallback (will be static, not animated)
        return `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/Addressable%20Assets/pm${pokemonNameOrId}.icon.png`;
    }

    // If we have a name, try to get the ID for PokeMiners fallback
    if (!suffix && typeof pokemonNameOrId === 'string') {
        const pokemonId = getPokemonId(pokemonNameOrId);
        if (pokemonId) {
            return `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/Addressable%20Assets/pm${pokemonId}.icon.png`;
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
