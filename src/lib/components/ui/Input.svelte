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
		'h-8 w-full rounded-xl border border-border bg-input px-2.5 text-sm text-input-foreground transition-[border-color,box-shadow,background-color] duration-200 outline-none placeholder:text-foreground-muted/80 focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus/65 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
		className
	)}
	{...rest}
/>
