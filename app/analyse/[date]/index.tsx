import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { analyzeDay } from '@/services/api';
import { getActivitiesForDate } from '@/services/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnalyseScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (date) {
            performAnalysis();
        }
    }, [date]);

    const performAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const activities = await getActivitiesForDate(date as string);
            const result = await analyzeDay(activities);
            setAnalysis(result);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during analysis.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <ThemedView style={styles.container}>
            <HeaderButtons buttonsStyle="light" />

            <View style={styles.content}>
                <ThemedText type="h1" style={styles.title}>
                    Daily Analysis
                </ThemedText>
                <ThemedText type="p" style={styles.subtitle}>
                    {date}
                </ThemedText>

                <View style={styles.resultsContainer}>
                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color={Colors.calendar.orange} />
                            <ThemedText style={styles.loadingText}>
                                Synthesizing operator-level insights...
                            </ThemedText>
                        </View>
                    ) : error ? (
                        <View style={styles.centerContent}>
                            <ThemedText style={styles.errorText}>{error}</ThemedText>
                            <AppButton
                                text="Try Again"
                                onPress={performAnalysis}
                                style={{ marginTop: 20 }}
                            />
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.scroll}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <Markdown style={markdownStyles}>
                                {analysis}
                            </Markdown>
                        </ScrollView>
                    )}
                </View>
            </View>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <AppButton text="Back to Day" onPress={handleBack} />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    title: {
        fontSize: 32,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        opacity: 0.6,
        marginBottom: 24,
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 20,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.8,
        fontStyle: 'italic',
    },
    errorText: {
        color: '#FF453A',
        textAlign: 'center',
        fontSize: 16,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    analysisText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#FFFFFF',
    },
    footer: {
        paddingHorizontal: 24,
    },
});

const markdownStyles = StyleSheet.create({
    body: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'GeistMono-Light',
    },
    heading1: {
        color: '#FFFFFF',
        fontSize: 24,
        fontFamily: 'GeistMono-Bold',
        marginTop: 20,
        marginBottom: 10,
    },
    heading2: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'GeistMono-Bold',
        marginTop: 15,
        marginBottom: 8,
    },
    strong: {
        fontFamily: 'GeistMono-Bold',
    },
    em: {
        fontStyle: 'italic',
    },
    list_item: {
        color: '#FFFFFF',
        marginVertical: 4,
    },
    bullet_list: {
        marginVertical: 10,
    },
});
