import type { PogoEvent, PokemonBoss, RaidScheduleEntry } from './eventTypes';
import { buildRaidTierGroupsWithImages, buildTierGroupsFromBosses } from './raidTierGroups';

export type TooltipScheduleSection = {
    id: string;
    labelText: string;
    time?: string;
    isAllDay: boolean;
    sortKey: number;
    tierGroups: NonNullable<ReturnType<typeof buildRaidTierGroupsWithImages>>;
};

export type TooltipScheduleDaySection = {
    id: string;
    date: string;
    sections: TooltipScheduleSection[];
};

/**
 * Builds the tooltip's full multi-day raid schedule: bosses grouped into tiers, nested under their
 * schedule section and ordered day. Diverges from {@link buildTimelineScheduleDaySectionsWithTierGroups}
 * deliberately — raid-hour rows are rendered by generated pseudo events here, default labels are plain
 * ("All Day"/"Scheduled"), and timed sections all sort equally (`sortKey: 0`). Returns `undefined`
 * when there is nothing to render.
 */
export function buildFullRaidScheduleDaySections(event: PogoEvent, useAnimatedImages: boolean) {
    const raidSchedule = event.extraData?.raidSchedule;
    if (!raidSchedule?.length) {
        return undefined;
    }

    const daySectionMap = new Map<string, TooltipScheduleDaySection>();
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
        daySection: TooltipScheduleDaySection,
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
            sortKey: isAllDay ? -1 : 0,
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
                schedule.label?.trim() || (isAllDay ? 'All Day' : 'Scheduled'),
                schedule.time?.trim() || undefined,
                isAllDay,
                schedule.bosses,
            );
        }
        // Raid-hour rows are shown by generated pseudo events, not the parent event.
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
        .filter((section): section is TooltipScheduleDaySection => Boolean(section));

    return daySections.length > 0 ? daySections : undefined;
}
