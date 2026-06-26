import { type PogoEvent } from './eventTypes';

export interface PokemonImageOptions {
    useAnimated?: boolean;
    isMega?: boolean;
    excludeTiers?: string[];
}

export interface PokemonImageData {
    name: string;
    imageUrl: string | null;
    fallbackImageUrl?: string | null;
}

// A PogoEvent guaranteed to carry `extraData`. The entry point narrows to this (via `hasExtraData`)
// before dispatching, so resolvers can read `event.extraData.X` without defensive optional chaining.
export type EventWithExtraData = PogoEvent & { extraData: NonNullable<PogoEvent['extraData']> };
