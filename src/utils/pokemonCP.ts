/**
 * Pokemon CP (Combat Power) calculation utilities
 * Based on Pokemon GO's CP formula for perfect IV (15/15/15) Pokemon
 */

// CP Multipliers for different Pokemon levels
// These values are exact from Pokemon GO's game data
export const CPM_VALUES = {
    15: 0.51739395, // Level 15 (Research encounters)
    20: 0.5974, // Level 20 (Raid encounters, or any *Max battle)
    25: 0.667934, // Level 25 (Weather boosted Raids)
    40: 0.7903, // Level 40
    50: 0.8403, // Level 50 (Max level)
} as const;

export interface PokemonStats {
    baseStamina: number;
    baseAttack: number;
    baseDefense: number;
}

export interface PokemonData {
    id: number;
    name: string;
    form: string;
    types: string[];
    stats: PokemonStats;
    released?: boolean;
    shadow?: boolean;
    raid_tier?: number;
}

export interface CPResult {
    /** CP for level 20 perfect IVs (15/15/15) - Normal raid encounters */
    level20Max: number;
    /** CP for level 25 perfect IVs (15/15/15) - Weather boosted raid encounters */
    level25Max: number;
}

/**
 * Calculate CP using Pokemon GO's formula
 * CP = floor((BaseAtk + AtkIV) × CPM × sqrt((BaseDef + DefIV) × CPM) × sqrt((BaseStam + StamIV) × CPM) / 10)
 */
export function calculateCP(
    baseAttack: number,
    baseDefense: number,
    baseStamina: number,
    levelCPM: number,
    ivAttack: number = 15,
    ivDefense: number = 15,
    ivStamina: number = 15,
): number {
    const effectiveAttack = (baseAttack + ivAttack) * levelCPM;
    const effectiveDefense = (baseDefense + ivDefense) * levelCPM;
    const effectiveStamina = (baseStamina + ivStamina) * levelCPM;

    const cp = Math.floor((effectiveAttack * Math.sqrt(effectiveDefense) * Math.sqrt(effectiveStamina)) / 10);

    // Minimum CP is always 10
    return Math.max(cp, 10);
}

/**
 * Calculate raid CP values for a Pokemon (level 20 normal and level 25 weather boosted)
 * Always uses perfect IVs (15/15/15) for "Hundo" calculations
 */
export function calculateRaidCP(stats: PokemonStats): CPResult {
    const { baseAttack, baseDefense, baseStamina } = stats;

    return {
        level20Max: calculateCP(baseAttack, baseDefense, baseStamina, CPM_VALUES[20], 15, 15, 15),
        level25Max: calculateCP(baseAttack, baseDefense, baseStamina, CPM_VALUES[25], 15, 15, 15),
    };
}

/**
 * Clean Pokemon name by removing non-alphanumeric characters and converting to lowercase
 * This matches the normalization used in the Python fetcher
 */
export function cleanPokemonName(name: string): string {
    return name.replace(/\W/g, '').toLowerCase();
}

/**
 * Format CP value with thousands separator using user's locale
 * Examples: 1234 -> "1,234" (en-US), "1.234" (de-DE), "1 234" (fr-FR)
 */
export function formatCP(cp: number): string {
    return cp.toLocaleString();
}

/**
 * Format CP display string based on whether weather boost applies
 * @param level20Max - Normal raid CP
 * @param level25Max - Weather boosted raid CP
 * @param showWeatherBoost - Whether to show the weather boost value
 * @returns Formatted string like "1,234" or "1,234 / 1,456"
 */
export function formatCPDisplay(level20Max: number, level25Max: number, showWeatherBoost: boolean): string {
    if (showWeatherBoost) {
        return `${formatCP(level20Max)} / ${formatCP(level25Max)}`;
    }
    return `${formatCP(level20Max)}`;
}
