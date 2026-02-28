/**
 * Storage service for managing monthly activity data using JSON files
 */

import { ACTIVITY_CATEGORIES, type Activity, type DayActivities, type MonthlyActivities } from '@/types/activity';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_DIR = `${FileSystem.documentDirectory}activities/`;

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
    await ensureStorageDirectory();
    const filePath = getMonthlyFilePath(date);

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
