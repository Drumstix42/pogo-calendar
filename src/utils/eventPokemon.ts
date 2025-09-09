import { type PogoEvent } from './eventTypes';
import { getPokemonAnimatedUrl, getPokemonSpriteUrl } from './pokemonMapper.ts';

export interface PokemonImageOptions {
    useAnimated?: boolean;
    isMega?: boolean;
}

function extractPokemonNamesFromRaidHour(eventName: string): string[] {
    // Pattern: "<Pokemon Name(s)> Raid Hour"
    const match = eventName.match(/^(.+?)\s+Raid\s+Hour$/i);
    if (!match) {
        return [];
    }

    const pokemonPart = match[1].trim();

    // Split on "and" and also handle potential commas for 3+ Pokemon
    // Examples: "Mega Latias and Mega Latios", "Pokemon A, Pokemon B, and Pokemon C"
    const pokemonNames: string[] = [];

    // First split on commas, then handle "and" in the last part
    const commaParts = pokemonPart.split(',').map(part => part.trim());

    for (let i = 0; i < commaParts.length; i++) {
        const part = commaParts[i];

        if (i === commaParts.length - 1 && part.includes(' and ')) {
            // Last part might contain "and" - split it
            const andParts = part.split(' and ').map(p => p.trim());
            pokemonNames.push(...andParts);
        } else {
            pokemonNames.push(part);
        }
    }

    // If no commas were found, just split on "and"
    if (commaParts.length === 1 && pokemonPart.includes(' and ')) {
        pokemonNames.length = 0; // Clear the array
        const andParts = pokemonPart.split(' and ').map(p => p.trim());
        pokemonNames.push(...andParts);
    }

    return pokemonNames.filter(name => name.length > 0);
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
            // Pattern: "Shadow <Pokemon> in Shadow Raids" or "Shadow <Pokemon> Raid Weekend"
            const inShadowRaids = eventName.match(/^Shadow\s+(.+?)\s+in\s+Shadow\s+Raids$/i);
            if (inShadowRaids) {
                return inShadowRaids[1].trim();
            }

            const raidWeekend = eventName.match(/^Shadow\s+(.+?)\s+Raid\s+Weekend$/i);
            if (raidWeekend) {
                return raidWeekend[1].trim();
            }

            return null;
        }
        case 'mega-raids': {
            // Pattern: "Mega <Pokemon> in Mega Raids"
            const match = eventName.match(/^Mega\s+(.+?)\s+in\s+Mega\s+Raids$/i);
            return match ? match[1].trim() : null;
        }
        case 'raid-battles':
        case 'raid-weekend': {
            // Pattern: "<Pokemon> in <tier>-star Raid battles" or "<Pokemon> Raid Weekend"
            const raidBattles = eventName.match(/^(.+?)\s+in\s+(\d+)-star\s+Raid\s+battles$/i);
            if (raidBattles) {
                return raidBattles[1].trim();
            }

            const raidWeekend = eventName.match(/^(.+?)\s+Raid\s+Weekend$/i);
            if (raidWeekend) {
                return raidWeekend[1].trim();
            }

            return null;
        }
        default:
            return null;
    }
}

function parsePokemonNameAndSuffix(pokemonNameString: string): { pokemonName: string; suffix?: string } | null {
    // Handle Mega variants with X/Y
    const megaXYMatch = pokemonNameString.match(/^Mega\s+(.+?)\s+([XY])$/i);
    if (megaXYMatch) {
        const baseName = megaXYMatch[1].trim();
        const variant = megaXYMatch[2].toUpperCase();
        const suffix = variant === 'X' ? '-megax' : '-megay';
        return { pokemonName: baseName, suffix };
    }

    // Handle regular Mega Pokemon
    const megaMatch = pokemonNameString.match(/^Mega\s+(.+)$/i);
    if (megaMatch) {
        const baseName = megaMatch[1].trim();
        return { pokemonName: baseName, suffix: '-mega' };
    }

    // Handle Shadow Pokemon
    const shadowMatch = pokemonNameString.match(/^Shadow\s+(.+)$/i);
    if (shadowMatch) {
        const baseName = shadowMatch[1].trim();
        return { pokemonName: baseName }; // No suffix for shadow, just base Pokemon
    }

    // Handle Pokemon with special forms in parentheses
    // Examples: "Palkia (Origin Forme)" → "palkia-origin", "Landorus (Therian Form)" → "landorus-therian"
    const formeMatch = pokemonNameString.match(/^(.+?)\s+\((.+?)\s+forme?\)$/i);
    if (formeMatch) {
        const baseName = formeMatch[1].trim();
        const formeName = formeMatch[2].trim().toLowerCase();
        return { pokemonName: baseName, suffix: `-${formeName}` };
    }

    // Regular Pokemon (no prefix)
    return { pokemonName: pokemonNameString.trim() };
}

