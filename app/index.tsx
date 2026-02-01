import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppButton } from '@/components/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { useFocusEffect } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { useCallback } from "react";

export default function LandingScreen() {
    const router = useRouter();

    const onStart = () => {
        router.push('/calendar');
    };

    useFocusEffect(
        useCallback(() => {
            // Bottom navigation bar (Android)
            NavigationBar.setBackgroundColorAsync(Colors.background.dark);
            NavigationBar.setButtonStyleAsync("dark");
        }, [])
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: Colors.background.dark }]}>
            <ThemedView style={styles.contentContainer}>
                <ThemedText type="h1" style={styles.title}>
                    The 15 Minute App
                </ThemedText>

                <ThemedView
                    style={styles.divider}
                    lightColor={Colors.landing.dividerLight}
                    darkColor={Colors.landing.dividerDark}
                />

                <ThemedView style={styles.subtitleContainer}>
                    <ThemedText type="p" style={styles.subtitle}>
                        The perfect time tracker if you are aim to join to the productivity tribe.
                        Check your spent effort anytime and so you can eliminate the unnecessary timetraps.
                    </ThemedText>
                </ThemedView>

                <AppButton text="Start" onPress={onStart} />
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'flex-end', // Content aligns to the bottom
        paddingBottom: 60,
    },
    contentContainer: {
        width: '100%',
        gap: 10,
    },
    title: {
        textAlign: 'left',
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 12,
    },
    subtitleContainer: {
        width: '100%',
        alignItems: 'flex-end', // Aligns the text block to the right
    },
    subtitle: {
        textAlign: 'left', // Aligns the text within the block to the right
        maxWidth: '70%', // Limit width to create the block effect
        opacity: 0.9,
        fontSize: 16,
    },
});
