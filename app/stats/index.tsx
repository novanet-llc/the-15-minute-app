import { AppButton } from '@/components/app-button';
import { HeaderButtons } from '@/components/header-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { getMonthlyActivitiesForMonth } from '@/services/storage';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/types/activity';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CategoryStats = Record<ActivityCategory, number>;

const CATEGORY_ORDER: ActivityCategory[] = [
	'UPKEEP',
	'WORK',
	'NOT_PRODUCTIVE',
	'BUSINESS_RELATED'
];

const SKELETON_COLOR = '#9e9e9eff';
const BASE_PIE_SIZE = 240;
const PIE_PADDING = 6;
const PIE_GAP = 8;
const SLICE_INNER_CORNER_RADIUS = 10;

type SlicePosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
const SLICE_ENDPOINT_CORNER_RADIUS = 8;

function resolveCategory(activity: { category?: string; text?: string; color?: string }): ActivityCategory | null {
	const categoryKeys = Object.keys(ACTIVITY_CATEGORIES) as ActivityCategory[];
	if (activity.category && categoryKeys.includes(activity.category as ActivityCategory)) {
		return activity.category as ActivityCategory;
	}

	const byText = categoryKeys.find(key => ACTIVITY_CATEGORIES[key].text === activity.text);
	if (byText) return byText;

	const byColor = categoryKeys.find(key => ACTIVITY_CATEGORIES[key].color === activity.color);
	return byColor ?? null;
}

function getMonthLabel(yearMonth: string): string {
	const [year, month] = yearMonth.split('-').map(Number);
	if (!year || !month) return yearMonth;
	const date = new Date(year, month - 1, 1);
	return date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
}

