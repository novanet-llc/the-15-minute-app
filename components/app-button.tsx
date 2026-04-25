import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import React from 'react';
import { StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';

interface AppButtonProps {
    text: string;
    onPress: () => void;
    style?: ViewStyle;
}

export function AppButton({ text, onPress, style }: AppButtonProps) {
    const buttonColor = Colors.landing.buttonBackground;
    const buttonTextColor = Colors.landing.buttonText;

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <ThemedText type="p" style={[styles.buttonText, { color: buttonTextColor }]}>
                {text}
            </ThemedText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        alignSelf: 'flex-end',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 24,
        marginTop: 24,
    },
    buttonText: {
        fontSize: 14,
    },
});
