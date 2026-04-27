/**
 * Storage service for managing monthly activity data using JSON files
 */

import {
    ACTIVITY_CATEGORIES,
    ACTIVITY_SUBCATEGORIES,
    type Activity,
    type ActivityCategory,
    type DayActivities,
    type MonthlyActivities,
} from '@/types/activity';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_DIR = `${FileSystem.documentDirectory}activities/`;

export type SeedPreset = 'balanced' | 'focused' | 'weekend-heavy';

export const MONTH_SEED_PRESETS: Array<{ label: string; value: SeedPreset }> = [
    { label: 'Balanced', value: 'balanced' },
    { label: 'Focused', value: 'focused' },
    { label: 'Weekend Heavy', value: 'weekend-heavy' },
];

type SeedBlock = {
    start: string;
    end: string;
    subcategory: string;
};

const ALL_TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, index) => {
    const totalMinutes = index * 15;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    return `${hour}:${minute.toString().padStart(2, '0')}`;
});

const SUBCATEGORY_TO_CATEGORY = Object.entries(ACTIVITY_SUBCATEGORIES).reduce<Record<string, ActivityCategory>>(
    (lookup, [category, subcategories]) => {
        subcategories.forEach(subcategory => {
            lookup[subcategory] = category as ActivityCategory;
        });
        return lookup;
    },
    {}
);

/**
 * Ensure the storage directory exists
 */
async function ensureStorageDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
    }
}

/**
 * Get the file path for a specific month
 * @param date - Date string in YYYY-MM-DD format
 * @returns File path for the month's activity data
 */
function getMonthlyFilePath(date: string): string {
    const yearMonth = date.substring(0, 7); // Extract YYYY-MM
    return `${STORAGE_DIR}activities-${yearMonth}.json`;
}

/**
 * Get the file path for a specific month
 * @param yearMonth - Month string in YYYY-MM format
 * @returns File path for the month's activity data
 */
function getMonthlyFilePathForMonth(yearMonth: string): string {
    return `${STORAGE_DIR}activities-${yearMonth}.json`;
}

export function getPreviousMonthId(referenceDate = new Date()): string {
    const previousMonth = new Date(referenceDate);
    previousMonth.setDate(1);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const year = previousMonth.getFullYear();
    const month = (previousMonth.getMonth() + 1).toString().padStart(2, '0');

    return `${year}-${month}`;
}

function getDaysInMonth(yearMonth: string): number {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
}

function createActivity(subcategory: string): Activity {
    const category = SUBCATEGORY_TO_CATEGORY[subcategory];

    if (!category) {
        throw new Error(`Unsupported seed subcategory: ${subcategory}`);
    }

    return {
        category,
        subcategory,
        color: ACTIVITY_CATEGORIES[category].color,
        text: subcategory,
    };
}

function applySeedBlock(dayActivities: DayActivities, block: SeedBlock): void {
    const [startHour, startMinute] = block.start.split(':').map(Number);
    const [endHour, endMinute] = block.end.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const activity = createActivity(block.subcategory);

    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 15) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const time = `${hour}:${minute.toString().padStart(2, '0')}`;
        dayActivities[time] = { ...activity };
    }
}

function pickSeedSubcategory(options: string[], dayIndex: number, offset: number): string {
    return options[(dayIndex + offset) % options.length];
}

function fillMissingSeedSlots(dayActivities: DayActivities): void {
    const fallbackActivity = createActivity('SLEEP');

    ALL_TIME_SLOTS.forEach(timeSlot => {
        if (!dayActivities[timeSlot]) {
            dayActivities[timeSlot] = { ...fallbackActivity };
        }
    });
}

