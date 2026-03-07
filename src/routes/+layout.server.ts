import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();

	return {
		user,
		locale: locals.locale,
		siteOrigin: url.origin
	};
};
