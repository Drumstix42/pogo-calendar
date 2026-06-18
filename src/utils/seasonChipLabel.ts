/**
 * Formats a season "Daily Discovery" bonus title into a compact calendar-chip label.
 *
 * Pipeline:
 *  1. Drop the day-of-week word anywhere in the title (it's redundant under the day column).
 *  2. Apply the abbreviation dictionary (case-insensitive whole-word/phrase replacements).
 *  3. Collapse whitespace; fall back to the original title if the result is empty.
 */

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Tiny dictionary of phrases to shorten on chip labels. Matching is case-insensitive and
 * whole-word; longer keys are applied first so multi-word phrases win over their fragments.
 */
export const CHIP_ABBREVIATIONS: Record<string, string> = {
    'GO Battle': 'GBL',
    and: '&',
};

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Precompute [regex, replacement] pairs, longest key first.
const ABBREVIATION_RULES: Array<{ pattern: RegExp; replacement: string }> = Object.entries(CHIP_ABBREVIATIONS)
    .sort(([a], [b]) => b.length - a.length)
    .map(([phrase, replacement]) => ({
        pattern: new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi'),
        replacement,
    }));

export function formatSeasonChipLabel(title: string, dayOfWeek: number): string {
    let label = title;

    const weekday = WEEKDAY_NAMES[dayOfWeek];
    if (weekday) {
        // Remove the weekday word (and a possible plural "s") anywhere in the title.
        label = label.replace(new RegExp(`\\b${weekday}s?\\b`, 'gi'), '');
    }

    for (const { pattern, replacement } of ABBREVIATION_RULES) {
        label = label.replace(pattern, replacement);
    }

    label = label.replace(/\s{2,}/g, ' ').trim();
    return label.length ? label : title;
}
