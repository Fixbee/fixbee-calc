<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	type Props = HTMLInputAttributes & {
		class?: string;
	};

	let { class: className = '', ...rest }: Props = $props();
</script>

<input
	class={cn(
		'h-10 w-full rounded-xl border border-auth-border/70 bg-auth-input px-4 text-[0.95rem] text-auth-input-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.08),0_0_0_1px_oklch(0_0_0_/_0.4)] transition-[border-color,box-shadow,background-color] duration-150 outline-none placeholder:text-auth-foreground-muted/80 hover:bg-auth-surface-solid focus-visible:border-auth-border-strong focus-visible:ring-2 focus-visible:ring-auth-focus/65 focus-visible:ring-offset-2 focus-visible:ring-offset-auth-canvas',
		className
	)}
	{...rest}
/>
