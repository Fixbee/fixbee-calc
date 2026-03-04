import { getLocaleFromNavigator, init, locale, register } from 'svelte-i18n';
import { DEFAULT_LOCALE, LOCALE_COOKIE, STORAGE_KEY, normalizeLocale } from './utils';

register('en', () => import('./locales/en.json'));
register('pl', () => import('./locales/pl.json'));

init({
	fallbackLocale: DEFAULT_LOCALE,
	initialLocale: DEFAULT_LOCALE
});

const readCookie = (name: string) => {
	if (typeof document === 'undefined') {
		return null;
	}

	const match = document.cookie
		.split(';')
		.map((value) => value.trim())
		.find((value) => value.startsWith(`${name}=`));

	if (!match) {
		return null;
	}

	return decodeURIComponent(match.split('=')[1] ?? '');
};

export const setupI18n = () => {
	if (typeof window === 'undefined') {
		return;
	}

	const stored = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
	const cookieLocale = normalizeLocale(readCookie(LOCALE_COOKIE));
	const system = normalizeLocale(getLocaleFromNavigator());
	const initialLocale = stored ?? cookieLocale ?? system ?? DEFAULT_LOCALE;
	locale.set(initialLocale);
};

export const setAppLocale = (value: string) => {
	const next = normalizeLocale(value) ?? DEFAULT_LOCALE;
	locale.set(next);
	if (typeof window !== 'undefined') {
		window.localStorage.setItem(STORAGE_KEY, next);
		document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Lax`;
	}
};

export const getNormalizedLocale = (value: string | null | undefined) =>
	normalizeLocale(value) ?? DEFAULT_LOCALE;

export { locale };
export { DEFAULT_LOCALE, LOCALE_COOKIE, STORAGE_KEY } from './utils';
