const ORDINAL_SUFFIXES: Record<Intl.LDMLPluralRule, string> = {
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th',
    zero: 'th',
    many: 'th',
};
const ordinalRules = new Intl.PluralRules('en-US', { type: 'ordinal' });

// e.g. 10 -> "10th"
export function getOrdinalSuffix(n: number) {
    return `${n}${ORDINAL_SUFFIXES[ordinalRules.select(n)]}`;
}
