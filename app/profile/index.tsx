import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportActivitiesWorkbook, getExportOptions } from '../../services/export';

type ExportPickerMode = 'root' | 'year' | 'month';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pickerMode, setPickerMode] = useState<ExportPickerMode>('root');
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const loadExportOptions = async () => {
        setIsLoadingOptions(true);

        try {
            const options = await getExportOptions();
            setAvailableMonths(options.months);
            setAvailableYears(options.years);
        } catch {
            Alert.alert('Export failed', 'Could not load available activity data.');
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const handleOpenExportModal = async () => {
        setPickerMode('root');
        setIsModalVisible(true);
        await loadExportOptions();
    };

    const handleCloseModal = () => {
        if (isExporting) return;

        setIsModalVisible(false);
        setPickerMode('root');
    };

    const handleExport = async (type: 'year' | 'month', value: string) => {
        setIsExporting(true);

        try {
            await exportActivitiesWorkbook({ type, value });
            setIsModalVisible(false);
            setPickerMode('root');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not export your data.';
            Alert.alert('Export failed', message);
        } finally {
            setIsExporting(false);
        }
    };

    const selectionItems = pickerMode === 'year' ? availableYears : availableMonths;

	return (
	        <ThemedView style={[styles.container, { paddingBottom: Math.max(40, insets.bottom) }]}>
            <HeaderButtons buttonsStyle="light" style={{margin: 0, padding: 0}}/>

            <View style={styles.content}>
                <ThemedText type="h1" style={styles.title}>
                    Profile
                </ThemedText>
        
                <ThemedView
                    style={styles.divider}
                    lightColor={Colors.landing.dividerLight}
                    darkColor={Colors.landing.dividerDark}
                />

                <ThemedView style={styles.subtitleContainer}>
                    <ThemedText type="p" style={styles.subtitle}>
                        You can export your data for further use in sheet format.
                    </ThemedText>
                </ThemedView>

                <AppButton text={isExporting ? 'Exporting...' : 'Export my data'} onPress={handleOpenExportModal} />
            </View>

            <Modal animationType="fade" transparent visible={isModalVisible} onRequestClose={handleCloseModal}>
                <Pressable style={styles.modalBackdrop} onPress={handleCloseModal}>
                    <Pressable style={styles.modalCard} onPress={event => event.stopPropagation()}>
                        <ThemedText type="h4" style={styles.modalTitle}>
                            Export activity data
                        </ThemedText>

                        {isLoadingOptions ? (
                            <View style={styles.loadingState}>
                                <ActivityIndicator color={Colors.text.light} />
                                <ThemedText type="p" style={styles.modalText}>
                                    Loading available data...
                                </ThemedText>
                            </View>
                        ) : availableMonths.length === 0 ? (
                            <View style={styles.loadingState}>
                                <ThemedText type="p" style={styles.modalText}>
                                    No saved activity data is available yet.
                                </ThemedText>
                            </View>
                        ) : pickerMode === 'root' ? (
                            <View style={styles.optionGroup}>
                                <TouchableOpacity style={styles.modalOption} onPress={() => setPickerMode('year')} activeOpacity={0.8}>
                                    <ThemedText type="p" style={styles.modalOptionText}>
                                        Select a year
                                    </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalOption} onPress={() => setPickerMode('month')} activeOpacity={0.8}>
                                    <ThemedText type="p" style={styles.modalOptionText}>
                                        Select a month
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.backOption} onPress={() => setPickerMode('root')} activeOpacity={0.8}>
                                    <ThemedText type="p" style={styles.backOptionText}>
                                        Back
                                    </ThemedText>
                                </TouchableOpacity>
                                <ScrollView style={styles.selectionList} contentContainerStyle={styles.selectionListContent}>
                                    {selectionItems.map(item => (
                                        <TouchableOpacity
                                            key={item}
                                            style={styles.selectionOption}
                                            onPress={() => handleExport(pickerMode, item)}
                                            activeOpacity={0.8}
                                            disabled={isExporting}
                                        >
                                            <ThemedText type="p" style={styles.selectionOptionText}>
                                                {item}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <TouchableOpacity style={styles.cancelOption} onPress={handleCloseModal} activeOpacity={0.8} disabled={isExporting}>
                            <ThemedText type="p" style={styles.cancelOptionText}>
                                Cancel
                            </ThemedText>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
        flex: 1,
        padding: 24,
        justifyContent: 'flex-end',
    },
    content: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 12,
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: Colors.background.dark,
        borderRadius: 20,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: Colors.background.darkGrey,
    },
    modalTitle: {
        textAlign: 'center',
    },
    modalText: {
        textAlign: 'center',
        opacity: 0.85,
    },
    loadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 24,
    },
    optionGroup: {
        gap: 12,
    },
    modalOption: {
        backgroundColor: Colors.background.darkGrey,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    modalOptionText: {
        textAlign: 'center',
        color: Colors.text.light,
        fontFamily: 'Geist-Bold',
    },
    backOption: {
        alignSelf: 'flex-start',
    },
    backOptionText: {
        opacity: 0.8,
    },
    selectionList: {
        maxHeight: 260,
    },
    selectionListContent: {
        gap: 10,
    },
    selectionOption: {
        backgroundColor: Colors.background.darkGrey,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    selectionOptionText: {
        textAlign: 'center',
        color: Colors.text.light,
        fontFamily: 'Geist-Bold',
    },
    cancelOption: {
        paddingTop: 4,
    },
    cancelOptionText: {
        textAlign: 'center',
        opacity: 0.8,
    },
});
