<script lang="ts">
	import { Button } from '$lib';

	type Props = {
		hasAvatar: boolean;
		avatarUrl: string;
		accountName: string;
		accountEmail: string;
		getInitials: (value: string) => string;
		onClick: () => void;
		onAvatarError?: () => void;
		class?: string;
	};

	let {
		hasAvatar,
		avatarUrl,
		accountName,
		accountEmail,
		getInitials,
		onClick,
		onAvatarError,
		class: className = ''
	}: Props = $props();
</script>

<Button
	size="full"
	variant="secondary"
	type="button"
	onclick={onClick}
	class={`h-auto justify-start gap-3 px-3 py-3 text-left ${className}`}
>
	<div class="flex w-full flex-row items-center gap-3">
		{#if hasAvatar}
			<img
				src={avatarUrl}
				alt={accountName}
				onerror={onAvatarError}
				class="size-10 shrink-0 rounded-full border border-border object-cover"
			/>
		{:else}
			<span
				class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground"
			>
				{getInitials(accountName)}
			</span>
		{/if}
		<span class="min-w-0">
			<span class="block truncate text-sm font-medium text-foreground">{accountName}</span>
			<span class="block truncate text-xs text-foreground-muted">{accountEmail}</span>
		</span>
	</div>
</Button>
