import type { Database } from '$lib/types/database';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient<Database> | null = null;

export const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const serviceRoleKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl) {
		throw new Error('Missing PUBLIC_SUPABASE_URL environment variable.');
	}

	if (!serviceRoleKey) {
		throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
	}

	if (!supabaseAdmin) {
		supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});
	}

	return supabaseAdmin;
};

export const AVATARS_BUCKET = 'company-avatars';
