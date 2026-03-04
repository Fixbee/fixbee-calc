import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 12;
const updatePasswordSchema = z
	.object({
		password: z
			.string()
			.min(1, 'errors.passwordRequired')
			.min(MIN_PASSWORD_LENGTH, 'errors.passwordMin'),
		confirmPassword: z.string().min(1, 'errors.confirmPasswordRequired')
	})
	.refine((values) => values.password === values.confirmPassword, {
		message: 'errors.passwordsMismatch',
		path: ['confirmPassword']
	});

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(302, '/login');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsedData = updatePasswordSchema.safeParse({
			password: String(formData.get('password') ?? ''),
			confirmPassword: String(formData.get('confirmPassword') ?? '')
		});

		if (!parsedData.success) {
			const { fieldErrors } = parsedData.error.flatten();

			return fail(400, {
				fieldErrors: {
					password: fieldErrors.password?.[0],
					confirmPassword: fieldErrors.confirmPassword?.[0]
				}
			});
		}

		const { password } = parsedData.data;
		const { error } = await locals.supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, {
				formError: 'errors.passwordUpdateFailed'
			});
		}

		throw redirect(303, '/valuation');
	}
};
