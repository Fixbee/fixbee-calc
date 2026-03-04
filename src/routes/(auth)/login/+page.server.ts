import { dev } from '$app/environment';
import {
	REMEMBER_ME_COOKIE,
	REMEMBER_ME_PREFERENCE_MAX_AGE,
	readRememberPreference
} from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, 'errors.emailRequired')
		.email('errors.emailInvalid'),
	password: z.string().min(1, 'errors.passwordRequired')
});

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const { user } = await locals.safeGetSession();

	if (user) {
		throw redirect(302, '/valuation');
	}

	return {
		remember: readRememberPreference(cookies.get(REMEMBER_ME_COOKIE))
	};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const parsedData = loginSchema.safeParse({
			email: String(formData.get('email') ?? ''),
			password: String(formData.get('password') ?? '')
		});
		const remember = formData.get('remember') === 'on';

		cookies.set(REMEMBER_ME_COOKIE, remember ? '1' : '0', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: REMEMBER_ME_PREFERENCE_MAX_AGE
		});

		if (!parsedData.success) {
			const { fieldErrors } = parsedData.error.flatten();

			return fail(400, {
				values: {
					email: String(formData.get('email') ?? '')
						.trim()
						.toLowerCase(),
					remember
				},
				fieldErrors: {
					email: fieldErrors.email?.[0],
					password: fieldErrors.password?.[0]
				}
			});
		}

		const { email, password } = parsedData.data;

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return fail(400, {
				values: {
					email,
					remember
				},
				formError: 'errors.invalidEmailPassword'
			});
		}

		throw redirect(303, '/valuation');
	}
};
