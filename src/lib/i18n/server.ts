import { DEFAULT_LOCALE, normalizeLocale } from './utils';

const parseAcceptLanguage = (value: string | null) => {
	if (!value) {
		return null;
	}

	const languages = value
		.split(',')
		.map((entry) => entry.split(';')[0]?.trim())
		.filter(Boolean);

	for (const language of languages) {
		const normalized = normalizeLocale(language);
		if (normalized) {
			return normalized;
		}
	}

	return null;
};

export const resolveRequestLocale = (
	cookieValue: string | undefined,
	acceptLanguage: string | null
) => normalizeLocale(cookieValue) ?? parseAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
