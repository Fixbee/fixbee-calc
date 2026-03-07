<script lang="ts">
	import { page } from '$app/state';
	import './layout.css';
	import '$lib/i18n';
	import { locale as localeStore, waitLocale } from 'svelte-i18n';

	let { children, data } = $props();

	const localeReady = $derived.by(() => {
		const targetLocale = data?.locale;
		if (targetLocale) {
			localeStore.set(targetLocale);
		}

		return waitLocale(targetLocale);
	});

	type AppLocale = 'en' | 'pl';

	const METADATA_BY_LOCALE: Record<
		AppLocale,
		{
			title: string;
			description: string;
			keywords: string;
			ogImageAlt: string;
		}
	> = {
		en: {
			title: 'fixbee.pl',
			description:
				'fixbee helps your team run consistent phone buyback valuations and keep full valuation history in one place.',
			keywords: 'fixbee, phone valuation, buyback, trade-in, mobile diagnostics, b2b',
			ogImageAlt: 'fixbee app preview'
		},
		pl: {
			title: 'fixbee.pl',
			description:
				'fixbee pomaga zespolowi wykonywac spojne wyceny odkupu telefonow i przechowywac cala historie wycen w jednym miejscu.',
			keywords: 'fixbee, wycena telefonu, odkup, trade-in, diagnostyka, b2b',
			ogImageAlt: 'Podglad aplikacji fixbee'
		}
	};

	const currentLocale = $derived.by<AppLocale>(() => (data?.locale === 'pl' ? 'pl' : 'en'));
	const headMeta = $derived.by(() => METADATA_BY_LOCALE[currentLocale]);
	const ogLocale = $derived.by(() => (currentLocale === 'pl' ? 'pl_PL' : 'en_US'));
	const siteOrigin = $derived.by(() => data?.siteOrigin || page.url.origin);
	const canonicalUrl = $derived.by(() => {
		return new URL(page.url.pathname || '/', siteOrigin).toString();
	});
	const ogImageUrl = $derived.by(() => new URL('/og-image.jpg', siteOrigin).toString());
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<title>{headMeta.title}</title>
	<meta name="description" content={headMeta.description} />
	<meta name="keywords" content={headMeta.keywords} />
	<meta name="application-name" content="fixbee" />
	<meta name="apple-mobile-web-app-title" content="fixbee" />
	<meta name="theme-color" content="#f6c40f" />
	<meta name="color-scheme" content="light" />
	<meta name="format-detection" content="telephone=no" />
	<meta name="referrer" content="strict-origin-when-cross-origin" />
	<meta name="robots" content="noindex, nofollow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="fixbee" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={headMeta.title} />
	<meta property="og:description" content={headMeta.description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:alt" content={headMeta.ogImageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={headMeta.title} />
	<meta name="twitter:description" content={headMeta.description} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:image:alt" content={headMeta.ogImageAlt} />
</svelte:head>
{#await localeReady}
	<span class="hidden"></span>
{:then}
	{@render children()}
{/await}
