import { parseGigantamaxFormSlug, parsePokemonNameAndSuffix } from './eventPokemonNames';
import { SPRITE_EFFECTS } from './eventPokemonTypes';
import type { PokemonImageData, PokemonImageOptions, SpriteEffect } from './eventPokemonTypes';
import { type PogoEvent, type PokemonBoss, type RaidScheduleEntry } from './eventTypes';
import {
    getGigantamaxSpriteUrl,
    getPokemonAnimatedUrl,
    getPokemonSpriteUrl,
    getSprite256FallbackUrl,
    getSpriteFallbackUrl,
    hasExactSpriteForm,
    hasSplitMegaXYForms,
} from './pokemonMapper.ts';
import { getSuperMegaShieldCount } from './superMegaShields';

export function getSpriteUrl(pokemonName: string, suffix?: string, options?: PokemonImageOptions, fallbackUrl?: string | null) {
    // Use provided suffix or derive from options
    const finalSuffix = suffix ?? (options?.isMega ? '-mega' : undefined);

    if (options?.useAnimated) {
        try {
            const animatedUrl = getPokemonAnimatedUrl(pokemonName, finalSuffix);
            if (animatedUrl) {
                return animatedUrl;
            }
        } catch (error) {
            console.warn(`Failed to generate animated sprite for ${pokemonName}:`, error);
        }
        // If animated fails, fall back to static sprite
    }

    // Try static sprite
    try {
        const staticUrl = getPokemonSpriteUrl(pokemonName, finalSuffix);
        if (staticUrl) {
            return staticUrl;
        }
    } catch (error) {
        console.warn(`Failed to generate sprite for ${pokemonName}:`, error);
    }

    // If our sprite generation failed, try the fallback URL from event data
    if (fallbackUrl) {
        return fallbackUrl;
    }

    return null;
}

export function getRaidBossesWithTierFallback(event: PogoEvent, options?: PokemonImageOptions) {
    const allBosses = event.extraData?.raidbattles?.bosses;
    if (!allBosses || allBosses.length === 0) {
        return [];
    }

    // Progressively relax excludes (dropping from the end) until at least one boss remains.
    if (!options?.excludeTiers || options.excludeTiers.length === 0) {
        return allBosses;
    }

    for (let i = options.excludeTiers.length; i >= 0; i--) {
        const activeExclusions = options.excludeTiers.slice(0, i);
        const filtered = activeExclusions.length > 0 ? allBosses.filter(b => !b.raidType || !activeExclusions.includes(b.raidType)) : allBosses;
        if (filtered.length > 0) {
            return filtered;
        }
    }

    return allBosses;
}

// Bosses present in every day of a multi-day raid schedule (e.g. a legendary that runs the whole
// event alongside a daily-rotating Mega). A day-specific boss (present on only some days) isn't
// representative of the full span, so it's excluded here - the multi-day bar shows only what's
// actually available every day, with the rest implied by the overflow count.
export function getRecurringRaidScheduleBosses(raidSchedule: RaidScheduleEntry[]): PokemonBoss[] {
    const dayBossSets = raidSchedule.map(day => day.bosses ?? []).filter(bosses => bosses.length > 0);
    if (dayBossSets.length === 0) {
        return [];
    }

    const [firstDay, ...restDays] = dayBossSets;
    return firstDay.filter(boss =>
        restDays.every(dayBosses => dayBosses.some(otherBoss => otherBoss.name.trim().toLowerCase() === boss.name.trim().toLowerCase())),
    );
}

export function getPokemonImagesFromBosses(event: PogoEvent, options?: PokemonImageOptions): PokemonImageData[] {
    return getPokemonImagesFromBossList(getRaidBossesWithTierFallback(event, options), options);
}

export function getPokemonImagesFromBossList(bosses: PokemonBoss[], options?: PokemonImageOptions): PokemonImageData[] {
    const images: PokemonImageData[] = [];

    for (const boss of bosses) {
        const parsedData = parsePokemonNameAndSuffix(boss.name);
        const shieldCount = boss.raidType === 'Super Mega' ? getSuperMegaShieldCount(boss.name) : undefined;

        if (parsedData) {
            // Only trust a generated sprite when it genuinely matches the boss's exact form - some
            // Mega/Super Mega bosses (Raichu X/Y, Starmie, Dragonite, Malamar) have no matching sprite
            // anywhere in our sources, and PokeMiners silently substitutes the base sprite for an
            // unmatched suffix. The event-provided image ranks above that guess; the base sprite (no
            // suffix at all) is the absolute last resort if even that's missing.
            const hasRealForm = hasExactSpriteForm(parsedData.pokemonName, parsedData.suffix);
            const spriteUrl = hasRealForm
                ? getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options, boss.image)
                : boss.image || getSpriteUrl(parsedData.pokemonName, undefined, options, boss.image);

            images.push({ name: boss.name, imageUrl: spriteUrl, fallbackImageUrl: boss.image || null, shieldCount });
        } else {
            images.push({ name: boss.name, imageUrl: boss.image || null, fallbackImageUrl: boss.image || null, shieldCount });
        }
    }

    return images;
}

