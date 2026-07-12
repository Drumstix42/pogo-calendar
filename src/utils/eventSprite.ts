import { parsePokemonNameAndSuffix } from './eventPokemonNames';
import type { PokemonImageData, PokemonImageOptions } from './eventPokemonTypes';
import { type PogoEvent } from './eventTypes';
import { getPokemonAnimatedUrl, getPokemonSpriteUrl } from './pokemonMapper.ts';
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

export function getPokemonImagesFromBosses(event: PogoEvent, options?: PokemonImageOptions): PokemonImageData[] {
    const bosses = getRaidBossesWithTierFallback(event, options);
    const images: PokemonImageData[] = [];

    for (const boss of bosses) {
        const parsedData = parsePokemonNameAndSuffix(boss.name);
        const shieldCount = boss.raidType === 'Super Mega' ? getSuperMegaShieldCount(boss.name) : undefined;

        if (parsedData) {
            let spriteUrl: string | null = null;

            const preferProvidedImage = parsedData.suffix === '-megax' || parsedData.suffix === '-megay';

            if (parsedData.suffix) {
                spriteUrl =
                    preferProvidedImage && boss.image ? boss.image : getSpriteUrl(parsedData.pokemonName, parsedData.suffix, options, boss.image);
            } else {
                spriteUrl = getSpriteUrl(parsedData.pokemonName, undefined, options, boss.image);
            }

            images.push({ name: boss.name, imageUrl: spriteUrl, fallbackImageUrl: boss.image || null, shieldCount });
        } else {
            images.push({ name: boss.name, imageUrl: boss.image || null, fallbackImageUrl: boss.image || null, shieldCount });
        }
    }

    return images;
}

// Parse a list of Pokemon names and resolve a sprite image for each (skipping unparseable names).
// `megaFallback` (set from event context, e.g. a Mega raid) applies `-mega` to names that carry no
// explicit form suffix of their own.
export function getSpriteImagesFromNames(names: string[], options?: PokemonImageOptions, megaFallback = false): PokemonImageData[] {
    const images: PokemonImageData[] = [];

    for (const name of names) {
        const parsed = parsePokemonNameAndSuffix(name);
        if (!parsed) continue;

        const suffix = parsed.suffix ?? (megaFallback ? '-mega' : undefined);
        images.push({ name, imageUrl: getSpriteUrl(parsed.pokemonName, suffix, options) });
    }

    return images;
}
