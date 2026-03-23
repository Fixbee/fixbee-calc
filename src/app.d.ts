import type { Database } from '$lib/types/database';
import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ user: User | null }>;
			locale: string;
		}
		interface PageData {
			user: User | null;
			locale?: string;
			siteOrigin?: string;
			appRole?: 'admin' | 'user';
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
