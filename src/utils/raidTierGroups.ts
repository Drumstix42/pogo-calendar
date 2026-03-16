import type { PokemonImageData } from './eventPokemon';
import { getPokemonAnimatedUrl } from './pokemonMapper';

interface TierGroupBoss {
    name: string;
    image: string;
}

interface TierGroupInput {
    label: string;
    bosses: TierGroupBoss[];
}

export interface RaidTierGroupWithImages {
    label: string;
    showLabel: boolean;
    images: PokemonImageData[];
}

export function buildRaidTierGroupsWithImages(groups: TierGroupInput[] | undefined, useAnimated: boolean): RaidTierGroupWithImages[] | null {
    if (!groups || groups.length === 0) return null;

    const shouldHideOtherLabel = groups.length === 1 && groups[0].label === 'Other';

    return groups.map(group => ({
        label: group.label,
        showLabel: !shouldHideOtherLabel,
        images: group.bosses.map(boss => {
            const animatedUrl = useAnimated ? getPokemonAnimatedUrl(boss.name) : null;
            return { name: boss.name, imageUrl: animatedUrl ?? boss.image } satisfies PokemonImageData;
        }),
    }));
}
