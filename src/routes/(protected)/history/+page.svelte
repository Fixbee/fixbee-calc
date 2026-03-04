<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import type { PageData } from './$types';
	import { locale, t } from 'svelte-i18n';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	const formatLocale = $derived.by(() => ($locale?.startsWith('pl') ? 'pl-PL' : 'en-US'));

	const formatPrice = (priceInGrosz: number) =>
		new Intl.NumberFormat(formatLocale, {
			style: 'currency',
			currency: 'PLN',
			maximumFractionDigits: 0
		}).format(priceInGrosz / 100);

	const formatDateTime = (dateValue: string | Date | null) => {
		if (!dateValue) {
			return '-';
		}

		const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
		return new Intl.DateTimeFormat(formatLocale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	};
</script>

<Card class="w-full max-w-full p-0">
	<div class="overflow-x-auto rounded-3xl p-6">
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="text-left text-[11px] tracking-wide text-foreground-muted uppercase">
					<th class="px-3 py-2 font-medium">{$t('common.model')}</th>
					<th class="px-3 py-2 font-medium">{$t('common.color')}</th>
					<th class="px-3 py-2 font-medium">{$t('common.imei')}</th>
					<th class="px-3 py-2 font-medium">{$t('common.grade')}</th>
					<th class="px-3 py-2 font-medium">{$t('common.price')}</th>
					<th class="px-3 py-2 font-medium">{$t('common.status')}</th>
					<th class="px-3 py-2 font-medium">{$t('common.created')}</th>
				</tr>
			</thead>
			<tbody>
				{#each data.valuations as valuation (valuation.id)}
					<tr class="border-t border-border/60 align-top whitespace-nowrap text-foreground">
						<td class="px-3 py-2">{valuation.model}</td>
						<td class="px-3 py-2">{valuation.phoneColor}</td>
						<td class="px-3 py-2">{valuation.imei ?? '-'}</td>
						<td class="px-3 py-2 text-title">{valuation.grade}</td>
						<td class="px-3 py-2">{formatPrice(valuation.proposedPrice)}</td>
						<td class="px-3 py-2">
							<span class="status-badge text-xs" data-status={valuation.status}>
								{#if valuation.status === 'accepted'}
									{$t('history.statusAccepted')}
								{:else if valuation.status === 'rejected'}
									{$t('history.statusRejected')}
								{:else}
									{$t('history.statusAbandoned')}
								{/if}
							</span>
						</td>
						<td class="px-3 py-2">{formatDateTime(valuation.createdAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Card>

<style>
	.status-badge {
		display: inline-flex;
		align-items: center;
		border: 1px solid var(--color-border);
		border-radius: 9999px;
		padding: 0.2rem 0.55rem;
		line-height: 1;
	}

	.status-badge[data-status='accepted'] {
		color: var(--color-success);
		background: var(--color-button-success-background-hover);
		border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
	}
	.status-badge[data-status='rejected'] {
		color: var(--color-destructive);
		background: var(--color-button-destructive-background-hover);
		border-color: color-mix(in srgb, var(--color-destructive) 30%, transparent);
	}
	.status-badge[data-status='abandoned'] {
		color: var(--color-button-secondary-foreground);
		background: color-mix(in srgb, var(--color-button-secondary-background) 20%, transparent);
		border-color: color-mix(in srgb, var(--color-button-secondary-outer-stroke) 80%, transparent);
	}
</style>
