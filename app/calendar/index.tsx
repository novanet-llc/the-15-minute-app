import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ORANGE = Colors.calendar.orange;
const BEIGE = Colors.calendar.beige;
const DARK = Colors.calendar.dark;
const LIGHT = Colors.calendar.light;

function normalizeMonthParam(param: string | string[] | undefined): string {
    const raw = Array.isArray(param) ? param[0] : param;
    if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;

    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getMonthOffset(baseDate: Date, monthId: string): number {
    const [year, month] = monthId.split('-').map(Number);
    if (!year || !month) return 0;

    return (year - baseDate.getFullYear()) * 12 + (month - 1 - baseDate.getMonth());
}

function clampMonthOffset(offset: number, initialIndex: number, pageCount: number): number {
    return Math.max(-initialIndex, Math.min(pageCount - initialIndex - 1, offset));
}

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
            <View style={[styles.skeletonText, { width: 120, height: 24 }]} />
            <View style={[styles.skeletonText, { width: 60, height: 24 }]} />
        </View>
        <View style={[styles.skeletonText, { width: 100, height: 24, marginTop: 10 }]} />
        <View style={styles.gridContainer}>
            {Array.from({ length: 35 }).map((_, i) => (
                <View key={i} style={styles.gridCell}>
                    <View style={[styles.circle, { backgroundColor: '#9e9e9eff', opacity: 0.5 }]} />
                </View>
            ))}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.skeletonText, { width: 160, height: 46, marginTop: 20, borderRadius: 20}]} />
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
    const router = useRouter();

    const handleMonthlyStats = () => {
        const yearMonth = `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`;
        router.push(`/stats?month=${yearMonth}`);
    };

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
            <AppButton text="Monthly Stats" style={{ backgroundColor: '#ffffff' }} onPress={handleMonthlyStats} />
        </View>
    );
};

export default function CalendarScreen() {
    const { month } = useLocalSearchParams<{ month?: string }>();
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const { dark } = useTheme();
    const colorScheme = dark ? 'dark' : 'light';
    const theme = Colors[colorScheme];
    const flatListRef = useRef<FlatList>(null);

    const PAGE_COUNT = 120;
    const INITIAL_INDEX = 60;
    const requestedMonthId = useMemo(() => normalizeMonthParam(month), [month]);

    const [today, setToday] = useState(new Date());
    const [viewingMonthOffset, setViewingMonthOffset] = useState(() => {
        const now = new Date();
        return clampMonthOffset(getMonthOffset(now, requestedMonthId), INITIAL_INDEX, PAGE_COUNT);
    });
    const initialMonthIndex = INITIAL_INDEX + viewingMonthOffset;

    useFocusEffect(
        useCallback(() => {
            const now = new Date();
            const clampedOffset = clampMonthOffset(getMonthOffset(now, requestedMonthId), INITIAL_INDEX, PAGE_COUNT);
            setToday(now);
            setViewingMonthOffset(clampedOffset);
            flatListRef.current?.scrollToIndex({ index: INITIAL_INDEX + clampedOffset, animated: false });
        }, [requestedMonthId])
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

    const activeMonth = useMemo(() => {
        const monthDate = new Date(today.getFullYear(), today.getMonth() + viewingMonthOffset, 1);
        return `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`;
    }, [today, viewingMonthOffset]);

    const handleDayPress = (date: Date) => {
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        router.push(`/calendar/${dateStr}`);
    };

    return (
        <ThemedView style={styles.container}>
            <HeaderButtons buttonsStyle="light" activeMonth={activeMonth} />

            <View style={styles.content}>
                <FlatList
                    ref={flatListRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    data={Array.from({ length: PAGE_COUNT })}
                    keyExtractor={(_, i) => i.toString()}
                    initialScrollIndex={initialMonthIndex}
                    getItemLayout={(_, index) => ({
                        length: windowWidth,
                        offset: windowWidth * index,
                        index,
                    })}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    style={{ flex: 1, marginHorizontal: -24 }}
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
            
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 20,
        paddingBottom: 40
    },
    content: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingHorizontal: 24
    },
    bigDate: {
        fontSize: 120,
        lineHeight: 120,
        fontFamily: 'Geist-Bold',
        marginBottom: -10,
        color: LIGHT,
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
        color: LIGHT,
    },
    dayText: {
        fontSize: 32,
        fontFamily: 'Geist-Bold',
        color: ORANGE,
    },
    yearText: {
        fontSize: 32,
        fontFamily: 'Geist-Light',
        color: LIGHT,
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
        padding: 2,
    },
    circle: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    circleEmpty: {
        borderWidth: 1,
        borderColor: BEIGE,
    },
    circlePast: {
        backgroundColor: LIGHT,
    },
    circleToday: {
        backgroundColor: ORANGE,
    },
    circleFuture: {
        backgroundColor: BEIGE,
    },
    skeletonText: {
        backgroundColor: '#9e9e9eff',
        borderRadius: 8,
        opacity: 0.5,
    },
});
