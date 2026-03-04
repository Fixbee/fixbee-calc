import { closeDbClient, createDbClient } from '$lib/server/db/client';
import { phoneModels, valuations } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return {
			valuations: []
		};
	}

	const { db, sql } = createDbClient();

	try {
		const userValuations = await db
			.select({
				id: valuations.id,
				model: phoneModels.model,
				phoneColor: valuations.phoneColor,
				imei: valuations.imei,
				grade: valuations.grade,
				proposedPrice: valuations.proposedPrice,
				status: valuations.status,
				createdAt: valuations.createdAt
			})
			.from(valuations)
			.innerJoin(phoneModels, eq(phoneModels.id, valuations.phoneModelId))
			.where(eq(valuations.userId, user.id))
			.orderBy(desc(valuations.updatedAt));

		return {
			valuations: userValuations
		};
	} finally {
		await closeDbClient(sql);
	}
};