function getBalancedBlocks(isWeekend: boolean, dayIndex: number): SeedBlock[] {
    if (isWeekend) {
        return [
            { start: '0:00', end: '7:00', subcategory: 'SLEEP' },
            { start: '7:00', end: '7:30', subcategory: pickSeedSubcategory(['COFFEE', 'BREAKFAST'], dayIndex, 0) },
            { start: '7:30', end: '8:30', subcategory: 'BREAKFAST' },
            { start: '8:30', end: '10:30', subcategory: pickSeedSubcategory(['TRAINING', 'GARDENING'], dayIndex, 1) },
            { start: '10:30', end: '11:30', subcategory: pickSeedSubcategory(['HOUSEHOLD CHORES', 'GROCERY SHOPPING', 'SHOPPING'], dayIndex, 2) },
            { start: '11:30', end: '12:00', subcategory: pickSeedSubcategory(['PHONE', 'DOOMSCROLLING', 'SHOPPING'], dayIndex, 3) },
            { start: '12:00', end: '13:00', subcategory: 'LUNCH' },
            { start: '13:00', end: '14:00', subcategory: pickSeedSubcategory(['FAMILY TIME', 'KIDS TIME'], dayIndex, 4) },
            { start: '14:00', end: '15:00', subcategory: pickSeedSubcategory(['NETWORKING', 'MEETING'], dayIndex, 5) },
            { start: '15:00', end: '17:00', subcategory: pickSeedSubcategory(['FAMILY TIME', 'KIDS TIME', 'RELATIVES'], dayIndex, 6) },
            { start: '17:00', end: '18:00', subcategory: pickSeedSubcategory(['TRAINING', 'GARDENING', 'HOUSEHOLD CHORES'], dayIndex, 7) },
            { start: '18:00', end: '19:00', subcategory: 'DINNER' },
            { start: '19:00', end: '20:30', subcategory: pickSeedSubcategory(['WATCHING TV', 'GAMING', 'PHONE'], dayIndex, 8) },
            { start: '20:30', end: '22:30', subcategory: pickSeedSubcategory(['RELATIVES', 'FAMILY TIME', 'KIDS TIME'], dayIndex, 9) },
            { start: '22:30', end: '24:00', subcategory: 'SLEEP' },
        ];
    }

    return [
        { start: '0:00', end: '6:00', subcategory: 'SLEEP' },
        { start: '6:00', end: '6:30', subcategory: pickSeedSubcategory(['COFFEE', 'TRAINING'], dayIndex, 0) },
        { start: '6:30', end: '7:00', subcategory: 'BREAKFAST' },
        { start: '7:00', end: '7:30', subcategory: 'TRAVELING' },
        { start: '7:30', end: '9:30', subcategory: 'WORK' },
        { start: '9:30', end: '10:15', subcategory: pickSeedSubcategory(['NETWORKING', 'MEETING'], dayIndex, 1) },
        { start: '10:15', end: '12:00', subcategory: 'WORK' },
        { start: '12:00', end: '13:00', subcategory: 'LUNCH' },
        { start: '13:00', end: '15:30', subcategory: 'WORK' },
        { start: '15:30', end: '16:00', subcategory: pickSeedSubcategory(['PHONE', 'DOOMSCROLLING', 'SHOPPING'], dayIndex, 2) },
        { start: '16:00', end: '17:30', subcategory: pickSeedSubcategory(['MEETING', 'NETWORKING'], dayIndex, 3) },
        { start: '17:30', end: '18:00', subcategory: 'TRAVELING' },
        { start: '18:00', end: '19:00', subcategory: 'DINNER' },
        { start: '19:00', end: '20:00', subcategory: pickSeedSubcategory(['HOUSEHOLD CHORES', 'FAMILY TIME', 'TRAINING'], dayIndex, 4) },
        { start: '20:00', end: '21:00', subcategory: pickSeedSubcategory(['WATCHING TV', 'GAMING', 'PHONE'], dayIndex, 5) },
        { start: '21:00', end: '22:30', subcategory: pickSeedSubcategory(['RELATIVES', 'FAMILY TIME', 'KIDS TIME'], dayIndex, 6) },
        { start: '22:30', end: '24:00', subcategory: 'SLEEP' },
    ];
}

