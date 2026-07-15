import { SUPER_MEGA_SHIELD_COUNTS } from '@/constants/superMegaShields';

/** Looks up the shield count for a Super Mega Raid boss by name, with or without a "Mega" prefix. */
export function getSuperMegaShieldCount(pokemonName: string): number | undefined {
    const normalized = pokemonName
        .trim()
        .toLowerCase()
        .replace(/^mega\s+/, '');
    return SUPER_MEGA_SHIELD_COUNTS[normalized];
}
