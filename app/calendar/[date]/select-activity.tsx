import { ActivityCard } from '@/components/activity-card';
import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { saveActivity } from '@/services/storage';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/types/activity';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SelectActivityScreen() {
    const { date, timeSlot } = useLocalSearchParams<{ date: string; timeSlot: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);

    const handleAddActivity = async (category?: ActivityCategory) => {
        const categoryToUse = category || selectedCategory;
        if (!categoryToUse || !date || !timeSlot) {
            return;
        }

        const activityData = ACTIVITY_CATEGORIES[categoryToUse];
        await saveActivity(date as string, timeSlot as string, {
            category: categoryToUse,
            color: activityData.color,
            text: activityData.text
        });

        router.back();
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <ThemedView style={styles.container}>
            <HeaderButtons buttonsStyle="light" />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <ActivityCard
                            color={ACTIVITY_CATEGORIES.NOT_PRODUCTIVE.color}
                            text={ACTIVITY_CATEGORIES.NOT_PRODUCTIVE.text}
                            onPress={() => handleAddActivity('NOT_PRODUCTIVE')}
                        />
                        <View style={styles.gap} />
                        <ActivityCard
                            color={ACTIVITY_CATEGORIES.WORK.color}
                            text={ACTIVITY_CATEGORIES.WORK.text}
                            onPress={() => handleAddActivity('WORK')}
                        />
                    </View>

                    <View style={styles.gridRowGap} />

                    <View style={styles.gridRow}>
                        <ActivityCard
                            color={ACTIVITY_CATEGORIES.BUSINESS_RELATED.color}
                            text={ACTIVITY_CATEGORIES.BUSINESS_RELATED.text}
                            onPress={() => handleAddActivity('BUSINESS_RELATED')}
                        />
                        <View style={styles.gap} />
                        <ActivityCard
                            color={ACTIVITY_CATEGORIES.UPKEEP.color}
                            text={ACTIVITY_CATEGORIES.UPKEEP.text}
                            onPress={() => handleAddActivity('UPKEEP')}
                        />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <ThemedText type="p" style={styles.explanationText}>
                        These are the most common{'\n'}
                        things you do in a day.{'\n'}
                        Keep attention to their{'\n'}
                        ratio. You can add others,{'\n'}
                        but why?
                    </ThemedText>
                </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
                <AppButton text="Back" onPress={handleBack} style={styles.button} />
                <AppButton text="Add" onPress={handleAddActivity} style={styles.button} />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 60,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    gridContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    gridRow: {
        flexDirection: 'row',
        gap: 20,
    },
    gridRowGap: {
        height: 20,
    },
    gap: {
        width: 20,
    },
    textContainer: {
        marginTop: 60,
        paddingHorizontal: 24,
    },
    explanationText: {
        fontSize: 16,
        color: Colors.text.light,
        textAlign: 'center',
        fontFamily: 'GeistMono-Light',
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        gap: 16,
        marginTop: 20,
    },
    button: {
        flex: 1,
        marginTop: 0,
    },
});
