export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'pl'] as const;
export const STORAGE_KEY = 'fixbee-locale';
export const LOCALE_COOKIE = 'fixbee-locale';

export const normalizeLocale = (value: string | null | undefined) => {
	if (!value) {
		return null;
	}

	const normalized = value.toLowerCase();
	if (normalized.startsWith('pl')) {
		return 'pl';
	}
	if (normalized.startsWith('en')) {
		return 'en';
	}

	return null;
};
