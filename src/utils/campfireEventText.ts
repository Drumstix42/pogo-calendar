/**
 * Builds copyable Pokemon GO Campfire meetup text (title + static blurb + per-Pokemon CP/weakness
 * blocks). Ported from a companion Python tool (campfire-event-helper).
 */
import { getEventPokemonImages } from './eventPokemon';
import { type PogoEvent } from './eventTypes';
import { type CPResult, type PokemonData, calculateRaidCP, formatCP, formatCPDisplay } from './pokemonCP';
import { getSpotlightBonusText } from './spotlightBonus';
import { type PokemonType, formatWeaknessText, getSuperEffectiveTypes } from './typeEffectiveness';

// Names the image resolvers use as placeholders when no specific Pokemon is known - not real lookups.
const NON_POKEMON_PLACEHOLDER_NAMES = new Set(['Spotlight Pokemon', 'Max Battle']);

// Distinct, real Pokemon names for an event - seeds both the text and image sections' Pokemon lists.
export function resolveCampfireEventPokemonNames(event: PogoEvent): string[] {
    return [...new Set(getEventPokemonImages(event).map(image => image.name))].filter(name => !NON_POKEMON_PLACEHOLDER_NAMES.has(name));
}

// Spotlight Hour's single bonus, or Community Day's list. `communityday.bonuses` is typed `any[]`
// upstream but is `{ text, image }`-shaped at runtime.
export function getCampfireEventBonuses(event: PogoEvent): string[] {
    const spotlightBonus = getSpotlightBonusText(event);
    if (spotlightBonus) return [spotlightBonus];

    if (event.eventType !== 'community-day') return [];
    const bonuses: Array<{ text?: string }> = event.extraData?.communityday?.bonuses ?? [];
    return bonuses.map(bonus => bonus?.text?.trim()).filter((text): text is string => Boolean(text));
}

export interface CampfirePokemonEntry {
    displayName: string;
    types: string[];
    cp: CPResult;
    weaknessText: string;
    /** Temporarily-boosted Level 50 CP while Mega Evolved/Primal Reverted - only set when the battle form has its own stats. */
    megaMaxCp?: number;
}

/**
 * @param catchablePokemon Base species stats - what you actually catch/encounter (CP is always
 * based on this, even for Mega/Dynamax/Gigantamax/Primal/Shadow, none of which are catchable forms).
 * @param battlePokemon Typing to show weaknesses for - the actual boss being fought. Defaults to
 * `catchablePokemon`, but should be the Mega/Primal record when one exists, since those do change typing.
 */
export function buildCampfirePokemonEntry(
    displayName: string,
    catchablePokemon: PokemonData,
    battlePokemon: PokemonData = catchablePokemon,
): CampfirePokemonEntry {
    const [type1, type2] = battlePokemon.types as PokemonType[];
    const { single, double } = getSuperEffectiveTypes(type1, type2);

    // A distinct battle-form record (Mega/Primal) means its stats differ from the catchable species.
    const megaMaxCp = battlePokemon !== catchablePokemon ? calculateRaidCP(battlePokemon.stats).level50Max : undefined;

    return {
        displayName,
        types: battlePokemon.types,
        cp: calculateRaidCP(catchablePokemon.stats),
        weaknessText: formatWeaknessText(single, double),
        megaMaxCp,
    };
}

export interface CampfireOutputOptions {
    includePokemonDetails: boolean;
    includeWeakness: boolean;
    includeCP: boolean;
    includeWeatherBoostedCP: boolean;
    includeMaxCP: boolean;
    /** Event bonuses (e.g. "3x Catch XP"), placed between the summary text and the Pokemon block. */
    bonuses?: string[];
}

export function formatCampfirePokemonEntry(entry: CampfirePokemonEntry, options: CampfireOutputOptions): string {
    const lines = [`${entry.displayName} (${entry.types.join(', ')})`];

    if (options.includeWeakness) {
        lines.push(`Weakness: ${entry.weaknessText}`);
    }

    if (options.includeCP) {
        const hundoCp = formatCPDisplay(entry.cp.level20Max, entry.cp.level25Max, options.includeWeatherBoostedCP);
        lines.push(`Hundo CP: ${options.includeWeatherBoostedCP ? `${hundoCp} (WB)` : hundoCp}`);
    }

    if (options.includeMaxCP) {
        lines.push(`Max CP: ${formatCP(entry.cp.level50Max)} (Lv 50)`);
        if (entry.megaMaxCp) {
            lines.push(`Mega Max CP: ${formatCP(entry.megaMaxCp)} (Lv 50)`);
        }
    }

    return lines.join('\n');
}

// Natural-language join: "A", "A and B", "A, B, and C"
export function joinPokemonNames(names: string[]): string {
    if (names.length <= 1) return names[0] ?? '';
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

const TEMPLATE_PLACEHOLDERS: Record<string, RegExp> = {
    pokemonName: /\{\{\s*pokemonName\s*\}\}/gi,
    eventType: /\{\{\s*eventType\s*\}\}/gi,
};

export interface CampfireTemplateContext {
    pokemonNames: string[];
    eventTypeName: string;
}

/** Resolves `{{pokemonName}}`/`{{eventType}}` placeholders in a title/body template. */
export function resolveCampfireTemplate(template: string, context: CampfireTemplateContext): string {
    return template
        .replace(TEMPLATE_PLACEHOLDERS.pokemonName, joinPokemonNames(context.pokemonNames))
        .replace(TEMPLATE_PLACEHOLDERS.eventType, context.eventTypeName);
}

function formatBonusBlock(bonuses: string[]): string {
    if (bonuses.length === 0) return '';
    if (bonuses.length === 1) return `Bonus: ${bonuses[0]}`;
    return `Bonuses:\n${bonuses.map(bonus => `- ${bonus}`).join('\n')}`;
}

export function formatCampfireEventText(title: string, body: string, entries: CampfirePokemonEntry[], options: CampfireOutputOptions): string {
    const bonusBlock = formatBonusBlock(options.bonuses ?? []);
    const entryBlock =
        options.includePokemonDetails && entries.length > 0
            ? `--\n${entries.map(entry => formatCampfirePokemonEntry(entry, options)).join('\n\n')}`
            : '';
    return [title.trim(), body.trim(), bonusBlock, entryBlock].filter(Boolean).join('\n\n');
}
