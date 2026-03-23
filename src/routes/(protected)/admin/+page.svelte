<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { Button, Card, Input } from '$lib';
	import { locale, t } from 'svelte-i18n';
	import type { Chart as ChartInstance } from 'chart.js';
	import type { ActionData, PageData } from './$types';

	type Props = {
		data: PageData;
		form?: ActionData;
	};

	type PeriodType = 'week' | 'month';
	type ReportRow = PageData['weeklyRows'][number];
	type RankingRow = PageData['monthlySalonRanking'][number];

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

	const formatNumber = (value: number) => new Intl.NumberFormat(formatLocale).format(value);

	const formatPercent = (value: number) =>
		`${new Intl.NumberFormat(formatLocale, {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1
		}).format(value)}%`;

	const getSalonName = (row: ReportRow | RankingRow) => {
		const trimmedCompanyName = row.companyName?.trim() ?? '';
		return trimmedCompanyName.length > 0 ? trimmedCompanyName : row.userEmail;
	};

	const weeklyTrendRows = $derived([...data.weeklyTrend].reverse());
	const monthlyTrendRows = $derived([...data.monthlyTrend].reverse());
	const hasStatusDistribution = $derived(
		data.statusDistribution.accepted +
			data.statusDistribution.rejected +
			data.statusDistribution.abandoned >
			0
	);
	let reportPeriod = $state<PeriodType>('week');
	const activeReportRows = $derived(reportPeriod === 'week' ? data.weeklyRows : data.monthlyRows);

	let weeklyTrendCanvas = $state<HTMLCanvasElement | null>(null);
	let monthlyTrendCanvas = $state<HTMLCanvasElement | null>(null);
	let statusDistributionCanvas = $state<HTMLCanvasElement | null>(null);

	let weeklyTrendChart: ChartInstance | null = null;
	let monthlyTrendChart: ChartInstance | null = null;
	let statusDistributionChart: ChartInstance | null = null;
	let chartModulePromise: Promise<typeof import('chart.js/auto')> | null = null;

	const getChartModule = async () => {
		if (!chartModulePromise) {
			chartModulePromise = import('chart.js/auto');
		}

		return chartModulePromise;
	};

	const destroyCharts = () => {
		weeklyTrendChart?.destroy();
		monthlyTrendChart?.destroy();
		statusDistributionChart?.destroy();
		weeklyTrendChart = null;
		monthlyTrendChart = null;
		statusDistributionChart = null;
	};

	const renderCharts = async () => {
		if (!browser || !weeklyTrendCanvas || !monthlyTrendCanvas) {
			return;
		}

		const { default: Chart } = await getChartModule();

		destroyCharts();

		weeklyTrendChart = new Chart(weeklyTrendCanvas, {
			type: 'line',
			data: {
				labels: weeklyTrendRows.map((row) => formatPeriod(row.periodStart, 'week')),
				datasets: [
					{
						label: $t('admin.table.valuations'),
						data: weeklyTrendRows.map((row) => row.valuationsTotal),
						borderColor: 'rgba(36, 36, 36, 0.95)',
						backgroundColor: 'rgba(36, 36, 36, 0.14)',
						pointRadius: 3,
						pointHoverRadius: 4,
						tension: 0.35
					},
					{
						label: $t('admin.table.accepted'),
						data: weeklyTrendRows.map((row) => row.acceptedTotal),
						borderColor: 'rgba(0, 126, 72, 0.95)',
						backgroundColor: 'rgba(0, 126, 72, 0.14)',
						pointRadius: 3,
						pointHoverRadius: 4,
						tension: 0.35
					},
					{
						label: $t('admin.table.soldToCentral'),
						data: weeklyTrendRows.map((row) => row.soldDevicesTotal),
						borderColor: 'rgba(166, 110, 0, 0.95)',
						backgroundColor: 'rgba(166, 110, 0, 0.14)',
						pointRadius: 3,
						pointHoverRadius: 4,
						tension: 0.35
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom'
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							precision: 0
						}
					}
				}
			}
		});

		monthlyTrendChart = new Chart(monthlyTrendCanvas, {
			type: 'bar',
			data: {
				labels: monthlyTrendRows.map((row) => formatPeriod(row.periodStart, 'month')),
				datasets: [
					{
						label: $t('admin.table.valuations'),
						data: monthlyTrendRows.map((row) => row.valuationsTotal),
						backgroundColor: 'rgba(36, 36, 36, 0.78)',
						borderRadius: 8
					},
					{
						label: $t('admin.table.accepted'),
						data: monthlyTrendRows.map((row) => row.acceptedTotal),
						backgroundColor: 'rgba(0, 126, 72, 0.78)',
						borderRadius: 8
					},
					{
						label: $t('admin.table.soldToCentral'),
						data: monthlyTrendRows.map((row) => row.soldDevicesTotal),
						backgroundColor: 'rgba(166, 110, 0, 0.78)',
						borderRadius: 8
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom'
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							precision: 0
						}
					}
				}
			}
		});

		if (statusDistributionCanvas && hasStatusDistribution) {
			statusDistributionChart = new Chart(statusDistributionCanvas, {
				type: 'doughnut',
				data: {
					labels: [
						$t('admin.charts.statusAccepted'),
						$t('admin.charts.statusRejected'),
						$t('admin.charts.statusAbandoned')
					],
					datasets: [
						{
							data: [
								data.statusDistribution.accepted,
								data.statusDistribution.rejected,
								data.statusDistribution.abandoned
							],
							backgroundColor: [
								'rgba(0, 126, 72, 0.86)',
								'rgba(188, 62, 62, 0.86)',
								'rgba(114, 114, 114, 0.86)'
							],
							borderWidth: 0
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'bottom'
						}
					}
				}
			});
		}
	};

	const trackChartDependencies = (...dependencies: unknown[]) => dependencies.length;

	$effect(() => {
		trackChartDependencies(
			formatLocale,
			weeklyTrendRows,
			monthlyTrendRows,
			data.statusDistribution.accepted,
			data.statusDistribution.rejected,
			data.statusDistribution.abandoned,
			hasStatusDistribution,
			weeklyTrendCanvas,
			monthlyTrendCanvas,
			statusDistributionCanvas
		);
		void renderCharts();
	});

	onDestroy(() => {
		destroyCharts();
	});
