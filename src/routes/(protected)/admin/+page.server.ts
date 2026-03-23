import { closeDbClient, createDbClient } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

type PeriodType = 'week' | 'month';
type ValuationStatus = 'accepted' | 'rejected' | 'abandoned';

type AggregatedRow = {
	user_id: string;
	user_email: string;
	company_name: string | null;
	period_start: string;
	valuations_total: number;
	accepted_total: number;
	sold_devices_count: number;
};

type TrendRow = {
	period_start: string;
	valuations_total: number;
	accepted_total: number;
	sold_devices_total: number;
};

type StatusDistributionRow = {
	status: ValuationStatus;
	total: number;
};

const PERIOD_TYPES: PeriodType[] = ['week', 'month'];

const saveSoldDevicesSchema = z.object({
	userId: z.string().uuid('errors.adminInvalidInput'),
	periodType: z.enum(PERIOD_TYPES, 'errors.adminInvalidInput'),
	periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'errors.adminInvalidInput'),
	soldDevicesCount: z.coerce
		.number()
		.int('errors.adminInvalidSoldDevices')
		.min(0, 'errors.adminInvalidSoldDevices')
		.max(100000, 'errors.adminInvalidSoldDevices')
});

const mapAggregatedRow = (row: AggregatedRow) => ({
	userId: row.user_id,
	userEmail: row.user_email,
	companyName: row.company_name,
	periodStart: row.period_start,
	valuationsTotal: Number(row.valuations_total),
	acceptedTotal: Number(row.accepted_total),
	soldDevicesCount: Number(row.sold_devices_count)
});

const mapTrendRow = (row: TrendRow) => ({
	periodStart: row.period_start,
	valuationsTotal: Number(row.valuations_total),
	acceptedTotal: Number(row.accepted_total),
	soldDevicesTotal: Number(row.sold_devices_total)
});

const getPeriodTrend = async (
	clientSql: ReturnType<typeof createDbClient>['sql'],
	periodType: PeriodType,
	limit: number
) => {
	const rows = await clientSql<TrendRow[]>`
		WITH valuations_with_period AS (
			SELECT
				v.user_id,
				v.status,
				date_trunc(${periodType}, v.created_at)::date AS period_start
			FROM public.valuations v
			INNER JOIN public.users u ON u.id = v.user_id
			WHERE u.role = 'user'
		),
		valuations_by_user_period AS (
			SELECT
				vwp.user_id,
				vwp.period_start,
				count(*)::int AS valuations_total,
				count(*) FILTER (WHERE vwp.status = 'accepted')::int AS accepted_total
			FROM valuations_with_period vwp
			GROUP BY vwp.user_id, vwp.period_start
		)
		SELECT
			vup.period_start::text AS period_start,
			sum(vup.valuations_total)::int AS valuations_total,
			sum(vup.accepted_total)::int AS accepted_total,
			COALESCE(sum(ads.sold_devices_count), 0)::int AS sold_devices_total
		FROM valuations_by_user_period vup
		LEFT JOIN public.admin_device_sales ads
			ON ads.user_id = vup.user_id
			AND ads.period_type = ${periodType}
			AND ads.period_start = vup.period_start
		GROUP BY vup.period_start
		ORDER BY vup.period_start DESC
		LIMIT ${limit}
	`;

	return rows.map(mapTrendRow);
};

const getStatusDistribution = async (clientSql: ReturnType<typeof createDbClient>['sql']) => {
	const rows = await clientSql<StatusDistributionRow[]>`
		SELECT
			v.status,
			count(*)::int AS total
		FROM public.valuations v
		INNER JOIN public.users u ON u.id = v.user_id
		WHERE u.role = 'user'
		GROUP BY v.status
	`;

	const result: Record<ValuationStatus, number> = {
		accepted: 0,
		rejected: 0,
		abandoned: 0
	};

	for (const row of rows) {
		result[row.status] = Number(row.total);
	}

	return result;
};

const roundPercentage = (value: number) => Math.round(value * 10) / 10;

const sumMetrics = (
	rows: ReturnType<typeof mapAggregatedRow>[],
	targetPeriodStart: string | null
) => {
	if (!targetPeriodStart) {
		return {
			valuationsTotal: 0,
			acceptedTotal: 0,
			soldDevicesTotal: 0,
			activeSalons: 0
		};
	}

	const periodRows = rows.filter((row) => row.periodStart === targetPeriodStart);

	return periodRows.reduce(
		(accumulator, row) => ({
			valuationsTotal: accumulator.valuationsTotal + row.valuationsTotal,
			acceptedTotal: accumulator.acceptedTotal + row.acceptedTotal,
			soldDevicesTotal: accumulator.soldDevicesTotal + row.soldDevicesCount,
			activeSalons: accumulator.activeSalons + 1
		}),
		{
			valuationsTotal: 0,
			acceptedTotal: 0,
			soldDevicesTotal: 0,
			activeSalons: 0
		}
	);
};

