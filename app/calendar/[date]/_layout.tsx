import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function CalendarLayout() {

    NavigationBar.setStyle("dark");

    return (
        <ThemeProvider value={DarkTheme}>
            <SafeAreaProvider>
                <Stack screenOptions={{ headerShown: false }} >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="select-activity" />
                </Stack>
                <StatusBar style="light" />
            </SafeAreaProvider>
        </ThemeProvider>
    );
}
