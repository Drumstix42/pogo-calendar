import { parsePokemonNameAndSuffix } from './eventPokemonNames';
import { type PokemonImageData, SPRITE_EFFECTS } from './eventPokemonTypes';
import { getPokemonAnimatedUrl, getPokemonSpriteUrl, hasExactSpriteForm } from './pokemonMapper';
import { type RaidTierGroupWithImages } from './raidTierGroups';

/** A single raid boss entry from the `raids.min.json` feed. */
export interface CurrentRaidBoss {
    name: string;
    tier: string;
    image: string;
    canBeShiny: boolean;
}

export interface RaidTierSummary {
    tier: string;
    label: string;
    count: number;
}

/** A tier's bosses, split into its own row plus a separate Shadow row (when shadow bosses are present). */
export interface CurrentRaidTierGroup {
    tier: string;
    label: string;
    groups: RaidTierGroupWithImages[];
}

/**
 * Single source of truth for known raid tiers: display order (array position), label, and egg icon
 * (collapsed summary bar). Anything not listed here is an unknown/future tier - still grouped and
 * rendered, just appended after these (sorted alphabetically) with its raw string as the label and no icon.
 */
const KNOWN_RAID_TIERS = [
    { tier: '5-Star Raids', label: 'Tier 5', icon: '/images/icons/raid-egg-tier-5.png' },
    { tier: 'Mega Raids', label: 'Mega', icon: '/images/icons/raid-egg-tier-mega.png' },
    { tier: '3-Star Raids', label: 'Tier 3', icon: '/images/icons/raid-egg-tier-3.png' },
    { tier: '1-Star Raids', label: 'Tier 1', icon: '/images/icons/raid-egg-tier-1.png' },
] as const;

export type KnownRaidTier = (typeof KNOWN_RAID_TIERS)[number]['tier'];

const RAID_TIER_ORDER: readonly string[] = KNOWN_RAID_TIERS.map(entry => entry.tier);
const RAID_TIER_LABELS: Record<string, string> = Object.fromEntries(KNOWN_RAID_TIERS.map(entry => [entry.tier, entry.label]));

export const RAID_TIER_ICONS: Record<string, string> = Object.fromEntries(KNOWN_RAID_TIERS.map(entry => [entry.tier, entry.icon]));

export function isShadowRaidBoss(name: string): boolean {
    return name.startsWith('Shadow ');
}

export function getRaidTierLabel(tier: string): string {
    return RAID_TIER_LABELS[tier] ?? tier;
}

function sortRaidTier(a: string, b: string): number {
    const indexA = RAID_TIER_ORDER.indexOf(a);
    const indexB = RAID_TIER_ORDER.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.localeCompare(b);
}

function buildBossImageData(boss: CurrentRaidBoss, useAnimated: boolean): PokemonImageData {
    const parsed = parsePokemonNameAndSuffix(boss.name);
    const hasRealForm = parsed != null && hasExactSpriteForm(parsed.pokemonName, parsed.suffix);
    const generatedUrl = hasRealForm
        ? useAnimated
            ? getPokemonAnimatedUrl(boss.name)
            : getPokemonSpriteUrl(parsed.pokemonName, parsed.suffix)
        : null;

    return {
        name: boss.name,
        imageUrl: generatedUrl ?? boss.image ?? null,
        fallbackImageUrl: boss.image || null,
        effect: isShadowRaidBoss(boss.name) ? SPRITE_EFFECTS.SHADOW : undefined,
    };
}

/** Groups raid bosses by tier (sorted), with shadow bosses split into their own row within the tier. */
export function groupCurrentRaidBosses(bosses: CurrentRaidBoss[], useAnimated: boolean): CurrentRaidTierGroup[] {
    const tierMap = new Map<string, CurrentRaidBoss[]>();
    bosses.forEach(boss => {
        if (!tierMap.has(boss.tier)) {
            tierMap.set(boss.tier, []);
        }
        tierMap.get(boss.tier)!.push(boss);
    });

    return Array.from(tierMap.entries())
        .sort(([a], [b]) => sortRaidTier(a, b))
        .map(([tier, tierBosses]) => {
            const nonShadowBosses = tierBosses.filter(boss => !isShadowRaidBoss(boss.name));
            const shadowBosses = tierBosses.filter(boss => isShadowRaidBoss(boss.name));

            const groups: RaidTierGroupWithImages[] = [];
            if (nonShadowBosses.length) {
                groups.push({
                    label: getRaidTierLabel(tier),
                    showLabel: false,
                    images: nonShadowBosses.map(boss => buildBossImageData(boss, useAnimated)),
                });
            }
            if (shadowBosses.length) {
                groups.push({ label: 'Shadow', showLabel: false, images: shadowBosses.map(boss => buildBossImageData(boss, useAnimated)) });
            }

            return {
                tier,
                label: getRaidTierLabel(tier),
                groups,
            };
        });
}

/** Per-tier boss counts (shadow bosses counted within their tier), for the collapsed summary bar. */
export function summarizeCurrentRaidBosses(bosses: CurrentRaidBoss[]): RaidTierSummary[] {
    const tierMap = new Map<string, number>();
    bosses.forEach(boss => {
        tierMap.set(boss.tier, (tierMap.get(boss.tier) ?? 0) + 1);
    });

    return Array.from(tierMap.entries())
        .sort(([a], [b]) => sortRaidTier(a, b))
        .map(([tier, count]) => ({ tier, label: getRaidTierLabel(tier), count }));
}
