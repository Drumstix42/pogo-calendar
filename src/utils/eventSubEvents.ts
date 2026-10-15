import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

import { parseRaidScheduleDate } from './eventRaidHours';
import { type PogoEvent, type PokemonBoss, getEventTypes, isAllMaxBattleBosses } from './eventTypes';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Parse raid hour time string to extract start and end hours
 * Example: "6:00 p.m. to 7:00 p.m. local time" -> { start: 18, end: 19 }
 */
function parseRaidHourTime(timeString: string): { startHour: number; endHour: number } {
    // Default to 6pm-7pm if parsing fails
    const defaultTime = { startHour: 18, endHour: 19 };

    if (!timeString) return defaultTime;

    // Extract times like "6:00 p.m. to 7:00 p.m."
    const timeMatch = timeString.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)\s+to\s+(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i);
    if (timeMatch) {
        const [, startHourStr, , startPeriod, endHourStr, , endPeriod] = timeMatch;
        let startHour = parseInt(startHourStr, 10);
        let endHour = parseInt(endHourStr, 10);

        // Convert to 24-hour format
        if (startPeriod.toLowerCase().includes('p') && startHour !== 12) {
            startHour += 12;
        } else if (startPeriod.toLowerCase().includes('a') && startHour === 12) {
            startHour = 0;
        }

        if (endPeriod.toLowerCase().includes('p') && endHour !== 12) {
            endHour += 12;
        } else if (endPeriod.toLowerCase().includes('a') && endHour === 12) {
            endHour = 0;
        }

        return { startHour, endHour };
    }

    return defaultTime;
}

const MAX_FORM_PREFIX = /^(Dynamax|Gigantamax)\s+/i;

/**
 * Format Pokemon names grammatically
 * 1 Pokemon: "Lugia Raid Hour"
 * 2 Pokemon: "Lugia and Ho-Oh Raid Hour"
 * 3+ Pokemon: "Tapu Koko, Tapu Lele, and Tapu Bulu Raid Hour"
 * Max Battles only: "Dynamax Latias and Latios Max Battle Hour"
 */
