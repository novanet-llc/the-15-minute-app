import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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

    const dayOfWeek = firstDay.getDay();
    const padding = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon-start padding

    for (let i = 0; i < padding; i++) {
        items.push({ type: 'empty', day: null });
    }

    for (let day = 1; day <= lastDay; day++) {
        let status: DayStatus = 'future';
        const todayReset = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
        const iterReset = new Date(year, month, day);

        if (iterReset < todayReset) status = 'past';
        if (iterReset.getTime() === todayReset.getTime()) status = 'today';

        items.push({ type: 'day', day, status });
    }

    while (items.length % 7 !== 0) {
        items.push({ type: 'empty', day: null });
    }

    while (items.length < 35) {
        items.push({ type: 'empty', day: null });
    }

    return items;
};

const MonthSkeleton = ({ windowWidth }: { windowWidth: number }) => (
    <View style={{ width: windowWidth, paddingHorizontal: 24, opacity: 0.5 }}>
        <View style={[styles.skeletonText, { width: 150, height: 120, marginBottom: 20 }]} />
        <View style={styles.monthRow}>
            <View style={[styles.skeletonText, { width: 120, height: 32 }]} />
            <View style={[styles.skeletonText, { width: 60, height: 32 }]} />
        </View>
        <View style={[styles.skeletonText, { width: 100, height: 32, marginTop: 10 }]} />
        <View style={styles.gridContainer}>
            {Array.from({ length: 35 }).map((_, i) => (
                <View key={i} style={styles.gridCell}>
                    <View style={[styles.circle, { backgroundColor: BEIGE, opacity: 0.3 }]} />
                </View>
            ))}
        </View>
    </View>
);

const MonthPage = ({
    index,
    initialIndex,
    today,
    windowWidth,
    onDayPress
}: {
    index: number;
    initialIndex: number;
    today: Date;
    windowWidth: number;
    onDayPress: (date: Date) => void;
}) => {
    const [isLoading, setIsLoading] = React.useState(true);

    const monthDate = useMemo(() => {
        const offset = index - initialIndex;
        return new Date(today.getFullYear(), today.getMonth() + offset, 1);
    }, [index, initialIndex, today]);

    const gridItems = useMemo(() => {
        return getCalendarGrid(monthDate.getFullYear(), monthDate.getMonth(), today);
    }, [monthDate, today]);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, [index]);

    if (isLoading) return <MonthSkeleton windowWidth={windowWidth} />;

    const displayMonth = monthDate.toLocaleString('default', { month: 'long' }).toUpperCase();
    const displayYear = monthDate.getFullYear();
    const displayDayName = today.toLocaleString('default', { weekday: 'short' });

    return (
        <View style={{ width: windowWidth, paddingHorizontal: 24 }}>
            <ThemedText style={styles.bigDate}>{today.getDate()}</ThemedText>

            <View style={styles.monthRow}>
                <ThemedText style={styles.monthText}>{displayMonth}</ThemedText>
                <ThemedText style={styles.dayText}>{displayDayName}</ThemedText>
            </View>

            <ThemedText style={styles.yearText}>{displayYear}</ThemedText>

            <View style={styles.gridContainer}>
                {gridItems.map((item, idx) => (
                    <View key={idx} style={styles.gridCell}>
                        <TouchableOpacity
                            activeOpacity={item.type === 'day' ? 0.7 : 1}
                            disabled={item.type === 'empty'}
                            onPress={() => {
                                if (item.type === 'day') {
                                    const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), item.day);
                                    onDayPress(d);
                                }
                            }}
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
    );
};

export default function CalendarScreen() {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const { dark } = useTheme();
    const colorScheme = dark ? 'dark' : 'light';
    const theme = Colors[colorScheme];
    const flatListRef = useRef<FlatList>(null);

    const [today, setToday] = useState(new Date());
    const [viewingMonthOffset, setViewingMonthOffset] = useState(0);

    const PAGE_COUNT = 120;
    const INITIAL_INDEX = 60;

    useFocusEffect(
        useCallback(() => {
            const now = new Date();
            setToday(now);
            setViewingMonthOffset(0);
            flatListRef.current?.scrollToIndex({ index: INITIAL_INDEX, animated: false });
        }, [])
    );

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.x;
        const index = Math.round(offset / windowWidth);
        const newOffset = index - INITIAL_INDEX;
        if (newOffset !== viewingMonthOffset) {
            setViewingMonthOffset(newOffset);
        }
    }, [windowWidth, viewingMonthOffset]);

    const router = useRouter();

    const handleDayPress = (date: Date) => {
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        router.push(`/calendar/${dateStr}`);
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background.light }]}>
            <HeaderButtons />

            <View style={styles.content}>
                <FlatList
                    ref={flatListRef}
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
                    renderItem={({ index }) => (
                        <MonthPage
                            index={index}
                            initialIndex={INITIAL_INDEX}
                            today={today}
                            windowWidth={windowWidth}
                            onDayPress={handleDayPress}
                        />
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 30,
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
    skeletonText: {
        backgroundColor: BEIGE,
        borderRadius: 8,
        opacity: 0.3,
    },
});
