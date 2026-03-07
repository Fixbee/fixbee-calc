<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { Check, ChevronDown } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	type LanguageOption = {
		id: string;
		label: string;
	};

	type Props = {
		options: LanguageOption[];
		value?: string | null;
		id?: string;
		placeholder?: string;
		emptyStateLabel?: string;
		onChange?: (value: string) => void;
		disabled?: boolean;
		invalid?: boolean;
		class?: string;
	};

	let {
		options,
		value = $bindable<string | null>(null),
		id = 'language-select-trigger',
		placeholder = 'Select language',
		emptyStateLabel = 'No languages found.',
		onChange,
		disabled = false,
		invalid = false,
		class: className = ''
	}: Props = $props();

	let rootElement = $state<HTMLElement | null>(null);
	let isOpen = $state(false);

	const selectedOption = $derived(
		value === null ? null : (options.find((option) => option.id === value) ?? null)
	);

	const selectOption = (option: LanguageOption) => {
		value = option.id;
		isOpen = false;
		onChange?.(option.id);
	};

	const toggleOpen = () => {
		if (disabled) {
			return;
		}

		isOpen = !isOpen;
	};

	const handleOutsideClick = (event: MouseEvent) => {
		if (!rootElement) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}

		if (!rootElement.contains(target)) {
			isOpen = false;
		}
	};

	const handleTriggerKeyDown = (event: KeyboardEvent) => {
		if (disabled) {
			return;
		}

		if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			isOpen = true;
		}
	};

	onMount(() => {
		document.addEventListener('mousedown', handleOutsideClick);

		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
		};
	});
</script>

<div bind:this={rootElement} class={cn('relative', className)}>
	<button
		{id}
		type="button"
		class={cn(
			'inline-flex h-8 w-full items-center justify-between rounded-xl border border-border bg-input px-2.5 text-sm text-input-foreground transition-[border-color,box-shadow,background-color] duration-200 outline-none focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus/65 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-70',
			invalid ? 'border-destructive/70 focus-visible:ring-destructive/55' : ''
		)}
		onclick={toggleOpen}
		onkeydown={handleTriggerKeyDown}
		aria-haspopup="listbox"
		aria-controls={`${id}-list`}
		aria-expanded={isOpen}
		{disabled}
	>
		<span class={cn('truncate text-left', selectedOption ? '' : 'text-foreground-muted')}>
			{selectedOption?.label ?? placeholder}
		</span>
		<ChevronDown
			class={cn('size-4 shrink-0 transition-transform duration-200', isOpen ? 'rotate-180' : '')}
		/>
	</button>

	{#if isOpen}
		<div
			class="absolute z-40 mt-2 w-full"
			in:fly={{ duration: 120, y: -10, opacity: 0 }}
			out:fade={{ duration: 100 }}
		>
			<ul
				id={`${id}-list`}
				class="max-h-64 w-full overflow-auto rounded-xl border border-border bg-sidebar p-1 shadow-[0_8px_24px_-16px_var(--color-card-shadow-drop)]"
				role="listbox"
			>
				{#if options.length === 0}
					<li class="px-3 py-2 text-xs text-foreground-muted">{emptyStateLabel}</li>
				{:else}
					{#each options as option (option.id)}
						<li>
							<button
								type="button"
								class={cn(
									'flex h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-sm',
									value === option.id
										? 'bg-input-secondary text-foreground'
										: 'text-foreground-muted hover:bg-button-secondary-foreground/10 hover:text-foreground'
								)}
								onclick={() => selectOption(option)}
								role="option"
								aria-selected={value === option.id}
							>
								<span class="truncate">{option.label}</span>
								{#if value === option.id}
									<Check class="size-4 shrink-0" />
								{/if}
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{/if}
</div>
