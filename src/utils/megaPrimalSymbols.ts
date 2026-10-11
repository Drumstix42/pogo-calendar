// Mega Evolution / Primal Reversion symbols, shown as a corner badge on those sprites (where the Super
// Mega shield sits).
import { SPRITE_EFFECTS, type SpriteEffect } from './eventPokemonTypes';

function toDataUrl(svg: string): string {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Mega: the helix symbol in a flat mid-tone gray. The art can't follow the theme, so a middle value (with
// the host's transparency) reads as a muted dark gray on dark cells and a soft light gray on light ones.
// One path in a 50-unit space: the outline, then its four gaps (drawn with the default nonzero fill rule,
// the gap subpaths wind the opposite way, so they cut out).
const MEGA_SYMBOL_PATH = [
    'M21.8942 43.8543C20.4257 35.1457 11.9184 32.6857 8.02693 26.0886C-0.0429087 12.4143 17.8664 2.67429 28.7114 0',
    'C26.9929 4.34286 28.0723 8.3 30.4697 12.0857C34.5031 18.4514 43.4819 22.4371 43.2121 31.0114',
    'C42.9025 40.7971 29.9356 47.3714 21.8942 50C21.6755 48.1343 22.1925 45.6343 21.8942 43.8571V43.8543Z',
    'M26.723 14.28L23.5985 6.11714C23.1156 5.87143 17.784 8.65429 17.6477 9.30857C17.5255 9.88572 19.4855 10.8886 19.9996 11.1857',
    'C20.7523 11.62 26.4276 14.5571 26.723 14.2771V14.28Z',
    'M37.7981 27.4257C37.8748 27.0143 37.7271 26.7257 37.5766 26.3657C35.8581 22.2743 29.3079 20.6743 25.4846 18.8143',
    'C23.4593 17.8314 21.4198 16.8143 19.4315 15.76C18.1817 15.0971 15.2617 12.9457 14.2277 12.6857',
    'C13.2478 12.44 11.5832 14.3086 11.4298 15.0657C11.2537 15.9257 12.4041 16.4086 13.0063 16.7971',
    'C20.5421 21.6886 29.2624 24.84 37.8038 27.4229L37.7981 27.4257Z',
    'M38.6531 32.2857C31.6541 30.3943 24.8171 27.7886 18.2953 24.6171C15.6821 23.3457 13.2137 21.7086 10.5322 20.5714',
    'C10.5095 21.8886 11.4014 24.0029 12.4183 24.8143C14.6936 26.6314 21.6102 29.6371 24.5415 30.9057',
    'C27.0128 31.9743 34.2248 35.0771 36.5369 35.1543C38.0424 35.2029 38.4202 33.5257 38.6531 32.2886V32.2857Z',
    'M33.5402 38.8571L22.7492 35.1429C24.0445 37.8914 25.4704 40.6429 25.8823 43.7057C26.2828 44.0457 29.4783 42.2114 30.1117 41.8314',
    'C30.5549 41.5657 34.0515 39.4143 33.5431 38.8571H33.5402Z',
].join('');

function buildMegaSymbolSvg(): string {
    // Cropped to the symbol's bounds (x 6-43.2, y 0-50), so hosts can anchor it by its visible edges (like the egg).
    return [
        '<svg xmlns="http://www.w3.org/2000/svg" width="74" height="100" viewBox="6 0 37.2 50">',
        `<path d="${MEGA_SYMBOL_PATH}" fill="#8e939c"/>`,
        '</svg>',
    ].join('');
}

// Primal: the in-game badge kept basic - a matte pink disc with a lighter inner ring and the white Primal
// glyph (three marks above a ring, with rays and a gate shape below it).
const PRIMAL_GLYPH = [
    '<path d="M43 22v8M50 19v11M57 22v8"/>',
    '<circle cx="50" cy="46" r="9"/>',
    '<path d="M43.5 53.5l-6 6M56.5 53.5l6 6"/>',
    '<path d="M45 76v-9h10v9"/>',
].join('');

function buildPrimalSymbolSvg(): string {
    return [
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">',
        '<circle cx="50" cy="50" r="48" fill="#ec7aa4"/>',
        '<circle cx="50" cy="50" r="42" fill="none" stroke="#f7a9c7" stroke-width="3"/>',
        `<g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${PRIMAL_GLYPH}</g>`,
        '</svg>',
    ].join('');
}

let megaSymbolImageUrl: string | undefined;
let primalSymbolImageUrl: string | undefined;

function getMegaSymbolImageUrl(): string {
    megaSymbolImageUrl ??= toDataUrl(buildMegaSymbolSvg());
    return megaSymbolImageUrl;
}

function getPrimalSymbolImageUrl(): string {
    primalSymbolImageUrl ??= toDataUrl(buildPrimalSymbolSvg());
    return primalSymbolImageUrl;
}

/**
 * The corner symbol for a Mega/Primal sprite (null for any other effect). `src` is a data URL, usable by
 * both `<img>` and canvas drawing (Campfire badge).
 */
export function getEffectSymbol(effect: SpriteEffect | undefined): { src: string; alt: string } | null {
    if (effect === SPRITE_EFFECTS.MEGA) return { src: getMegaSymbolImageUrl(), alt: 'Mega' };
    if (effect === SPRITE_EFFECTS.PRIMAL) return { src: getPrimalSymbolImageUrl(), alt: 'Primal' };
    return null;
}
