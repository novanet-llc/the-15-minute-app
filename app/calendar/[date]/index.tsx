import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { getActivitiesForDate } from '@/services/storage';
import type { DayActivities } from '@/types/activity';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEXT_COLOR = Colors.text.light;

export default function DayViewScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activities, setActivities] = useState<DayActivities>({});
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const startSlotIndex = useSharedValue(-1);

    const SLOT_HEIGHT = 40; // 34 height + 6 margin

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
        if (selectedSlots.has(time)) {
            // If multiple slots are selected, navigate with all of them
            const slotsArray = Array.from(selectedSlots);
            router.push(`/calendar/${date}/select-activity?timeSlots=${slotsArray.join(',')}`);
            setSelectedSlots(new Set());
            return;
        }

        // Single slot press
        setSelectedSlots(new Set()); // Clear any previous selection
        router.push(`/calendar/${date}/select-activity?timeSlot=${time}`);
    };

    const AnalyseHandler = () => {
        router.push(`/analyse/${date}`);
    };

    const updateSelection = (y: number) => {
        const currentIndex = Math.min(Math.max(0, Math.floor(y / SLOT_HEIGHT)), timeSlots.length - 1);

        if (startSlotIndex.value !== -1) {
            const start = Math.min(startSlotIndex.value, currentIndex);
            const end = Math.max(startSlotIndex.value, currentIndex);
            const newSelection = new Set<string>();
            for (let i = start; i <= end; i++) {
                newSelection.add(timeSlots[i]);
            }
            setSelectedSlots(newSelection);
        }
    };

    const panGesture = Gesture.Pan()
        .activateAfterLongPress(300)
        .onStart((e) => {
            const index = Math.min(Math.max(0, Math.floor(e.y / SLOT_HEIGHT)), timeSlots.length - 1);
            startSlotIndex.value = index;
            runOnJS(setIsDragging)(true);
            runOnJS(updateSelection)(e.y);
        })
        .onUpdate((e) => {
            runOnJS(updateSelection)(e.y);
        })
        .onEnd(() => {
            startSlotIndex.value = -1;
            runOnJS(setIsDragging)(false);
        });

    const renderSlot = (time: string, index: number) => {
        const activity = activities[time];
        const isFilled = !!activity;
        const isSelected = selectedSlots.has(time);

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
                        !isFilled && styles.cardEmpty,
                        isSelected && styles.cardSelected
                    ]}
                >
                    {isFilled ? (
                        <ThemedText type="p" style={[
                            styles.activityText,
                            { color: '#1C1C1E' }
                        ]}>
                            // {activity.text}
                        </ThemedText>
                    ) : (
                        <ThemedText type="p" style={[
                            styles.plusText,
                            isSelected && { color: '#000000' }
                        ]}>
                            {isSelected ? '✓' : '+'}
                        </ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const BackHandler = () => {
        router.push('/calendar');
    };

    const scrollY = useSharedValue(0);

    const handleScroll = (event: any) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
    };

    return (
        <ThemedView style={styles.container}>
            <HeaderButtons buttonsStyle="light" />

            <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isDragging}
            >
                <GestureDetector gesture={panGesture}>
                    <View style={{ width: '100%', backgroundColor: 'transparent' }}>
                        {timeSlots.map((time, index) => renderSlot(time, index))}
                    </View>
                </GestureDetector>
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: 24, gap: 10 }}>
                <AppButton text="Back" onPress={BackHandler} />
                <AppButton text="Analyse" onPress={AnalyseHandler} style={{ backgroundColor: Colors.background.light }} />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 30,
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
        width: 60,
        textAlign: 'right',
        color: TEXT_COLOR,
        fontSize: 18,
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
        borderWidth: 0.5,
        borderColor: '#ffffff',
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
    },
    activityText: {
        fontSize: 16,
    },
    plusText: {
        fontSize: 30,
        color: TEXT_COLOR,
        textAlign: 'center',
    },
    cardSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderColor: '#ffffff',
        borderWidth: 2,
        borderStyle: 'solid',
    },
});
