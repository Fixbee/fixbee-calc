import { sanitizeNextPath } from '$lib/server/auth';
import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = sanitizeNextPath(url.searchParams.get('next'), '/valuation');

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			throw redirect(303, next);
		}
	}

	if (tokenHash && type) {
		const { error } = await locals.supabase.auth.verifyOtp({
			type,
			token_hash: tokenHash
		});

		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, '/login?error=auth_callback');
};
