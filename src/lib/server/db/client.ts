import { env } from '$env/dynamic/private';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type DatabaseClient = PostgresJsDatabase<typeof schema>;
export type SqlClient = ReturnType<typeof postgres>;

const getDatabaseUrl = () => {
	const databaseUrl = env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error('Missing DATABASE_URL environment variable.');
	}

	return databaseUrl;
};

export const createDbClient = () => {
	const sql = postgres(getDatabaseUrl(), {
		prepare: false,
		max: 1,
		idle_timeout: 20,
		connect_timeout: 10
	});
	const db = drizzle(sql, { schema });

	return { db, sql };
};

export const closeDbClient = async (sql: SqlClient) => {
	try {
		await sql.end({ timeout: 5 });
	} catch (error) {
		console.error('[db] Failed to close SQL client.', error);
	}
};
