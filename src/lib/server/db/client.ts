import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DatabaseClient = PostgresJsDatabase<typeof schema>;

type GlobalDatabase = {
	sql?: ReturnType<typeof postgres>;
	db?: DatabaseClient;
};

const globalForDb = globalThis as unknown as GlobalDatabase;
const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('Missing DATABASE_URL environment variable.');
}

const sql = globalForDb.sql ?? postgres(databaseUrl, { prepare: false });
const db = globalForDb.db ?? drizzle(sql, { schema });

if (dev) {
	globalForDb.sql = sql;
	globalForDb.db = db;
}

export { db, sql };