function formatPokemonList(bosses: PokemonBoss[]): string {
    const suffix = isAllMaxBattleBosses(bosses) ? 'Max Battle Hour' : 'Raid Hour';

    if (bosses.length === 0) return suffix;
    if (bosses.length > 6) return `${bosses.length} Bosses ${suffix}`;

    // A shared Dynamax/Gigantamax prefix is said once, matching LeekDuck's "Dynamax X and Y Max Battle Day" titles.
    let names = bosses.map(b => b.name);
    const sharedPrefix = names[0].match(MAX_FORM_PREFIX)?.[0];
    if (sharedPrefix && names.every(name => name.startsWith(sharedPrefix))) {
        names = names.map(name => name.slice(sharedPrefix.length));
    }

    let list: string;
    if (names.length === 1) list = names[0];
    else if (names.length === 2) list = `${names[0]} and ${names[1]}`;
    else list = `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;

    return `${sharedPrefix ?? ''}${list} ${suffix}`;
}

function formatSpotlightEventName(pokemon: PokemonBoss): string {
    return `${pokemon.name} Spotlight Hour`;
}

/**
 * Generate pseudo Raid Hour sub events from a parent event's raid schedule
 */
export function generateEventRaidHourSubEvents(parentEvent: PogoEvent): PogoEvent[] {
    // Only process events with eventType "event"
    if (parentEvent.eventType !== 'event') {
        return [];
    }

    const raidSchedule = parentEvent.extraData?.raidSchedule;
    if (!raidSchedule || raidSchedule.length === 0) {
        return [];
    }

    const pseudoEvents: PogoEvent[] = [];

    raidSchedule.forEach(schedule => {
        // Only process entries with raid hours
        if (!schedule.raidHours || schedule.raidHours.length === 0) {
            return;
        }

        // Parse the date
        const raidDate = parseRaidScheduleDate(schedule.date, parentEvent.start, parentEvent.end);
        if (!raidDate) {
            console.warn(`Could not parse raid schedule date: "${schedule.date}" for event ${parentEvent.eventID}`);
            return;
        }

        // Process each raid hour
        schedule.raidHours.forEach((raidHour, index) => {
            if (!raidHour.bosses || raidHour.bosses.length === 0) {
                return;
            }

            // Parse the time
            const { startHour, endHour } = parseRaidHourTime(raidHour.time || '');

            // Create start and end times
            const startDateTime = raidDate.hour(startHour).minute(0).second(0);
            const endDateTime = raidDate.hour(endHour).minute(0).second(0);

            // Format event name
            const eventName = formatPokemonList(raidHour.bosses);

            // Generate unique ID
            const dateKey = raidDate.format('YYYY-MM-DD');
            const eventID = `${parentEvent.eventID}-raid-hour-${dateKey}-${index}`;

            // Create pseudo event
            const pseudoEvent: PogoEvent = {
                eventID,
                name: eventName,
                eventType: 'event',
                eventTypes: getEventTypes(parentEvent),
                heading: 'Event',
                link: parentEvent.link,
                image: raidHour.bosses[0]?.image || parentEvent.image,
                start: startDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
                end: endDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
                extraData: {
                    isRaidHourSubEvent: true,
                    parentEventId: parentEvent.eventID,
                    generic: {
                        hasSpawns: false,
                        hasFieldResearchTasks: false,
                    },
                    raidbattles: {
                        bosses: raidHour.bosses,
                    },
                    ...(schedule.bonuses && schedule.bonuses.length > 0 && { raidHourBonuses: schedule.bonuses }),
                },
            };

            pseudoEvents.push(pseudoEvent);
        });
    });

    return pseudoEvents;
}

/**
 * Generate pseudo Spotlight Hour sub events from a parent event's spotlight schedule
 */
export function generateEventSpotlightSubEvents(parentEvent: PogoEvent): PogoEvent[] {
    // Only process events with eventType "event"
    if (parentEvent.eventType !== 'event') {
        return [];
    }

    const spotlightSchedule = parentEvent.extraData?.spotlightSchedule;
    if (!spotlightSchedule || spotlightSchedule.length === 0) {
        return [];
    }

    const pseudoEvents: PogoEvent[] = [];

    spotlightSchedule.forEach((schedule, index) => {
        if (!schedule.pokemon || !schedule.pokemon.name) {
            return;
        }

        const spotlightDate = parseRaidScheduleDate(schedule.date, parentEvent.start, parentEvent.end);
        if (!spotlightDate) {
            console.warn(`Could not parse spotlight schedule date: "${schedule.date}" for event ${parentEvent.eventID}`);
            return;
        }

        const { startHour, endHour } = parseRaidHourTime(schedule.time || '');
        const startDateTime = spotlightDate.hour(startHour).minute(0).second(0);
        const endDateTime = spotlightDate.hour(endHour).minute(0).second(0);

        const eventName = formatSpotlightEventName(schedule.pokemon);
        const dateKey = spotlightDate.format('YYYY-MM-DD');
        const eventID = `${parentEvent.eventID}-spotlight-hour-${dateKey}-${index}`;

        const pseudoEvent: PogoEvent = {
            eventID,
            name: eventName,
            eventType: parentEvent.eventType,
            eventTypes: getEventTypes(parentEvent),
            heading: parentEvent.heading,
            link: parentEvent.link,
            image: schedule.pokemon.image || parentEvent.image,
            start: startDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
            end: endDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
            extraData: {
                isSpotlightSubEvent: true,
                parentEventId: parentEvent.eventID,
                generic: {
                    hasSpawns: false,
                    hasFieldResearchTasks: false,
                },
                spotlight: {
                    name: schedule.pokemon.name,
                    image: schedule.pokemon.image,
                    canBeShiny: schedule.pokemon.canBeShiny,
                },
            },
        };

        pseudoEvents.push(pseudoEvent);
    });

    return pseudoEvents;
}
