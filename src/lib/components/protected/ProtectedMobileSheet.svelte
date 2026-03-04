<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { X } from 'lucide-svelte';
	import { Button } from '$lib';
	import { resolve } from '$app/paths';
	import { AuthLogo } from '$lib';
	import { t } from 'svelte-i18n';

	import AccountTriggerButton from '$lib/components/protected/AccountTriggerButton.svelte';
	import ProtectedNav from '$lib/components/protected/ProtectedNav.svelte';

	type NavigationItem = {
		href: string;
		label: string;
	};

	type Props = {
		open: boolean;
		currentPath: string;
		navigationItems: NavigationItem[];
		hasAvatar: boolean;
		avatarUrl: string;
		accountName: string;
		accountEmail: string;
		getInitials: (value: string) => string;
		onClose: () => void;
		onOpenProfile: () => void;
		onAvatarError?: () => void;
	};

	let {
		open,
		currentPath,
		navigationItems,
		hasAvatar,
		avatarUrl,
		accountName,
		accountEmail,
		getInitials,
		onClose,
		onOpenProfile,
		onAvatarError
	}: Props = $props();

	const handleOpenProfile = () => {
		onClose();
		onOpenProfile();
	};
</script>

{#if open}
	<div class="fixed inset-0 z-50 md:hidden">
		<button
			type="button"
			class="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
			aria-label={$t('aria.closeNavigationMenu')}
			onclick={onClose}
			in:fade={{ duration: 130 }}
			out:fade={{ duration: 110 }}
		></button>

		<aside
			class="absolute top-0 right-0 flex h-full w-[min(85vw,22rem)] flex-col rounded-l-3xl border-l border-border bg-sidebar p-4"
			in:fly={{ x: 24, duration: 180 }}
			out:fly={{ x: 24, duration: 140 }}
		>
			<div class="mb-6 flex items-center justify-between">
				<a href={resolve('/valuation' as Parameters<typeof resolve>[0])}>
					<AuthLogo class="mb-0 w-16" />
				</a>
				<Button
					type="button"
					variant="ghost"
					class="w-9 px-0"
					aria-label={$t('aria.closeNavigationMenu')}
					onclick={onClose}
				>
					<X class="size-6" strokeWidth={2} />
				</Button>
			</div>

			<ProtectedNav {navigationItems} {currentPath} onNavigate={onClose} />

			<div class="mt-auto space-y-3">
				<AccountTriggerButton
					{hasAvatar}
					{avatarUrl}
					{accountName}
					{accountEmail}
					{getInitials}
					onClick={handleOpenProfile}
					{onAvatarError}
				/>

				<form method="POST" action="/logout">
					<Button size="full" variant="destructive" type="submit">
						{$t('navigation.logout')}
					</Button>
				</form>
			</div>
		</aside>
	</div>
{/if}
