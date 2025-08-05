import { type PogoEvent } from './eventTypes';
// Import the Pokemon mapper utility
// @ts-ignore - JS file without type definitions
import { getPokemonSpriteUrl } from './pokemonMapper.js';

/**
 * Extracts Pokemon name from raid-hour event titles
 * @param eventName - The event name like "Lugia Raid Hour"
 * @returns The Pokemon name or null if not found
 */
function extractPokemonNameFromRaidHour(eventName: string): string | null {
    // Pattern: "<Pokemon Name> Raid Hour"
    const match = eventName.match(/^(.+?)\s+Raid\s+Hour$/i);
    return match ? match[1].trim() : null;
}

/**
 * Extracts Pokemon name from max-mondays event titles
 * @param eventName - The event name like "Dynamax Omanyte during Max Monday"
 * @returns The Pokemon name or null if not found
 */
function extractPokemonNameFromMaxMonday(eventName: string): string | null {
    // Pattern: "Dynamax <Pokemon Name> during Max Monday"
    const match = eventName.match(/^Dynamax\s+(.+?)\s+during\s+Max\s+Monday$/i);
    return match ? match[1].trim() : null;
}

/**
 * Gets all Pokémon images for an event
 * @param event - The PoGo event object
 * @returns Array of image URLs, empty array if none found
 */
export function getEventPokemonImages(event: PogoEvent): string[] {
    if (!event.extraData) return [];

    // Handle raid battles - can have multiple bosses
    if (event.eventType === 'raid-battles' && event.extraData.raidbattles?.bosses) {
        const bosses = event.extraData.raidbattles.bosses;
        if (bosses.length > 0) {
            return bosses.map(boss => boss.image).filter(image => image) as string[];
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

/**
 * Gets all Pokémon names for an event
 * @param event - The PoGo event object
 * @returns Array of Pokémon names, empty array if none found
 */
export function getEventPokemonNames(event: PogoEvent): string[] {
    if (!event.extraData) return [];

    // Handle raid battles - can have multiple bosses
    if (event.eventType === 'raid-battles' && event.extraData.raidbattles?.bosses) {
        const bosses = event.extraData.raidbattles.bosses;
        if (bosses.length > 0) {
            return bosses.map(boss => boss.name).filter(name => name) as string[];
        }
    }

    // Handle raid-hour events - parse Pokemon name from title
    if (event.eventType === 'raid-hour') {
        const pokemonName = extractPokemonNameFromRaidHour(event.name);
        if (pokemonName) {
            return [pokemonName];
        }
    }

    // Handle max-mondays events - parse Pokemon name from title
    if (event.eventType === 'max-mondays') {
        const pokemonName = extractPokemonNameFromMaxMonday(event.name);
        if (pokemonName) {
            return [pokemonName];
        }
    }

    // Handle spotlight hours - can have multiple Pokémon
    if (event.eventType === 'pokemon-spotlight-hour' && event.extraData.spotlight) {
        if (event.extraData.spotlight.list && event.extraData.spotlight.list.length > 0) {
            return event.extraData.spotlight.list.map(pokemon => pokemon.name).filter(name => name) as string[];
        }

        // Fallback to single name
        if (event.extraData.spotlight.name) {
            return [event.extraData.spotlight.name];
        }
    }

    // Handle community day events - use spawns data
    if (event.eventType === 'community-day' && event.extraData.communityday?.spawns) {
        const spawns = event.extraData.communityday.spawns;
        return spawns.map(spawn => spawn.name).filter(name => name) as string[];
    }

    // Handle max battles - no specific Pokémon names available
    if (event.eventType === 'max-battles') {
        // These events don't have specific Pokémon names we can extract
        return [];
    }

    return [];
}

/**
 * Gets the first Pokémon name for an event (for backwards compatibility)
 * @param event - The PoGo event object
 * @returns The Pokémon name if found, null otherwise
 */
export function getEventPokemonName(event: PogoEvent): string | null {
    const names = getEventPokemonNames(event);
    return names.length > 0 ? names[0] : null;
}

/**
 * Checks if an event has Pokémon image data available
 * @param event - The PoGo event object
 * @returns True if the event has Pokémon image data
 */
export function hasEventPokemonImage(event: PogoEvent): boolean {
    return getEventPokemonImages(event).length > 0;
}

/**
 * Gets all Pokémon images for multi-day events
 * @param event - The PoGo event object
 * @returns Array of image URLs for multi-day events, empty array if none found
 */
export function getMultiDayPokemonImages(event: PogoEvent): string[] {
    // Only show images for raid-battles events for now
    if (event.eventType !== 'raid-battles') {
        return [];
    }

    return getEventPokemonImages(event);
}
