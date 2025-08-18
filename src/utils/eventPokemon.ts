import { type PogoEvent } from './eventTypes';
import { getPokemonAnimatedUrl, getPokemonSpriteUrl } from './pokemonMapper.ts';

export interface PokemonImageOptions {
    useAnimated?: boolean;
    isMega?: boolean;
}

function extractPokemonNameFromRaidHour(eventName: string): string | null {
    // Pattern: "<Pokemon Name> Raid Hour"
    const match = eventName.match(/^(.+?)\s+Raid\s+Hour$/i);
    return match ? match[1].trim() : null;
}

function extractPokemonNameFromMaxMonday(eventName: string): string | null {
    // Pattern: "Dynamax <Pokemon Name> during Max Monday"
    const match = eventName.match(/^Dynamax\s+(.+?)\s+during\s+Max\s+Monday$/i);
    return match ? match[1].trim() : null;
}

// Uses getRaidSubType to determine the format, then applies appropriate regex patterns
function extractPokemonNameFromRaidBattle(event: PogoEvent): string | null {
    const subType = getRaidSubType(event);
    const eventName = event.name;

    switch (subType) {
        case 'shadow-raids': {
            // Pattern: "Shadow <Pokemon> in Shadow Raids"
            const match = eventName.match(/^Shadow\s+(.+?)\s+in\s+Shadow\s+Raids$/i);
            return match ? match[1].trim() : null;
        }
        case 'mega-raids': {
            // Pattern: "Mega <Pokemon> in Mega Raids"
            const match = eventName.match(/^Mega\s+(.+?)\s+in\s+Mega\s+Raids$/i);
            return match ? match[1].trim() : null;
        }
        case 'raid-battles': {
            // Pattern: "<Pokemon> in <tier>-star Raid battles"
            // Captures: [full match, pokemon name, tier number]
            const match = eventName.match(/^(.+?)\s+in\s+(\d+)-star\s+Raid\s+battles$/i);
            return match ? match[1].trim() : null;
        }
        default:
            return null;
    }
}

// Helper function to get sprite URL based on options, with fallback logic
function getSpriteUrlWithOptions(pokemonName: string, options?: PokemonImageOptions): string | null {
    if (options?.useAnimated) {
        try {
            // For mega pokemon, pass the suffix to the animated URL function
            const suffix = options.isMega ? '-mega' : undefined;
            const animatedUrl = getPokemonAnimatedUrl(pokemonName, suffix);
            if (animatedUrl) {
                return animatedUrl;
            }
        } catch (error) {
            console.warn(`Failed to generate animated sprite for ${pokemonName}:`, error);
        }
        // If animated fails, fall back to static sprite
    }

    // Default to static sprite (use original name, not mega variant)
    try {
        return getPokemonSpriteUrl(pokemonName);
    } catch (error) {
        console.warn(`Failed to generate sprite for ${pokemonName}:`, error);
        return null;
    }
}

