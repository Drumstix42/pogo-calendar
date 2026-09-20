/**
 * Builds copyable Pokemon GO Campfire meetup text (title + static blurb + per-Pokemon CP/weakness
 * blocks). Ported from a companion Python tool (campfire-event-helper).
 */
import { type CPResult, type PokemonData, calculateRaidCP, formatCP } from './pokemonCP';
import { type PokemonType, formatVulnerabilityText, getSuperEffectiveTypes } from './typeEffectiveness';

export interface CampfirePokemonEntry {
    displayName: string;
    types: string[];
    cp: CPResult;
    vulnerabilityText: string;
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
        vulnerabilityText: formatVulnerabilityText(single, double),
        megaMaxCp,
    };
}

export interface CampfireOutputOptions {
    includeVulnerabilities: boolean;
    includeCP: boolean;
    includeWeatherBoostedCP: boolean;
    includeMaxCP: boolean;
}

export function formatCampfirePokemonEntry(entry: CampfirePokemonEntry, options: CampfireOutputOptions): string {
    const lines = [`${entry.displayName} (${entry.types.join(', ')})`];

    if (options.includeVulnerabilities) {
        lines.push(`Vulnerable: ${entry.vulnerabilityText}`);
    }

    if (options.includeCP) {
        const hundoCp = options.includeWeatherBoostedCP
            ? `${formatCP(entry.cp.level20Max)} / ${formatCP(entry.cp.level25Max)} (WB)`
            : formatCP(entry.cp.level20Max);
        lines.push(`Hundo CP: ${hundoCp}`);
    }

    if (options.includeMaxCP) {
        lines.push(`Max CP: ${formatCP(entry.cp.level50Max)} (Lvl 50)`);
        if (entry.megaMaxCp) {
            lines.push(`Mega Max CP: ${formatCP(entry.megaMaxCp)} (Lvl 50)`);
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

export function formatCampfireEventText(title: string, body: string, entries: CampfirePokemonEntry[], options: CampfireOutputOptions): string {
    const entryBlock = entries.length > 0 ? `--\n${entries.map(entry => formatCampfirePokemonEntry(entry, options)).join('\n\n')}` : '';
    return [title.trim(), body.trim(), entryBlock].filter(Boolean).join('\n\n');
}
