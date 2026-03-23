import { closeDbClient, createDbClient } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

type PeriodType = 'week' | 'month';

type AggregatedRow = {
	user_id: string;
	user_email: string;
	company_name: string | null;
	period_start: string;
	valuations_total: number;
	accepted_total: number;
	sold_devices_count: number;
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

const getAggregatedReport = async (
	clientSql: ReturnType<typeof createDbClient>['sql'],
	periodType: PeriodType
) => {
	const rows = await clientSql<AggregatedRow[]>`
		SELECT
			v.user_id,
			u.email AS user_email,
			u.company_name,
			date_trunc(${periodType}, v.created_at)::date::text AS period_start,
			count(*)::int AS valuations_total,
			count(*) FILTER (WHERE v.status = 'accepted')::int AS accepted_total,
			COALESCE(max(ads.sold_devices_count), 0)::int AS sold_devices_count
		FROM public.valuations v
		INNER JOIN public.users u ON u.id = v.user_id
		LEFT JOIN public.admin_device_sales ads
			ON ads.user_id = v.user_id
			AND ads.period_type = ${periodType}
			AND ads.period_start = date_trunc(${periodType}, v.created_at)::date
		WHERE u.role = 'user'
		GROUP BY v.user_id, u.email, u.company_name, date_trunc(${periodType}, v.created_at)::date
		ORDER BY date_trunc(${periodType}, v.created_at)::date DESC, valuations_total DESC, u.email ASC
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

		return {
			weeklyRows,
			monthlyRows
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

			return {
				successMessage: 'messages.adminSoldDevicesSaved'
			};
		} finally {
			await closeDbClient(clientSql);
		}
	}
};
