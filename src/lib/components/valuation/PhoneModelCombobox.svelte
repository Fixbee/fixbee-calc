<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cn } from '$lib/utils/cn';

	type PhoneModelOption = {
		id: number;
		model: string;
	};

	type Props = {
		options: PhoneModelOption[];
		value?: number | null;
		id?: string;
		placeholder?: string;
		emptyStateLabel?: string;
		disabled?: boolean;
		invalid?: boolean;
		class?: string;
	};

	let {
		options,
		value = $bindable<number | null>(null),
		id = 'phone-model-combobox-input',
		placeholder = 'Search phone model',
		emptyStateLabel = 'No phone models found.',
		disabled = false,
		invalid = false,
		class: className = ''
	}: Props = $props();

	let rootElement = $state<HTMLElement | null>(null);
	let portalElement = $state<HTMLDivElement | null>(null);
	let query = $state('');
	let isOpen = $state(false);
	let portalStyle = $state('');
	let rootResizeObserver: ResizeObserver | null = null;
	let portalAnimationFrame = 0;

	const DROPDOWN_GAP_PX = 8;
	const VIEWPORT_MARGIN_PX = 8;
	const MIN_DROPDOWN_HEIGHT_PX = 120;
	const MAX_DROPDOWN_HEIGHT_PX = 256;

	const selectedOption = $derived(
		value === null ? null : (options.find((option) => option.id === value) ?? null)
	);

	const filteredOptions = $derived.by(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) {
			return options;
		}

		return options.filter((option) => option.model.toLowerCase().includes(normalizedQuery));
	});

	$effect(() => {
		if (!isOpen && selectedOption) {
			query = selectedOption.model;
		}
	});

	$effect(() => {
		if (!isOpen && !selectedOption && query.length > 0) {
			query = '';
		}
	});

	const selectOption = (option: PhoneModelOption) => {
		value = option.id;
		query = option.model;
		isOpen = false;
	};

	const handleInput = (event: Event) => {
		if (disabled) {
			return;
		}

		query = (event.currentTarget as HTMLInputElement).value;
		value = null;
		isOpen = true;
	};

	const handleFocus = () => {
		if (!disabled) {
			isOpen = true;
		}
	};

	const handleOutsideClick = (event: MouseEvent) => {
		if (!rootElement) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}

		const clickedInsideRoot = rootElement.contains(target);
		const clickedInsidePortal = portalElement?.contains(target) ?? false;

		if (!clickedInsideRoot && !clickedInsidePortal) {
			isOpen = false;
		}
	};

	const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

	const updatePortalPosition = () => {
		if (typeof window === 'undefined' || !isOpen || !rootElement) {
			return;
		}

		const anchorRect = rootElement.getBoundingClientRect();
		if (anchorRect.width <= 0 || anchorRect.height <= 0) {
			return;
		}

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const availableBelow = viewportHeight - anchorRect.bottom - VIEWPORT_MARGIN_PX;
		const availableAbove = anchorRect.top - VIEWPORT_MARGIN_PX;
		const openAbove = availableBelow < 180 && availableAbove > availableBelow;
		const availableHeight = openAbove ? availableAbove : availableBelow;
		const maxHeight = clamp(
			availableHeight - DROPDOWN_GAP_PX,
			MIN_DROPDOWN_HEIGHT_PX,
			MAX_DROPDOWN_HEIGHT_PX
		);

		const width = Math.max(anchorRect.width, 220);
		const maxLeft = viewportWidth - VIEWPORT_MARGIN_PX - width;
		const left = clamp(anchorRect.left, VIEWPORT_MARGIN_PX, Math.max(VIEWPORT_MARGIN_PX, maxLeft));
		const top = openAbove
			? clamp(
					anchorRect.top - DROPDOWN_GAP_PX - maxHeight,
					VIEWPORT_MARGIN_PX,
					viewportHeight - VIEWPORT_MARGIN_PX - maxHeight
				)
			: clamp(
					anchorRect.bottom + DROPDOWN_GAP_PX,
					VIEWPORT_MARGIN_PX,
					viewportHeight - VIEWPORT_MARGIN_PX - maxHeight
				);

		portalStyle = `position:fixed;top:${top}px;left:${left}px;width:${width}px;max-height:${maxHeight}px;`;
	};

	const schedulePortalPositionUpdate = () => {
		if (typeof window === 'undefined') {
			return;
		}

		if (portalAnimationFrame) {
			window.cancelAnimationFrame(portalAnimationFrame);
		}

		portalAnimationFrame = window.requestAnimationFrame(() => {
			portalAnimationFrame = 0;
			updatePortalPosition();
		});
	};

	const portal = (node: HTMLDivElement) => {
		if (typeof document === 'undefined') {
			return;
		}

		document.body.appendChild(node);
		schedulePortalPositionUpdate();

		return {
			destroy() {
				node.remove();
			}
		};
	};

	$effect(() => {
		if (!isOpen) {
			return;
		}

		schedulePortalPositionUpdate();
	});

	onMount(() => {
		document.addEventListener('mousedown', handleOutsideClick);
		window.addEventListener('resize', schedulePortalPositionUpdate);
		window.addEventListener('scroll', schedulePortalPositionUpdate, true);

		if (typeof ResizeObserver !== 'undefined' && rootElement) {
			rootResizeObserver = new ResizeObserver(() => {
				schedulePortalPositionUpdate();
			});
			rootResizeObserver.observe(rootElement);
		}

		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
			window.removeEventListener('resize', schedulePortalPositionUpdate);
			window.removeEventListener('scroll', schedulePortalPositionUpdate, true);
			rootResizeObserver?.disconnect();
			rootResizeObserver = null;
			if (portalAnimationFrame) {
				window.cancelAnimationFrame(portalAnimationFrame);
				portalAnimationFrame = 0;
			}
		};
	});
