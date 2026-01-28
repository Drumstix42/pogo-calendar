import { getEventTypeInfo } from './eventTypes';

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

/** Removes "Pokémon " or "Pokemon " prefix from event names */
function removePokemonGoPrefix(text: string): string {
    return text.replace(/^(pokémon |pokemon )/i, '');
}

export function formatEventName(text: string) {
    return removePokemonGoPrefix(decodeHtmlEntities(text));
}

/**
 * Determines the best display name for a group of events.
 * If event names are similar (one is substring of another or significant overlap),
 * uses the shortest common name. Otherwise, uses the event type name.
 * Returns RAW name (not formatted) - formatting happens in the component.
 */
export function getSmartGroupDisplayName(events: Array<{ name: string; eventType: string }>): string {
    if (events.length === 1) {
        return events[0].name; // Return raw name
    }

    // Work with raw names for comparison, but return raw result
    const rawNames = events.map(e => e.name);
    const names = rawNames.map(n => formatEventName(n)); // Format only for comparison

    // Check if all names share a common substring (one name contains all others or vice versa)
    const sortedByLength = [...names].sort((a, b) => a.length - b.length);
    const shortest = sortedByLength[0];
    const shortestIndex = names.indexOf(shortest);

    // If the shortest name is contained in all other names, use it
    const shortestIsCommon = sortedByLength.every(name => name.toLowerCase().includes(shortest.toLowerCase()));

    if (shortestIsCommon) {
        return rawNames[shortestIndex]; // Return the raw version
    }

    // Check for significant word overlap (at least 60% of words match)
    const getWords = (str: string) =>
        str
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);
    const firstWords = new Set(getWords(names[0]));

    let totalWords = 0;
    let matchingWords = 0;

    names.forEach(name => {
        const words = getWords(name);
        totalWords += words.length;
        words.forEach(word => {
            if (firstWords.has(word)) {
                matchingWords++;
            }
        });
    });

    const overlapPercentage = totalWords > 0 ? matchingWords / totalWords : 0;

    // If significant overlap, use the shortest name
    if (overlapPercentage >= 0.6) {
        return rawNames[shortestIndex]; // Return the raw version
    }

    // Names are too different - use event type name
    const eventTypeName = getEventTypeInfo(events[0].eventType).name;
    return eventTypeName;
}
