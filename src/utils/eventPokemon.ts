import { formatEventName } from './eventName.ts';
import { type PogoEvent, getRaidSubType } from './eventTypes';
import { getPokemonAnimatedUrl, getPokemonId, getPokemonSpriteUrl } from './pokemonMapper.ts';
import { GIGANTAMAX_POKEMON_IDS } from '@/constants/validGigantamaxSprites.ts';

export interface PokemonImageOptions {
    useAnimated?: boolean;
    isMega?: boolean;
}

export interface PokemonImageData {
    name: string;
    imageUrl: string | null;
}

// Special Gigantamax forms for Pokemon with multiple variants
// Maps Pokemon ID to default form filename and pattern-based form filenames
// TODO: migrate mapping to pokemonMapper.ts
const GMAX_FORM_VARIANTS: Record<number, { default: string; patterns: Record<string, string> }> = {
    849: {
        // Toxtricity - "Gigantamax Toxtricity" → Amped, "Gigantamax Toxtricity Low Key" → Low Key
        default: '849-Amped-Gmax.png',
        patterns: {
            'low-key': '849-Low-Key-Gmax.png',
        },
    },
    892: {
        // Urshifu - "Gigantamax Urshifu" → Rapid Strike, "Gigantamax Urshifu Single Strike" → Single Strike
        default: '892-Single-Strike-Gmax.png',
        patterns: {
            'rapid-strike': '892-Rapid-Strike-Gmax.png',
        },
    },
};

