import type { PogoEvent, PokemonBoss, RaidScheduleEntry } from './eventTypes';
import { buildRaidTierGroupsWithImages, buildTierGroupsFromBosses, sortTierLabel } from './raidTierGroups';

function parseTimeStartSortKey(timeString?: string): number {
    if (!timeString) {
        return Number.MAX_SAFE_INTEGER;
    }

    const match = timeString.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i);
    if (!match) {
        return Number.MAX_SAFE_INTEGER;
    }

    const [, hourStr, minuteStr, period] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (period.toLowerCase().includes('p') && hour !== 12) {
        hour += 12;
    } else if (period.toLowerCase().includes('a') && hour === 12) {
        hour = 0;
    }

    return hour * 60 + minute;
}

function formatScheduleSectionLabel(label?: string, isAllDay: boolean = false): string {
    const normalizedLabel = label?.trim();

    if (isAllDay) {
        return normalizedLabel ? `${normalizedLabel} (All Day)` : 'All Day';
    }

    if (normalizedLabel) {
        return normalizedLabel;
    }

    return 'Scheduled';
}

/**
 * Builds the expanded timeline raid schedule: bosses grouped into tiers, nested under their
 * schedule section (incl. raid hours) and ordered day. Returns `undefined` when there is nothing
 * to render.
 */
export function buildTimelineScheduleDaySectionsWithTierGroups(event: PogoEvent, useAnimatedImages: boolean = true) {
    const raidSchedule = event.extraData?.raidSchedule;
    if (!raidSchedule || raidSchedule.length === 0) {
        return undefined;
    }

    type TimelineScheduleSection = {
        id: string;
        labelText: string;
        time?: string;
        isAllDay: boolean;
        sortKey: number;
        tierGroups: NonNullable<ReturnType<typeof buildRaidTierGroupsWithImages>>;
    };

    type TimelineDaySection = {
        id: string;
        date: string;
        sections: TimelineScheduleSection[];
    };

    const daySectionMap = new Map<string, TimelineDaySection>();
    const orderedDates: string[] = [];

    function ensureDaySection(date: string | undefined, scheduleIndex: number) {
        const normalizedDate = (date ?? '').trim() || 'Scheduled Day';
        if (!daySectionMap.has(normalizedDate)) {
            daySectionMap.set(normalizedDate, {
                id: `schedule-day-${scheduleIndex}-${normalizedDate}`,
                date: normalizedDate,
                sections: [],
            });
            orderedDates.push(normalizedDate);
        }
        return daySectionMap.get(normalizedDate)!;
    }

    function appendScheduleSection(
        daySection: TimelineDaySection,
        id: string,
        labelText: string,
        time: string | undefined,
        isAllDay: boolean,
        bosses: PokemonBoss[],
    ) {
        const tierGroups = buildTierGroupsFromBosses(bosses);
        const tierGroupsWithImages = buildRaidTierGroupsWithImages(tierGroups, useAnimatedImages);

        if (!tierGroupsWithImages?.length) {
            return;
        }

        daySection.sections.push({
            id,
            labelText,
            time,
            isAllDay,
            sortKey: isAllDay ? -1 : parseTimeStartSortKey(time),
            tierGroups: tierGroupsWithImages,
        });
    }

    raidSchedule.forEach((schedule: RaidScheduleEntry, scheduleIndex) => {
        const daySection = ensureDaySection(schedule.date, scheduleIndex);

        if (schedule.bosses?.length) {
            const isAllDay = !schedule.time;
            appendScheduleSection(
                daySection,
                `schedule-${scheduleIndex}`,
                formatScheduleSectionLabel(schedule.label, isAllDay),
                schedule.time?.trim() || undefined,
                isAllDay,
                schedule.bosses,
            );
        }

        if (schedule.raidHours?.length) {
            schedule.raidHours.forEach((raidHour, hourIndex) => {
                if (!raidHour.bosses?.length) {
                    return;
                }

                appendScheduleSection(
                    daySection,
                    `schedule-${scheduleIndex}-raidhour-${hourIndex}`,
                    formatScheduleSectionLabel(raidHour.label, false),
                    raidHour.time?.trim() || undefined,
                    false,
                    raidHour.bosses,
                );
            });
        }
    });

    const daySections = orderedDates
        .map(date => {
            const daySection = daySectionMap.get(date);
            if (!daySection || daySection.sections.length === 0) {
                return undefined;
            }

            daySection.sections.sort((a, b) => {
                if (a.isAllDay !== b.isAllDay) {
                    return a.isAllDay ? -1 : 1;
                }
                if (a.sortKey !== b.sortKey) {
                    return a.sortKey - b.sortKey;
                }
                return a.labelText.localeCompare(b.labelText);
            });

            return daySection;
        })
        .filter((section): section is TimelineDaySection => Boolean(section));

    if (daySections.length === 0) {
        return undefined;
    }

    return daySections;
}

// One day's worth of grouped raid schedule sections, as rendered by the expanded timeline card.
export type TimelineScheduleDaySection = NonNullable<ReturnType<typeof buildTimelineScheduleDaySectionsWithTierGroups>>[number];

/**
 * Collapses the expanded schedule into a per-day list of deduped bosses (keyed by name + image),
 * keeping the highest-priority tier label for each. Used for the compact, non-active card layout.
 */
export function buildCollapsedScheduleDayGroups(event: PogoEvent) {
    const daySections = buildTimelineScheduleDaySectionsWithTierGroups(event, false);
    if (!daySections?.length) {
        return undefined;
    }

    return daySections
        .map(daySection => {
            const dedupedBosses = new Map<
                string,
                {
                    boss: (typeof daySection.sections)[number]['tierGroups'][number]['images'][number];
                    tierLabel: string;
                }
            >();

            daySection.sections.forEach(section => {
                section.tierGroups.forEach(group => {
                    group.images.forEach(boss => {
                        const dedupeKey = `${boss.name.toLowerCase()}|${(boss.imageUrl ?? '').toLowerCase()}`;
                        const existing = dedupedBosses.get(dedupeKey);

                        if (!existing) {
                            dedupedBosses.set(dedupeKey, {
                                boss,
                                tierLabel: group.label,
                            });
                            return;
                        }

                        if (sortTierLabel(group.label, existing.tierLabel) < 0) {
                            dedupedBosses.set(dedupeKey, {
                                boss,
                                tierLabel: group.label,
                            });
                        }
                    });
                });
            });

            const sortedImages = Array.from(dedupedBosses.values())
                .sort((a, b) => {
                    return sortTierLabel(a.tierLabel, b.tierLabel);
                })
                .map(entry => entry.boss);

            return {
                id: daySection.id,
                date: daySection.date,
                images: sortedImages,
            };
        })
        .filter(daySection => daySection.images.length > 0);
}

// One day's compact, deduped boss list for the collapsed (non-active) timeline card.
export type CollapsedScheduleDayGroup = NonNullable<ReturnType<typeof buildCollapsedScheduleDayGroups>>[number];
