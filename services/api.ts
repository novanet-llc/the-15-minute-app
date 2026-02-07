import type { DayActivities } from '@/types/activity';

const API_KEY = process.env.EXPO_PUBLIC_API_KEY || 'YOUR_API_KEY';

/**
 * Analyzes the day activities using backend API
 */
export async function analyzeDay(activities: DayActivities): Promise<string> {
    if (!API_KEY) {
        throw new Error('API Key is missing. Please add EXPO_PUBLIC_API_KEY to your .env file.');
    }

    try {
        const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({
                    activities,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to call API');
        }

        const data = await response.json();

        return data.response || 'No analysis generated due to an error.';
    } catch (error) {
        console.error('Error analyzing day:', error);
        throw error;
    }
}
