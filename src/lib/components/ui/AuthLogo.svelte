<script lang="ts">
	import logoSvgRaw from '$lib/assets/fixbee-logo.svg?raw';
	import { cn } from '$lib/utils/cn';

	type Props = {
		class?: string;
		label?: string;
	};

	let { class: className = '', label = 'Fixbee' }: Props = $props();

	const logoMarkup = logoSvgRaw.replace(
		'<svg',
		'<svg class="block h-auto w-full select-none" aria-hidden="true" focusable="false"'
	);
</script>

<div role="img" aria-label={label} class={cn('mx-auto mb-6 w-44', className)}>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html logoMarkup}
</div>
