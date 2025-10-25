import { type PogoEvent } from './eventTypes';

export interface SpotlightBonusInfo {
    category: 'catch' | 'evolve' | 'transfer';
    bonusType: 'xp' | 'stardust' | 'candy';
}

export function getSpotlightBonusInfo(event: PogoEvent): SpotlightBonusInfo | null {
    if (event.eventType !== 'pokemon-spotlight-hour' || !event.extraData?.spotlight?.bonus) {
        return null;
    }

    const bonus = event.extraData.spotlight.bonus.toLowerCase();

    // Determine bonus type
    let bonusType: SpotlightBonusInfo['bonusType'];
    if (/xp/.test(bonus)) {
        bonusType = 'xp';
    } else if (/stardust/.test(bonus)) {
        bonusType = 'stardust';
    } else if (/candy/.test(bonus)) {
        bonusType = 'candy';
    } else {
        console.log('No bonus type matched for:', bonus);
        return null;
    }

    // Determine category
    let category: SpotlightBonusInfo['category'];
    if (/catch/.test(bonus)) {
        category = 'catch';
    } else if (/evolution/.test(bonus)) {
        category = 'evolve';
    } else if (/transfer/.test(bonus)) {
        category = 'transfer';
    } else {
        console.log('No category matched for:', bonus);
        return null;
    }

    return { category, bonusType };
}

export function getSpotlightBonusTypeIcon(bonusType: SpotlightBonusInfo['bonusType']): string {
    switch (bonusType) {
        case 'xp':
            return '/images/icons/xp.png';
        case 'stardust':
            return '/images/icons/stardust.png';
        case 'candy':
            return '/images/icons/candy.png';
    }
}
