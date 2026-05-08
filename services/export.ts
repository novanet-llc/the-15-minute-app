import { getMonthlyActivitiesForMonth, listStoredActivityMonths } from '@/services/storage';
import type { MonthlyActivities } from '@/types/activity';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx-js-style';

export type ExportScope =
    | { type: 'month'; value: string }
    | { type: 'year'; value: string };

export type ExportResult =
    | { type: 'shared'; fileUri: string }
    | { type: 'saved'; fileUri: string; fileName: string; reason: 'android-folder-export' | 'android-local-fallback' };

const BORDER_COLOR = 'D0D0D0';
const HEADER_FILL = 'F2F2F2';

function getExportFileName(scope: ExportScope): string {
    return `activities-${scope.value}.xlsx`;
}

function getFileNameWithoutExtension(fileName: string): string {
    return fileName.replace(/\.xlsx$/i, '');
}

async function ensureExportDirectoryExists(directoryUri: string): Promise<void> {
    const directoryInfo = await FileSystem.getInfoAsync(directoryUri);

    if (!directoryInfo.exists) {
        await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    }
}

async function persistExportForAndroid(fileUri: string, fileName: string): Promise<ExportResult> {
    const exportDirectory = `${FileSystem.documentDirectory}exports/`;
    await ensureExportDirectoryExists(exportDirectory);

    const persistentUri = `${exportDirectory}${fileName}`;
    await FileSystem.copyAsync({ from: fileUri, to: persistentUri });

    return {
        type: 'saved',
        fileUri: persistentUri,
        fileName,
        reason: 'android-local-fallback',
    };
}

async function saveExportToAndroidDirectory(base64: string, fileName: string): Promise<ExportResult> {
    const initialDirectoryUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialDirectoryUri);

    if (!permissions.granted) {
        throw new Error('Export cancelled. No folder was selected.');
    }

    const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        getFileNameWithoutExtension(fileName),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await FileSystem.StorageAccessFramework.writeAsStringAsync(targetUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });

    return {
        type: 'saved',
        fileUri: targetUri,
        fileName,
        reason: 'android-folder-export',
    };
}

function getTimeSlots(): string[] {
    const slots: string[] = [];

    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 15) {
            slots.push(`${hour}:${min.toString().padStart(2, '0')}`);
        }
    }

    return slots;
}

function getMonthRangeForYear(year: string): string[] {
    return Array.from({ length: 12 }, (_, index) => `${year}-${(index + 1).toString().padStart(2, '0')}`);
}

function getDaysInMonth(yearMonth: string): number {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
}

function getDayKey(yearMonth: string, day: number): string {
    return `${yearMonth}-${day.toString().padStart(2, '0')}`;
}

function getCellTextColor(fillColor?: string): string {
    if (!fillColor) return '1C1C1E';

    const normalized = fillColor.replace('#', '').toUpperCase();
    if (normalized === 'FFFFFF') return '1C1C1E';

    return '1C1C1E';
}

function getBorderStyle() {
    return {
        top: { style: 'thin', color: { rgb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
        left: { style: 'thin', color: { rgb: BORDER_COLOR } },
        right: { style: 'thin', color: { rgb: BORDER_COLOR } },
    };
}

function buildMonthSheet(yearMonth: string, monthlyActivities: MonthlyActivities): XLSX.WorkSheet {
    const daysInMonth = getDaysInMonth(yearMonth);
    const timeSlots = getTimeSlots();
    const rows: string[][] = [
        ['TIME', ...Array.from({ length: daysInMonth }, (_, index) => (index + 1).toString().padStart(2, '0'))]
    ];

    timeSlots.forEach(timeSlot => {
        const row: string[] = [timeSlot];

        for (let day = 1; day <= daysInMonth; day++) {
            const activity = monthlyActivities[getDayKey(yearMonth, day)]?.[timeSlot];
            row.push(activity?.text ?? '');
        }

        rows.push(row);
    });

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 10 }, ...Array.from({ length: daysInMonth }, () => ({ wch: 18 }))];
    sheet['!rows'] = Array.from({ length: rows.length }, (_, index) => ({ hpt: index === 0 ? 24 : 20 }));

    for (let column = 0; column <= daysInMonth; column++) {
        const address = XLSX.utils.encode_cell({ r: 0, c: column });
        const cell = sheet[address];

        if (cell) {
            cell.s = {
                font: { bold: true, color: { rgb: '1C1C1E' } },
                fill: { patternType: 'solid', fgColor: { rgb: HEADER_FILL } },
                border: getBorderStyle(),
                alignment: { horizontal: 'center', vertical: 'center' },
            };
        }
    }

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const timeAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        const timeCell = sheet[timeAddress];

        if (timeCell) {
            timeCell.s = {
                font: { color: { rgb: '1C1C1E' } },
                fill: { patternType: 'solid', fgColor: { rgb: HEADER_FILL } },
                border: getBorderStyle(),
                alignment: { horizontal: 'center', vertical: 'center' },
            };
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const timeSlot = timeSlots[rowIndex - 1];
            const activity = monthlyActivities[getDayKey(yearMonth, day)]?.[timeSlot];
            const address = XLSX.utils.encode_cell({ r: rowIndex, c: day });
            const cell = sheet[address];

            if (cell) {
                const fillColor = activity?.color?.replace('#', '').toUpperCase();

                cell.s = {
                    font: { color: { rgb: getCellTextColor(fillColor) } },
                    fill: fillColor
                        ? { patternType: 'solid', fgColor: { rgb: fillColor } }
                        : undefined,
                    border: getBorderStyle(),
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                };
            }
        }
    }

    return sheet;
}

export async function getExportOptions() {
    const months = await listStoredActivityMonths();
    const years = Array.from(new Set(months.map(month => month.slice(0, 4)))).sort();

    return { months, years };
}

export async function exportActivitiesWorkbook(scope: ExportScope): Promise<ExportResult> {
    const workbook = XLSX.utils.book_new();
    const monthIds = scope.type === 'year' ? getMonthRangeForYear(scope.value) : [scope.value];

    for (const monthId of monthIds) {
        const monthlyActivities = await getMonthlyActivitiesForMonth(monthId);
        XLSX.utils.book_append_sheet(workbook, buildMonthSheet(monthId, monthlyActivities), monthId);
    }

    const base64 = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'base64',
    });

    const fileName = getExportFileName(scope);
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });

    if (Platform.OS === 'android') {
        try {
            return await saveExportToAndroidDirectory(base64, fileName);
        } catch (error) {
            if (error instanceof Error && error.message === 'Export cancelled. No folder was selected.') {
                throw error;
            }

            return persistExportForAndroid(fileUri, fileName);
        }
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
        throw new Error('Sharing is not available on this device.');
    }

    await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export activity data',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });

    return { type: 'shared', fileUri };
}