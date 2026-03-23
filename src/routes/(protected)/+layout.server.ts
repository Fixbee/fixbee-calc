import { closeDbClient, createDbClient } from '$lib/server/db/client';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(302, '/login');
	}

	const { db, sql } = createDbClient();

	try {
		const profile = await db.query.users.findFirst({
			where: (table, { eq }) => eq(table.id, user.id)
		});

		return {
			user,
			profile: profile ?? null,
			appRole: profile?.role ?? 'user'
		};
	} finally {
		await closeDbClient(sql);
	}
};
