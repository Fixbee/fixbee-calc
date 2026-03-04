<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
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
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#await localeReady}
	<span class="hidden"></span>
{:then}
	{@render children()}
{/await}
