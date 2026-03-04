<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	type Props = Omit<HTMLInputAttributes, 'type'> & {
		checked?: boolean;
		class?: string;
		labelClass?: string;
		boxClass?: string;
		children?: Snippet;
	};

	let {
		checked = $bindable(false),
		class: className = '',
		labelClass = '',
		boxClass = '',
		children,
		disabled = false,
		...rest
	}: Props = $props();
</script>

<label
	class={cn(
		'inline-flex items-center gap-2 text-xs text-foreground-muted select-none',
		disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
		className
	)}
>
	<span class="relative inline-flex">
		<input
			type="checkbox"
			class="peer cursor-inherit absolute inset-0 h-full w-full opacity-0"
			bind:checked
			{disabled}
			{...rest}
		/>
		<span
			aria-hidden="true"
			class={cn(
				'inline-flex size-4 items-center justify-center rounded-md border border-border-strong bg-input text-accent-foreground transition-all duration-200 peer-focus-visible:outline-[1.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus/65',
				checked ? 'border-accent bg-accent' : '',
				boxClass
			)}
		>
			<Check
				class={cn('size-3 transition-opacity duration-150', checked ? 'opacity-100' : 'opacity-0')}
			/>
		</span>
	</span>

	{#if children}
		<span class={cn('leading-none', labelClass)}>{@render children()}</span>
	{/if}
</label>
