<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { AuthLogo } from '$lib';
	import { t } from 'svelte-i18n';

	type NavigationItem = {
		href: string;
		label: string;
	};

	type Props = {
		currentPath: string;
		navigationItems: NavigationItem[];
		hasAvatar: boolean;
		avatarUrl: string;
		accountName: string;
		accountEmail: string;
		getInitials: (value: string) => string;
		onOpenProfile: () => void;
		onAvatarError?: () => void;
	};

	let {
		currentPath,
		navigationItems,
		hasAvatar,
		avatarUrl,
		accountName,
		accountEmail,
		getInitials,
		onOpenProfile,
		onAvatarError
	}: Props = $props();

	let menuOpen = $state(false);
	let menuRoot: HTMLDivElement | null = null;

	const toggleMenu = () => {
		menuOpen = !menuOpen;
	};

	const openProfile = () => {
		menuOpen = false;
		onOpenProfile();
	};

	const handleDocumentMouseDown = (event: MouseEvent) => {
		if (!menuOpen || !menuRoot) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}

		if (!menuRoot.contains(target)) {
			menuOpen = false;
		}
	};

	const handleDocumentKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			menuOpen = false;
		}
	};

	onMount(() => {
		document.addEventListener('mousedown', handleDocumentMouseDown);
		document.addEventListener('keydown', handleDocumentKeyDown);

		return () => {
			document.removeEventListener('mousedown', handleDocumentMouseDown);
			document.removeEventListener('keydown', handleDocumentKeyDown);
		};
	});
</script>

<header class="relative hidden items-center justify-between gap-4 px-2 md:flex">
	<a href={resolve('/valuation' as Parameters<typeof resolve>[0])}>
		<AuthLogo class="mb-0 w-20" />
	</a>

	<nav class="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
		{#each navigationItems as item (item.href)}
			<a
				href={resolve(item.href as Parameters<typeof resolve>[0])}
				class={`relative inline-flex h-8 appearance-none items-center justify-start rounded-xl border-none px-3 text-sm leading-none font-medium tracking-wide transition-all duration-200 select-none focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-focus/65 disabled:pointer-events-none disabled:opacity-50 ${
					currentPath.startsWith(item.href)
						? 'bg-button-secondary-foreground/10 text-foreground'
						: 'text-foreground-muted hover:bg-button-secondary-foreground/10 hover:text-foreground'
				}`}
			>
				{item.label}
			</a>
		{/each}
	</nav>

	<div bind:this={menuRoot} class="relative flex items-center justify-end">
		<button
			type="button"
			class="inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-input/45 transition-all duration-200 hover:bg-input/70 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-focus/65"
			onclick={toggleMenu}
			aria-label={$t('aria.openAccountMenu')}
			aria-haspopup="menu"
			aria-expanded={menuOpen}
		>
			{#if hasAvatar}
				<img
					src={avatarUrl}
					alt={accountName}
					onerror={onAvatarError}
					class="size-9 rounded-full border border-border object-cover"
				/>
			{:else}
				<span
					class="inline-flex size-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground"
				>
					{getInitials(accountName)}
				</span>
			{/if}
		</button>

		{#if menuOpen}
			<div
				class="absolute top-[calc(100%+0.5rem)] right-0 z-50 min-w-58 rounded-2xl border border-border bg-sidebar p-2 shadow-[0_20px_40px_-24px_var(--color-card-shadow-drop)]"
				in:fly={{ duration: 120, y: -10, opacity: 0 }}
				out:fade={{ duration: 100 }}
			>
				<div class="mb-1 rounded-2xl bg-button-secondary-foreground/10 px-2.5 py-2">
					<p class="truncate text-sm font-medium text-foreground">{accountName}</p>
					<p class="truncate text-xs text-foreground-muted">{accountEmail}</p>
				</div>

				<button
					type="button"
					class="inline-flex h-8 w-full items-center rounded-xl px-2.5 text-left text-sm text-foreground transition-all duration-200 hover:bg-button-secondary-foreground/10"
					onclick={openProfile}
				>
					{$t('navigation.settings')}
				</button>

				<form method="POST" action="/logout">
					<button
						type="submit"
						class="inline-flex h-8 w-full items-center rounded-xl px-2.5 text-left text-sm text-destructive transition-all duration-200 hover:bg-button-destructive-background-hover"
					>
						{$t('navigation.logout')}
					</button>
				</form>
			</div>
		{/if}
	</div>
</header>
