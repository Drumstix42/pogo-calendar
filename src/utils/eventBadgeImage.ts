import type { SpriteEffect } from './eventPokemonTypes';
import { getBadgeSprite } from './eventSprite';
import { loadFirstAvailableImage } from './loadImage';

const CANVAS_SIZE = 512;
const CORNER_RADIUS = 56;
const PADDING = 30;
const FONT_FAMILY = 'Inter, sans-serif';
const TOP_BAND_COLOR = 'rgba(0, 0, 0, 0.6)';
const BOTTOM_BAND_COLOR = '#000000';
const TEXT_OUTLINE_WIDTH = 5.6;

// Gmax artwork already reads as visually distinct, so it only gets the glow below rather than an overlay.
const OVERLAY_ASSET_URLS: Partial<Record<SpriteEffect, string>> = {
    dynamax: '/images/overlay/dynamax-clouds.png',
    shadow: '/images/overlay/shadow-aura.png',
};
const OVERLAY_SCALE: Partial<Record<SpriteEffect, number>> = {
    dynamax: 1.35,
    shadow: 1.3,
};
const EFFECT_GLOW: Partial<Record<SpriteEffect, { color: string; blur: number }>> = {
    shadow: { color: 'rgba(68, 57, 117, 0.75)', blur: 3 },
    gigantamax: { color: 'rgba(200, 0, 0, 0.35)', blur: 4.4 },
};

const POKEBALL_PATTERN_ANGLE_DEG = 42;
const POKEBALL_PATTERN_SPACING = 113;
const POKEBALL_PATTERN_RADIUS = 38;
const POKEBALL_PATTERN_LINE_WIDTH = 5.6;
const POKEBALL_PATTERN_COLOR = 'rgba(255, 255, 255, 0.07)';

const TITLE_FONT_SIZE = 68;
const TITLE_TOP = 18;
const TITLE_LINE_HEIGHT = 61;
const TITLE_MAX_LINES = 2;
const TITLE_SIDE_PADDING = 61;
const TOP_BAND_PADDING_BOTTOM = 8;

// "∣" (U+2223) rather than "|" - shorter, centered on the math axis rather than full ascender
// height. Exported so the Campfire modal builds its CP lines with the same character.
export const CP_DIVIDER = '∣';
const CP_DIVIDER_COLOR = 'rgba(255, 255, 255, 0.5)';

const BOTTOM_FONT_SIZE_SINGLE_LINE = 72;
const BOTTOM_FONT_SIZE_MULTI_LINE = 67;
const BOTTOM_MIN_FONT_SIZE = 30;
const BOTTOM_TEXT_MAX_WIDTH = CANVAS_SIZE - PADDING * 1.5;
const BOTTOM_LINE_HEIGHT = 61;
const BOTTOM_BAND_PADDING_TOP = 14;
const BOTTOM_BAND_PADDING_BOTTOM = 22;

// How far the Pokemon art is allowed to extend into the band regions - it's drawn last, so it reads
// as overlapping in front of the bands rather than being cropped underneath.
const POKEMON_BAND_OVERLAP = 38;
// The radius is deliberately oversized - the canvas clamps it to the largest geometrically valid
// value, so the bottom-corner sweep always reaches as far toward center as it can.
const TOP_BAND_CORNER_RADIUS = 102;
const TOP_BAND_OVERSIZE_SIZE = 26;

export interface EventBadgeSpec {
    title: string;
    backgroundColor: string;
    /** 1-3 Pokemon names, in display order */
    pokemonNames: string[];
    /** Pre-formatted lines shown near the bottom (CP text or a custom caption) - 0-2 entries */
    bottomLines: string[];
    /** Event-level effect (e.g. from a Max Monday or Shadow Raid) applied when a name has no prefix of its own */
    defaultPokemonEffect?: SpriteEffect;
}

interface ResolvedBadgePokemon {
    image: HTMLImageElement;
    overlayImage: HTMLImageElement | null;
    effect?: SpriteEffect;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(candidate).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = candidate;
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
}

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, minSize: number): number {
    let size = startSize;
    while (size > minSize) {
        ctx.font = `900 ${size}px ${FONT_FAMILY}`;
        if (ctx.measureText(text).width <= maxWidth) break;
        size -= 5;
    }
    return size;
}

function getTitleLines(ctx: CanvasRenderingContext2D, title: string): string[] {
    ctx.font = `900 ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`;
    return wrapText(ctx, title, CANVAS_SIZE - TITLE_SIDE_PADDING * 2).slice(0, TITLE_MAX_LINES);
}

function getTopBandHeight(lineCount: number): number {
    return TITLE_TOP + Math.max(lineCount - 1, 0) * TITLE_LINE_HEIGHT + TITLE_FONT_SIZE + TOP_BAND_PADDING_BOTTOM;
}