export interface BadgeSprite {
    /** Ordered candidate URLs, largest/best first - try in order until one loads. */
    urls: string[];
    effect?: SpriteEffect;
}

// Same tiered chain as `getSpriteUrl`, returning every candidate instead of just the first match.
// (A 256x256-first attempt was tried and reverted - PokeMiners pads some Pokemon's 256 art with
// empty margin instead of scaling up, leaving them tiny/off-center.)
export function getBadgeSpriteUrls(pokemonName: string): string[] {
    const parsed = parsePokemonNameAndSuffix(pokemonName);
    if (!parsed) return [];

    const baseUrl = getPokemonSpriteUrl(parsed.pokemonName, parsed.suffix);
    if (!baseUrl) return [];

    const candidates = [baseUrl, getSprite256FallbackUrl(baseUrl), getSpriteFallbackUrl(baseUrl)];
    return [...new Set(candidates.filter((url): url is string => url !== null))];
}

// Also detects a free-typed Gigantamax/Dynamax/Shadow prefix and reports which overlay effect (if
// any) the badge should draw. `fallbackEffect` covers Max Monday/Shadow Raids, whose resolvers strip
// that prefix and classify the effect at the event level instead - a name-based match always wins.
export function getBadgeSprite(pokemonName: string, fallbackEffect?: SpriteEffect): BadgeSprite {
    const gigantamaxMatch = pokemonName.match(/^Gigantamax\s+(.+)$/i);
    if (gigantamaxMatch) {
        const { baseName, formSlug } = parseGigantamaxFormSlug(gigantamaxMatch[1].trim());
        const gmaxUrl = getGigantamaxSpriteUrl(baseName, formSlug);
        // Gigantamax art doesn't join the normal tiered fallback (it's a standalone CDN) - if there's
        // no Gmax asset for this Pokemon, fall back to its plain sprite chain with no overlay.
        return gmaxUrl ? { urls: [gmaxUrl], effect: SPRITE_EFFECTS.GIGANTAMAX } : { urls: getBadgeSpriteUrls(baseName) };
    }

    const dynamaxMatch = pokemonName.match(/^Dynamax\s+(.+)$/i);
    if (dynamaxMatch) {
        return { urls: getBadgeSpriteUrls(dynamaxMatch[1].trim()), effect: SPRITE_EFFECTS.DYNAMAX };
    }

    if (/^Shadow\s+/i.test(pokemonName)) {
        // parsePokemonNameAndSuffix strips "Shadow " itself, so the full name still resolves correctly.
        return { urls: getBadgeSpriteUrls(pokemonName), effect: SPRITE_EFFECTS.SHADOW };
    }

    return { urls: getBadgeSpriteUrls(pokemonName), effect: fallbackEffect };
}

// Parse a list of Pokemon names and resolve a sprite image for each (skipping unparseable names).
// `megaFallback` (set from event context, e.g. a Mega raid) applies `-mega` to names that carry no
// explicit form suffix of their own - except Pokemon whose Mega splits into X/Y sprites (Charizard,
// Mewtwo), where a bare name can't say which variant it is, so it's left as the plain form instead
// of guessing. The returned `name` reflects this too, so downstream consumers (e.g. the Campfire
// badge, which re-parses `name` for its own sprite/CP lookups) see the same form the sprite shows.
export function getSpriteImagesFromNames(names: string[], options?: PokemonImageOptions, megaFallback = false): PokemonImageData[] {
    const images: PokemonImageData[] = [];

    for (const name of names) {
        const parsed = parsePokemonNameAndSuffix(name);
        if (!parsed) continue;

        const isAmbiguousSplitForm = !parsed.suffix && hasSplitMegaXYForms(parsed.pokemonName);
        const applyMegaFallback = megaFallback && !isAmbiguousSplitForm;
        const suffix = parsed.suffix ?? (applyMegaFallback ? '-mega' : undefined);
        const displayName = applyMegaFallback ? `Mega ${name}` : name;

        images.push({ name: displayName, imageUrl: getSpriteUrl(parsed.pokemonName, suffix, options) });
    }

    return images;
}
