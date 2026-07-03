// Generic DOM helpers (no Vue reactivity).

/** Toggle the `inert` attribute on an element, disabling/restoring interaction + focusability of its subtree. */
export function setElementInert(el: Element | null, inert: boolean) {
    el?.toggleAttribute('inert', inert);
}