// Parse multiple Pokemon names from event title text separated by commas and "and"
// Examples: "Mega Latias and Mega Latios" → ["Mega Latias", "Mega Latios"]
//           "Pokemon A, Pokemon B, and Pokemon C" → ["Pokemon A", "Pokemon B", "Pokemon C"]
//           "Genesect (Burn Drive), Genesect (Chill Drive)" → ["Genesect (Burn Drive)", "Genesect (Chill Drive)"]
function parseEventPokemonNames(pokemonString: string): string[] {
    // Handle special case: Pokemon with forms in parentheses separated by &
    // Example: "Deoxys (Attack & Speed Forme)" should become ["Deoxys (Attack Forme)", "Deoxys (Speed Forme)"]
    const pokemonFormParenthesesMatch = pokemonString.match(/^(.+?)\s+\((.+?)\s+&\s+(.+?)\s+forme?\)$/i);
    if (pokemonFormParenthesesMatch) {
        const baseName = pokemonFormParenthesesMatch[1].trim();
        const form1 = pokemonFormParenthesesMatch[2].trim();
        const form2 = pokemonFormParenthesesMatch[3].trim();
        return [`${baseName} (${form1} Forme)`, `${baseName} (${form2} Forme)`];
    }

    const pokemonNames: string[] = [];

    // First check if we have commas
    const commaParts = pokemonString.split(',').map(part => part.trim());

    if (commaParts.length > 1) {
        // Multiple comma-separated parts
        for (let i = 0; i < commaParts.length; i++) {
            let part = commaParts[i];

            // Strip leading "and " if present
            if (part.toLowerCase().startsWith('and ')) {
                part = part.substring(4).trim();
            }

            if (i === commaParts.length - 1 && part.includes(' and ')) {
                // Last part might contain "and" - split it
                const andParts = part.split(' and ').map(p => p.trim());
                pokemonNames.push(...andParts);
            } else {
                pokemonNames.push(part);
            }
        }
    } else if (pokemonString.includes(' and ')) {
        // No commas, just split on "and"
        const andParts = pokemonString.split(' and ').map(p => p.trim());
        pokemonNames.push(...andParts);
    } else {
        // Single Pokemon name
        pokemonNames.push(pokemonString);
    }

    return pokemonNames.filter(name => name.length > 0);
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
    return parseEventPokemonNames(pokemonPart);
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
            // Pattern: "<Pokemon> in <tier>-star Raid battles" or "<Pokemon> [Special Type] Raid Weekend"
            // Special types can be: "Fusion", etc.
            const raidBattles = eventName.match(/^(.+?)\s+in\s+(\d+)-star\s+Raid\s+battles$/i);
            if (raidBattles) {
                return raidBattles[1].trim();
            }

            const raidWeekend = eventName.match(/^(.+?)\s+(?:Fusion\s+)?Raid\s+Weekend$/i);
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

    // Handle forme prefixes: "Therian Forme <Pokemon>", "Incarnate Forme <Pokemon>", "Origin Forme <Pokemon>", etc.
    const formeMatch = pokemonNameString.match(/^(Therian|Incarnate|Origin|Altered|Sky|Land|Attack|Defense|Speed)\s+Forme?\s+(.+)$/i);
    if (formeMatch) {
        const formeName = formeMatch[1].trim().toLowerCase();
        const baseName = formeMatch[2].trim();
        return { pokemonName: baseName, suffix: `-${formeName}` };
    }

    // Handle Pokemon with special forms in parentheses
    // Examples: "Palkia (Origin Forme)" → "palkia-origin", "Landorus (Therian Form)" → "landorus-therian"
    // Also handles: "Deoxys (Normal)" → no suffix, "Deoxys (Attack)" → "deoxys-attack"
    // Special case: "Genesect (Burn Drive)" → "genesect-burn"
    const pokemonFormMatch = pokemonNameString.match(/^(.+?)\s+\((.+?)(?:\s+forme?)?\)$/i);
    if (pokemonFormMatch) {
        const baseName = pokemonFormMatch[1].trim();
        let pokemonFormName = pokemonFormMatch[2].trim().toLowerCase();

        // Special handling for Deoxys Normal form - no suffix needed
        if (baseName.toLowerCase() === 'deoxys' && pokemonFormName === 'normal') {
            return { pokemonName: baseName };
        }

        // Special handling for Genesect Drives - strip " drive" suffix
        if (baseName.toLowerCase() === 'genesect' && pokemonFormName.endsWith(' drive')) {
            pokemonFormName = pokemonFormName.replace(/\s+drive$/i, '');
        }

        return { pokemonName: baseName, suffix: `-${pokemonFormName}` };
    }

    // Special case: Genesect without form specified defaults to "normal" form for static sprites
    if (pokemonNameString.toLowerCase().trim() === 'genesect') {
        return { pokemonName: 'Genesect', suffix: '-normal' };
    }

    // Regular Pokemon (no prefix)
    return { pokemonName: pokemonNameString.trim() };
}

