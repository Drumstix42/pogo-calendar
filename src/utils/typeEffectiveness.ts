/**
 * Pokemon GO type effectiveness and weakness calculations
 */

export type PokemonType =
    | 'Normal'
    | 'Fire'
    | 'Water'
    | 'Electric'
    | 'Grass'
    | 'Ice'
    | 'Fighting'
    | 'Poison'
    | 'Ground'
    | 'Flying'
    | 'Psychic'
    | 'Bug'
    | 'Rock'
    | 'Ghost'
    | 'Dragon'
    | 'Dark'
    | 'Steel'
    | 'Fairy';

interface TypeMatchups {
    weakTo: PokemonType[];
    resists: PokemonType[];
    immuneTo: PokemonType[];
}

// Pokemon GO-specific multipliers (differ from mainline games)
const SUPER_EFFECTIVE = 1.6;
const RESIST = 0.625;
const IMMUNE = 0.39;

export const TYPE_EFFECTIVENESS: Record<PokemonType, TypeMatchups> = {
    Normal: { weakTo: ['Fighting'], resists: [], immuneTo: ['Ghost'] },
    Fire: { weakTo: ['Water', 'Ground', 'Rock'], resists: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'], immuneTo: [] },
    Water: { weakTo: ['Electric', 'Grass'], resists: ['Fire', 'Water', 'Ice', 'Steel'], immuneTo: [] },
    Electric: { weakTo: ['Ground'], resists: ['Electric', 'Flying', 'Steel'], immuneTo: [] },
    Grass: { weakTo: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resists: ['Water', 'Electric', 'Grass', 'Ground'], immuneTo: [] },
    Ice: { weakTo: ['Fire', 'Fighting', 'Rock', 'Steel'], resists: ['Ice'], immuneTo: [] },
    Fighting: { weakTo: ['Flying', 'Psychic', 'Fairy'], resists: ['Bug', 'Rock', 'Dark'], immuneTo: ['Ghost'] },
    Poison: { weakTo: ['Ground', 'Psychic'], resists: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'], immuneTo: [] },
    Ground: { weakTo: ['Water', 'Grass', 'Ice'], resists: ['Poison', 'Rock'], immuneTo: ['Electric'] },
    Flying: { weakTo: ['Electric', 'Ice', 'Rock'], resists: ['Grass', 'Fighting', 'Bug'], immuneTo: ['Ground'] },
    Psychic: { weakTo: ['Bug', 'Ghost', 'Dark'], resists: ['Fighting', 'Psychic'], immuneTo: [] },
    Bug: { weakTo: ['Fire', 'Flying', 'Rock'], resists: ['Grass', 'Fighting', 'Ground'], immuneTo: [] },
    Rock: { weakTo: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'], resists: ['Normal', 'Fire', 'Poison', 'Flying'], immuneTo: [] },
    Ghost: { weakTo: ['Ghost', 'Dark'], resists: ['Poison', 'Bug'], immuneTo: ['Normal', 'Fighting'] },
    Dragon: { weakTo: ['Ice', 'Dragon', 'Fairy'], resists: ['Fire', 'Water', 'Electric', 'Grass'], immuneTo: [] },
    Dark: { weakTo: ['Fighting', 'Bug', 'Fairy'], resists: ['Ghost', 'Dark'], immuneTo: ['Psychic'] },
    Steel: {
        weakTo: ['Fire', 'Fighting', 'Ground'],
        resists: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'],
        immuneTo: ['Poison'],
    },
    Fairy: { weakTo: ['Poison', 'Steel'], resists: ['Fighting', 'Bug', 'Dark'], immuneTo: ['Dragon'] },
};

const ALL_TYPES = Object.keys(TYPE_EFFECTIVENESS) as PokemonType[];

export interface EffectivenessResult {
    /** Attacking types super effective (1.6x) against one of the defending types */
    single: PokemonType[];
    /** Attacking types double super effective (2.56x) against both defending types */
    double: PokemonType[];
}

function getMultiplier(attackingType: PokemonType, defendingType: PokemonType): number {
    const matchups = TYPE_EFFECTIVENESS[defendingType];
    if (matchups.weakTo.includes(attackingType)) return SUPER_EFFECTIVE;
    if (matchups.resists.includes(attackingType)) return RESIST;
    if (matchups.immuneTo.includes(attackingType)) return IMMUNE;
    return 1.0;
}

/** Determines which attacking types are super/double-super effective against a Pokemon's typing. */
export function getSuperEffectiveTypes(type1: PokemonType, type2?: PokemonType): EffectivenessResult {
    const single: PokemonType[] = [];
    const double: PokemonType[] = [];

    for (const attackingType of ALL_TYPES) {
        const totalMultiplier = getMultiplier(attackingType, type1) * (type2 ? getMultiplier(attackingType, type2) : 1.0);

        if (totalMultiplier > 2.0) {
            double.push(attackingType);
        } else if (totalMultiplier > 1.0) {
            single.push(attackingType);
        }
    }

    return { single: single.sort(), double: double.sort() };
}

export function formatVulnerabilityText(single: PokemonType[], double: PokemonType[]): string {
    const parts: string[] = [];

    if (double.length > 0) {
        parts.push(`2.56x from ${double.join(', ')}`);
    }
    if (single.length > 0) {
        parts.push(`1.6x from ${single.join(', ')}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No major weaknesses';
}
