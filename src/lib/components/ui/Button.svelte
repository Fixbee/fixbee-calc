<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	const buttonVariants = cva('ui-btn', {
		variants: {
			variant: {
				default: 'ui-btn--default',
				secondary: 'ui-btn--secondary'
			},
			size: {
				default: 'ui-btn--size-default',
				full: 'ui-btn--size-full'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

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
	<span class="ui-btn__label">{@render children?.()}</span>
</button>

<style>
	.ui-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		border: 0;
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1;
		letter-spacing: 0.01em;
		-webkit-user-select: none;
		user-select: none;
		appearance: none;
		outline: none;
		transition:
			translate 0.1s,
			background 0.2s,
			box-shadow 0.2s,
			color 0.2s;
	}

	.ui-btn:focus-visible {
		outline: 1.5px solid var(--color-auth-focus);
		outline-offset: 2px;
	}

	.ui-btn:active {
		translate: 0 1px;
	}

	.ui-btn:disabled {
		pointer-events: none;
		opacity: 0.5;
	}

	.ui-btn--size-default {
		height: 38px;
		padding-inline: 20px;
	}

	.ui-btn--size-full {
		height: 38px;
		width: 100%;
		padding-inline: 20px;
	}

	.ui-btn__label {
		position: relative;
		z-index: 2;
	}

	.ui-btn--default {
		color: var(--color-auth-button-foreground);
		text-shadow: 0 -1px 0 var(--color-auth-button-text-shadow);
		background:
			radial-gradient(ellipse at -20px top, var(--color-auth-button-top-light), transparent),
			var(--color-auth-button-background);
		box-shadow:
			inset 0 0 0 1px var(--color-auth-button-inner-stroke),
			0 0 0 1px var(--color-auth-button-outer-stroke),
			0 40px 11px -32px var(--color-auth-button-shadow-1),
			0 26px 10px -22px var(--color-auth-button-shadow-2),
			0 14px 9px -12px var(--color-auth-button-shadow-3),
			0 6px 6px -6px var(--color-auth-button-shadow-4),
			0 2px 4px -3px var(--color-auth-button-shadow-5);
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
				var(--color-auth-button-border-top),
				var(--color-auth-button-border-mid) 41%,
				var(--color-auth-button-border-low) 75%,
				var(--color-auth-button-border-bottom)
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
				radial-gradient(
					ellipse at -20px top,
					var(--color-auth-button-top-light-hover),
					transparent
				),
				var(--color-auth-button-background);
		}
	}

	.ui-btn--default:active {
		box-shadow:
			inset 0 0 0 1px var(--color-auth-button-inner-stroke),
			0 0 0 1px var(--color-auth-button-outer-stroke),
			0 20px 10px -18px var(--color-auth-button-shadow-1),
			0 12px 10px -10px var(--color-auth-button-shadow-2),
			0 6px 9px -6px var(--color-auth-button-shadow-3),
			0 2px 4px -2px var(--color-auth-button-shadow-4),
			0 1px 2px -1px var(--color-auth-button-shadow-5);
	}

	.ui-btn--secondary {
		color: var(--color-auth-button-secondary-foreground);
		text-shadow: 0 -1px 0 var(--color-auth-button-secondary-text-shadow);
		background: transparent;
		box-shadow:
			inset 0 0 0 1px var(--color-auth-button-secondary-inner-stroke),
			0 0 0 1px var(--color-auth-button-secondary-outer-stroke);
	}

	.ui-btn--secondary::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: inherit;
		background:
			radial-gradient(
				ellipse at -20px top,
				var(--color-auth-button-secondary-top-light),
				transparent
			),
			var(--color-auth-button-secondary-background);
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
				var(--color-auth-button-secondary-border-top),
				var(--color-auth-button-secondary-border-mid) 45%,
				var(--color-auth-button-secondary-border-bottom)
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
			background:
				radial-gradient(
					ellipse at -20px top,
					var(--color-auth-button-secondary-top-light-hover),
					transparent
				),
				var(--color-auth-button-secondary-background-hover);
		}
	}
</style>