function getFocusedBlocks(isWeekend: boolean, dayIndex: number): SeedBlock[] {
    if (isWeekend) {
        return [
            { start: '0:00', end: '7:30', subcategory: 'SLEEP' },
            { start: '7:30', end: '8:00', subcategory: pickSeedSubcategory(['COFFEE', 'BREAKFAST'], dayIndex, 0) },
            { start: '8:00', end: '8:30', subcategory: 'BREAKFAST' },
            { start: '8:30', end: '10:30', subcategory: pickSeedSubcategory(['HOUSEHOLD CHORES', 'GARDENING', 'TRAINING'], dayIndex, 1) },
            { start: '10:30', end: '11:30', subcategory: pickSeedSubcategory(['NETWORKING', 'MEETING'], dayIndex, 2) },
            { start: '11:30', end: '12:00', subcategory: pickSeedSubcategory(['PHONE', 'SHOPPING', 'DOOMSCROLLING'], dayIndex, 3) },
            { start: '12:00', end: '13:00', subcategory: 'LUNCH' },
            { start: '13:00', end: '15:30', subcategory: pickSeedSubcategory(['FAMILY TIME', 'KIDS TIME'], dayIndex, 4) },
            { start: '15:30', end: '17:00', subcategory: pickSeedSubcategory(['TRAINING', 'GARDENING'], dayIndex, 5) },
            { start: '17:00', end: '18:00', subcategory: pickSeedSubcategory(['RELATIVES', 'FAMILY TIME'], dayIndex, 6) },
            { start: '18:00', end: '19:00', subcategory: 'DINNER' },
            { start: '19:00', end: '20:30', subcategory: pickSeedSubcategory(['WATCHING TV', 'GAMING', 'PHONE'], dayIndex, 7) },
            { start: '20:30', end: '22:30', subcategory: pickSeedSubcategory(['RELATIVES', 'FAMILY TIME', 'KIDS TIME'], dayIndex, 8) },
            { start: '22:30', end: '24:00', subcategory: 'SLEEP' },
        ];
    }

    return [
        { start: '0:00', end: '6:00', subcategory: 'SLEEP' },
        { start: '6:00', end: '6:30', subcategory: 'COFFEE' },
        { start: '6:30', end: '7:00', subcategory: 'BREAKFAST' },
        { start: '7:00', end: '7:30', subcategory: 'TRAVELING' },
        { start: '7:30', end: '10:30', subcategory: 'WORK' },
        { start: '10:30', end: '11:15', subcategory: pickSeedSubcategory(['NETWORKING', 'MEETING'], dayIndex, 0) },
        { start: '11:15', end: '12:30', subcategory: 'WORK' },
        { start: '12:30', end: '13:00', subcategory: 'LUNCH' },
        { start: '13:00', end: '16:30', subcategory: 'WORK' },
        { start: '16:30', end: '17:15', subcategory: pickSeedSubcategory(['MEETING', 'NETWORKING'], dayIndex, 1) },
        { start: '17:15', end: '18:00', subcategory: pickSeedSubcategory(['PHONE', 'DOOMSCROLLING'], dayIndex, 2) },
        { start: '18:00', end: '18:30', subcategory: 'TRAVELING' },
        { start: '18:30', end: '19:00', subcategory: 'DINNER' },
        { start: '19:00', end: '20:00', subcategory: pickSeedSubcategory(['HOUSEHOLD CHORES', 'TRAINING'], dayIndex, 3) },
        { start: '20:00', end: '21:00', subcategory: pickSeedSubcategory(['RELATIVES', 'FAMILY TIME', 'KIDS TIME'], dayIndex, 4) },
        { start: '21:00', end: '22:30', subcategory: pickSeedSubcategory(['WATCHING TV', 'GAMING', 'PHONE'], dayIndex, 5) },
        { start: '22:30', end: '24:00', subcategory: 'SLEEP' },
    ];
}

