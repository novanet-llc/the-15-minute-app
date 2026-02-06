/**
 * Activity types and data structures for the 15-minute time tracking app
 */

export type ActivityCategory = 'NOT_PRODUCTIVE' | 'WORK' | 'BUSINESS_RELATED' | 'UPKEEP';

export interface Activity {
    category: ActivityCategory;
    subcategory?: string;
    color: string;
    text: string;
}

export interface DayActivities {
    [timeSlot: string]: Activity;
}

export interface MonthlyActivities {
    [date: string]: DayActivities;
}

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, { color: string; text: string }> = {
    NOT_PRODUCTIVE: {
        color: '#EF5350',
        text: 'NOT PRODUCTIVE'
    },
    WORK: {
        color: '#D4E157',
        text: 'WORK'
    },
    BUSINESS_RELATED: {
        color: '#F9A825',
        text: 'BUSINESS RELATED'
    },
    UPKEEP: {
        color: '#FFFFFF',
        text: 'UPKEEP'
    }
};

export const ACTIVITY_SUBCATEGORIES: Record<ActivityCategory, string[]> = {
    NOT_PRODUCTIVE: [
        'DOOMSCROLLING',
        'WATCHING TV',
        'GAMING',
        'SHOPPING',
        'PHONE'
    ],
    WORK: [
        'WORK'
    ],
    BUSINESS_RELATED: [
        'NETWORKING',
        'MEETING'
    ],
    UPKEEP: [
        'TRAINING',
        'FEEDING ANIMALS',
        'FAMILY TIME',
        'KIDS TIME',
        'HOUSEHOLD CHORES',
        'GROCERY SHOPPING',
        'TRAVELING',
        'SLEEP',
        'RELATIVES',
        'COFFEE',
        'GARDENING',
        'BREAKFAST',
        'LUNCH',
        'DINNER'
    ]
};
