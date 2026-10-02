import { type InjectionKey, type MaybeRefOrGetter, type Ref, computed, inject, provide, ref, toValue } from 'vue';

const SPRITE_LOADING_KEY: InjectionKey<Ref<boolean>> = Symbol('sprite-loading');

// Lets a subtree (e.g. an off-screen neighbor month in the calendar pager) hold off sprite
// downloads; PokemonImage renders a same-size empty box until enabled.
export function provideSpriteLoading(enabled: MaybeRefOrGetter<boolean>) {
    provide(
        SPRITE_LOADING_KEY,
        computed(() => toValue(enabled)),
    );
}

// Sprites load by default anywhere outside a provider.
export function useSpriteLoading() {
    return inject(SPRITE_LOADING_KEY, ref(true));
}