</script>

<Card class="w-full max-w-full overflow-hidden p-0">
	<div class="space-y-4 p-4 sm:space-y-5 sm:p-5 lg:p-6">
		<header class="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
			<div class="space-y-1">
				<h1
					class="text-lg leading-none tracking-tight text-foreground text-shadow-2xs text-shadow-title-shadow sm:text-xl"
				>
					{$t('admin.title')}
				</h1>
			</div>

			<div class="space-y-0.5 text-right text-[11px] text-foreground-muted sm:text-xs">
				{#if data.overview.latestWeekStart}
					<p>
						{$t('admin.overview.latestWeekPeriod')}: {formatPeriod(
							data.overview.latestWeekStart,
							'week'
						)}
					</p>
				{/if}
				{#if data.overview.latestMonthStart}
					<p>
						{$t('admin.overview.latestMonthPeriod')}: {formatPeriod(
							data.overview.latestMonthStart,
							'month'
						)}
					</p>
				{/if}
			</div>
		</header>

		{#if form?.formError}
			<p class="text-xs text-destructive">{$t(form.formError)}</p>
		{/if}

		{#if form?.successMessage}
			<p class="text-xs text-success">{$t(form.successMessage)}</p>
		{/if}

		<section class="space-y-2">
			<h2 class="text-base font-semibold text-foreground">{$t('admin.overview.title')}</h2>
			<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
				<div class="rounded-xl border border-border/60 bg-input/55 p-3">
					<p
						class="text-[10px] leading-tight tracking-wide text-foreground-muted uppercase sm:text-[11px]"
					>
						{$t('admin.overview.latestWeekValuations')}
					</p>
					<p class="mt-1.5 text-xl leading-tight font-semibold text-foreground">
						{formatNumber(data.overview.latestWeekMetrics.valuationsTotal)}
					</p>
				</div>
				<div class="rounded-xl border border-border/60 bg-input/55 p-3">
					<p
						class="text-[10px] leading-tight tracking-wide text-foreground-muted uppercase sm:text-[11px]"
					>
						{$t('admin.overview.latestWeekAcceptanceRate')}
					</p>
					<p class="mt-1.5 text-xl leading-tight font-semibold text-foreground">
						{formatPercent(data.overview.latestWeekMetrics.acceptanceRate)}
					</p>
				</div>
				<div class="rounded-xl border border-border/60 bg-input/55 p-3">
					<p
						class="text-[10px] leading-tight tracking-wide text-foreground-muted uppercase sm:text-[11px]"
					>
						{$t('admin.overview.latestMonthSold')}
					</p>
					<p class="mt-1.5 text-xl leading-tight font-semibold text-foreground">
						{formatNumber(data.overview.latestMonthMetrics.soldDevicesTotal)}
					</p>
				</div>
				<div class="rounded-xl border border-border/60 bg-input/55 p-3">
					<p
						class="text-[10px] leading-tight tracking-wide text-foreground-muted uppercase sm:text-[11px]"
					>
						{$t('admin.overview.latestMonthSellThroughRate')}
					</p>
					<p class="mt-1.5 text-xl leading-tight font-semibold text-foreground">
						{formatPercent(data.overview.latestMonthMetrics.sellThroughRate)}
					</p>
				</div>
				<div class="rounded-xl border border-border/60 bg-input/55 p-3">
					<p
						class="text-[10px] leading-tight tracking-wide text-foreground-muted uppercase sm:text-[11px]"
					>
						{$t('admin.overview.latestWeekActiveSalons')}
					</p>
					<p class="mt-1.5 text-xl leading-tight font-semibold text-foreground">
						{formatNumber(data.overview.latestWeekMetrics.activeSalons)}
					</p>
				</div>
				<div class="rounded-xl border border-border/60 bg-input/55 p-3">
					<p
						class="text-[10px] leading-tight tracking-wide text-foreground-muted uppercase sm:text-[11px]"
					>
						{$t('admin.overview.latestMonthActiveSalons')}
					</p>
					<p class="mt-1.5 text-xl leading-tight font-semibold text-foreground">
						{formatNumber(data.overview.latestMonthMetrics.activeSalons)}
					</p>
				</div>
				<div class="rounded-xl border border-border/60 bg-input/55 p-3">
					<p
						class="text-[10px] leading-tight tracking-wide text-foreground-muted uppercase sm:text-[11px]"
					>
						{$t('admin.overview.latestMonthValuations')}
					</p>
					<p class="mt-1.5 text-xl leading-tight font-semibold text-foreground">
						{formatNumber(data.overview.latestMonthMetrics.valuationsTotal)}
					</p>
				</div>
				<div class="rounded-xl border border-border/60 bg-input/55 p-3">
					<p
						class="text-[10px] leading-tight tracking-wide text-foreground-muted uppercase sm:text-[11px]"
					>
						{$t('admin.overview.latestMonthAcceptanceRate')}
					</p>
					<p class="mt-1.5 text-xl leading-tight font-semibold text-foreground">
						{formatPercent(data.overview.latestMonthMetrics.acceptanceRate)}
					</p>
				</div>
			</div>
		</section>

		<section class="space-y-2">
			<h2 class="text-base font-semibold text-foreground">{$t('admin.charts.title')}</h2>
			<div class="grid gap-2 lg:grid-cols-3">
				<article class="rounded-xl border border-border/60 bg-input/45 p-3">
					<h3 class="text-sm font-semibold text-foreground">{$t('admin.charts.weeklyTrend')}</h3>
					<div class="mt-2 h-52 sm:h-56">
						<canvas bind:this={weeklyTrendCanvas}></canvas>
					</div>
				</article>

				<article class="rounded-xl border border-border/60 bg-input/45 p-3">
					<h3 class="text-sm font-semibold text-foreground">{$t('admin.charts.monthlyTrend')}</h3>
					<div class="mt-2 h-40 sm:h-44">
						<canvas bind:this={monthlyTrendCanvas}></canvas>
					</div>
				</article>

				<article class="rounded-xl border border-border/60 bg-input/45 p-3">
					<h3 class="text-sm font-semibold text-foreground">
						{$t('admin.charts.statusBreakdown')}
					</h3>
					<div class="mt-2 h-40 sm:h-44">
						{#if hasStatusDistribution}
							<canvas bind:this={statusDistributionCanvas}></canvas>
						{:else}
							<div class="flex h-full items-center justify-center text-sm text-foreground-muted">
								{$t('admin.charts.noData')}
							</div>
						{/if}
					</div>
				</article>
			</div>
		</section>

		<section class="space-y-2">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-base font-semibold text-foreground">{$t('admin.ranking.title')}</h2>
				{#if data.overview.latestMonthStart}
					<span
						class="rounded-full border border-border/70 bg-surface px-2.5 py-0.5 text-[11px] text-foreground-muted sm:text-xs"
					>
						{formatPeriod(data.overview.latestMonthStart, 'month')}
					</span>
				{/if}
			</div>
			{#if data.monthlySalonRanking.length === 0}
				<p class="text-sm text-foreground-muted">{$t('admin.table.noData')}</p>
			{:else}
				<div class="max-h-[26dvh] overflow-auto rounded-xl border border-border/60 bg-input/45">
					<table class="w-full min-w-4xl border-collapse text-xs sm:text-sm">
						<thead class="sticky top-0 rounded-t-xl bg-input/90 backdrop-blur-sm">
							<tr
								class="text-left text-[10px] tracking-wide text-foreground-muted uppercase sm:text-[11px]"
							>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.salon')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('common.email')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.valuations')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.accepted')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.soldToCentral')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.ranking.acceptanceRate')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.ranking.sellThroughRate')}</th>
							</tr>
						</thead>
						<tbody>
							{#each data.monthlySalonRanking as row (`rank-${row.userId}-${row.periodStart}`)}
								<tr class="border-t border-border/60 align-top text-foreground">
									<td class="px-2.5 py-1.5 font-medium">{getSalonName(row)}</td>
									<td class="px-2.5 py-1.5 text-foreground-muted">{row.userEmail}</td>
									<td class="px-2.5 py-1.5">{formatNumber(row.valuationsTotal)}</td>
									<td class="px-2.5 py-1.5">{formatNumber(row.acceptedTotal)}</td>
									<td class="px-2.5 py-1.5">{formatNumber(row.soldDevicesCount)}</td>
									<td class="px-2.5 py-1.5">{formatPercent(row.acceptanceRate)}</td>
									<td class="px-2.5 py-1.5">{formatPercent(row.sellThroughRate)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		{#snippet editableReportTable(rows: ReportRow[], periodType: PeriodType)}
			{#if rows.length === 0}
				<p class="text-sm text-foreground-muted">{$t('admin.table.noData')}</p>
			{:else}
				<div class="max-h-[34dvh] overflow-auto rounded-xl border border-border/60 bg-input/45">
					<table class="w-full min-w-4xl border-collapse text-xs sm:text-sm">
						<thead class="sticky top-0 rounded-t-xl bg-input/90 backdrop-blur-sm">
							<tr
								class="text-left text-[10px] tracking-wide text-foreground-muted uppercase sm:text-[11px]"
							>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.salon')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.period')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.valuations')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.accepted')}</th>
								<th class="px-2.5 py-1.5 font-medium">{$t('admin.table.soldToCentral')}</th>
							</tr>
						</thead>
						<tbody>
							{#each rows as row (`${periodType}-${row.userId}-${row.periodStart}`)}
								<tr class="border-t border-border/60 align-top text-foreground">
									<td class="px-2.5 py-1.5">
										<p class="font-medium">{getSalonName(row)}</p>
										{#if row.companyName}
											<p class="text-xs text-foreground-muted">{row.userEmail}</p>
										{/if}
									</td>
									<td class="px-2.5 py-1.5 whitespace-nowrap">
										{formatPeriod(row.periodStart, periodType)}
									</td>
									<td class="px-2.5 py-1.5">{formatNumber(row.valuationsTotal)}</td>
									<td class="px-2.5 py-1.5">{formatNumber(row.acceptedTotal)}</td>
									<td class="px-2.5 py-1.5">
										<form
											method="POST"
											action="?/saveSoldDevices"
											class="flex min-w-44 items-center gap-1.5"
										>
											<input type="hidden" name="userId" value={row.userId} />
											<input type="hidden" name="periodType" value={periodType} />
											<input type="hidden" name="periodStart" value={row.periodStart} />
											<label class="sr-only" for={`${periodType}-${row.userId}-${row.periodStart}`}>
												{$t('admin.table.updateSoldCount')}
											</label>
											<Input
												id={`${periodType}-${row.userId}-${row.periodStart}`}
												type="number"
												name="soldDevicesCount"
												min="0"
												step="1"
												value={String(row.soldDevicesCount)}
												class="w-20"
											/>
											<Button variant="secondary" type="submit" class="h-7 rounded-lg px-2 text-xs">
												{$t('admin.table.save')}
											</Button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{/snippet}

		<section class="space-y-2">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-base font-semibold text-foreground">
					{$t('admin.weeklySectionTitle')} / {$t('admin.monthlySectionTitle')}
				</h2>
				<div
					class="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-input/45 p-1"
				>
					<button
						type="button"
						class={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
							reportPeriod === 'week'
								? 'bg-button-secondary-foreground/14 text-foreground'
								: 'text-foreground-muted hover:bg-button-secondary-foreground/10 hover:text-foreground'
						}`}
						onclick={() => (reportPeriod = 'week')}
					>
						{$t('admin.weeklySectionTitle')}
					</button>
					<button
						type="button"
						class={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
							reportPeriod === 'month'
								? 'bg-button-secondary-foreground/14 text-foreground'
								: 'text-foreground-muted hover:bg-button-secondary-foreground/10 hover:text-foreground'
						}`}
						onclick={() => (reportPeriod = 'month')}
					>
						{$t('admin.monthlySectionTitle')}
					</button>
				</div>
			</div>
			{@render editableReportTable(activeReportRows, reportPeriod)}
		</section>
	</div>
</Card>
