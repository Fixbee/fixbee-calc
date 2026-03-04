export const REMEMBER_ME_COOKIE = 'fixbee-remember-me';
export const REMEMBER_ME_PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365;

const isSafePath = (value: string) => value.startsWith('/') && !value.startsWith('//');

export const readRememberPreference = (value: string | undefined) => value === '1';

export const sanitizeNextPath = (next: string | null, fallback: string) => {
	if (!next || !isSafePath(next)) {
		return fallback;
	}

	return next;
};
