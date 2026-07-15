import type { PokemonImageData } from './eventPokemon';
import { parsePokemonNameAndSuffix } from './eventPokemonNames';
import type { PokemonBoss } from './eventTypes';
import { getPokemonAnimatedUrl, getPokemonSpriteUrl, hasExactSpriteForm } from './pokemonMapper';
import { getSuperMegaShieldCount } from './superMegaShields';

interface TierGroupBoss {
    name: string;
    image: string;
}

interface TierGroupInput {
    label: string;
    bosses: TierGroupBoss[];
}

/**
 * Orders raid tier labels: "Super Mega" first, then "Tier N" descending, then alphabetical.
 */
export function sortTierLabel(a: string, b: string): number {
    const normalizedA = a.trim().toLowerCase();
    const normalizedB = b.trim().toLowerCase();

    if (normalizedA === 'super mega' && normalizedB !== 'super mega') return -1;
    if (normalizedB === 'super mega' && normalizedA !== 'super mega') return 1;

    const tierA = a.match(/^Tier (\d+)$/i);
    const tierB = b.match(/^Tier (\d+)$/i);
    if (tierA && tierB) return parseInt(tierB[1]) - parseInt(tierA[1]);
    if (tierA) return -1;
    if (tierB) return 1;

    return a.localeCompare(b);
}

/**
 * Groups bosses by their `raidType` (defaulting to "Other"), sorted via {@link sortTierLabel}.
 */
export function buildTierGroupsFromBosses(bosses: PokemonBoss[] | undefined) {
    if (!bosses || bosses.length === 0) {
        return undefined;
    }

    const tierMap = new Map<string, PokemonBoss[]>();
    bosses.forEach(boss => {
        const label = boss.raidType || 'Other';
        if (!tierMap.has(label)) {
            tierMap.set(label, []);
        }
        tierMap.get(label)!.push(boss);
    });

    return Array.from(tierMap.entries())
        .sort(([a], [b]) => sortTierLabel(a, b))
        .map(([label, groupedBosses]) => ({
            label,
            bosses: groupedBosses,
        }));
}

export interface RaidTierGroupWithImages {
    label: string;
    showLabel: boolean;
    images: PokemonImageData[];
}

export function buildRaidTierGroupsWithImages(groups: TierGroupInput[] | undefined, useAnimated: boolean): RaidTierGroupWithImages[] | null {
    if (!groups || groups.length === 0) return null;

    const shouldHideOtherLabel = groups.length === 1 && groups[0].label === 'Other';

    return groups.map(group => {
        const isSuperMega = group.label === 'Super Mega';
        return {
            label: group.label,
            showLabel: !shouldHideOtherLabel,
            images: group.bosses.map(boss => {
                const parsed = parsePokemonNameAndSuffix(boss.name);
                // Only trust a generated sprite when it genuinely matches the boss's exact form -
                // PokeMiners silently substitutes the base sprite for an unmatched suffix (e.g. no
                // Mega Raichu X/Y art exists), which would otherwise outrank the event-provided image
                // instead of falling below it. The base sprite is the absolute last-resort fallback.
                const hasRealForm = parsed != null && hasExactSpriteForm(parsed.pokemonName, parsed.suffix);
                const generatedUrl = hasRealForm ? (useAnimated ? getPokemonAnimatedUrl(boss.name) : null) : null;
                const imageUrl = generatedUrl ?? boss.image ?? (parsed ? getPokemonSpriteUrl(parsed.pokemonName) : null);

                return {
                    name: boss.name,
                    imageUrl,
                    fallbackImageUrl: boss.image || null,
                    shieldCount: isSuperMega ? getSuperMegaShieldCount(boss.name) : undefined,
                } satisfies PokemonImageData;
            }),
        };
    });
}
