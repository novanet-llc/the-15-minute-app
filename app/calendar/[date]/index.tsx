import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { getActivitiesForDate } from '@/services/storage';
import type { DayActivities } from '@/types/activity';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEXT_COLOR = Colors.text.light;

export default function DayViewScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activities, setActivities] = useState<DayActivities>({});

    // Load activities when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (date) {
                loadActivities();
            }
        }, [date])
    );

    const loadActivities = async () => {
        if (!date) return;
        const dayActivities = await getActivitiesForDate(date as string);
        setActivities(dayActivities);
    };

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let min = 0; min < 60; min += 15) {
                const time = `${hour.toString().padStart(1, '0')}:${min.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    }, []);

    const handleSlotPress = (time: string) => {
        if (activities[time]) {
            // If there's already an activity, could navigate to edit/delete
            // For now, navigate to select to replace it
        }
        router.push(`/calendar/${date}/select-activity?timeSlot=${time}`);
    };

    const renderSlot = (time: string) => {
        const activity = activities[time];
        const isFilled = !!activity;

        return (
            <View key={time} style={styles.slotRow}>
                <ThemedText type="p" style={styles.timeLabel}>{time}</ThemedText>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSlotPress(time)}
                    style={[
                        styles.card,
                        isFilled && styles.cardFilled,
                        isFilled && { backgroundColor: activity.color },
                        !isFilled && styles.cardEmpty
                    ]}
                >
                    {isFilled ? (
                        <ThemedText style={[
                            styles.activityText,
                            { color: activity.color === '#FFFFFF' ? '#1C1C1E' : '#1C1C1E' }
                        ]}>
                            {activity.text}
                        </ThemedText>
                    ) : (
                        <ThemedText style={styles.plusText}>+</ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const BackHandler = () => {
        router.push('/calendar');
    };

    return (
        <ThemedView style={styles.container}>
            <HeaderButtons buttonsStyle="light" />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                {timeSlots.map(renderSlot)}
            </ScrollView>

            <AppButton text="Back" onPress={BackHandler} style={{ marginHorizontal: 24 }} />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 60,
        gap: 20
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 16,
    },
    timeLabel: {
        width: 80,
        textAlign: 'right',
        color: TEXT_COLOR,
        fontSize: 22,
        fontFamily: 'GeistMono-Light',
    },
    card: {
        flex: 1,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    cardFilled: {
        // Background color set dynamically based on activity
    },
    cardEmpty: {
        borderWidth: 1,
        borderColor: '#ffffff',
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
    },
    activityText: {
        fontSize: 16,
        fontFamily: 'Geist-Bold',
        color: '#1C1C1E',
        letterSpacing: 1,
    },
    activityTextWork: {
        color: '#1C1C1E',
    },
    plusText: {
        fontSize: 36,
        color: TEXT_COLOR,
        textAlign: 'center',
        fontFamily: 'GeistMono-Light',
    },
});