function getBottomBandHeight(lineCount: number): number {
    if (lineCount === 0) return 0;
    return lineCount * BOTTOM_LINE_HEIGHT + BOTTOM_BAND_PADDING_TOP + BOTTOM_BAND_PADDING_BOTTOM;
}

function drawBand(ctx: CanvasRenderingContext2D, top: number, height: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(0, top, CANVAS_SIZE, height);
}

// A "collar" shape: square top bleeding to the true edge (the outer canvas clip rounds it off),
// large rounded sweep at the bottom corners only.
function drawTopBandCollar(ctx: CanvasRenderingContext2D, height: number, color: string) {
    ctx.beginPath();
    ctx.roundRect(-TOP_BAND_OVERSIZE_SIZE, -TOP_BAND_OVERSIZE_SIZE, CANVAS_SIZE + 2 * TOP_BAND_OVERSIZE_SIZE, height + TOP_BAND_OVERSIZE_SIZE, [
        0,
        0,
        TOP_BAND_CORNER_RADIUS,
        TOP_BAND_CORNER_RADIUS,
    ]);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawPokeballOutline(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.24, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPokeballPattern(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.rotate((POKEBALL_PATTERN_ANGLE_DEG * Math.PI) / 180);
    ctx.strokeStyle = POKEBALL_PATTERN_COLOR;
    ctx.lineWidth = POKEBALL_PATTERN_LINE_WIDTH;

    // Rotation can swing the grid's corners outside the original bounds - overdraw past the square's
    // circumradius so coverage stays full at any angle.
    const halfExtent = CANVAS_SIZE * 0.75;
    const steps = Math.ceil(halfExtent / POKEBALL_PATTERN_SPACING);

    for (let row = -steps; row <= steps; row++) {
        for (let col = -steps; col <= steps; col++) {
            drawPokeballOutline(ctx, col * POKEBALL_PATTERN_SPACING, row * POKEBALL_PATTERN_SPACING, POKEBALL_PATTERN_RADIUS);
        }
    }

    ctx.restore();
}

function drawOutlinedTextAt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = TEXT_OUTLINE_WIDTH;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function drawOutlinedText(ctx: CanvasRenderingContext2D, text: string, y: number) {
    drawOutlinedTextAt(ctx, text, CANVAS_SIZE / 2, y, '#ffffff');
}

// Draws left-to-right segments (each its own color) as one horizontally-centered unit - used to fade
// the CP divider without fading the numbers on either side of it.
function drawOutlinedTextSegments(ctx: CanvasRenderingContext2D, segments: { text: string; color: string }[], y: number) {
    const widths = segments.map(segment => ctx.measureText(segment.text).width);
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);

    ctx.textAlign = 'left';
    let x = CANVAS_SIZE / 2 - totalWidth / 2;

    segments.forEach((segment, index) => {
        drawOutlinedTextAt(ctx, segment.text, x, y, segment.color);
        x += widths[index];
    });

    ctx.textAlign = 'center';
}

function drawTitle(ctx: CanvasRenderingContext2D, lines: string[]) {
    ctx.font = `900 ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    // No outline (unlike the bottom band) - the title band's own backdrop gives it enough contrast.
    lines.forEach((line, index) => {
        ctx.fillText(line, CANVAS_SIZE / 2, TITLE_TOP + index * TITLE_LINE_HEIGHT + TITLE_FONT_SIZE / 2);
    });
}

function drawBottomLines(ctx: CanvasRenderingContext2D, lines: string[], bandHeight: number) {
    const startSize = lines.length > 1 ? BOTTOM_FONT_SIZE_MULTI_LINE : BOTTOM_FONT_SIZE_SINGLE_LINE;
    const bandTop = CANVAS_SIZE - bandHeight;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    lines.forEach((line, index) => {
        const fontSize = fitFontSize(ctx, line, BOTTOM_TEXT_MAX_WIDTH, startSize, BOTTOM_MIN_FONT_SIZE);
        ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;
        const y = bandTop + BOTTOM_BAND_PADDING_TOP + index * BOTTOM_LINE_HEIGHT + BOTTOM_LINE_HEIGHT / 2;

        if (line.includes(CP_DIVIDER)) {
            const [left, right] = line.split(CP_DIVIDER);
            drawOutlinedTextSegments(
                ctx,
                [
                    { text: left, color: '#ffffff' },
                    { text: CP_DIVIDER, color: CP_DIVIDER_COLOR },
                    { text: right, color: '#ffffff' },
                ],
                y,
            );
        } else {
            drawOutlinedText(ctx, line, y);
        }
    });
}

async function resolveBadgePokemon(name: string, fallbackEffect?: SpriteEffect): Promise<ResolvedBadgePokemon | null> {
    const { urls, effect } = getBadgeSprite(name, fallbackEffect);
    const image = await loadFirstAvailableImage(urls);
    if (!image) return null;

    const overlayUrl = effect && OVERLAY_ASSET_URLS[effect];
    const overlayImage = overlayUrl ? await loadFirstAvailableImage([overlayUrl]) : null;

    return { image, overlayImage, effect };
}

interface PokemonSlotLayout {
    pokemon: ResolvedBadgePokemon;
    x: number;
    y: number;
    drawWidth: number;
    drawHeight: number;
}

// Slight backoff from a full `object-fit: contain` fit
const POKEMON_FILL_SCALE = 0.93;

// Position/size only - drawing happens separately so overlay art can layer behind the title band
// while the Pokemon icon stays in front of it.
function layOutPokemon(pokemon: ResolvedBadgePokemon[], areaTop: number, areaHeight: number): PokemonSlotLayout[] {
    const areaWidth = CANVAS_SIZE - PADDING * 2;
    const slotWidth = areaWidth / pokemon.length;

    return pokemon.map((resolved, index) => {
        // Fits the slot proportionally, same as `object-fit: contain` - no cap at native resolution,
        // so the sprite scales with the canvas instead of shrinking relative to everything around it.
        const scale = Math.min(slotWidth / resolved.image.width, areaHeight / resolved.image.height) * POKEMON_FILL_SCALE;
        const drawWidth = resolved.image.width * scale;
        const drawHeight = resolved.image.height * scale;
        const slotCenterX = PADDING + slotWidth * (index + 0.5);

        return {
            pokemon: resolved,
            x: slotCenterX - drawWidth / 2,
            y: areaTop + (areaHeight - drawHeight) / 2,
            drawWidth,
            drawHeight,
        };
    });
}

function drawPokemonOverlays(ctx: CanvasRenderingContext2D, layout: PokemonSlotLayout[]) {
    layout.forEach(({ pokemon: { overlayImage, effect }, x, y, drawWidth, drawHeight }) => {
        if (!overlayImage || !effect) return;

        // Sized off the overlay's own aspect ratio, not stretched to the Pokemon's bounding box -
        // stretching distorts non-square overlay art.
        const overlayScale = OVERLAY_SCALE[effect] ?? 1;
        const overlayWidth = drawWidth * overlayScale;
        const overlayHeight = overlayWidth * (overlayImage.height / overlayImage.width);
        const centerX = x + drawWidth / 2;
        const centerY = y + drawHeight / 2;

        ctx.drawImage(overlayImage, centerX - overlayWidth / 2, centerY - overlayHeight / 2, overlayWidth, overlayHeight);
    });
}

function drawPokemonIcons(ctx: CanvasRenderingContext2D, layout: PokemonSlotLayout[]) {
    layout.forEach(({ pokemon: { image, effect }, x, y, drawWidth, drawHeight }) => {
        const glow = effect && EFFECT_GLOW[effect];
        if (glow) {
            ctx.save();
            ctx.shadowColor = glow.color;
            ctx.shadowBlur = glow.blur;
        }
        ctx.drawImage(image, x, y, drawWidth, drawHeight);
        if (glow) {
            ctx.restore();
        }
    });
}

/**
 * Renders a Campfire-style square event badge as a PNG blob. Layer order: background -> Pokeball
 * pattern -> overlay art -> title band + text -> Pokemon icon(s) -> bottom band + text.
 */
export async function generateEventBadge(spec: EventBadgeSpec): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Sprites are no longer capped at native resolution (see `layOutPokemon`), so they're often
    // upscaled now - 'high' gives smoother interpolation than the canvas default ('low').
    ctx.imageSmoothingQuality = 'high';

    await document.fonts.load(`900 ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`);

    ctx.beginPath();
    ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, CORNER_RADIUS);
    ctx.clip();

    ctx.fillStyle = spec.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawPokeballPattern(ctx);

    const titleLines = getTitleLines(ctx, spec.title);
    const topBandHeight = getTopBandHeight(titleLines.length);
    const bottomBandHeight = getBottomBandHeight(spec.bottomLines.length);

    const resolvedPokemon = await Promise.all(spec.pokemonNames.map(name => resolveBadgePokemon(name, spec.defaultPokemonEffect)));
    const loadedPokemon = resolvedPokemon.filter((pokemon): pokemon is ResolvedBadgePokemon => pokemon !== null);

    const areaTop = topBandHeight - POKEMON_BAND_OVERLAP;
    const areaHeight = CANVAS_SIZE - bottomBandHeight + POKEMON_BAND_OVERLAP - areaTop;
    const pokemonLayout = layOutPokemon(loadedPokemon, areaTop, areaHeight);

    drawPokemonOverlays(ctx, pokemonLayout);

    drawTopBandCollar(ctx, topBandHeight, TOP_BAND_COLOR);
    drawTitle(ctx, titleLines);

    drawPokemonIcons(ctx, pokemonLayout);

    if (spec.bottomLines.length > 0) {
        drawBand(ctx, CANVAS_SIZE - bottomBandHeight, bottomBandHeight, BOTTOM_BAND_COLOR);
        drawBottomLines(ctx, spec.bottomLines, bottomBandHeight);
    }

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}
