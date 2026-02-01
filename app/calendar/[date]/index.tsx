import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DARK = Colors.calendar.dark;
const BEIGE = Colors.calendar.beige;
const ORANGE = Colors.calendar.orange;
const TEXT_COLOR = Colors.text.light;

// Mock data for the demonstration
const MOCK_SCHEDULE: Record<string, string> = {
    '05:15': '// WAKE UP',
    '05:30': '// TRAIN',
    '05:45': '// TRAIN',
    '06:00': '// TRAIN',
    '06:15': '// FEED ANIMALS',
    '06:30': '// GET READY',
    '06:45': '// TRAVEL',
    '07:00': '// TRAVEL',
    '07:15': '// COFFEE',
    '07:30': '// WORK',
    '07:45': '// WORK',
};

const WORK_SLOTS = ['07:30', '07:45'];

export default function DayViewScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

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

    const renderSlot = (time: string) => {
        const activity = MOCK_SCHEDULE[time];
        const isWork = WORK_SLOTS.includes(time);
        const isFilled = !!activity;

        return (
            <View key={time} style={styles.slotRow}>
                <ThemedText type="p" style={styles.timeLabel}>{time}</ThemedText>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        styles.card,
                        isFilled && styles.cardFilled,
                        isWork && styles.cardWork,
                        !isFilled && styles.cardEmpty
                    ]}
                >
                    {isFilled ? (
                        <ThemedText style={[styles.activityText, isWork && styles.activityTextWork]}>
                            {activity}
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
        backgroundColor: '#FFFFFF',
    },
    cardWork: {
        backgroundColor: '#D4E157', // Light green/yellow as in image
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