function getWeekendHeavyBlocks(isWeekend: boolean, dayIndex: number): SeedBlock[] {
    if (isWeekend) {
        return [
            { start: '0:00', end: '8:00', subcategory: 'SLEEP' },
            { start: '8:00', end: '8:30', subcategory: pickSeedSubcategory(['COFFEE', 'BREAKFAST'], dayIndex, 0) },
            { start: '8:30', end: '9:15', subcategory: 'BREAKFAST' },
            { start: '9:15', end: '11:00', subcategory: pickSeedSubcategory(['TRAINING', 'GARDENING'], dayIndex, 1) },
            { start: '11:00', end: '11:45', subcategory: pickSeedSubcategory(['NETWORKING', 'MEETING'], dayIndex, 2) },
            { start: '11:45', end: '12:30', subcategory: pickSeedSubcategory(['FAMILY TIME', 'KIDS TIME'], dayIndex, 3) },
            { start: '12:30', end: '13:15', subcategory: 'LUNCH' },
            { start: '13:15', end: '15:15', subcategory: pickSeedSubcategory(['FAMILY TIME', 'KIDS TIME', 'RELATIVES'], dayIndex, 4) },
            { start: '15:15', end: '16:00', subcategory: pickSeedSubcategory(['SHOPPING', 'PHONE', 'DOOMSCROLLING'], dayIndex, 5) },
            { start: '16:00', end: '17:30', subcategory: pickSeedSubcategory(['HOUSEHOLD CHORES', 'GROCERY SHOPPING', 'GARDENING'], dayIndex, 6) },
            { start: '17:30', end: '18:00', subcategory: 'TRAVELING' },
            { start: '18:00', end: '19:00', subcategory: 'DINNER' },
            { start: '19:00', end: '20:30', subcategory: pickSeedSubcategory(['WATCHING TV', 'GAMING', 'PHONE'], dayIndex, 7) },
            { start: '20:30', end: '22:30', subcategory: pickSeedSubcategory(['RELATIVES', 'FAMILY TIME', 'KIDS TIME'], dayIndex, 8) },
            { start: '22:30', end: '24:00', subcategory: 'SLEEP' },
        ];
    }

    return [
        { start: '0:00', end: '6:30', subcategory: 'SLEEP' },
        { start: '6:30', end: '7:00', subcategory: 'BREAKFAST' },
        { start: '7:00', end: '7:30', subcategory: 'TRAVELING' },
        { start: '7:30', end: '9:30', subcategory: 'WORK' },
        { start: '9:30', end: '10:15', subcategory: pickSeedSubcategory(['MEETING', 'NETWORKING'], dayIndex, 0) },
        { start: '10:15', end: '11:30', subcategory: 'WORK' },
        { start: '11:30', end: '12:15', subcategory: 'LUNCH' },
        { start: '12:15', end: '14:45', subcategory: 'WORK' },
        { start: '14:45', end: '15:15', subcategory: pickSeedSubcategory(['PHONE', 'SHOPPING', 'DOOMSCROLLING'], dayIndex, 1) },
        { start: '15:15', end: '16:00', subcategory: pickSeedSubcategory(['MEETING', 'NETWORKING'], dayIndex, 2) },
        { start: '16:00', end: '17:30', subcategory: pickSeedSubcategory(['GROCERY SHOPPING', 'HOUSEHOLD CHORES', 'TRAINING'], dayIndex, 3) },
        { start: '17:30', end: '18:00', subcategory: 'TRAVELING' },
        { start: '18:00', end: '18:45', subcategory: 'DINNER' },
        { start: '18:45', end: '20:15', subcategory: pickSeedSubcategory(['FAMILY TIME', 'KIDS TIME', 'RELATIVES'], dayIndex, 4) },
        { start: '20:15', end: '21:15', subcategory: pickSeedSubcategory(['WATCHING TV', 'GAMING', 'PHONE'], dayIndex, 5) },
        { start: '21:15', end: '22:30', subcategory: pickSeedSubcategory(['RELATIVES', 'FAMILY TIME'], dayIndex, 6) },
        { start: '22:30', end: '24:00', subcategory: 'SLEEP' },
    ];
}

