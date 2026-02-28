import { useRouter } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { AppButton } from '@/components/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';

import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';

export default function LandingScreen() {
    const router = useRouter();

    useEffect(() => {
        if (Platform.OS === 'android') {
            void NavigationBar.setButtonStyleAsync('dark');
        }
    }, []);

    const onStart = () => {
        router.push('/calendar');
    };

    return (
        <ThemedView style={styles.container}>
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
        alignItems: 'flex-end',
    },
    subtitle: {
        textAlign: 'left',
        maxWidth: '80%',
        opacity: 0.9,
        fontSize: 16,
    },
});
