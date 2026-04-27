import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

type DropdownOption = {
    label: string;
    value: string;
};

interface AppDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
}

export function AppDropdown({ options, value, onChange, style, disabled = false }: AppDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = useMemo(
        () => options.find(option => option.value === value) ?? options[0],
        [options, value]
    );

    const handleSelect = (nextValue: string) => {
        onChange(nextValue);
        setIsOpen(false);
    };

    return (
        <View style={[styles.container, style, isOpen && styles.containerOpen]}>
            <Pressable
                style={[styles.trigger, disabled && styles.triggerDisabled]}
                onPress={() => {
                    if (!disabled) {
                        setIsOpen(current => !current);
                    }
                }}
            >
                <ThemedText type="p" style={styles.triggerText}>
                    {selectedOption?.label ?? ''}
                </ThemedText>
                <ThemedText type="p" style={styles.chevron}>
                    ▼
                </ThemedText>
            </Pressable>

            {isOpen ? (
                <View style={styles.menu}>
                    <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator
                        persistentScrollbar
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                        directionalLockEnabled
                        style={styles.menuScroll}
                        contentContainerStyle={styles.menuContent}
                    >
                        {options.map(option => (
                            <Pressable
                                key={option.value}
                                style={[styles.option, option.value === value && styles.optionSelected]}
                                onPress={() => handleSelect(option.value)}
                            >
                                <ThemedText type="p" style={styles.optionText}>
                                    {option.label}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 5,
    },
    containerOpen: {
        zIndex: 50,
    },
    trigger: {
        minWidth: 124,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: Colors.background.light,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    triggerDisabled: {
        opacity: 0.6,
    },
    triggerText: {
        color: Colors.text.dark,
        lineHeight: 18,
    },
    chevron: {
        color: Colors.text.dark,
        lineHeight: 18,
        fontSize: 11,
    },
    menu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 8,
        borderRadius: 16,
        backgroundColor: Colors.background.light,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    menuScroll: {
        height: 220,
    },
    menuContent: {
        paddingVertical: 6,
        minHeight: '100%',
    },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    optionSelected: {
        backgroundColor: '#F4E8D3',
    },
    optionText: {
        color: Colors.text.dark,
        lineHeight: 18,
    },
});