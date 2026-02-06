import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface ActivityCardProps {
    color: string;
    text: string;
    onPress: () => void;
}

export function ActivityCard({ color, text, onPress }: ActivityCardProps) {
    const textColor = color === '#FFFFFF' ? '#1C1C1E' : '#1C1C1E';

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <ThemedText type="p" style={[styles.text, { color: textColor }]}>
                // {'\n'}{text}
            </ThemedText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
    },
    text: {
        fontSize: 22,
        textAlign: 'left',
    },
});
