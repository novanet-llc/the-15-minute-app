import { Colors } from '@/constants/colors';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DARK = Colors.calendar.dark;
const BEIGE = Colors.calendar.beige;
const BG_DARK = Colors.background.dark;
const BG_DARK_GREY = Colors.background.darkGrey;

interface HeaderButtonsProps {
    style?: ViewStyle;
    buttonsStyle?: 'dark' | 'light';
    onBlobPress?: () => void;
    onGridPress?: () => void;
}

export function HeaderButtons({ style, buttonsStyle = 'dark', onBlobPress, onGridPress }: HeaderButtonsProps) {
    const insets = useSafeAreaInsets();

    let backgroundColor = BG_DARK;
    if (buttonsStyle === 'light') {
        backgroundColor = BG_DARK_GREY;
    }

    return (
        <View style={[styles.header, { paddingTop: insets.top + 10 }, style]}>
            <View style={styles.headerButtons}>
                <TouchableOpacity style={[styles.iconButton, styles.blobIconButton, { backgroundColor }]} onPress={onBlobPress}>
                    <View style={styles.blobIcon}>
                        <View style={styles.blobInner} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconButton, { backgroundColor }]} onPress={onGridPress}>
                    <View style={styles.gridIcon}>
                        <View style={styles.dotRow}>
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                        </View>
                        <View style={styles.dotRow}>
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        width: 37,
        height: 37,
        backgroundColor: DARK,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    blobIconButton: {
        borderRadius: 50,
    },
    blobIcon: {
        width: 19,
        height: 19,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BEIGE,
        borderRadius: 40,
        marginLeft: -2,
        marginBottom: -2,
    },
    blobInner: {
        width: 10,
        height: 10,
        backgroundColor: BEIGE,
        borderRadius: 9,
        position: 'absolute',
        top: -2,
        right: -2,
    },
    gridIcon: {
        gap: 1,
    },
    dotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 1,
    },
    dot: {
        width: 11,
        height: 11,
        backgroundColor: BEIGE,
        borderRadius: 10,
    },
});
