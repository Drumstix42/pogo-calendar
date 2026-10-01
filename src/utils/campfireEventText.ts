/**
 * Builds copyable Pokemon GO Campfire meetup text (title + static blurb + per-Pokemon CP/weakness
 * blocks). Ported from a companion Python tool (campfire-event-helper).
 */
import { getEventBonusGroups } from './eventBonuses';
import { getEventPokemonImages } from './eventPokemon';
import { type PogoEvent } from './eventTypes';
import { type CPResult, type PokemonData, calculateRaidCP, formatCP, formatCPDisplay } from './pokemonCP';
import { type PokemonType, formatWeaknessText, getSuperEffectiveTypes } from './typeEffectiveness';

// Names the image resolvers use as placeholders when no specific Pokemon is known - not real lookups.
const NON_POKEMON_PLACEHOLDER_NAMES = new Set(['Spotlight Pokemon', 'Max Battle']);

// Distinct, real Pokemon names for an event - seeds both the text and image sections' Pokemon lists.
export function resolveCampfireEventPokemonNames(event: PogoEvent): string[] {
    return [...new Set(getEventPokemonImages(event).map(image => image.name))].filter(name => !NON_POKEMON_PLACEHOLDER_NAMES.has(name));
}

export interface CampfireBonusGroup {
    title: string | null;
    items: string[];
}

// Trailing `*`/`**` markers point at footnotes the Output doesn't include.
const FOOTNOTE_MARKER = /\*+$/;

// The same bonus groups the detail views show, reduced to plain text lines.
export function getCampfireEventBonusGroups(event: PogoEvent): CampfireBonusGroup[] {
    return getEventBonusGroups(event)
        .map(group => ({
            title: group.title,
            items: group.items.map(item => item.text.replace(FOOTNOTE_MARKER, '').trim()).filter(Boolean),
        }))
        .filter(group => group.items.length > 0);
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
    /** Event bonus groups (e.g. "3x Catch XP"), placed between the summary text and the Pokemon block. */
    bonusGroups?: CampfireBonusGroup[];
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

function formatBonusSection(heading: string, items: string[]): string {
    if (items.length === 1) return `${heading}: ${items[0]}`;
    return `${heading}:\n${items.map(item => `- ${item}`).join('\n')}`;
}

function formatBonusBlock(groups: CampfireBonusGroup[]): string {
    // Back-to-back untitled groups (e.g. all-day + time-windowed bonuses) share one default heading.
    const sections: CampfireBonusGroup[] = [];
    for (const group of groups) {
        const previous = sections[sections.length - 1];
        if (!group.title && previous && !previous.title) {
            previous.items.push(...group.items);
        } else {
            sections.push({ title: group.title, items: [...group.items] });
        }
    }

    return sections
        .map(section => formatBonusSection(section.title ?? (section.items.length === 1 ? 'Bonus' : 'Bonuses'), section.items))
        .join('\n\n');
}

export function formatCampfireEventText(title: string, body: string, entries: CampfirePokemonEntry[], options: CampfireOutputOptions): string {
    const bonusBlock = formatBonusBlock(options.bonusGroups ?? []);
    const entryBlock =
        options.includePokemonDetails && entries.length > 0
            ? `--\n${entries.map(entry => formatCampfirePokemonEntry(entry, options)).join('\n\n')}`
            : '';
    return [title.trim(), body.trim(), bonusBlock, entryBlock].filter(Boolean).join('\n\n');
}