export function getEventPokemonImages(event: PogoEvent, options?: PokemonImageOptions): string[] {
    if (!event.extraData) return [];

    // Handle raid battles - try to extract Pokemon name first, then fall back to bosses data
    if (event.eventType === 'raid-battles') {
        // First try to extract Pokemon name from event title and generate sprite
        const pokemonName = extractPokemonNameFromRaidBattle(event);
        if (pokemonName) {
            const isMega = getRaidSubType(event) === 'mega-raids';
            const spriteUrl = getSpriteUrlWithOptions(pokemonName, { ...options, isMega });
            if (spriteUrl) {
                return [spriteUrl];
            }
        }

        // Fallback to LeetDuck's provided images (this will always be the case with Mega's due to limited API data)
        if (event.extraData?.raidbattles?.bosses) {
            const bosses = event.extraData.raidbattles.bosses;
            if (bosses.length > 0) {
                return bosses.map(boss => boss.image).filter(image => image) as string[];
            }
        }
    }

    // Handle raid-hour events - parse Pokemon name from title and generate sprite URL
    if (event.eventType === 'raid-hour') {
        const pokemonName = extractPokemonNameFromRaidHour(event.name);
        if (pokemonName) {
            const spriteUrl = getSpriteUrlWithOptions(pokemonName, options);
            if (spriteUrl) {
                return [spriteUrl];
            }
        }
    }

    // Handle max-mondays events - parse Pokemon name from title and generate sprite URL
    if (event.eventType === 'max-mondays') {
        const pokemonName = extractPokemonNameFromMaxMonday(event.name);
        if (pokemonName) {
            const spriteUrl = getSpriteUrlWithOptions(pokemonName, options);
            if (spriteUrl) {
                return [spriteUrl];
            } else {
                // If sprite generation fails, fall back to event image
                if (event.image) {
                    return [event.image];
                }
            }
        }
    }

    // Handle spotlight hours - can have multiple Pokémon
    if (event.eventType === 'pokemon-spotlight-hour' && event.extraData.spotlight) {
        const images: string[] = [];

        // Try to get images from our sprite mapper first
        if (event.extraData.spotlight.list && event.extraData.spotlight.list.length > 0) {
            // Handle multiple Pokémon (like Plusle and Minun)
            for (const pokemon of event.extraData.spotlight.list) {
                const spriteUrl = getSpriteUrlWithOptions(pokemon.name, options);
                if (spriteUrl) {
                    images.push(spriteUrl);
                } else if (pokemon.image) {
                    // Fallback to API image if sprite generation fails
                    images.push(pokemon.image);
                }
            }
        } else if (event.extraData.spotlight.name) {
            // Handle single Pokémon
            const spriteUrl = getSpriteUrlWithOptions(event.extraData.spotlight.name, options);
            if (spriteUrl) {
                images.push(spriteUrl);
            } else if (event.extraData.spotlight.image) {
                // Fallback to API image
                images.push(event.extraData.spotlight.image);
            }
        } else if (event.extraData.spotlight.image) {
            // Last fallback - just use the API image
            images.push(event.extraData.spotlight.image);
        }

        if (images.length > 0) {
            return images;
        }
    }

    // Handle community day events - use spawns data and generate sprites
    if (event.eventType === 'community-day' && event.extraData.communityday?.spawns) {
        const spawns = event.extraData.communityday.spawns;
        const images: string[] = [];

        for (const spawn of spawns) {
            if (spawn.name) {
                const spriteUrl = getSpriteUrlWithOptions(spawn.name, options);
                if (spriteUrl) {
                    images.push(spriteUrl);
                } else if (spawn.image) {
                    // Fallback to API image if sprite generation fails
                    images.push(spawn.image);
                }
            }
        }

        if (images.length > 0) {
            return images;
        }
    }

    // Handle max battles - use the main event image
    if (event.eventType === 'max-battles') {
        if (event.image) {
            return [event.image];
        }
    }

    return [];
}

export function hasEventPokemonImage(event: PogoEvent, options?: PokemonImageOptions): boolean {
    return getEventPokemonImages(event, options).length > 0;
}

export function getMultiDayPokemonImages(event: PogoEvent, options?: PokemonImageOptions): string[] {
    // Only show images for raid-battles events for now
    if (event.eventType !== 'raid-battles') {
        return [];
    }

    return getEventPokemonImages(event, options);
}

export function getRaidSubType(event: PogoEvent): string {
    if (event.eventType !== 'raid-battles') {
        return ''; // Not applicable for non-raid events
    }

    const eventName = event.name.toLowerCase();

    if (eventName.includes('shadow')) {
        return 'shadow-raids';
    } else if (eventName.includes('mega')) {
        return 'mega-raids';
    } else if (eventName.includes('raid battles')) {
        return 'raid-battles';
    }
    return ''; // Default case, no specific sub-type
}

// Higher number = higher priority for raid sub-type sorting
export function getRaidSubTypePriority(event: PogoEvent): number {
    if (event.eventType !== 'raid-battles') {
        return 0; // Not applicable for non-raid events
    }

    const subType = getRaidSubType(event);
    switch (subType) {
        case 'shadow-raids':
            return 3;
        case 'raid-battles':
            return 2;
        case 'mega-raids':
            return 1;
        default:
            return 0;
    }
}
