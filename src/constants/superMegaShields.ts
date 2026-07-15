// Shield counts for Super Mega Raid bosses, keyed by Pokemon name without the "Mega" prefix (every
// entry here is a Mega Evolution by definition). Only Mega-Evolved Pokemon can break these shields
// (one per Trainer), unlike standard raid shields. Counts confirmed via Pokemon GO Hub raid guides;
// bosses not listed here simply render without a shield badge until confirmed and added.
export const SUPER_MEGA_SHIELD_COUNTS: Record<string, number> = {
    dragonite: 10,
    falinks: 8,
    malamar: 8,
    'mewtwo x': 10,
    'mewtwo y': 10,
    'raichu x': 8,
    'raichu y': 8,
    skarmory: 8,
    starmie: 8,
};
