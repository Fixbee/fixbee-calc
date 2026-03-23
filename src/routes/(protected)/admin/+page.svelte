<script lang="ts">
	import { Button, Card, Input } from '$lib';
	import { locale, t } from 'svelte-i18n';
	import type { ActionData, PageData } from './$types';

	type Props = {
		data: PageData;
		form?: ActionData;
	};

	type PeriodType = 'week' | 'month';
	type ReportRow = PageData['weeklyRows'][number];

	let { data, form }: Props = $props();

	const formatLocale = $derived.by(() => ($locale?.startsWith('pl') ? 'pl-PL' : 'en-US'));

	const parseDateAsUtc = (value: string) => {
		const [yearString, monthString, dayString] = value.split('-');
		const year = Number(yearString);
		const month = Number(monthString);
		const day = Number(dayString);

		return new Date(Date.UTC(year, month - 1, day));
	};

	const formatDate = (dateValue: Date) =>
		new Intl.DateTimeFormat(formatLocale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			timeZone: 'UTC'
		}).format(dateValue);

	const formatPeriod = (periodStart: string, periodType: PeriodType) => {
		const startDate = parseDateAsUtc(periodStart);

		if (periodType === 'month') {
			return new Intl.DateTimeFormat(formatLocale, {
				year: 'numeric',
				month: 'long',
				timeZone: 'UTC'
			}).format(startDate);
		}

		const weekEnd = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
		return `${formatDate(startDate)} - ${formatDate(weekEnd)}`;
	};

	const getSalonName = (row: ReportRow) => {
		const trimmedCompanyName = row.companyName?.trim() ?? '';
		return trimmedCompanyName.length > 0 ? trimmedCompanyName : row.userEmail;
	};
</script>

<div class="space-y-4">
	<header class="space-y-1">
		<h1
			class="text-xl leading-none tracking-tight text-foreground text-shadow-2xs text-shadow-title-shadow"
		>
			{$t('admin.title')}
		</h1>
		<p class="text-sm text-foreground-muted">
			{$t('admin.subtitle')}
		</p>
	</header>

	{#if form?.formError}
		<p class="text-xs text-destructive">{$t(form.formError)}</p>
	{/if}

	{#if form?.successMessage}
		<p class="text-xs text-success">{$t(form.successMessage)}</p>
	{/if}

	<Card class="w-full max-w-full p-0">
		<div class="space-y-4 p-6">
			<header>
				<h2 class="text-base font-medium text-foreground">{$t('admin.weeklySectionTitle')}</h2>
			</header>

			{#if data.weeklyRows.length === 0}
				<p class="text-sm text-foreground-muted">{$t('admin.table.noData')}</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-sm">
						<thead>
							<tr class="text-left text-[11px] tracking-wide text-foreground-muted uppercase">
								<th class="px-3 py-2 font-medium">{$t('admin.table.salon')}</th>
								<th class="px-3 py-2 font-medium">{$t('admin.table.period')}</th>
								<th class="px-3 py-2 font-medium">{$t('admin.table.valuations')}</th>
								<th class="px-3 py-2 font-medium">{$t('admin.table.accepted')}</th>
								<th class="px-3 py-2 font-medium">{$t('admin.table.soldToCentral')}</th>
							</tr>
						</thead>
						<tbody>
							{#each data.weeklyRows as row (`week-${row.userId}-${row.periodStart}`)}
								<tr class="border-t border-border/60 align-top text-foreground">
									<td class="px-3 py-2">
										<p class="font-medium">{getSalonName(row)}</p>
										{#if row.companyName}
											<p class="text-xs text-foreground-muted">{row.userEmail}</p>
										{/if}
									</td>
									<td class="px-3 py-2 whitespace-nowrap">
										{formatPeriod(row.periodStart, 'week')}
									</td>
									<td class="px-3 py-2">{row.valuationsTotal}</td>
									<td class="px-3 py-2">{row.acceptedTotal}</td>
									<td class="px-3 py-2">
										<form
											method="POST"
											action="?/saveSoldDevices"
											class="flex min-w-56 items-center gap-2"
										>
											<input type="hidden" name="userId" value={row.userId} />
											<input type="hidden" name="periodType" value="week" />
											<input type="hidden" name="periodStart" value={row.periodStart} />
											<label class="sr-only" for={`weekly-${row.userId}-${row.periodStart}`}>
												{$t('admin.table.updateSoldCount')}
											</label>
											<Input
												id={`weekly-${row.userId}-${row.periodStart}`}
												type="number"
												name="soldDevicesCount"
												min="0"
												step="1"
												value={String(row.soldDevicesCount)}
												class="w-24"
											/>
											<Button variant="secondary" type="submit">{$t('admin.table.save')}</Button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</Card>

	<Card class="w-full max-w-full p-0">
		<div class="space-y-4 p-6">
			<header>
				<h2 class="text-base font-medium text-foreground">{$t('admin.monthlySectionTitle')}</h2>
			</header>

			{#if data.monthlyRows.length === 0}
				<p class="text-sm text-foreground-muted">{$t('admin.table.noData')}</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-sm">
						<thead>
							<tr class="text-left text-[11px] tracking-wide text-foreground-muted uppercase">
								<th class="px-3 py-2 font-medium">{$t('admin.table.salon')}</th>
								<th class="px-3 py-2 font-medium">{$t('admin.table.period')}</th>
								<th class="px-3 py-2 font-medium">{$t('admin.table.valuations')}</th>
								<th class="px-3 py-2 font-medium">{$t('admin.table.accepted')}</th>
								<th class="px-3 py-2 font-medium">{$t('admin.table.soldToCentral')}</th>
							</tr>
						</thead>
						<tbody>
							{#each data.monthlyRows as row (`month-${row.userId}-${row.periodStart}`)}
								<tr class="border-t border-border/60 align-top text-foreground">
									<td class="px-3 py-2">
										<p class="font-medium">{getSalonName(row)}</p>
										{#if row.companyName}
											<p class="text-xs text-foreground-muted">{row.userEmail}</p>
										{/if}
									</td>
									<td class="px-3 py-2 whitespace-nowrap">
										{formatPeriod(row.periodStart, 'month')}
									</td>
									<td class="px-3 py-2">{row.valuationsTotal}</td>
									<td class="px-3 py-2">{row.acceptedTotal}</td>
									<td class="px-3 py-2">
										<form
											method="POST"
											action="?/saveSoldDevices"
											class="flex min-w-56 items-center gap-2"
										>
											<input type="hidden" name="userId" value={row.userId} />
											<input type="hidden" name="periodType" value="month" />
											<input type="hidden" name="periodStart" value={row.periodStart} />
											<label class="sr-only" for={`monthly-${row.userId}-${row.periodStart}`}>
												{$t('admin.table.updateSoldCount')}
											</label>
											<Input
												id={`monthly-${row.userId}-${row.periodStart}`}
												type="number"
												name="soldDevicesCount"
												min="0"
												step="1"
												value={String(row.soldDevicesCount)}
												class="w-24"
											/>
											<Button variant="secondary" type="submit">{$t('admin.table.save')}</Button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</Card>
</div>
