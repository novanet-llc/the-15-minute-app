import { AppButton } from '@/components/app-button';
import { AppPicker } from '@/components/app-picker';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import {
    MONTH_SEED_PRESETS,
    clearAllActivities,
    getPreviousMonthId,
    seedMonthActivities,
    type SeedPreset,
} from '@/services/storage';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportActivitiesWorkbook, getExportOptions } from '../../services/export';

const MONTH_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
];

function getSeedMonthLabel(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const monthLabel = MONTH_OPTIONS.find(option => option.value === month)?.label ?? month;
    return `${monthLabel} ${year}`;
}

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isSeedModalVisible, setIsSeedModalVisible] = useState(false);
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isRemovingAllData, setIsRemovingAllData] = useState(false);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedSeedPreset, setSelectedSeedPreset] = useState<SeedPreset>('balanced');
    const seedMonth = getPreviousMonthId();
    const seedMonthLabel = getSeedMonthLabel(seedMonth);

    const loadExportOptions = async () => {
        setIsLoadingOptions(true);

        try {
            const options = await getExportOptions();
            setAvailableYears(options.years);

            if (options.years.length > 0) {
                setSelectedYear(current => current || options.years[options.years.length - 1]);
            }
        } catch {
            Alert.alert('Export failed', 'Could not load available activity data.');
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const handleOpenExportModal = async () => {
        setSelectedMonth('all');
        setIsModalVisible(true);
        await loadExportOptions();
    };

    const handleCloseModal = () => {
        if (isExporting) return;

        setIsModalVisible(false);
        setSelectedMonth('all');
    };

    const handleOpenSeedModal = () => {
        setIsSeedModalVisible(true);
    };

    const handleCloseSeedModal = () => {
        if (isSeeding) return;

        setIsSeedModalVisible(false);
    };

    const handleExport = async () => {
        if (!selectedYear) {
            Alert.alert('Export failed', 'Select a year first.');
            return;
        }

        setIsExporting(true);

        try {
            const result =
                selectedMonth === 'all'
                    ? await exportActivitiesWorkbook({ type: 'year', value: selectedYear })
                    : await exportActivitiesWorkbook({ type: 'month', value: `${selectedYear}-${selectedMonth}` });

            if (result.type === 'saved') {
                if (result.reason === 'android-folder-export') {
                    Alert.alert('Export complete', `Saved ${result.fileName} to the folder you selected.`);
                } else {
                    Alert.alert(
                        'Export saved locally',
                        `Created ${result.fileName} in the app's local storage.`
                    );
                }
            }

            setIsModalVisible(false);
            setSelectedMonth('all');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not export your data.';
            Alert.alert('Export failed', message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleSeedMonth = async () => {
        setIsSeeding(true);

        try {
            await seedMonthActivities({
                yearMonth: seedMonth,
                preset: selectedSeedPreset,
            });

            setIsSeedModalVisible(false);
            Alert.alert('Seed complete', `Created ${selectedSeedPreset} test data for ${seedMonthLabel}.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not seed local activity data.';
            Alert.alert('Seeding failed', message);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleRemoveAllData = () => {
        Alert.alert('Remove all data', 'This will delete every saved activity month on this device.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove all data',
                style: 'destructive',
                onPress: async () => {
                    setIsRemovingAllData(true);

                    try {
                        await clearAllActivities();
                        setIsSeedModalVisible(false);
                        setIsModalVisible(false);
                        Alert.alert('All data removed', 'Deleted all locally stored activity data.');
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Could not remove local activity data.';
                        Alert.alert('Remove failed', message);
                    } finally {
                        setIsRemovingAllData(false);
                    }
                },
            },
        ]);
    };

    const yearOptions = availableYears.map(year => ({ label: year, value: year }));

	return (
        <ThemedView style={styles.container}>
            <HeaderButtons buttonsStyle="light"/>

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
                    <ThemedText type="p" style={styles.textRight}>
                        You can export your data in sheet format for further use.
                    </ThemedText>
                </ThemedView>

                <AppButton text={isExporting ? 'Exporting...' : 'Export my data'} onPress={handleOpenExportModal} />
                {__DEV__ ? (
                    <View style={styles.devButtonRow}>
                        <AppButton
                            text={isSeeding ? 'Seeding...' : 'Seed test month'}
                            onPress={handleOpenSeedModal}
                            style={[styles.secondaryButton, styles.devActionButton]}
                            disabled={isRemovingAllData}
                        />
                        <AppButton
                            text={isRemovingAllData ? 'Removing...' : 'Remove all data'}
                            onPress={handleRemoveAllData}
                            style={[styles.secondaryButton, styles.devActionButton, styles.destructiveButton]}
                            disabled={isSeeding || isRemovingAllData}
                        />
                    </View>
                ) : null}
            </View>

            <Modal animationType="fade" transparent visible={isModalVisible} onRequestClose={handleCloseModal}>
                <View style={styles.modalBackdrop}>
                    <Pressable style={styles.backdropDismissArea} onPress={handleCloseModal} />
                    <View style={styles.modalCard}>
                        <ThemedText type="h3" style={styles.modalTitle}>
                            Export activity data
                        </ThemedText>

                        <ThemedView
                            style={styles.divider}
                            lightColor={Colors.landing.dividerLight}
                            darkColor={Colors.landing.dividerDark}
                        />

                        {isLoadingOptions ? (
                            <View style={styles.loadingState}>
                                <ActivityIndicator color={Colors.text.light} />
                                <ThemedText type="p" style={styles.textRight}>
                                    Loading available data...
                                </ThemedText>
                            </View>
                        ) : availableYears.length === 0 ? (
                            <View style={styles.loadingState}>
                                <ThemedText type="p" style={styles.textRight}>
                                    No saved activity data is available yet.
                                </ThemedText>
                            </View>
                        ) : (
                            <View style={styles.controlsColumn}>
                                <View style={styles.dropdownRow}>
                                    <AppPicker
                                        options={yearOptions}
                                        selectedValue={selectedYear}
                                        onValueChange={setSelectedYear}
                                        style={styles.dropdown}
                                        enabled={!isExporting}
                                    />
                                    <AppPicker
                                        options={MONTH_OPTIONS}
                                        selectedValue={selectedMonth}
                                        onValueChange={setSelectedMonth}
                                        style={styles.dropdown}
                                        enabled={!isExporting}
                                    />
                                </View>

                                <View style={styles.actionRow}>
                                    <AppButton text="Cancel" onPress={handleCloseModal} style={styles.modalButton} disabled={isExporting} />
                                    <AppButton text={isExporting ? 'Exporting...' : 'Export'} onPress={handleExport} style={[styles.modalButton, styles.exportButton]} disabled={isExporting || !selectedYear} />
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal animationType="fade" transparent visible={isSeedModalVisible} onRequestClose={handleCloseSeedModal}>
                <Pressable style={styles.modalBackdrop} onPress={handleCloseSeedModal}>
                    <Pressable style={styles.modalCard} onPress={event => event.stopPropagation()}>
                        <ThemedText type="h3" style={styles.modalTitle}>
                            Seed local test data
                        </ThemedText>

                        <ThemedView
                            style={styles.divider}
                            lightColor={Colors.landing.dividerLight}
                            darkColor={Colors.landing.dividerDark}
                        />

                        <View style={styles.controlsColumn}>
                            <ThemedView style={styles.subtitleContainer}>
                                <ThemedText type="p" style={styles.textRight}>
                                    Target month: {seedMonthLabel}
                                </ThemedText>
                            </ThemedView>

                            <View style={styles.dropdownRowSingle}>
                                <AppPicker
                                    options={MONTH_SEED_PRESETS}
                                    selectedValue={selectedSeedPreset}
                                    onValueChange={value => setSelectedSeedPreset(value as SeedPreset)}
                                    style={styles.dropdown}
                                    enabled={!isSeeding}
                                />
                            </View>

                            <ThemedView style={styles.subtitleContainer}>
                                <ThemedText type="p" style={styles.textRight}>
                                    This rewrites the previous real-life month inside Expo Go so calendar and export performance can be tested with deterministic data.
                                </ThemedText>
                            </ThemedView>

                            <View style={styles.actionRow}>
                                <AppButton text="Cancel" onPress={handleCloseSeedModal} style={styles.modalButton} disabled={isSeeding} />
                                <AppButton text={isSeeding ? 'Seeding...' : 'Seed month'} onPress={handleSeedMonth} style={[styles.modalButton, styles.exportButton]} disabled={isSeeding} />
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
        flex: 1,
        justifyContent: 'flex-end',
        gap: 20,
        paddingBottom: 60,
    },
    content: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
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
    backdropDismissArea: {
        ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
        backgroundColor: Colors.background.dark,
        borderRadius: 20,
        padding: 20,
        gap: 12,
        minHeight: 190,
        zIndex: 1,
    },
    modalTitle: {
        fontWeight: 'normal',
    },
    loadingState: {
        gap: 12,
        width: '100%',
        alignItems: 'flex-end',
        justifyContent: 'center',
        flex: 1,
    },
    textRight: {
        textAlign: 'right',
    },
    secondaryButton: {
        marginTop: 0,
    },
    devButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        flexWrap: 'wrap',
    },
    devActionButton: {
        marginTop: 0,
    },
    destructiveButton: {
        backgroundColor: '#D9534F',
    },
    controlsColumn: {
        gap: 22,
        paddingTop: 2,
    },
    dropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
        zIndex: 10,
    },
    dropdownRowSingle: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        zIndex: 10,
    },
    dropdown: {
        flex: 1,
        maxWidth: 220,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
    },
    modalButton: {
        marginTop: 0,
        paddingVertical: 10,
        paddingHorizontal: 22,
    },
    exportButton: {
        backgroundColor: Colors.background.light,
    },
});
