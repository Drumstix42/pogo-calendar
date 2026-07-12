import { type PogoEvent } from './eventTypes';

export interface PokemonImageOptions {
    useAnimated?: boolean;
    isMega?: boolean;
    excludeTiers?: string[];
}

// Visual overlay applied to a resolved sprite. Owned by the resolver/dispatcher layer so the
// rendering component doesn't re-derive it from the event title.
export const SPRITE_EFFECTS = {
    DYNAMAX: 'dynamax',
    GIGANTAMAX: 'gigantamax',
    SHADOW: 'shadow',
} as const;

export type SpriteEffect = (typeof SPRITE_EFFECTS)[keyof typeof SPRITE_EFFECTS];

export interface PokemonImageData {
    name: string;
    imageUrl: string | null;
    fallbackImageUrl?: string | null;
    effect?: SpriteEffect;
    /** Number of shields this Super Mega Raid boss has (undefined for non-Super-Mega/unknown bosses). */
    shieldCount?: number;
}

// A PogoEvent guaranteed to carry `extraData`. The entry point narrows to this (via `hasExtraData`)
// before dispatching, so resolvers can read `event.extraData.X` without defensive optional chaining.
export type EventWithExtraData = PogoEvent & { extraData: NonNullable<PogoEvent['extraData']> };
