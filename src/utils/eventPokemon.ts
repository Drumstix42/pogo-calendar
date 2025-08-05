import { type PogoEvent } from './eventTypes';
import { getPokemonSpriteUrl } from './pokemonMapper.ts';

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
            // Pattern: "<Pokemon> in Mega Raids"
            const match = eventName.match(/^(.+?)\s+in\s+Mega\s+Raids$/i);
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

export function getEventPokemonImages(event: PogoEvent): string[] {
    if (!event.extraData) return [];

    // Handle raid battles - try to extract Pokemon name first, then fall back to bosses data
    if (event.eventType === 'raid-battles') {
        // First try to extract Pokemon name from event title and generate sprite
        const pokemonName = extractPokemonNameFromRaidBattle(event);
        if (pokemonName) {
            try {
                const spriteUrl = getPokemonSpriteUrl(pokemonName);
                if (spriteUrl) {
                    return [spriteUrl];
                }
            } catch (error) {
                console.warn(`Failed to generate sprite for ${pokemonName}:`, error);
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
            try {
                const spriteUrl = getPokemonSpriteUrl(pokemonName);
                if (spriteUrl) {
                    return [spriteUrl];
                }
            } catch (error) {
                // If sprite generation fails, continue to other handlers
                console.warn(`Failed to generate sprite for ${pokemonName}:`, error);
            }
        }
    }

    // Handle max-mondays events - parse Pokemon name from title and generate sprite URL
    if (event.eventType === 'max-mondays') {
        const pokemonName = extractPokemonNameFromMaxMonday(event.name);
        if (pokemonName) {
            try {
                const spriteUrl = getPokemonSpriteUrl(pokemonName);
                if (spriteUrl) {
                    return [spriteUrl];
                }
            } catch (error) {
                // If sprite generation fails, fall back to event image
                console.warn(`Failed to generate sprite for ${pokemonName}:`, error);
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
                try {
                    const spriteUrl = getPokemonSpriteUrl(pokemon.name);
                    if (spriteUrl) {
                        images.push(spriteUrl);
                    } else if (pokemon.image) {
                        // Fallback to API image if sprite generation fails
                        images.push(pokemon.image);
                    }
                } catch (error) {
                    // Fallback to API image if sprite generation fails
                    console.warn(`Failed to generate sprite for ${pokemon.name}:`, error);
                    if (pokemon.image) {
                        images.push(pokemon.image);
                    }
                }
            }
        } else if (event.extraData.spotlight.name) {
            // Handle single Pokémon
            try {
                const spriteUrl = getPokemonSpriteUrl(event.extraData.spotlight.name);
                if (spriteUrl) {
                    images.push(spriteUrl);
                } else if (event.extraData.spotlight.image) {
                    // Fallback to API image
                    images.push(event.extraData.spotlight.image);
                }
            } catch (error) {
                // Fallback to API image
                console.warn(`Failed to generate sprite for ${event.extraData.spotlight.name}:`, error);
                if (event.extraData.spotlight.image) {
                    images.push(event.extraData.spotlight.image);
                }
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
                try {
                    const spriteUrl = getPokemonSpriteUrl(spawn.name);
                    if (spriteUrl) {
                        images.push(spriteUrl);
                    } else if (spawn.image) {
                        // Fallback to API image if sprite generation fails
                        images.push(spawn.image);
                    }
                } catch (error) {
                    // Fallback to API image if sprite generation fails
                    console.warn(`Failed to generate sprite for ${spawn.name}:`, error);
                    if (spawn.image) {
                        images.push(spawn.image);
                    }
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

export function hasEventPokemonImage(event: PogoEvent): boolean {
    return getEventPokemonImages(event).length > 0;
}

export function getMultiDayPokemonImages(event: PogoEvent): string[] {
    // Only show images for raid-battles events for now
    if (event.eventType !== 'raid-battles') {
        return [];
    }

    return getEventPokemonImages(event);
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
