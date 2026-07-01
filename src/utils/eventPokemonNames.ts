import { formatEventName } from './eventName.ts';
import { getRaidSubType } from './eventSubtype';
import { type PogoEvent } from './eventTypes';

// Parse multiple Pokemon names from event title text separated by commas and "and"
// Examples: "Mega Latias and Mega Latios" → ["Mega Latias", "Mega Latios"]
//           "Pokemon A, Pokemon B, and Pokemon C" → ["Pokemon A", "Pokemon B", "Pokemon C"]
//           "Genesect (Burn Drive), Genesect (Chill Drive)" → ["Genesect (Burn Drive)", "Genesect (Chill Drive)"]
export function parseEventPokemonNames(pokemonString: string): string[] {
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

export function extractPokemonNamesFromRaidHour(eventName: string): string[] {
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

export function extractPokemonNameFromMaxMonday(eventName: string): string | null {
    // Pattern: "Dynamax <Pokemon Name> during Max Monday"
    const match = eventName.match(/^Dynamax\s+(.+?)\s+during\s+Max\s+Monday$/i);
    return match ? match[1].trim() : null;
}

// Single source of truth for the max-battle title patterns. Returns the captured Pokemon name
// (e.g. "Toxtricity Low Key") for a matching title, else null. Shared by the max-battle image
// resolver and the component's Dynamax/Gigantamax effect flags.
export function parseGigantamaxMaxBattleName(eventName: string): string | null {
    // Pattern: "Gigantamax <Pokemon Name> Max Battle Day"
    const match = eventName.match(/^Gigantamax\s+(.+?)\s+Max\s+Battle\s+Day$/i);
    return match ? match[1].trim() : null;
}

export function parseDynamaxMaxBattleName(eventName: string): string | null {
    // Pattern: "Dynamax <Pokemon Name> Max Battle Weekend/Day"
    const match = eventName.match(/^Dynamax\s+(.+?)\s+Max\s+Battle\s+(?:Weekend|Day)$/i);
    return match ? match[1].trim() : null;
}

export function extractPokemonNamesFromSpotlightHour(eventName: string): string[] {
    const decodedEventName = formatEventName(eventName);

    // Pattern: "<Pokemon Name(s)> Spotlight Hour"
    const match = decodedEventName.match(/^(.+?)\s+Spotlight\s+Hour$/i);
    if (!match) {
        return [];
    }

    return parseEventPokemonNames(match[1].trim());
}

// Uses getRaidSubType to determine the format, then applies appropriate regex patterns
export function extractPokemonNameFromRaidBattle(event: PogoEvent): string | null {
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
        case 'super-mega-raids': {
            // Pattern: "Mega <Pokemon> in Super Mega Raids"
            const match = eventName.match(/^Mega\s+(.+?)\s+in\s+Super\s+Mega\s+Raids$/i);
            return match ? match[1].trim() : null;
        }
        case 'mega-raids': {
            // Pattern: "Mega <Pokemon> in Mega Raids"
            const match = eventName.match(/^Mega\s+(.+?)\s+in\s+Mega\s+Raids$/i);
            return match ? match[1].trim() : null;
        }
        case 'primal-raids': {
            // Pattern: "Primal <Pokemon> in Primal Raids"
            const match = eventName.match(/^Primal\s+(.+?)\s+in\s+Primal\s+Raids$/i);
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

// Maps a regional-form prefix word to its sprite-slug suffix (irregular: Alolan/Paldean are abbreviated).
const REGIONAL_FORM_SUFFIXES: Record<string, string> = {
    alolan: 'alola',
    galarian: 'galarian',
    hisuian: 'hisuian',
    paldean: 'paldea',
};

export function parsePokemonNameAndSuffix(pokemonNameString: string): { pokemonName: string; suffix?: string } | null {
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

    // Handle Primal Pokemon
    const primalMatch = pokemonNameString.match(/^Primal\s+(.+)$/i);
    if (primalMatch) {
        const baseName = primalMatch[1].trim();
        return { pokemonName: baseName, suffix: '-primal' };
    }

    // Handle Shadow Pokemon
    const shadowMatch = pokemonNameString.match(/^Shadow\s+(.+)$/i);
    if (shadowMatch) {
        const baseName = shadowMatch[1].trim();
        return { pokemonName: baseName }; // No suffix for shadow, just base Pokemon
    }

    // Handle regional form prefixes: "Hisuian Braviary", "Alolan Raichu", "Galarian Zapdos", "Paldean Wooper"
    // Suffix slugs are irregular: Alolan→-alola, Paldean→-paldea, but Hisuian/Galarian keep the full word.
    const regionalMatch = pokemonNameString.match(/^(Alolan|Galarian|Hisuian|Paldean)\s+(.+)$/i);
    if (regionalMatch) {
        const baseName = regionalMatch[2].trim();
        return { pokemonName: baseName, suffix: `-${REGIONAL_FORM_SUFFIXES[regionalMatch[1].toLowerCase()]}` };
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

        // Map verbose form names to their short sprite slug equivalents
        const FORM_NAME_OVERRIDES: Record<string, string> = {
            'dawn wings': 'dawnwings',
            'dusk mane': 'duskmane',
            'hero of many battles': 'hero',
            'crowned sword': 'crownedsword',
            'crowned shield': 'crownedshield',
        };
        if (FORM_NAME_OVERRIDES[pokemonFormName]) {
            pokemonFormName = FORM_NAME_OVERRIDES[pokemonFormName];
        } else {
            pokemonFormName = pokemonFormName.replace(/[^a-z0-9]+/g, '-');
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
