/**
 * Storage service for managing monthly activity data using JSON files
 */

import type { Activity, DayActivities, MonthlyActivities } from '@/types/activity';
import { Directory, File, Paths } from 'expo-file-system';

const STORAGE_DIR = new Directory(Paths.document, 'activities');

/**
 * Ensure the storage directory exists
 */
async function ensureStorageDirectory(): Promise<void> {
    if (!STORAGE_DIR.exists) {
        STORAGE_DIR.create({ idempotent: true });
    }
}

/**
 * Get the file for a specific month
 * @param date - Date string in YYYY-MM-DD format
 * @returns File instance for the month's activity data
 */
function getMonthlyFile(date: string): File {
    const yearMonth = date.substring(0, 7); // Extract YYYY-MM
    return new File(STORAGE_DIR, `activities-${yearMonth}.json`);
}

/**
 * Load monthly activities from file
 * @param date - Date string in YYYY-MM-DD format
 * @returns Monthly activities object
 */
async function loadMonthlyActivities(date: string): Promise<MonthlyActivities> {
    await ensureStorageDirectory();
    const file = getMonthlyFile(date);

    try {
        if (file.exists) {
            const content = await file.text();
            return JSON.parse(content) as MonthlyActivities;
        }
    } catch (error) {
        console.error('Error loading monthly activities:', error);
    }

    return {};
}

/**
 * Save monthly activities to file
 * @param date - Date string in YYYY-MM-DD format
 * @param monthlyData - Monthly activities object
 */
async function saveMonthlyActivities(date: string, monthlyData: MonthlyActivities): Promise<void> {
    await ensureStorageDirectory();
    const file = getMonthlyFile(date);

    try {
        await file.write(JSON.stringify(monthlyData, null, 2));
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
    return monthlyData[date] || {};
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
        monthlyData[date] = {};
    }

    monthlyData[date][timeSlot] = activity;

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