function getSeedBlocks(date: string, preset: SeedPreset, dayIndex: number): SeedBlock[] {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    switch (preset) {
        case 'focused':
            return getFocusedBlocks(isWeekend, dayIndex);
        case 'weekend-heavy':
            return getWeekendHeavyBlocks(isWeekend, dayIndex);
        case 'balanced':
        default:
            return getBalancedBlocks(isWeekend, dayIndex);
    }
}

function buildSeededDayActivities(date: string, preset: SeedPreset, dayIndex: number): DayActivities {
    const activities: DayActivities = {};

    getSeedBlocks(date, preset, dayIndex).forEach(block => {
        applySeedBlock(activities, block);
    });

    fillMissingSeedSlots(activities);

    return activities;
}

/**
 * Load monthly activities from file
 * @param date - Date string in YYYY-MM-DD format
 * @returns Monthly activities object
 */
async function loadMonthlyActivities(date: string): Promise<MonthlyActivities> {
    await ensureStorageDirectory();
    const filePath = getMonthlyFilePath(date);

    try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
            const content = await FileSystem.readAsStringAsync(filePath);
            return JSON.parse(content) as MonthlyActivities;
        }
    } catch (error) {
        console.error('Error loading monthly activities:', error);
    }

    return {};
}

/**
 * Load monthly activities for a specific month
 * @param yearMonth - Month string in YYYY-MM format
 * @returns Monthly activities object
 */
export async function getMonthlyActivitiesForMonth(yearMonth: string): Promise<MonthlyActivities> {
    await ensureStorageDirectory();
    const filePath = getMonthlyFilePathForMonth(yearMonth);

    try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
            const content = await FileSystem.readAsStringAsync(filePath);
            return JSON.parse(content) as MonthlyActivities;
        }
    } catch (error) {
        console.error('Error loading monthly activities:', error);
    }

    return {};
}

/**
 * List stored activity months based on saved monthly JSON files
 * @returns Sorted month ids in YYYY-MM format
 */
export async function listStoredActivityMonths(): Promise<string[]> {
    await ensureStorageDirectory();

    try {
        const files = await FileSystem.readDirectoryAsync(STORAGE_DIR);

        return files
            .map(fileName => {
                const match = fileName.match(/^activities-(\d{4}-\d{2})\.json$/);
                return match?.[1] ?? null;
            })
            .filter((value): value is string => value !== null)
            .sort();
    } catch (error) {
        console.error('Error listing monthly activities:', error);
        return [];
    }
}

