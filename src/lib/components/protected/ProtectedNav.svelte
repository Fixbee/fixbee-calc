<script lang="ts">
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils/cn';

	type NavigationItem = {
		href: string;
		label: string;
	};

	type Props = {
		navigationItems: NavigationItem[];
		currentPath: string;
		class?: string;
		onNavigate?: () => void;
	};

	let { navigationItems, currentPath, class: className = '', onNavigate }: Props = $props();
</script>

<nav class={cn('space-y-1', className)}>
	{#each navigationItems as item (item.href)}
		<a
			href={resolve(item.href as Parameters<typeof resolve>[0])}
			onclick={onNavigate}
			class={`relative inline-flex h-8 w-full appearance-none items-center justify-start rounded-xl border-none px-2.5 text-sm leading-none font-medium tracking-wide transition-all duration-200 select-none focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-focus/65 disabled:pointer-events-none disabled:opacity-50 ${
				currentPath.startsWith(item.href)
					? 'bg-button-secondary-foreground/10'
					: 'hover:bg-button-secondary-foreground/10'
			}`}
		>
			<span class="relative z-2">{item.label}</span>
		</a>
	{/each}
</nav>