function getSpriteUrl(pokemonName: string, suffix?: string, options?: PokemonImageOptions, fallbackUrl?: string | null) {
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

    // Try static sprite
    try {
        const staticUrl = getPokemonSpriteUrl(pokemonName, finalSuffix);
        if (staticUrl) {
            return staticUrl;
        }
    } catch (error) {
        console.warn(`Failed to generate sprite for ${pokemonName}:`, error);
    }

    // If our sprite generation failed, try the fallback URL from event data
    if (fallbackUrl) {
        return fallbackUrl;
    }

    return null;
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
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options, boss.image);
                    } else {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, undefined, options, boss.image);
                    }

                    // Always add to images array, fallback handled by getSpriteUrl
                    images.push({ name: boss.name, imageUrl: spriteUrl });
                } else {
                    // If we can't parse the boss name, try API image or use null
                    images.push({ name: boss.name, imageUrl: boss.image || null });
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
            const pokemonNames = parseEventPokemonNames(pokemonName);
            const images: PokemonImageData[] = [];

            for (const name of pokemonNames) {
                const parsedData = parsePokemonNameAndSuffix(name);
                if (parsedData) {
                    let spriteUrl: string | null = null;

                    // If we have a custom suffix (like -mega), use it directly
                    if (parsedData.suffix) {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options);
                    } else {
                        const suffix = isMega ? '-mega' : undefined;
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, suffix, options);
                    }

                    images.push({ name: name, imageUrl: spriteUrl });
                }
            }

            if (images.length > 0) {
                return images;
            }
        }

        // Final fallback to LeetDuck's provided images
        if (event.extraData?.raidbattles?.bosses) {
            const bosses = event.extraData.raidbattles.bosses;
            if (bosses.length > 0) {
                return bosses.map(boss => ({ name: boss.name, imageUrl: boss.image || null }));
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

                    // Always add to images array, even if spriteUrl is null
                    images.push({ name: pokemonNameString, imageUrl: spriteUrl });
                }
            }

            if (images.length > 0) {
                return images;
            }
        }
    }

    // Handle event raid hour sub-events - use bosses data from extraData
    if (event.eventType === 'event' && event.extraData?.isRaidHourSubEvent) {
        if (event.extraData?.raidbattles?.bosses && event.extraData.raidbattles.bosses.length > 0) {
            const bosses = event.extraData.raidbattles.bosses;
            const images: PokemonImageData[] = [];

            for (const boss of bosses) {
                const parsedData = parsePokemonNameAndSuffix(boss.name);
                if (parsedData) {
                    let spriteUrl: string | null = null;

                    // If we have a custom suffix (like -megax, -megay), use it directly
                    if (parsedData.suffix) {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options, boss.image);
                    } else {
                        spriteUrl = getSpriteUrl(parsedData.pokemonName, undefined, options, boss.image);
                    }

                    // Always add to images array, fallback handled by getSpriteUrl
                    images.push({ name: boss.name, imageUrl: spriteUrl });
                } else {
                    // If we can't parse the boss name, try API image or use null
                    images.push({ name: boss.name, imageUrl: boss.image || null });
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

        // Pattern: "<Pokemon Name> [Special Type] Raid Day" or "<Pokemon Name> Raid Day"
        // Special types can be: "Fusion", "Shadow", etc.
        const match = eventName.match(/^(.+?)\s+(?:Fusion\s+)?Raid\s+Day$/i);
        if (match) {
            const pokemonNameString = match[1].trim();

            // Skip generic raid days without a Pokemon name (e.g. future events without complete data)
            if (pokemonNameString.toLowerCase() === 'shadow' || pokemonNameString.toLowerCase() === 'raid') {
                return [];
            }

            const parsedData = parsePokemonNameAndSuffix(pokemonNameString);
            if (parsedData) {
                let spriteUrl: string | null = null;

                // If we have a custom suffix (like -mega), use it directly
                if (parsedData.suffix) {
                    spriteUrl = getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options);
                } else {
                    spriteUrl = getSpriteUrl(parsedData.pokemonName, undefined, options);
                }

                // Always return, even if spriteUrl is null
                return [{ name: pokemonNameString, imageUrl: spriteUrl }];
            }
        }
    }

    // Handle max-mondays events - parse Pokemon name from title and generate sprite URL
    if (event.eventType === 'max-mondays') {
        const pokemonName = extractPokemonNameFromMaxMonday(formatEventName(event.name));
        if (pokemonName) {
            const spriteUrl = getSpriteUrl(pokemonName, undefined, options);
            // Always return, even if spriteUrl is null (let component handle placeholder)
            return [{ name: pokemonName, imageUrl: spriteUrl }];
        }
    }

    // Handle spotlight hours - can have multiple Pokémon
    if (event.eventType === 'pokemon-spotlight-hour' && event.extraData.spotlight) {
        const images: PokemonImageData[] = [];

        // Try to get images from our sprite mapper first
        if (event.extraData.spotlight.list && event.extraData.spotlight.list.length > 0) {
            // Handle multiple Pokémon (like Plusle and Minun)
            for (const pokemon of event.extraData.spotlight.list) {
                const spriteUrl = getSpriteUrl(pokemon.name, undefined, options, pokemon.image);
                images.push({ name: pokemon.name, imageUrl: spriteUrl });
            }
        } else if (event.extraData.spotlight.name) {
            // Handle single Pokémon
            const fallbackImage = event.extraData.spotlight.image || null;
            const spriteUrl = getSpriteUrl(event.extraData.spotlight.name, undefined, options, fallbackImage);
            images.push({ name: event.extraData.spotlight.name, imageUrl: spriteUrl });
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
                const fallbackImage = spawn.image || null;
                const spriteUrl = getSpriteUrl(spawn.name, undefined, options, fallbackImage);
                images.push({ name: spawn.name, imageUrl: spriteUrl });
            }
        }

        if (images.length > 0) {
            return images;
        }
    }

    // Handle max battles - use the main event image
    if (event.eventType === 'max-battles') {
        const eventName = formatEventName(event.name);

        // Check for Gigantamax Pokemon pattern: "Gigantamax <Pokemon Name> Max Battle Day"
        const gigantamaxMatch = eventName.match(/^Gigantamax\s+(.+?)\s+Max\s+Battle\s+Day$/i);
        if (gigantamaxMatch) {
            const pokemonName = gigantamaxMatch[1].trim();

            // Extract base Pokemon name for ID lookup (e.g., "Toxtricity Low Key" → "Toxtricity")
            // Try to match known form patterns first
            const normalizedName = pokemonName.toLowerCase().replace(/\s+/g, '-');
            let basePokemonName = pokemonName;
            let matchedFormFilename: string | null = null;

            // Check each Pokemon with form variants
            for (const formVariant of Object.values(GMAX_FORM_VARIANTS)) {
                const matchedForm = Object.entries(formVariant.patterns).find(([pattern]) => normalizedName.includes(pattern));

                if (matchedForm) {
                    // Found a form match - extract base name by removing the form text
                    // Handle various formats: "Toxtricity Low Key", "Toxtricity (Low Key)", "Toxtricity (Low Key Form)"
                    basePokemonName = pokemonName
                        .replace(/[\s(]+(low[\s-]?key|single[\s-]?strike|rapid[\s-]?strike)[\s)]*(?:form)?[\s)]*/gi, '')
                        .trim();
                    matchedFormFilename = matchedForm[1];
                    break;
                }
            }

            const pokemonId = getPokemonId(basePokemonName);

            // Check if we have a Gigantamax sprite for this Pokemon
            if (pokemonId && GIGANTAMAX_POKEMON_IDS.has(pokemonId)) {
                let gmaxFilename: string;

                // Use the matched form filename if found, otherwise check for default form
                if (matchedFormFilename) {
                    gmaxFilename = matchedFormFilename;
                } else {
                    const formVariant = GMAX_FORM_VARIANTS[pokemonId];
                    gmaxFilename = formVariant ? formVariant.default : `${String(pokemonId).padStart(3, '0')}-Gmax.png`;
                }

                const gmaxUrl = `https://raw.githubusercontent.com/HybridShivam/Pokemon/master/assets/images/${gmaxFilename}`;
                return [{ name: `Gigantamax ${pokemonName}`, imageUrl: gmaxUrl }];
            }
        }

        // Check for regular Dynamax pattern: "Dynamax <Pokemon> Max Battle Weekend/Day"
        const dynamaxMatch = eventName.match(/^Dynamax\s+(.+?)\s+Max\s+Battle\s+(?:Weekend|Day)$/i);
        if (dynamaxMatch) {
            const pokemonName = dynamaxMatch[1].trim();
            const spriteUrl = getSpriteUrl(pokemonName, undefined, options);
            return [{ name: pokemonName, imageUrl: spriteUrl }];
        }

        // Fallback to event image if available (e.g., "Max Battle Weekend" with no specific Pokemon)
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

            const pokemonNames = parseEventPokemonNames(pokemonNameString);
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

                    // Always add to images array, even if spriteUrl is null
                    // This ensures all Pokemon from the event name are represented
                    images.push({ name: name, imageUrl: spriteUrl });
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
