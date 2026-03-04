<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	const buttonVariants = cva(
		'relative inline-flex items-center justify-center rounded-xl border-none font-medium leading-none tracking-wide ui-btn text-sm select-none appearance-none transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-[1.5px] focus-visible:outline-focus/65 focus-visible:outline-offset-2',
		{
			variants: {
				variant: {
					default: 'ui-btn--default',
					secondary: 'ui-btn--secondary',
					success: 'ui-btn--success',
					destructive: 'ui-btn--destructive',
					ghost: 'ui-btn--ghost'
				},
				size: {
					default: 'h-8 px-2.5',
					full: 'h-8 px-2.5 w-full',
					icon: 'h-8 w-8 p-0',
					iconSm: 'h-6 w-6 p-0'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	type Props = HTMLButtonAttributes &
		VariantProps<typeof buttonVariants> & {
			class?: string;
			children?: Snippet;
		};

	let {
		variant = 'default',
		size = 'default',
		class: className = '',
		children,
		type = 'button',
		...rest
	}: Props = $props();
</script>

<button class={cn(buttonVariants({ variant, size }), className)} {type} {...rest}>
	<span class="relative z-2">{@render children?.()}</span>
</button>

<style>
	.ui-btn--default {
		color: var(--color-button-foreground);
		text-shadow: 0 -1px 0 var(--color-button-text-shadow);
		background:
			radial-gradient(ellipse at -20px top, var(--color-button-top-light), transparent),
			var(--color-button-background);
		box-shadow:
			inset 0 0 0 1px var(--color-button-inner-stroke),
			0 0 0 1px var(--color-button-outer-stroke),
			0 40px 11px -32px var(--color-button-shadow-1),
			0 26px 10px -22px var(--color-button-shadow-2),
			0 14px 9px -12px var(--color-button-shadow-3),
			0 6px 6px -6px var(--color-button-shadow-4),
			0 2px 4px -3px var(--color-button-shadow-5);
	}

	.ui-btn--default::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		border: 1.5px solid transparent;
		background: linear-gradient(
				180deg,
				var(--color-button-border-top),
				var(--color-button-border-mid) 41%,
				var(--color-button-border-low) 75%,
				var(--color-button-border-bottom)
			)
			border-box;
		mask:
			linear-gradient(black, black) padding-box,
			linear-gradient(black, black);
		mask-composite: exclude;
		mix-blend-mode: overlay;
	}

	@media (hover: hover) {
		.ui-btn--default:hover {
			background:
				radial-gradient(ellipse at -20px top, var(--color-button-top-light-hover), transparent),
				var(--color-button-background);
		}
	}

	.ui-btn--default:active {
		box-shadow:
			inset 0 0 0 1px var(--color-button-inner-stroke),
			0 0 0 1px var(--color-button-outer-stroke),
			0 20px 10px -18px var(--color-button-shadow-1),
			0 12px 10px -10px var(--color-button-shadow-2),
			0 6px 9px -6px var(--color-button-shadow-3),
			0 2px 4px -2px var(--color-button-shadow-4),
			0 1px 2px -1px var(--color-button-shadow-5);
	}

	.ui-btn--secondary {
		color: var(--color-button-secondary-foreground);
		text-shadow: 0 -1px 0 var(--color-button-secondary-text-shadow);
		background: var(--color-button-secondary-background);
		box-shadow:
			inset 0 0 0 1px var(--color-button-secondary-inner-stroke),
			0 0 0 1px var(--color-button-secondary-outer-stroke);
	}

	.ui-btn--secondary::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: inherit;
	}

	.ui-btn--secondary::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		border: 1px solid transparent;
		background: linear-gradient(
				180deg,
				var(--color-button-secondary-border-top),
				var(--color-button-secondary-border-mid) 45%,
				var(--color-button-secondary-border-bottom)
			)
			border-box;
		mask:
			linear-gradient(black, black) padding-box,
			linear-gradient(black, black);
		mask-composite: exclude;
		opacity: 0.65;
	}

	@media (hover: hover) {
		.ui-btn--secondary:hover::before {
			background: var(--color-button-secondary-background-hover);
		}
	}

	.ui-btn--success {
		color: var(--color-button-success-foreground);
		text-shadow: 0 -1px 0 var(--color-button-success-text-shadow);
		background:
			radial-gradient(ellipse at -20px top, var(--color-button-success-top-light), transparent),
			var(--color-button-success-background);
		box-shadow:
			inset 0 0 0 1px var(--color-button-success-inner-stroke),
			0 0 0 1px var(--color-button-success-outer-stroke),
			0 40px 11px -32px var(--color-button-success-shadow-1),
			0 26px 10px -22px var(--color-button-success-shadow-2),
			0 14px 9px -12px var(--color-button-success-shadow-3),
			0 6px 6px -6px var(--color-button-success-shadow-4),
			0 2px 4px -3px var(--color-button-success-shadow-5);
	}

	.ui-btn--success::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		border: 1.5px solid transparent;
		background: linear-gradient(
				180deg,
				var(--color-button-success-border-top),
				var(--color-button-success-border-mid) 41%,
				var(--color-button-success-border-low) 75%,
				var(--color-button-success-border-bottom)
			)
			border-box;
		mask:
			linear-gradient(black, black) padding-box,
			linear-gradient(black, black);
		mask-composite: exclude;
		mix-blend-mode: overlay;
	}

	@media (hover: hover) {
		.ui-btn--success:hover {
			background:
				radial-gradient(
					ellipse at -20px top,
					var(--color-button-success-top-light-hover),
					transparent
				),
				var(--color-button-success-background);
		}
	}

	.ui-btn--success:active {
		box-shadow:
			inset 0 0 0 1px var(--color-button-success-inner-stroke),
			0 0 0 1px var(--color-button-success-outer-stroke),
			0 20px 10px -18px var(--color-button-success-shadow-1),
			0 12px 10px -10px var(--color-button-success-shadow-2),
			0 6px 9px -6px var(--color-button-success-shadow-3),
			0 2px 4px -2px var(--color-button-success-shadow-4),
			0 1px 2px -1px var(--color-button-success-shadow-5);
	}

	.ui-btn--destructive {
		color: var(--color-button-destructive-foreground);
		text-shadow: 0 -1px 0 var(--color-button-destructive-text-shadow);
		background: var(--color-button-destructive-background);
		box-shadow:
			inset 0 0 0 1px var(--color-button-destructive-inner-stroke),
			0 0 0 1px var(--color-button-destructive-outer-stroke);
	}

	.ui-btn--destructive::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: inherit;
	}

	.ui-btn--destructive::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		border: 1px solid transparent;
		background: linear-gradient(
				180deg,
				var(--color-button-destructive-border-top),
				var(--color-button-destructive-border-mid) 45%,
				var(--color-button-destructive-border-bottom)
			)
			border-box;
		mask:
			linear-gradient(black, black) padding-box,
			linear-gradient(black, black);
		mask-composite: exclude;
		opacity: 0.65;
	}

	@media (hover: hover) {
		.ui-btn--destructive:hover::before {
			background: var(--color-button-destructive-background-hover);
		}
	}

	.ui-btn--ghost {
		color: var(--color-button-ghost-foreground);
		text-shadow: none;
		background: transparent;
		box-shadow: none;
	}

	.ui-btn--ghost::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: inherit;
	}

	@media (hover: hover) {
		.ui-btn--ghost:hover::before {
			background: var(--color-button-ghost-background-hover);
		}
	}

	.ui-btn--ghost:active::before {
		background: var(--color-button-ghost-background-active);
	}
</style>
