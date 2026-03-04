<script lang="ts">
	import { resolve } from '$app/paths';
	import { Menu } from 'lucide-svelte';
	import { Button } from '$lib';
	import { AuthLogo } from '$lib';
	import { t } from 'svelte-i18n';

	type Props = {
		onOpenMenu: () => void;
	};

	let { onOpenMenu }: Props = $props();
</script>

<header class="mx-4 mb-4 flex items-center justify-between md:hidden">
	<a href={resolve('/valuation' as Parameters<typeof resolve>[0])}>
		<AuthLogo class="mb-0 w-16" />
	</a>

	<Button
		type="button"
		variant="ghost"
		class="w-9 px-0"
		aria-label={$t('aria.openNavigationMenu')}
		onclick={onOpenMenu}
	>
		<Menu class="size-6" strokeWidth={2} />
	</Button>
</header>
