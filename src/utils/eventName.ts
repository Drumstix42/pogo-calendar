/**
 * Utility for decoding HTML entities in text strings
 * Handles common HTML entities like &amp;, &lt;, &gt;, &quot;, &#39; and numeric entities
 */
const HTML_ENTITIES: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
};

/** Decodes HTML entities in a string to their corresponding characters */
export function decodeHtmlEntities(text: string): string {
    if (!text) return text;

    let decoded = text;

    // Replace named entities
    for (const [entity, character] of Object.entries(HTML_ENTITIES)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), character);
    }

    // Replace numeric entities (&#123; and &#x1A;)
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
        return String.fromCharCode(parseInt(dec, 10));
    });

    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
}

/** Removes "Pokémon GO " or "Pokemon GO " prefix from event names */
function removePokemonGoPrefix(text: string): string {
    return text.replace(/^(pokémon go |pokemon go )/i, '');
}

export function formatEventName(text: string) {
    return removePokemonGoPrefix(decodeHtmlEntities(text));
}
