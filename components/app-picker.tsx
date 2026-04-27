import { Colors } from '@/constants/colors';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type PickerOption = {
    label: string;
    value: string;
};

interface AppPickerProps {
    options: PickerOption[];
    selectedValue: string;
    onValueChange: (value: string) => void;
    style?: StyleProp<ViewStyle>;
    enabled?: boolean;
}

export function AppPicker({ options, selectedValue, onValueChange, style, enabled = true }: AppPickerProps) {
    return (
        <View style={[styles.container, !enabled && styles.containerDisabled, style]}>
            <Picker
                selectedValue={selectedValue}
                onValueChange={itemValue => onValueChange(String(itemValue))}
                enabled={enabled}
                mode="dropdown"
                dropdownIconColor={Colors.text.dark}
                style={styles.picker}
                itemStyle={styles.pickerItem}
            >
                {options.map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
            </Picker>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: Colors.background.light,
        minHeight: Platform.OS === 'ios' ? 44 : 50,
        justifyContent: 'center',
    },
    containerDisabled: {
        opacity: 0.6,
    },
    picker: {
        color: Colors.text.dark,
        marginVertical: Platform.OS === 'ios' ? -6 : 0,
    },
    pickerItem: {
        color: Colors.text.dark,
        fontSize: 14,
    },
});