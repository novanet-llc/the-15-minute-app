import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ORANGE = Colors.calendar.orange;
const BEIGE = Colors.calendar.beige;
const DARK = Colors.calendar.dark;

// Types for day items
type DayStatus = 'past' | 'today' | 'future';
type GridItem = { type: 'day'; day: number; status: DayStatus } | { type: 'empty'; day: null };

// Helper to get grid for a specific month/year
const getCalendarGrid = (year: number, month: number, todayDate: Date): GridItem[] => {
    const items: GridItem[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();

    // getDay() 0=Sun, 1=Mon... 6=Sat
    // We want Monday-start: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
    const dayOfWeek = firstDay.getDay();
    const padding = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon-start padding

    // Add empty padding circles
    for (let i = 0; i < padding; i++) {
        items.push({ type: 'empty', day: null });
    }

    // Add days of the month
    for (let day = 1; day <= lastDay; day++) {
        let status: DayStatus = 'future';
        const currentIterDate = new Date(year, month, day);

        // Reset times for comparison
        const todayReset = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
        const iterReset = new Date(year, month, day);

        if (iterReset < todayReset) status = 'past';
        if (iterReset.getTime() === todayReset.getTime()) status = 'today';

        items.push({ type: 'day', day, status });
    }

    // Fill to multiple of 7
    while (items.length % 7 !== 0) {
        items.push({ type: 'empty', day: null });
    }

    // Ensure at least 5 rows (35 items)
    while (items.length < 35) {
        items.push({ type: 'empty', day: null });
    }

    return items;
};

export default function CalendarScreen() {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const { dark } = useTheme();
    const colorScheme = dark ? 'dark' : 'light';
    const theme = Colors[colorScheme];

    // Reference date: 2026-01-31
    const initialToday = useMemo(() => new Date(2026, 0, 31), []);

    // Current visible month relative to initialToday
    const [viewingMonthOffset, setViewingMonthOffset] = useState(0);

    // Dynamic date info based on state
    const currentViewingDate = useMemo(() => {
        const d = new Date(initialToday.getFullYear(), initialToday.getMonth() + viewingMonthOffset, 1);
        return d;
    }, [viewingMonthOffset, initialToday]);

    const displayMonth = currentViewingDate.toLocaleString('default', { month: 'long' }).toUpperCase();
    const displayYear = currentViewingDate.getFullYear();
    const displayDayName = initialToday.toLocaleString('default', { weekday: 'short' });

    // Grid data
    const gridItems = useMemo(() => {
        return getCalendarGrid(currentViewingDate.getFullYear(), currentViewingDate.getMonth(), initialToday);
    }, [currentViewingDate, initialToday]);

    // FlatList implementation for swipeable months
    // We'll use a large range for index to simulate infinite scroll
    const PAGE_COUNT = 120; // 10 years
    const INITIAL_INDEX = 60; // Middle

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.x;
        const index = Math.round(offset / windowWidth);
        setViewingMonthOffset(index - INITIAL_INDEX);
    }, [windowWidth]);

    const router = useRouter();

    const handleDayPress = (day: number) => {
        // Navigate to /calendar/YYYY-MM-DD
        const dateStr = `${currentViewingDate.getFullYear()}-${(currentViewingDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        router.push(`/calendar/${dateStr}`);
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background.light }]}>
            <HeaderButtons />

            <View style={styles.content}>
                {/* Horizontal paging for months */}
                <FlatList
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    data={Array.from({ length: PAGE_COUNT })}
                    keyExtractor={(_, i) => i.toString()}
                    initialScrollIndex={INITIAL_INDEX}
                    getItemLayout={(_, index) => ({
                        length: windowWidth,
                        offset: windowWidth * index,
                        index,
                    })}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    style={{ flexGrow: 1, marginHorizontal: -24 }}
                    renderItem={() => (
                        <View style={{ width: windowWidth, paddingHorizontal: 24 }}>
                            <ThemedText style={styles.bigDate}>{initialToday.getDate()}</ThemedText>

                            <View style={styles.monthRow}>
                                <ThemedText style={styles.monthText}>{displayMonth}</ThemedText>
                                <ThemedText style={styles.dayText}>{displayDayName}</ThemedText>
                            </View>

                            <ThemedText style={styles.yearText}>{displayYear}</ThemedText>

                            <View style={styles.gridContainer}>
                                {gridItems.map((item, index) => (
                                    <View key={index} style={styles.gridCell}>
                                        <TouchableOpacity
                                            activeOpacity={item.type === 'day' ? 0.7 : 1}
                                            disabled={item.type === 'empty'}
                                            onPress={() => item.type === 'day' && handleDayPress(item.day)}
                                            style={[
                                                styles.circle,
                                                item.type === 'empty' && styles.circleEmpty,
                                                (item as any).status === 'past' && styles.circlePast,
                                                (item as any).status === 'today' && styles.circleToday,
                                                (item as any).status === 'future' && styles.circleFuture
                                            ]}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 60,
        justifyContent: 'space-between',
    },
    header: {
        marginTop: 40,
        paddingHorizontal: 24,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        flexDirection: 'column',
    },
    bigDate: {
        fontSize: 120,
        lineHeight: 120,
        fontFamily: 'Geist-Bold',
        marginBottom: -10,
        color: Colors.calendar.dark,
    },
    monthRow: {
        marginTop: 26,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthText: {
        fontSize: 32,
        fontFamily: 'Geist-Bold',
        color: DARK,
    },
    dayText: {
        fontSize: 32,
        fontFamily: 'Geist-Bold',
        color: ORANGE,
    },
    yearText: {
        fontSize: 32,
        fontFamily: 'Geist-Light',
        color: DARK,
        marginTop: 10,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 40,
        marginHorizontal: -4,
    },
    gridCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 1,
    },
    circle: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
    circleEmpty: {
        borderWidth: 1,
        borderColor: BEIGE,
    },
    circlePast: {
        backgroundColor: DARK,
    },
    circleToday: {
        backgroundColor: ORANGE,
    },
    circleFuture: {
        backgroundColor: BEIGE,
    },
});