export async function seedMonthActivities({
    yearMonth,
    preset,
}: {
    yearMonth: string;
    preset: SeedPreset;
}): Promise<void> {
    const daysInMonth = getDaysInMonth(yearMonth);
    const monthlyData: MonthlyActivities = {};

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${yearMonth}-${day.toString().padStart(2, '0')}`;
        monthlyData[date] = buildSeededDayActivities(date, preset, day);
    }

    await saveMonthlyActivitiesForMonth(yearMonth, monthlyData);
}

export async function clearMonthlyActivities(yearMonth: string): Promise<void> {
    await ensureStorageDirectory();
    const filePath = getMonthlyFilePathForMonth(yearMonth);

    try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists) {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
        }
    } catch (error) {
        console.error('Error clearing monthly activities:', error);
        throw error;
    }
}

export async function clearAllActivities(): Promise<void> {
    await ensureStorageDirectory();

    try {
        const entries = await FileSystem.readDirectoryAsync(STORAGE_DIR);

        await Promise.all(
            entries.map(entry => FileSystem.deleteAsync(`${STORAGE_DIR}${entry}`, { idempotent: true }))
        );
    } catch (error) {
        console.error('Error clearing all activities:', error);
        throw error;
    }
}

/**
 * Get initial activities for a new day
 * @returns Default activities (Sleep slots)
 */
function getInitialDayActivities(): DayActivities {
    const activities: DayActivities = {};
    const sleepActivity: Activity = {
        category: 'UPKEEP',
        subcategory: 'SLEEP',
        color: ACTIVITY_CATEGORIES.UPKEEP.color,
        text: 'SLEEP'
    };

    // 0:00 - 5:00
    for (let hour = 0; hour <= 5; hour++) {
        for (let min = 0; min < 60; min += 15) {
            if (hour === 5 && min > 0) break;
            const time = `${hour}:${min.toString().padStart(2, '0')}`;
            activities[time] = { ...sleepActivity };
        }
    }

    // 22:30 - 23:45
    for (let hour = 22; hour <= 23; hour++) {
        for (let min = 0; min < 60; min += 15) {
            if (hour === 22 && min < 30) continue;
            const time = `${hour}:${min.toString().padStart(2, '0')}`;
            activities[time] = { ...sleepActivity };
        }
    }

    return activities;
}

/**
 * Save monthly activities to file
 * @param date - Date string in YYYY-MM-DD format
 * @param monthlyData - Monthly activities object
 */
async function saveMonthlyActivities(date: string, monthlyData: MonthlyActivities): Promise<void> {
    const yearMonth = date.substring(0, 7);
    await saveMonthlyActivitiesForMonth(yearMonth, monthlyData);
}

async function saveMonthlyActivitiesForMonth(yearMonth: string, monthlyData: MonthlyActivities): Promise<void> {
    await ensureStorageDirectory();
    const filePath = getMonthlyFilePathForMonth(yearMonth);

    try {
        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(monthlyData, null, 2));
    } catch (error) {
        console.error('Error saving monthly activities:', error);
        throw error;
    }
}

/**
 * Get activities for a specific date
 * @param date - Date string in YYYY-MM-DD format
 * @returns Activities for the date
 */
export async function getActivitiesForDate(date: string): Promise<DayActivities> {
    const monthlyData = await loadMonthlyActivities(date);
    return monthlyData[date] || getInitialDayActivities();
}

/**
 * Save an activity for a specific date and time slot
 * @param date - Date string in YYYY-MM-DD format
 * @param timeSlot - Time slot in HH:MM format (e.g., "09:15")
 * @param activity - Activity object
 */
export async function saveActivity(date: string, timeSlot: string, activity: Activity): Promise<void> {
    const monthlyData = await loadMonthlyActivities(date);

    if (!monthlyData[date]) {
        monthlyData[date] = getInitialDayActivities();
    }

    monthlyData[date][timeSlot] = activity;

    await saveMonthlyActivities(date, monthlyData);
}

/**
 * Save activities for multiple time slots at once
 * @param date - Date string in YYYY-MM-DD format
 * @param timeSlots - Array of time slots in HH:MM format
 * @param activity - Activity object to apply to all slots
 */
export async function saveActivitiesBatch(date: string, timeSlots: string[], activity: Activity): Promise<void> {
    const monthlyData = await loadMonthlyActivities(date);

    if (!monthlyData[date]) {
        monthlyData[date] = getInitialDayActivities();
    }

    timeSlots.forEach(timeSlot => {
        monthlyData[date][timeSlot] = { ...activity };
    });

    await saveMonthlyActivities(date, monthlyData);
}

/**
 * Delete an activity for a specific date and time slot
 * @param date - Date string in YYYY-MM-DD format
 * @param timeSlot - Time slot in HH:MM format
 */
export async function deleteActivity(date: string, timeSlot: string): Promise<void> {
    const monthlyData = await loadMonthlyActivities(date);

    if (monthlyData[date]) {
        delete monthlyData[date][timeSlot];

        // Remove date entry if no activities left
        if (Object.keys(monthlyData[date]).length === 0) {
            delete monthlyData[date];
        }

        await saveMonthlyActivities(date, monthlyData);
    }
}
