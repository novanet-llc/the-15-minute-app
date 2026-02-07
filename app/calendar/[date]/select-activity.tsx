import { ActivityCard } from '@/components/activity-card';
import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { saveActivitiesBatch, saveActivity } from '@/services/storage';
import { ACTIVITY_CATEGORIES, ACTIVITY_SUBCATEGORIES, type ActivityCategory } from '@/types/activity';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SelectActivityScreen() {
    const { date, timeSlot, timeSlots } = useLocalSearchParams<{ date: string; timeSlot?: string; timeSlots?: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);

    const handleCategorySelect = (category: ActivityCategory) => {
        setSelectedCategory(category);
    };

    const handleAddActivity = async (subcategory: string) => {
        if (!selectedCategory || !date) {
            return;
        }

        const activityData = ACTIVITY_CATEGORIES[selectedCategory];
        const activity = {
            category: selectedCategory,
            subcategory,
            color: activityData.color,
            text: subcategory
        };

        if (timeSlots) {
            const slots = timeSlots.split(',');
            await saveActivitiesBatch(date as string, slots, activity);
        } else if (timeSlot) {
            await saveActivity(date as string, timeSlot as string, activity);
        }

        router.back();
    };

    const handleBack = () => {
        if (selectedCategory) {
            setSelectedCategory(null);
        } else {
            router.back();
        }
    };

    return (
        <ThemedView style={styles.container}>
            <HeaderButtons buttonsStyle="light" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {!selectedCategory ? (
                    <View style={styles.gridContainer}>
                        <View style={styles.gridRow}>
                            <ActivityCard
                                color={ACTIVITY_CATEGORIES.NOT_PRODUCTIVE.color}
                                text={ACTIVITY_CATEGORIES.NOT_PRODUCTIVE.text}
                                onPress={() => handleCategorySelect('NOT_PRODUCTIVE')}
                            />
                            <View style={styles.gap} />
                            <ActivityCard
                                color={ACTIVITY_CATEGORIES.WORK.color}
                                text={ACTIVITY_CATEGORIES.WORK.text}
                                onPress={() => handleCategorySelect('WORK')}
                            />
                        </View>

                        <View style={styles.gridRowGap} />

                        <View style={styles.gridRow}>
                            <ActivityCard
                                color={ACTIVITY_CATEGORIES.BUSINESS_RELATED.color}
                                text={ACTIVITY_CATEGORIES.BUSINESS_RELATED.text}
                                onPress={() => handleCategorySelect('BUSINESS_RELATED')}
                            />
                            <View style={styles.gap} />
                            <ActivityCard
                                color={ACTIVITY_CATEGORIES.UPKEEP.color}
                                text={ACTIVITY_CATEGORIES.UPKEEP.text}
                                onPress={() => handleCategorySelect('UPKEEP')}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.subcategoryContainer}>
                        {(ACTIVITY_SUBCATEGORIES[selectedCategory] as string[]).map((sub: string, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.subcategoryButton,
                                    { backgroundColor: ACTIVITY_CATEGORIES[selectedCategory].color }
                                ]}
                                onPress={() => handleAddActivity(sub)}
                                activeOpacity={0.8}
                            >
                                <ThemedText style={styles.subcategoryText}>
                                    // {sub}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footerContainer}>
                <ThemedView
                    style={styles.divider}
                    lightColor={Colors.landing.dividerLight}
                    darkColor={Colors.landing.dividerDark}
                />

                <ThemedView style={styles.subtitleContainer}>
                    <ThemedText type="p" style={styles.subtitle}>
                        These are the most common things you do in a day. Keep attention to their ratio. You maybe want to add others, but why?
                    </ThemedText>
                </ThemedView>
            </View>

            <AppButton text="Back" onPress={handleBack} style={{ marginHorizontal: 24 }} />
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
        gap: 10,
        flexDirection: 'column',
    },
    footerContainer: {
        paddingHorizontal: 24,
        gap: 10,
        flexDirection: 'column',
    },
    subcategoryContainer: {
        width: '100%',
        gap: 8,
    },
    subcategoryButton: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    subcategoryText: {
        fontSize: 18,
        color: '#1C1C1E',
    },
    gridContainer: {
        width: '100%',
        flexDirection: 'column',
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridRowGap: {
        height: 10,
    },
    gap: {
        width: 10,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 12,
    },
    subtitleContainer: {
        width: '100%',
        alignItems: 'flex-end',
    },
    subtitle: {
        textAlign: 'left',
        maxWidth: '80%',
        opacity: 0.9,
        fontSize: 16,
    },
});