function getSpriteUrl(pokemonName: string, suffix?: string, options?: PokemonImageOptions) {
    // Use provided suffix or derive from options
    const finalSuffix = suffix ?? (options?.isMega ? '-mega' : undefined);

    if (options?.useAnimated) {
        try {
            const animatedUrl = getPokemonAnimatedUrl(pokemonName, finalSuffix);
            if (animatedUrl) {
                return animatedUrl;
            }
        } catch (error) {
            console.warn(`Failed to generate animated sprite for ${pokemonName}:`, error);
        }
        // If animated fails, fall back to static sprite
    }

    // Default to static sprite
    try {
        return getPokemonSpriteUrl(pokemonName, finalSuffix);
    } catch (error) {
        console.warn(`Failed to generate sprite for ${pokemonName}:`, error);
        return null;
    }
}

export function getEventPokemonImages(event: PogoEvent, options?: PokemonImageOptions): string[] {
    if (!event.extraData) return [];

    // Handle raid battles - check bosses data FIRST, then fall back to event name extraction
    if (event.eventType === 'raid-battles' || event.eventType === 'raid-weekend') {
        // First try to use bosses data from extraData
        if (event.extraData?.raidbattles?.bosses && event.extraData.raidbattles.bosses.length > 0) {
            const bosses = event.extraData.raidbattles.bosses;
            const images: string[] = [];

            for (const boss of bosses) {
                const parsedData = parsePokemonNameAndSuffix(boss.name);
                if (parsedData) {
                    let spriteUrl: string | null = null;

                    // If we have a custom suffix (like -megax, -megay), use it directly
                    if (parsedData.suffix) {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options);
                    } else {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, undefined, options);
                    }

                    if (spriteUrl) {
                        images.push(spriteUrl);
                    } else if (boss.image) {
                        // Fallback to API image if sprite generation fails
                        images.push(boss.image);
                    }
                } else if (boss.image) {
                    // If we can't parse the boss name, use the API image
                    images.push(boss.image);
                }
            }

            if (images.length > 0) {
                return images;
            }
        }

        // Fallback to event name extraction if bosses data doesn't work
        const pokemonName = extractPokemonNameFromRaidBattle(event);
        if (pokemonName) {
            const isMega = getRaidSubType(event) === 'mega-raids';
            const suffix = isMega ? '-mega' : undefined;
            const spriteUrl = getSpriteUrl(pokemonName, suffix, options);
            if (spriteUrl) {
                return [spriteUrl];
            }
        }

        // Final fallback to LeetDuck's provided images
        if (event.extraData?.raidbattles?.bosses) {
            const bosses = event.extraData.raidbattles.bosses;
            if (bosses.length > 0) {
                return bosses.map(boss => boss.image).filter(image => image) as string[];
            }
        }
    }

    // Handle raid-hour events - parse Pokemon names from title and generate sprite URLs
    if (event.eventType === 'raid-hour') {
        const pokemonNames = extractPokemonNamesFromRaidHour(event.name);
        if (pokemonNames.length > 0) {
            const images: string[] = [];

            for (const pokemonNameString of pokemonNames) {
                const parsedData = parsePokemonNameAndSuffix(pokemonNameString);
                if (parsedData) {
                    let spriteUrl: string | null = null;

                    // If we have a custom suffix (like -megax, -megay), use it directly
                    if (parsedData.suffix) {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options);
                    } else {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, undefined, options);
                    }

                    if (spriteUrl) {
                        images.push(spriteUrl);
                    }
                }
            }

            if (images.length > 0) {
                return images;
            }
        }
    }

    // Handle max-mondays events - parse Pokemon name from title and generate sprite URL
    if (event.eventType === 'max-mondays') {
        const pokemonName = extractPokemonNameFromMaxMonday(event.name);
        if (pokemonName) {
            const spriteUrl = getSpriteUrl(pokemonName, undefined, options);
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
                const spriteUrl = getSpriteUrl(pokemon.name, undefined, options);
                if (spriteUrl) {
                    images.push(spriteUrl);
                } else if (pokemon.image) {
                    // Fallback to API image if sprite generation fails
                    images.push(pokemon.image);
                }
            }
        } else if (event.extraData.spotlight.name) {
            // Handle single Pokémon
            const spriteUrl = getSpriteUrl(event.extraData.spotlight.name, undefined, options);
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
                const spriteUrl = getSpriteUrl(spawn.name, undefined, options);
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
    if (event.eventType === 'raid-battles' || event.eventType === 'raid-weekend') {
        return getEventPokemonImages(event, options);
    }
    return [];
}

export function getRaidSubType(event: PogoEvent): string {
    if (event.eventType !== 'raid-battles' && event.eventType !== 'raid-weekend') {
        return ''; // Not applicable for non-raid events
    }

    const eventName = event.name.toLowerCase();

    if (eventName.includes('shadow')) {
        return 'shadow-raids';
    } else if (eventName.includes('mega')) {
        return 'mega-raids';
    } else if (eventName.includes('raid battles') || eventName.includes('raid weekend')) {
        return 'raid-battles';
    }
    return ''; // Default case, no specific sub-type
}

// Higher number = higher priority for raid sub-type sorting
export function getRaidSubTypePriority(event: PogoEvent): number {
    if (event.eventType !== 'raid-battles' && event.eventType !== 'raid-weekend') {
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