const getLatestPeriodStart = (rows: ReturnType<typeof mapAggregatedRow>[]) => {
	if (rows.length === 0) {
		return null;
	}

	return rows.reduce(
		(latest, row) => (row.periodStart > latest ? row.periodStart : latest),
		rows[0].periodStart
	);
};

const buildOverview = (
	weeklyRows: ReturnType<typeof mapAggregatedRow>[],
	monthlyRows: ReturnType<typeof mapAggregatedRow>[]
) => {
	const latestWeekStart = getLatestPeriodStart(weeklyRows);
	const latestMonthStart = getLatestPeriodStart(monthlyRows);

	const latestWeekMetrics = sumMetrics(weeklyRows, latestWeekStart);
	const latestMonthMetrics = sumMetrics(monthlyRows, latestMonthStart);

	return {
		latestWeekStart,
		latestMonthStart,
		latestWeekMetrics: {
			...latestWeekMetrics,
			acceptanceRate:
				latestWeekMetrics.valuationsTotal > 0
					? roundPercentage(
							(latestWeekMetrics.acceptedTotal / latestWeekMetrics.valuationsTotal) * 100
						)
					: 0,
			sellThroughRate:
				latestWeekMetrics.acceptedTotal > 0
					? roundPercentage(
							(latestWeekMetrics.soldDevicesTotal / latestWeekMetrics.acceptedTotal) * 100
						)
					: 0
		},
		latestMonthMetrics: {
			...latestMonthMetrics,
			acceptanceRate:
				latestMonthMetrics.valuationsTotal > 0
					? roundPercentage(
							(latestMonthMetrics.acceptedTotal / latestMonthMetrics.valuationsTotal) * 100
						)
					: 0,
			sellThroughRate:
				latestMonthMetrics.acceptedTotal > 0
					? roundPercentage(
							(latestMonthMetrics.soldDevicesTotal / latestMonthMetrics.acceptedTotal) * 100
						)
					: 0
		}
	};
};

const buildMonthlySalonRanking = (monthlyRows: ReturnType<typeof mapAggregatedRow>[]) => {
	const latestMonthStart = getLatestPeriodStart(monthlyRows);

	if (!latestMonthStart) {
		return [];
	}

	return monthlyRows
		.filter((row) => row.periodStart === latestMonthStart)
		.map((row) => ({
			userId: row.userId,
			userEmail: row.userEmail,
			companyName: row.companyName,
			periodStart: row.periodStart,
			valuationsTotal: row.valuationsTotal,
			acceptedTotal: row.acceptedTotal,
			soldDevicesCount: row.soldDevicesCount,
			acceptanceRate:
				row.valuationsTotal > 0
					? roundPercentage((row.acceptedTotal / row.valuationsTotal) * 100)
					: 0,
			sellThroughRate:
				row.acceptedTotal > 0
					? roundPercentage((row.soldDevicesCount / row.acceptedTotal) * 100)
					: 0
		}))
		.sort((left, right) => {
			if (right.valuationsTotal !== left.valuationsTotal) {
				return right.valuationsTotal - left.valuationsTotal;
			}

			if (right.acceptanceRate !== left.acceptanceRate) {
				return right.acceptanceRate - left.acceptanceRate;
			}

			return left.userEmail.localeCompare(right.userEmail);
		});
};

