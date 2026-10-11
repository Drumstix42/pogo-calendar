import { type PogoEvent } from './eventTypes';

export type EggDistance = '2km' | '5km' | '7km' | '10km' | '12km';

export const DEFAULT_EGG_DISTANCE: EggDistance = '2km';

interface EggColors {
    /** Radial gradient stops: highlight, body, shade */
    shell: [string, string, string];
    spots: string;
}

const CREAM_SHELL: EggColors['shell'] = ['#fefcec', '#f3eec6', '#d8cf9c'];

// Matches the in-game egg colors: only 7 km eggs change the shell color, the rest differ by spot color.
const EGG_COLORS: Record<EggDistance, EggColors> = {
    '2km': { shell: CREAM_SHELL, spots: '#84b158' },
    '5km': { shell: CREAM_SHELL, spots: '#dc9c2c' },
    '7km': { shell: ['#fffbc4', '#f8e45e', '#ddbf34'], spots: '#ef86bd' },
    '10km': { shell: CREAM_SHELL, spots: '#9184c6' },
    '12km': { shell: CREAM_SHELL, spots: '#d52a22' },
};

const EGG_PATH = 'M40 3C20 3 5 37 5 61c0 21 15.5 36 35 36s35-15 35-36C75 37 60 3 40 3z';

// Spot layout traced from the in-game egg sprite; spots running off the shell are clipped to it.
const EGG_SPOTS = [
    '<ellipse cx="50" cy="59" rx="15.5" ry="22" transform="rotate(-10 50 59)"/>',
    '<ellipse cx="63" cy="16" rx="10" ry="8" transform="rotate(30 63 16)"/>',
    '<ellipse cx="63" cy="32" rx="3.5" ry="5.5" transform="rotate(-20 63 32)"/>',
    '<ellipse cx="11" cy="25" rx="6" ry="10.5" transform="rotate(20 11 25)"/>',
    '<ellipse cx="21" cy="81" rx="15" ry="10" transform="rotate(35 21 81)"/>',
    '<ellipse cx="75" cy="80" rx="6.5" ry="9.5"/>',
].join('');

function buildEggSvg({ shell: [highlight, body, shade], spots }: EggColors): string {
    return [
        '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" viewBox="0 0 80 100">',
        '<defs>',
        `<radialGradient id="shell" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="${highlight}"/><stop offset="0.55" stop-color="${body}"/><stop offset="1" stop-color="${shade}"/></radialGradient>`,
        `<clipPath id="egg-clip"><path d="${EGG_PATH}"/></clipPath>`,
        '</defs>',
        `<path d="${EGG_PATH}" fill="url(#shell)"/>`,
        `<g fill="${spots}" clip-path="url(#egg-clip)">${EGG_SPOTS}</g>`,
        `<path d="${EGG_PATH}" fill="none" stroke="#8c7b5e" stroke-opacity="0.55" stroke-width="2"/>`,
        '</svg>',
    ].join('');
}

const eggImageUrls = new Map<EggDistance, string>();

/** Egg artwork as a data URL, usable by both `<img>` and canvas drawing (Campfire badge). */
export function getEggImageUrl(distance: EggDistance = DEFAULT_EGG_DISTANCE): string {
    let url = eggImageUrls.get(distance);
    if (!url) {
        url = `data:image/svg+xml,${encodeURIComponent(buildEggSvg(EGG_COLORS[distance]))}`;
        eggImageUrls.set(distance, url);
    }
    return url;
}

// The feed doesn't say which egg a Hatch Day features yet; this is the seam for when it does.
export function getHatchDayEggDistance(_event: PogoEvent): EggDistance {
    return DEFAULT_EGG_DISTANCE;
}