</script>

<div bind:this={rootElement} class={cn('relative', className)}>
	<input
		{id}
		type="text"
		value={query}
		{placeholder}
		class={cn(
			'h-8 w-full rounded-xl border border-border bg-input px-2.5 text-sm text-input-foreground transition-[border-color,box-shadow,background-color] duration-200 outline-none placeholder:text-foreground-muted/80 focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus/65 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-70',
			invalid ? 'border-destructive/70 focus-visible:ring-destructive/55' : ''
		)}
		oninput={handleInput}
		onfocus={handleFocus}
		autocomplete="off"
		role="combobox"
		aria-expanded={isOpen}
		aria-controls={`${id}-list`}
		aria-autocomplete="list"
		aria-invalid={invalid}
		{disabled}
	/>

	{#if isOpen}
		<div
			use:portal
			bind:this={portalElement}
			style={portalStyle}
			class="pointer-events-none z-120"
			in:fly={{ duration: 120, y: -10, opacity: 0 }}
			out:fade={{ duration: 100 }}
		>
			<ul
				id={`${id}-list`}
				class="pointer-events-auto max-h-48 w-full overflow-auto rounded-xl border border-border bg-sidebar p-1 shadow-[0_8px_24px_-16px_var(--color-card-shadow-drop)]"
				role="listbox"
			>
				{#if filteredOptions.length === 0}
					<li class="px-3 py-2 text-xs text-foreground-muted">{emptyStateLabel}</li>
				{:else}
					{#each filteredOptions as option (option.id)}
						<li>
							<button
								type="button"
								class={cn(
									'flex h-8 w-full items-center rounded-lg px-2.5 text-left text-sm',
									value === option.id
										? 'bg-input-secondary text-foreground'
										: 'text-foreground-muted hover:bg-button-secondary-foreground/10 hover:text-foreground'
								)}
								onclick={() => selectOption(option)}
								role="option"
								aria-selected={value === option.id}
							>
								{option.model}
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{/if}
</div>
