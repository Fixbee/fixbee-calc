import type { Database } from '$lib/types/database';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { REMEMBER_ME_COOKIE, readRememberPreference } from '$lib/server/auth';
import { LOCALE_COOKIE, normalizeLocale } from '$lib/i18n/utils';
import { resolveRequestLocale } from '$lib/i18n/server';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;
	const supabaseUrl = env.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY environment variable.'
		);
	}

	event.locals.supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				const remember = readRememberPreference(event.cookies.get(REMEMBER_ME_COOKIE));

				for (const { name, value, options } of cookiesToSet) {
					const isClearingCookie =
						options.maxAge === 0 ||
						(options.expires instanceof Date && options.expires.getTime() <= Date.now());
					const cookieOptions = {
						...options,
						path: '/'
					};

					if (!remember && !isClearingCookie) {
						delete cookieOptions.maxAge;
						delete cookieOptions.expires;
					}

					event.cookies.set(name, value, {
						...cookieOptions
					});
				}
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { user: null };
		}

		return { user };
	};

	const cookieLocale = normalizeLocale(event.cookies.get(LOCALE_COOKIE));
	const resolvedLocale = resolveRequestLocale(
		event.cookies.get(LOCALE_COOKIE),
		event.request.headers.get('accept-language')
	);
	event.locals.locale = resolvedLocale;
	if (cookieLocale !== resolvedLocale) {
		event.cookies.set(LOCALE_COOKIE, resolvedLocale, {
			path: '/',
			httpOnly: false,
			sameSite: 'lax',
			secure: !dev,
			maxAge: LOCALE_MAX_AGE
		});
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
