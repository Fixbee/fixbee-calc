import type { DatabaseClient } from '$lib/server/db/client';
import { appSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const SETTINGS_ROW_ID = 1;

const normalizePercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const getInstalmentDiscountPercent = async (db: DatabaseClient) => {
	const settings = await db
		.select({
			percent: appSettings.instalmentDiscountPercent
		})
		.from(appSettings)
		.where(eq(appSettings.id, SETTINGS_ROW_ID))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	if (!settings) {
		throw new Error('Missing app settings row. Apply migrations to create and seed app_settings.');
	}

	return normalizePercent(settings.percent);
};
