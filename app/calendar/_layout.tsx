import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function CalendarLayout() {

    return (
        <ThemeProvider value={DefaultTheme}>
            <SafeAreaProvider>
                <Stack screenOptions={{ headerShown: false }} >
                    <Stack.Screen name="index" />
                </Stack>
                <StatusBar style="dark" />
            </SafeAreaProvider>
        </ThemeProvider>
    );
}