const getAggregatedReport = async (
	clientSql: ReturnType<typeof createDbClient>['sql'],
	periodType: PeriodType
) => {
	const rows = await clientSql<AggregatedRow[]>`
		WITH valuations_by_period AS (
			SELECT
				v.user_id,
				u.email AS user_email,
				u.company_name,
				v.status,
				date_trunc(${periodType}, v.created_at)::date AS period_start
			FROM public.valuations v
			INNER JOIN public.users u ON u.id = v.user_id
			WHERE u.role = 'user'
		)
		SELECT
			vbp.user_id,
			vbp.user_email,
			vbp.company_name,
			vbp.period_start::text AS period_start,
			count(*)::int AS valuations_total,
			count(*) FILTER (WHERE vbp.status = 'accepted')::int AS accepted_total,
			COALESCE(max(ads.sold_devices_count), 0)::int AS sold_devices_count
		FROM valuations_by_period vbp
		LEFT JOIN public.admin_device_sales ads
			ON ads.user_id = vbp.user_id
			AND ads.period_type = ${periodType}
			AND ads.period_start = vbp.period_start
		GROUP BY vbp.user_id, vbp.user_email, vbp.company_name, vbp.period_start
		ORDER BY vbp.period_start DESC, valuations_total DESC, vbp.user_email ASC
	`;

	return rows.map(mapAggregatedRow);
};

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(302, '/login');
	}

	const { db, sql: clientSql } = createDbClient();

	try {
		const actorProfile = await db.query.users.findFirst({
			columns: {
				role: true
			},
			where: eq(users.id, user.id)
		});

		if (actorProfile?.role !== 'admin') {
			throw redirect(302, '/valuation');
		}

		const [weeklyRows, monthlyRows] = await Promise.all([
			getAggregatedReport(clientSql, 'week'),
			getAggregatedReport(clientSql, 'month')
		]);

		const [weeklyTrend, monthlyTrend, statusDistribution] = await Promise.all([
			getPeriodTrend(clientSql, 'week', 8),
			getPeriodTrend(clientSql, 'month', 6),
			getStatusDistribution(clientSql)
		]);

		const overview = buildOverview(weeklyRows, monthlyRows);
		const monthlySalonRanking = buildMonthlySalonRanking(monthlyRows);

		return {
			weeklyRows,
			monthlyRows,
			weeklyTrend,
			monthlyTrend,
			statusDistribution,
			overview,
			monthlySalonRanking
		};
	} finally {
		await closeDbClient(clientSql);
	}
};

export const actions: Actions = {
	saveSoldDevices: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();

		if (!user) {
			return fail(401, {
				formError: 'errors.unauthorizedSession'
			});
		}

		const { db, sql: clientSql } = createDbClient();

		try {
			const actorProfile = await db.query.users.findFirst({
				columns: {
					role: true
				},
				where: eq(users.id, user.id)
			});

			if (actorProfile?.role !== 'admin') {
				return fail(403, {
					formError: 'errors.adminOnly'
				});
			}

			const formData = await request.formData();
			const parsed = saveSoldDevicesSchema.safeParse({
				userId: String(formData.get('userId') ?? ''),
				periodType: String(formData.get('periodType') ?? ''),
				periodStart: String(formData.get('periodStart') ?? ''),
				soldDevicesCount: String(formData.get('soldDevicesCount') ?? '')
			});

			if (!parsed.success) {
				return fail(400, {
					formError: parsed.error.issues[0]?.message ?? 'errors.adminInvalidInput'
				});
			}

			const targetUser = await db.query.users.findFirst({
				columns: {
					role: true
				},
				where: eq(users.id, parsed.data.userId)
			});

			if (targetUser?.role !== 'user') {
				return fail(400, {
					formError: 'errors.adminInvalidUser'
				});
			}

			await clientSql`
				INSERT INTO public.admin_device_sales (
					user_id,
					period_type,
					period_start,
					sold_devices_count
				)
				VALUES (
					${parsed.data.userId},
					${parsed.data.periodType},
					${parsed.data.periodStart}::date,
					${parsed.data.soldDevicesCount}
				)
				ON CONFLICT (user_id, period_type, period_start)
				DO UPDATE
				SET
					sold_devices_count = excluded.sold_devices_count,
					updated_at = now()
			`;

			if (parsed.data.periodType === 'week') {
				await clientSql`
					WITH month_summary AS (
						SELECT
							date_trunc('month', ${parsed.data.periodStart}::date)::date AS month_start,
							COALESCE(
								(
									SELECT sum(ads_week.sold_devices_count)::int
									FROM public.admin_device_sales ads_week
									WHERE ads_week.user_id = ${parsed.data.userId}
										AND ads_week.period_type = 'week'
										AND ads_week.period_start >= date_trunc('month', ${parsed.data.periodStart}::date)::date
										AND ads_week.period_start <
											(date_trunc('month', ${parsed.data.periodStart}::date) + interval '1 month')::date
								),
								0
							)::int AS sold_devices_count
					)
					INSERT INTO public.admin_device_sales (
						user_id,
						period_type,
						period_start,
						sold_devices_count
					)
					SELECT
						${parsed.data.userId},
						'month',
						ms.month_start,
						ms.sold_devices_count
					FROM month_summary ms
					ON CONFLICT (user_id, period_type, period_start)
					DO UPDATE
					SET
						sold_devices_count = excluded.sold_devices_count,
						updated_at = now()
				`;
			}

			return {
				successMessage: 'messages.adminSoldDevicesSaved'
			};
		} finally {
			await closeDbClient(clientSql);
		}
	}
};
