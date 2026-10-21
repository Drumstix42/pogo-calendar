import type { PokemonImageData } from './eventPokemon';
import { parsePokemonNameAndSuffix } from './eventPokemonNames';
import { SPRITE_EFFECTS } from './eventPokemonTypes';
import { splitSpriteEffectPrefix } from './eventSprite';
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
 * A boss's tier group label: its battle category combined with its star tier (e.g. "Tier 5",
 * "Tier 3 Shadow", "Tier 5 Max Battle"). Categories that are a tier of their own (Gigantamax, Mega,
 * Super Mega, Primal) or have no known tier are labeled by category alone.
 */
export function getRaidTierLabel(boss: PokemonBoss): string {
    const { raidType, tier } = boss;
    if (tier == null) return raidType || 'Other';
    if (!raidType || raidType === 'Raid') return `Tier ${tier}`;
    if (raidType === 'Shadow' || raidType === 'Max Battle') return `Tier ${tier} ${raidType}`;
    return raidType;
}

// Labels ranked above every "Tier N", in order. Gigantamax is effectively the top Max Battle tier.
const TOP_TIER_LABELS = ['gigantamax', 'primal', 'super mega'];
// Within a star tier raids lead (regular, then Shadow), then Max Battles. Mega only appears in Tier 5.
const TIER_CATEGORY_ORDER = ['', 'shadow', 'mega', 'max battle'];
const MAX_STAR_TIER = 6;

function getStarTierRank(tier: number, category: string) {
    return TOP_TIER_LABELS.length + (MAX_STAR_TIER - tier) * TIER_CATEGORY_ORDER.length + TIER_CATEGORY_ORDER.indexOf(category);
}

function getTierLabelRank(label: string) {
    const normalized = label.trim().toLowerCase();
    const topRank = TOP_TIER_LABELS.indexOf(normalized);
    if (topRank !== -1) return topRank;

    // Mega sits just below the Tier 5 raids; a Max Battle of unknown tier ranks as Tier 5.
    if (normalized === 'mega' || normalized === 'max battle') return getStarTierRank(5, normalized);

    const tierMatch = normalized.match(/^tier (\d+)(?: (shadow|max battle))?$/);
    if (tierMatch) return getStarTierRank(parseInt(tierMatch[1]), tierMatch[2] ?? '');

    return Infinity;
}

/**
 * Orders raid tier labels: {@link TOP_TIER_LABELS} first, then star tiers descending (each tier's
 * raids, Shadow raids, then Max Battles), then alphabetical.
 */
export function sortTierLabel(a: string, b: string): number {
    const rankA = getTierLabelRank(a);
    const rankB = getTierLabelRank(b);
    if (rankA !== rankB) return rankA - rankB;

    return a.localeCompare(b);
}

/**
 * Narrows a boss list down to just the single highest-priority tier group (by
 * {@link sortTierLabel}) - for compact previews where mixing tiers (e.g. Super Mega alongside a
 * plain Mega) reads oddly. The full, unfiltered list still powers detailed views.
 *
 * Exception: if the top two tiers together are still a handful of unique Pokemon (e.g. a lone
 * Tier 5 boss alongside a two-form Super Mega), both are shown - narrowing to just one tier would
 * hide a boss for no visual-clutter benefit.
 */
export function getHighestTierBosses(bosses: PokemonBoss[]): PokemonBoss[] {
    if (bosses.length === 0) return bosses;

    const tierMap = new Map<string, PokemonBoss[]>();
    bosses.forEach(boss => {
        const label = getRaidTierLabel(boss);
        if (!tierMap.has(label)) {
            tierMap.set(label, []);
        }
        tierMap.get(label)!.push(boss);
    });

    const sortedGroups = Array.from(tierMap.entries()).sort(([a], [b]) => sortTierLabel(a, b));
    const [, topTierBosses] = sortedGroups[0];

    const combinedBosses =
        sortedGroups.length > 1 && new Set([...topTierBosses, ...sortedGroups[1][1]].map(boss => boss.name.toLowerCase())).size <= 3
            ? [...topTierBosses, ...sortedGroups[1][1]]
            : topTierBosses;

    const deduped = new Map<string, PokemonBoss>();
    combinedBosses.forEach(boss => deduped.set(boss.name.toLowerCase(), boss));
    return Array.from(deduped.values());
}

/**
 * Groups bosses by {@link getRaidTierLabel}, sorted via {@link sortTierLabel}.
 */
export function buildTierGroupsFromBosses(bosses: PokemonBoss[] | undefined) {
    if (!bosses || bosses.length === 0) {
        return undefined;
    }

    const tierMap = new Map<string, PokemonBoss[]>();
    bosses.forEach(boss => {
        const label = getRaidTierLabel(boss);
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
                const { spriteName, effect } = splitSpriteEffectPrefix(boss.name);
                const parsed = parsePokemonNameAndSuffix(spriteName);
                // Only trust a generated sprite when it genuinely matches the boss's exact form -
                // PokeMiners silently substitutes the base sprite for an unmatched suffix (e.g. no
                // Mega Raichu X/Y art exists), which would otherwise outrank the event-provided image
                // instead of falling below it. The base sprite is the absolute last-resort fallback.
                const hasRealForm = parsed != null && hasExactSpriteForm(parsed.pokemonName, parsed.suffix);
                const generatedUrl = hasRealForm ? (useAnimated ? getPokemonAnimatedUrl(spriteName) : null) : null;
                const imageUrl = generatedUrl ?? boss.image ?? (parsed ? getPokemonSpriteUrl(parsed.pokemonName) : null);

                return {
                    name: boss.name,
                    imageUrl,
                    fallbackImageUrl: boss.image || null,
                    shieldCount: isSuperMega ? getSuperMegaShieldCount(boss.name) : undefined,
                    effect: isSuperMega ? SPRITE_EFFECTS.SUPER_MEGA : effect,
                } satisfies PokemonImageData;
            }),
        };
    });
}