function normalizeMonthParam(param: string | string[] | undefined): string {
	const raw = Array.isArray(param) ? param[0] : param;
	if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
	const now = new Date();
	return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getSliceSizeFromPercent(percent: number, sliceMaxSize: number) {
	if (percent <= 0) return 0;
	const clamped = Math.min(100, Math.max(0, percent));
	return Math.min(sliceMaxSize, sliceMaxSize * Math.sqrt(clamped / 100));
}

function getSliceLayout(position: SlicePosition, size: number, pieCenter: number) {
	const halfGap = PIE_GAP / 2;
	if (position === 'topLeft') {
		return { left: pieCenter - halfGap - size, top: pieCenter - halfGap - size };
	}
	if (position === 'topRight') {
		return { left: pieCenter + halfGap, top: pieCenter - halfGap - size };
	}
	if (position === 'bottomLeft') {
		return { left: pieCenter - halfGap - size, top: pieCenter + halfGap };
	}
	return { left: pieCenter + halfGap, top: pieCenter + halfGap };
}

function getInnerCornerStyle(position: SlicePosition, radius: number) {
	const r = Math.max(0, radius);
	if (position === 'topLeft') return { borderBottomRightRadius: r };
	if (position === 'topRight') return { borderBottomLeftRadius: r };
	if (position === 'bottomLeft') return { borderTopRightRadius: r };
	return { borderTopLeftRadius: r };
}

function getEndpointCornerStyle(position: SlicePosition, radius: number) {
	const r = Math.max(0, radius);
	// These corners correspond to the arc endpoints where the straight edges meet the curve.
	if (position === 'topLeft') return { borderTopRightRadius: r, borderBottomLeftRadius: r };
	if (position === 'topRight') return { borderTopLeftRadius: r, borderBottomRightRadius: r };
	if (position === 'bottomLeft') return { borderTopLeftRadius: r, borderBottomRightRadius: r };
	return { borderTopRightRadius: r, borderBottomLeftRadius: r };
}

function getCircleOffset(position: SlicePosition, size: number) {
	// Place the circle so its center sits on the inner corner (the one touching the chart center)
	// and let the container clip it into a quarter.
	if (position === 'topLeft') return { left: 0, top: 0 };
	if (position === 'topRight') return { left: -size, top: 0 };
	if (position === 'bottomLeft') return { left: 0, top: -size };
	return { left: -size, top: -size };
}

const StatsSkeleton = ({ size }: { size: number }) => (
	<View style={styles.skeletonContainer}>
		<View style={[styles.skeletonCircle, { width: size, height: size, borderRadius: size / 2 }]} />
		<View style={styles.skeletonLabels}>
			{Array.from({ length: 4 }).map((_, index) => (
				<View key={index} style={styles.skeletonLabelGroup}>
					<View style={styles.skeletonLine} />
					<View style={[styles.skeletonLine, { width: 120 }]} />
				</View>
			))}
		</View>
	</View>
);

export default function MonthlyStatsScreen() {
	const { month } = useLocalSearchParams<{ month?: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();

	// Target at least 2x the original chart size, but don't exceed available screen width.
	const pieSize = useMemo(() => {
		const desired = BASE_PIE_SIZE * 2;
		const maxFit = Math.max(220, windowWidth - 48);
		return Math.min(desired, maxFit);
	}, [windowWidth]);
	const pieInnerSize = pieSize - PIE_PADDING * 2;
	const pieCenter = pieInnerSize / 2;
	const sliceMaxSize = (pieInnerSize - PIE_GAP) / 2;

	const monthId = useMemo(() => normalizeMonthParam(month), [month]);
	const [isLoading, setIsLoading] = useState(true);
	const [categoryStats, setCategoryStats] = useState<CategoryStats>({
		UPKEEP: 0,
		WORK: 0,
		BUSINESS_RELATED: 0,
		NOT_PRODUCTIVE: 0
	});

	useEffect(() => {
		let isMounted = true;

		const loadStats = async () => {
			setIsLoading(true);
			const monthlyActivities = await getMonthlyActivitiesForMonth(monthId);
			const totals: CategoryStats = {
				UPKEEP: 0,
				WORK: 0,
				BUSINESS_RELATED: 0,
				NOT_PRODUCTIVE: 0
			};

			Object.values(monthlyActivities).forEach(dayActivities => {
				Object.values(dayActivities).forEach(activity => {
					const category = resolveCategory(activity);
					if (category) {
						totals[category] += 1;
					}
				});
			});

			if (isMounted) {
				setCategoryStats(totals);
				setIsLoading(false);
			}
		};

		loadStats();

		return () => {
			isMounted = false;
		};
	}, [monthId]);

	const totalSlots = Object.values(categoryStats).reduce((sum, value) => sum + value, 0);
	const categories = CATEGORY_ORDER.map(category => {
		const count = categoryStats[category];
		const percent = totalSlots > 0 ? Math.round((count / totalSlots) * 100) : 0;
		return {
			key: category,
			label: ACTIVITY_CATEGORIES[category].text,
			color: ACTIVITY_CATEGORIES[category].color,
			percent,
			count
		};
	});

	const quadrantSlices = useMemo(() => {
		const positions: Record<ActivityCategory, SlicePosition> = {
			UPKEEP: 'topLeft',
			WORK: 'topRight',
			NOT_PRODUCTIVE: 'bottomLeft',
			BUSINESS_RELATED: 'bottomRight'
		};
		return categories.map(item => {
			const size = getSliceSizeFromPercent(item.percent, sliceMaxSize);
			const layout = getSliceLayout(positions[item.key], size, pieCenter);
			return {
				key: item.key,
				color: item.color,
				size,
				layout,
				position: positions[item.key]
			};
		});
	}, [categories, pieCenter, sliceMaxSize]);

	return (
		<ThemedView style={[styles.container, { paddingBottom: Math.max(40, insets.bottom) }]}>
			<HeaderButtons buttonsStyle="light" />

			<View style={styles.content}>
				<ThemedText style={styles.title}>{getMonthLabel(monthId)}</ThemedText>

				{isLoading ? (
					<StatsSkeleton size={pieSize} />
				) : (
					<View style={styles.statsContainer}>
						<View style={[styles.pieWrapper, { width: pieSize, height: pieSize, borderRadius: pieSize / 2, padding: PIE_PADDING }]}>
							<View style={[styles.pieInner, { borderRadius: pieInnerSize / 2 }]}>
								{totalSlots === 0 ? (
									<View style={[styles.emptyPie, { borderRadius: pieInnerSize / 2 }]} />
								) : (
									<View style={styles.quadrantLayer}>
										{quadrantSlices.map(slice => (
											slice.size > 0 ? (
												<View
													key={slice.key}
													style={[
														styles.quadrantSlice,
														slice.layout,
														getInnerCornerStyle(slice.position, Math.min(SLICE_INNER_CORNER_RADIUS, slice.size / 2)),
														getEndpointCornerStyle(slice.position, Math.min(SLICE_ENDPOINT_CORNER_RADIUS, slice.size / 2)),
														{
															width: slice.size,
															height: slice.size,
															backgroundColor: 'transparent'
														}
													]}
												>
													<View
														style={[
															styles.quadrantCircle,
															getCircleOffset(slice.position, slice.size),
															{
																width: slice.size * 2,
																height: slice.size * 2,
																borderRadius: slice.size,
																backgroundColor: slice.color
															}
														]}
													/>
												</View>
											) : null
										))}
									</View>
								)}
							</View>
						</View>

						<View style={styles.labelsGrid}>
							{categories.map(item => (
								<View key={item.key} style={styles.labelItem}>
									<ThemedText type="p" style={styles.percentText}>{item.percent}%</ThemedText>
									<ThemedText type="p" style={styles.labelText}>{item.label}</ThemedText>
								</View>
							))}
						</View>
					</View>
				)}

				<AppButton text="Back" onPress={() => router.back()} />
			</View>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 20,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	title: {
		fontSize: 18,
		fontFamily: 'Geist-Bold',
		color: Colors.text.light,
		marginBottom: 24,
	},
	statsContainer: {
		alignItems: 'center',
		gap: 24,
	},
	pieWrapper: {
		backgroundColor: Colors.background.dark,
	},
	pieInner: {
		flex: 1,
		overflow: 'hidden',
		backgroundColor: Colors.background.dark,
	},
	quadrantLayer: {
		flex: 1,
	},
	quadrantSlice: {
		position: 'absolute',
		overflow: 'hidden',
	},
	quadrantCircle: {
		position: 'absolute',
	},
	labelsGrid: {
		width: '100%',
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: 16,
	},
	emptyPie: {
		width: '100%',
		height: '100%',
		backgroundColor: Colors.background.darkGrey,
	},
	labelItem: {
		width: '48%',
		gap: 4,
	},
	percentText: {
		fontFamily: 'Geist-Bold',
		fontSize: 16,
		color: Colors.text.light,
	},
	labelText: {
		fontFamily: 'GeistMono-Light',
		fontSize: 12,
		color: Colors.text.light,
	},
	skeletonContainer: {
		alignItems: 'center',
		gap: 24,
	},
	skeletonCircle: {
		width: 180,
		height: 180,
		borderRadius: 90,
		backgroundColor: SKELETON_COLOR,
		opacity: 0.5,
	},
	skeletonLabels: {
		width: '100%',
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: 16,
	},
	skeletonLabelGroup: {
		width: '48%',
		gap: 6,
	},
	skeletonLine: {
		height: 14,
		width: 60,
		borderRadius: 8,
		backgroundColor: SKELETON_COLOR,
		opacity: 0.5,
	},
});
