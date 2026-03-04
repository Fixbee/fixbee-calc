<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	type Props = HTMLAttributes<HTMLElement> & {
		class?: string;
		children?: Snippet;
	};

	let { class: className = '', children, ...rest }: Props = $props();
</script>

<section
	class={cn(
		'ui-card relative w-full max-w-120 rounded-3xl bg-surface p-6 backdrop-blur-xl',
		className
	)}
	{...rest}
>
	{@render children?.()}
</section>

<style>
	.ui-card {
		box-shadow:
			inset 0 0 0 1px var(--color-card-shadow-inner),
			0 0 0 1px var(--color-card-shadow-outline),
			0 10px 28px -14px var(--color-card-shadow-drop);
	}

	.ui-card::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 1.5px solid transparent;
		pointer-events: none;
		background: linear-gradient(
				160deg,
				var(--color-card-border-start),
				var(--color-card-border-mid) 40%,
				var(--color-card-border-soft) 72%,
				var(--color-card-border-end)
			)
			border-box;
		mask:
			linear-gradient(black, black) padding-box,
			linear-gradient(black, black);
		mask-composite: exclude;
	}
</style>
