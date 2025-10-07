import { formatEventName } from './eventName.ts';
import { type PogoEvent, getRaidSubType } from './eventTypes';
import { getPokemonAnimatedUrl, getPokemonSpriteUrl } from './pokemonMapper.ts';

export interface PokemonImageOptions {
    useAnimated?: boolean;
    isMega?: boolean;
}

export interface PokemonImageData {
    name: string;
    imageUrl: string;
}

function extractPokemonNamesFromRaidHour(eventName: string): string[] {
    // Decode HTML entities first
    const decodedEventName = formatEventName(eventName);

    // Pattern: "<Pokemon Name(s)> Raid Hour"
    const match = decodedEventName.match(/^(.+?)\s+Raid\s+Hour$/i);
    if (!match) {
        return [];
    }

    const pokemonPart = match[1].trim();

    // Handle special case: Pokemon with forms in parentheses
    // Example: "Deoxys (Attack & Speed Forme)" should become ["Deoxys (Attack Forme)", "Deoxys (Speed Forme)"]
    const formeParenthesesMatch = pokemonPart.match(/^(.+?)\s+\((.+?)\s+&\s+(.+?)\s+forme?\)$/i);
    if (formeParenthesesMatch) {
        const baseName = formeParenthesesMatch[1].trim();
        const form1 = formeParenthesesMatch[2].trim();
        const form2 = formeParenthesesMatch[3].trim();
        return [`${baseName} (${form1} Forme)`, `${baseName} (${form2} Forme)`];
    }

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
    const eventName = formatEventName(event.name);

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
    // Also handles: "Deoxys (Normal)" → no suffix, "Deoxys (Attack)" → "deoxys-attack"
    const formeMatch = pokemonNameString.match(/^(.+?)\s+\((.+?)(?:\s+forme?)?\)$/i);
    if (formeMatch) {
        const baseName = formeMatch[1].trim();
        const formeName = formeMatch[2].trim().toLowerCase();

        // Special handling for Deoxys Normal form - no suffix needed
        if (baseName.toLowerCase() === 'deoxys' && formeName === 'normal') {
            return { pokemonName: baseName };
        }

        return { pokemonName: baseName, suffix: `-${formeName}` };
    }

    // Special case: Genesect without form specified defaults to "normal" form for static sprites
    if (pokemonNameString.toLowerCase().trim() === 'genesect') {
        return { pokemonName: 'Genesect', suffix: '-normal' };
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

export function getEventPokemonImages(event: PogoEvent, options?: PokemonImageOptions): PokemonImageData[] {
    if (!event.extraData) return [];

    // Handle raid battles - check bosses data FIRST, then fall back to event name extraction
    if (event.eventType === 'raid-battles' || event.eventType === 'raid-weekend') {
        // First try to use bosses data from extraData
        if (event.extraData?.raidbattles?.bosses && event.extraData.raidbattles.bosses.length > 0) {
            const bosses = event.extraData.raidbattles.bosses;
            const images: PokemonImageData[] = [];

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
                        images.push({ name: boss.name, imageUrl: spriteUrl });
                    } else if (boss.image) {
                        // Fallback to API image if sprite generation fails
                        images.push({ name: boss.name, imageUrl: boss.image });
                    }
                } else if (boss.image) {
                    // If we can't parse the boss name, use the API image
                    images.push({ name: boss.name, imageUrl: boss.image });
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
                return [{ name: pokemonName, imageUrl: spriteUrl }];
            }
        }

        // Final fallback to LeetDuck's provided images
        if (event.extraData?.raidbattles?.bosses) {
            const bosses = event.extraData.raidbattles.bosses;
            if (bosses.length > 0) {
                return bosses.map(boss => ({ name: boss.name, imageUrl: boss.image })).filter(item => item.imageUrl);
            }
        }
    }

    // Handle raid-hour events - parse Pokemon names from title and generate sprite URLs
    if (event.eventType === 'raid-hour') {
        const pokemonNames = extractPokemonNamesFromRaidHour(formatEventName(event.name));
        if (pokemonNames.length > 0) {
            const images: PokemonImageData[] = [];

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
                        images.push({ name: pokemonNameString, imageUrl: spriteUrl });
                    }
                }
            }

            if (images.length > 0) {
                return images;
            }
        }
    }

    // Handle raid-day events - parse Pokemon name from title and generate sprite URL
    if (event.eventType === 'raid-day') {
        const eventName = formatEventName(event.name);

        // Pattern: "<Pokemon Name> Raid Day"
        const match = eventName.match(/^(.+?)\s+Raid\s+Day$/i);
        if (match) {
            const pokemonNameString = match[1].trim();
            const parsedData = parsePokemonNameAndSuffix(pokemonNameString);
            if (parsedData) {
                let spriteUrl: string | null = null;

                // If we have a custom suffix (like -mega), use it directly
                if (parsedData.suffix) {
                    spriteUrl = getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options);
                } else {
                    spriteUrl = getSpriteUrl(parsedData.pokemonName, undefined, options);
                }

                if (spriteUrl) {
                    return [{ name: pokemonNameString, imageUrl: spriteUrl }];
                }
            }
        }
    }

    // Handle max-mondays events - parse Pokemon name from title and generate sprite URL
    if (event.eventType === 'max-mondays') {
        const pokemonName = extractPokemonNameFromMaxMonday(formatEventName(event.name));
        if (pokemonName) {
            const spriteUrl = getSpriteUrl(pokemonName, undefined, options);
            if (spriteUrl) {
                return [{ name: pokemonName, imageUrl: spriteUrl }];
            } else {
                // If sprite generation fails, fall back to event image
                if (event.image) {
                    return [{ name: pokemonName, imageUrl: event.image }];
                }
            }
        }
    }

    // Handle spotlight hours - can have multiple Pokémon
    if (event.eventType === 'pokemon-spotlight-hour' && event.extraData.spotlight) {
        const images: PokemonImageData[] = [];

        // Try to get images from our sprite mapper first
        if (event.extraData.spotlight.list && event.extraData.spotlight.list.length > 0) {
            // Handle multiple Pokémon (like Plusle and Minun)
            for (const pokemon of event.extraData.spotlight.list) {
                const spriteUrl = getSpriteUrl(pokemon.name, undefined, options);
                if (spriteUrl) {
                    images.push({ name: pokemon.name, imageUrl: spriteUrl });
                } else if (pokemon.image) {
                    // Fallback to API image if sprite generation fails
                    images.push({ name: pokemon.name, imageUrl: pokemon.image });
                }
            }
        } else if (event.extraData.spotlight.name) {
            // Handle single Pokémon
            const spriteUrl = getSpriteUrl(event.extraData.spotlight.name, undefined, options);
            if (spriteUrl) {
                images.push({ name: event.extraData.spotlight.name, imageUrl: spriteUrl });
            } else if (event.extraData.spotlight.image) {
                // Fallback to API image
                images.push({ name: event.extraData.spotlight.name, imageUrl: event.extraData.spotlight.image });
            }
        } else if (event.extraData.spotlight.image) {
            // Last fallback - just use the API image (we may not have the name in this case)
            images.push({ name: 'Spotlight Pokemon', imageUrl: event.extraData.spotlight.image });
        }

        if (images.length > 0) {
            return images;
        }
    }

    // Handle community day events - use spawns data and generate sprites
    if (event.eventType === 'community-day' && event.extraData.communityday?.spawns) {
        const spawns = event.extraData.communityday.spawns;
        const images: PokemonImageData[] = [];

        for (const spawn of spawns) {
            if (spawn.name) {
                const spriteUrl = getSpriteUrl(spawn.name, undefined, options);
                if (spriteUrl) {
                    images.push({ name: spawn.name, imageUrl: spriteUrl });
                } else if (spawn.image) {
                    // Fallback to API image if sprite generation fails
                    images.push({ name: spawn.name, imageUrl: spawn.image });
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
            return [{ name: 'Max Battle', imageUrl: event.image }];
        }
    }

    // Handle pokestop showcases - parse Pokemon name(s) from title and generate sprite URLs
    if (event.eventType === 'pokestop-showcase') {
        const eventName = formatEventName(event.name);

        // Pattern: "<Pokemon Name(s)> PokéStop Showcase(s)"
        const match = eventName.match(/^(.+?)\s+PokéStop\s+Showcases?$/i);
        if (match) {
            const pokemonNameString = match[1].trim();

            // Skip if it's a general type-based showcase (contains "-type" or " type")
            if (/(?:\w+-type|\s+type)\b/i.test(pokemonNameString)) {
                return [];
            }

            // Handle multiple Pokemon separated by commas and "and"
            const pokemonNames: string[] = [];

            // First split on commas, then handle "and" in the last part
            const commaParts = pokemonNameString.split(',').map(part => part.trim());

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
            if (commaParts.length === 1 && pokemonNameString.includes(' and ')) {
                pokemonNames.length = 0; // Clear the array
                const andParts = pokemonNameString.split(' and ').map(p => p.trim());
                pokemonNames.push(...andParts);
            }

            // If still no multiple Pokemon found, treat as single Pokemon
            if (pokemonNames.length <= 1) {
                pokemonNames.length = 0;
                pokemonNames.push(pokemonNameString);
            }

            const images: PokemonImageData[] = [];

            for (const name of pokemonNames) {
                const parsedData = parsePokemonNameAndSuffix(name);
                if (parsedData) {
                    let spriteUrl: string | null = null;

                    // If we have a custom suffix (like forms), use it directly
                    if (parsedData.suffix) {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options);
                    } else {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, undefined, options);
                    }

                    if (spriteUrl) {
                        images.push({ name: name, imageUrl: spriteUrl });
                    }
                }
            }

            return images;
        }
    }

    return [];
}

export function hasEventPokemonImage(event: PogoEvent, options?: PokemonImageOptions): boolean {
    return getEventPokemonImages(event, options).length > 0;
}

export function getMultiDayPokemonImages(event: PogoEvent, options?: PokemonImageOptions): PokemonImageData[] {
    // Only show images for raid-battles events for now
    if (event.eventType === 'raid-battles' || event.eventType === 'raid-weekend') {
        return getEventPokemonImages(event, options);
    }
    return [];
}
