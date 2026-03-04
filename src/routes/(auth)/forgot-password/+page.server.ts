import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const forgotPasswordSchema = z.object({
	email: z.string().trim().toLowerCase().min(1, 'errors.emailRequired').email('errors.emailInvalid')
});

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (user) {
		throw redirect(302, '/valuation');
	}
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const parsedData = forgotPasswordSchema.safeParse({
			email: String(formData.get('email') ?? '')
		});

		if (!parsedData.success) {
			const { fieldErrors } = parsedData.error.flatten();

			return fail(400, {
				values: {
					email: String(formData.get('email') ?? '')
						.trim()
						.toLowerCase()
				},
				fieldErrors: {
					email: fieldErrors.email?.[0]
				}
			});
		}

		const { email } = parsedData.data;

		const redirectTo = `${url.origin}/auth/callback?next=${encodeURIComponent('/update-password')}`;

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo
		});

		if (error) {
			return fail(500, {
				values: {
					email
				},
				formError: 'errors.resetEmailFailed'
			});
		}

		return {
			email: '',
			success: true,
			message: 'messages.resetEmailSent'
		};
	}
};
