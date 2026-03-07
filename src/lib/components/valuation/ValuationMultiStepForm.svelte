<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { onDestroy, onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import type { EasingFunction } from 'svelte/transition';
	import { fade, fly, scale } from 'svelte/transition';
	import { Check, Lightbulb } from 'lucide-svelte';
	import { Card } from '$lib';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PhoneModelCombobox from '$lib/components/valuation/PhoneModelCombobox.svelte';
	import { getNormalizedLocale } from '$lib/i18n';
	import {
		computeValuationGrade,
		getPriceForGrade,
		type CosmeticCondition,
		type ValuationAnswers
	} from '$lib/valuation/grading';
	import { valuationDetailsSchema } from '$lib/valuation/schema';
	import { locale, t } from 'svelte-i18n';

	type YesNoAnswer = 'yes' | 'no';
	type QuestionKey =
		| 'questionPowerOn'
		| 'questionHasLock'
		| 'questionHasVisibleDamage'
		| 'questionAllFunctionsWork'
		| 'questionCosmeticCondition';

	type QuestionOption = {
		value: YesNoAnswer | CosmeticCondition;
		labelKey: string;
	};

	type QuestionDefinition = {
		key: QuestionKey;
		questionKey: string;
		options: QuestionOption[];
	};

	type TimelineStep =
		| { type: 'details' }
		| { type: 'summary' }
		| { type: 'question'; index: number };

	type DetailsFieldErrors = {
		phoneModelId?: string;
		phoneColor?: string;
		imei?: string;
	};

	type AbandonedDraftPayload = {
		phoneModelId: number;
		phoneColor: string;
		imeiUnreadable: boolean;
		imei: string;
		questionPowerOn: YesNoAnswer;
		questionHasLock: YesNoAnswer;
		questionHasVisibleDamage: YesNoAnswer;
		questionAllFunctionsWork: YesNoAnswer;
		questionCosmeticCondition: CosmeticCondition;
	};

	type AbandonedDraftResponse = {
		valuationId?: string;
		message?: string;
	};

	type PhoneModelOption = {
		id: number;
		model: string;
		basePrice: number;
		gradeAPercent: number;
		gradeBPercent: number;
		gradeCPercent: number;
		gradeDPercent: number;
	};

	type ValuationFormState = {
		formError?: string;
		successMessage?: string;
	};

	type ValuationDecision = 'accepted' | 'rejected';

	type HelpTipBlock =
		| {
				type: 'paragraph';
				text: string;
		  }
		| {
				type: 'bullets';
				items: string[];
		  };

	type HelpTip = {
		slug: string;
		title: {
			en: string;
			pl: string;
		};
		content: {
			en: HelpTipBlock[];
			pl: HelpTipBlock[];
		};
		sortOrder: number;
	};

	type SlideBlurParams = {
		x?: number;
		blur?: number;
		duration?: number;
		easing?: EasingFunction;
		scaleFrom?: number;
		scaleTo?: number;
		opacityFrom?: number;
		opacityTo?: number;
	};

	type Props = {
		phoneModels: PhoneModelOption[];
		helpTips: HelpTip[];
		form?: ValuationFormState | null;
	};

	let { phoneModels, helpTips, form = null }: Props = $props();

	const questionDefinitions: QuestionDefinition[] = [
		{
			key: 'questionPowerOn',
			questionKey: 'valuation.questions.powerOn',
			options: [
				{ value: 'yes', labelKey: 'common.yes' },
				{ value: 'no', labelKey: 'common.no' }
			]
		},
		{
			key: 'questionHasLock',
			questionKey: 'valuation.questions.hasLock',
			options: [
				{ value: 'yes', labelKey: 'common.yes' },
				{ value: 'no', labelKey: 'common.no' }
			]
		},
		{
			key: 'questionHasVisibleDamage',
			questionKey: 'valuation.questions.hasVisibleDamage',
			options: [
				{ value: 'yes', labelKey: 'common.yes' },
				{ value: 'no', labelKey: 'common.no' }
			]
		},
		{
			key: 'questionAllFunctionsWork',
			questionKey: 'valuation.questions.allFunctionsWork',
			options: [
				{ value: 'yes', labelKey: 'common.yes' },
				{ value: 'no', labelKey: 'common.no' }
			]
		},
		{
			key: 'questionCosmeticCondition',
			questionKey: 'valuation.questions.cosmeticCondition',
			options: [
				{ value: 'none', labelKey: 'valuation.questions.cosmeticNone' },
				{ value: 'light', labelKey: 'valuation.questions.cosmeticLight' },
				{ value: 'heavy', labelKey: 'valuation.questions.cosmeticHeavy' }
			]
		}
	];

	const RESULT_STEP_RESET_TIMEOUT_MS = 3000;
	const timelineSteps: TimelineStep[] = [
		{ type: 'details' } as const,
		...questionDefinitions.map(
			(_question, index) =>
				({
					type: 'question',
					index: index + 1
				}) as const
		),
		{ type: 'summary' } as const
	];
	const totalSteps = timelineSteps.length;
	const summaryStepIndex = questionDefinitions.length + 1;

	let currentStep = $state(0);
	let selectedModelId = $state<number | null>(null);
	let phoneColor = $state('');
	let imei = $state('');
	let imeiUnreadable = $state(false);

	let questionPowerOn = $state<YesNoAnswer | null>(null);
	let questionHasLock = $state<YesNoAnswer | null>(null);
	let questionHasVisibleDamage = $state<YesNoAnswer | null>(null);
	let questionAllFunctionsWork = $state<YesNoAnswer | null>(null);
	let questionCosmeticCondition = $state<CosmeticCondition | null>(null);

	let detailFieldErrors = $state<DetailsFieldErrors>({});
	let questionStepError = $state('');
	let abandonedValuationId = $state<string | null>(null);
	let isSavingAbandonedDraft = $state(false);
	let abandonedDraftError = $state('');
	let finalDecision = $state<ValuationDecision | null>(null);
	let activeStepContentElement = $state<HTMLDivElement | null>(null);
	let contentHeight = $state<number | null>(null);
	let contentResizeObserver: ResizeObserver | null = null;
	let resultResetTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let tipsRoot = $state<HTMLDivElement | null>(null);
	let isTipsOpen = $state(false);
	let supportsHover = $state(false);
	let hoverQuery: MediaQueryList | null = null;

	const selectedModel = $derived(
		selectedModelId === null
			? null
			: (phoneModels.find((model) => model.id === selectedModelId) ?? null)
	);
	const currentLocale = $derived.by(() => getNormalizedLocale($locale));
	const formatLocale = $derived.by(() => (currentLocale === 'pl' ? 'pl-PL' : 'en-US'));

	const timelineProgress = $derived(totalSteps <= 1 ? 0 : (currentStep / (totalSteps - 1)) * 100);
	const timelineProgressRatio = $derived(Math.max(0, Math.min(1, timelineProgress / 100)));
	const isSummaryStep = $derived(currentStep === questionDefinitions.length + 1);
	const isResultStep = $derived(currentStep === questionDefinitions.length + 2);
	const helpTipsBySlug = $derived.by(() => {
		const map: Record<string, HelpTip> = {};
		for (const tip of helpTips) {
			map[tip.slug] = tip;
		}
		return map;
	});
	const activeTipSlugs = $derived.by(() => {
		if (currentStep === 0) {
			return ['imei', 'model'];
		}
		if (currentStep > 0 && currentStep <= questionDefinitions.length) {
			return [`question-${currentStep}`];
		}
		if (isSummaryStep || isResultStep) {
			return ['summary'];
		}
		return [];
	});
	const activeTips = $derived.by(() =>
		activeTipSlugs.map((slug) => helpTipsBySlug[slug]).filter((tip): tip is HelpTip => Boolean(tip))
	);

	const getTimelineStepStatus = (stepIndex: number) => {
		if (isResultStep && stepIndex === summaryStepIndex) {
			return 'summary-final';
		}

		if (stepIndex < currentStep) {
			return 'done';
		}
		if (stepIndex === currentStep) {
			return 'active';
		}

		return 'upcoming';
	};

	const clearResultResetTimeout = () => {
		if (resultResetTimeoutId === null) {
			return;
		}

		clearTimeout(resultResetTimeoutId);
		resultResetTimeoutId = null;
	};

	const scheduleResultReset = () => {
		clearResultResetTimeout();
		resultResetTimeoutId = setTimeout(() => {
			resetWizard();
		}, RESULT_STEP_RESET_TIMEOUT_MS);
	};

	const updateContentHeight = () => {
		if (!activeStepContentElement) {
			return;
		}

		contentHeight = Math.ceil(activeStepContentElement.getBoundingClientRect().height);
	};

	const slideBlur = (_node: Element, params: SlideBlurParams = {}) => {
		const {
			x = 56,
			blur = 9,
			duration = 320,
			easing = cubicOut,
			scaleFrom = 0.985,
			scaleTo = 1,
			opacityFrom = 0,
			opacityTo = 1
		} = params;

		return {
			duration,
			easing,
			css: (t: number) => {
				const inv = 1 - t;
				const translateX = x * inv;
				const currentBlur = blur * inv;
				const opacity = opacityFrom + (opacityTo - opacityFrom) * t;
				const scale = scaleFrom + (scaleTo - scaleFrom) * t;

				return `transform: translate3d(${translateX}px, 0, 0) scale(${scale}); filter: blur(${currentBlur}px); opacity: ${opacity};`;
			}
		};
	};

	$effect(() => {
		const node = activeStepContentElement;
		if (!node) {
			return;
		}

		updateContentHeight();

		if (typeof ResizeObserver === 'undefined') {
			return;
		}

		contentResizeObserver?.disconnect();
		contentResizeObserver = new ResizeObserver(() => {
			updateContentHeight();
		});
		contentResizeObserver.observe(node);

		return () => {
			contentResizeObserver?.disconnect();
			contentResizeObserver = null;
		};
	});

	onDestroy(() => {
		contentResizeObserver?.disconnect();
		contentResizeObserver = null;
		clearResultResetTimeout();
	});

	const handleDocumentMouseDown = (event: MouseEvent) => {
		if (!isTipsOpen || supportsHover || !tipsRoot) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}

		if (!tipsRoot.contains(target)) {
			isTipsOpen = false;
		}
	};

	const handleDocumentKeyDown = (event: KeyboardEvent) => {
		if (!supportsHover && event.key === 'Escape') {
			isTipsOpen = false;
		}
	};

	const setTipsOpen = (value: boolean) => {
		if (!supportsHover) {
			return;
		}

		isTipsOpen = value;
	};

	const toggleTips = () => {
		if (supportsHover) {
			return;
		}

		isTipsOpen = !isTipsOpen;
	};

	onMount(() => {
		if (typeof window === 'undefined') {
			return;
		}

		hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
		supportsHover = hoverQuery.matches;

		const handleHoverChange = (event: MediaQueryListEvent) => {
			supportsHover = event.matches;
			if (supportsHover) {
				isTipsOpen = false;
			}
		};

		hoverQuery.addEventListener('change', handleHoverChange);
		document.addEventListener('mousedown', handleDocumentMouseDown);
		document.addEventListener('keydown', handleDocumentKeyDown);

		return () => {
			hoverQuery?.removeEventListener('change', handleHoverChange);
			document.removeEventListener('mousedown', handleDocumentMouseDown);
			document.removeEventListener('keydown', handleDocumentKeyDown);
		};
	});

	const answers = $derived.by(() => {
		if (
			questionPowerOn === null ||
			questionHasLock === null ||
			questionHasVisibleDamage === null ||
			questionAllFunctionsWork === null ||
			questionCosmeticCondition === null
		) {
			return null;
		}

		return {
			powersOnAndDisplaysImage: questionPowerOn === 'yes',
			hasLock: questionHasLock === 'yes',
			hasVisibleDamage: questionHasVisibleDamage === 'yes',
			allFunctionsWork: questionAllFunctionsWork === 'yes',
			cosmeticCondition: questionCosmeticCondition
		} satisfies ValuationAnswers;
	});

	const calculatedGrade = $derived(answers ? computeValuationGrade(answers) : null);

	const calculatedPrice = $derived.by(() => {
		if (!selectedModel || !calculatedGrade) {
			return null;
		}

		return getPriceForGrade(
			selectedModel.basePrice,
			{
				A: selectedModel.gradeAPercent,
				B: selectedModel.gradeBPercent,
				C: selectedModel.gradeCPercent,
				D: selectedModel.gradeDPercent
			},
			calculatedGrade
		);
	});

	const suggestedBuybackPrice = $derived.by(() => {
		if (calculatedPrice === null) {
			return null;
		}

		return Math.round(calculatedPrice * 0.8);
	});

	const currentQuestion = $derived(
		currentStep > 0 && currentStep <= questionDefinitions.length
			? questionDefinitions[currentStep - 1]
			: null
	);

	const getCurrentQuestionValue = () => {
		if (!currentQuestion) {
			return null;
		}

		switch (currentQuestion.key) {
			case 'questionPowerOn':
				return questionPowerOn;
			case 'questionHasLock':
				return questionHasLock;
			case 'questionHasVisibleDamage':
				return questionHasVisibleDamage;
			case 'questionAllFunctionsWork':
				return questionAllFunctionsWork;
			case 'questionCosmeticCondition':
				return questionCosmeticCondition;
		}
	};

	const setCurrentQuestionValue = (value: YesNoAnswer | CosmeticCondition) => {
		if (!currentQuestion) {
			return;
		}

		switch (currentQuestion.key) {
			case 'questionPowerOn':
				questionPowerOn = value as YesNoAnswer;
				break;
			case 'questionHasLock':
				questionHasLock = value as YesNoAnswer;
				break;
			case 'questionHasVisibleDamage':
				questionHasVisibleDamage = value as YesNoAnswer;
				break;
			case 'questionAllFunctionsWork':
				questionAllFunctionsWork = value as YesNoAnswer;
				break;
			case 'questionCosmeticCondition':
				questionCosmeticCondition = value as CosmeticCondition;
				break;
		}
		questionStepError = '';
	};

	const formatPrice = (priceInGrosz: number) =>
		new Intl.NumberFormat(formatLocale, {
			style: 'currency',
			currency: 'PLN',
			maximumFractionDigits: 0
		}).format(priceInGrosz / 100);

	const moveBack = () => {
		if (currentStep === 0) {
			return;
		}
		questionStepError = '';
		abandonedDraftError = '';

		if (currentStep === questionDefinitions.length + 2) {
			currentStep = questionDefinitions.length + 1;
			return;
		}

		if (currentStep === questionDefinitions.length + 1) {
			currentStep = questionDefinitions.length;
			return;
		}

		currentStep -= 1;
	};

	const resetWizard = () => {
		clearResultResetTimeout();
		currentStep = 0;
		selectedModelId = null;
		phoneColor = '';
		imei = '';
		imeiUnreadable = false;
		questionPowerOn = null;
		questionHasLock = null;
		questionHasVisibleDamage = null;
		questionAllFunctionsWork = null;
		questionCosmeticCondition = null;
		detailFieldErrors = {};
		questionStepError = '';
		abandonedValuationId = null;
		isSavingAbandonedDraft = false;
		abandonedDraftError = '';
		finalDecision = null;
	};

	const startQuestions = () => {
		const parsedDetails = valuationDetailsSchema.safeParse({
			phoneModelId: selectedModelId ?? 0,
			phoneColor,
			imeiUnreadable,
			imei
		});

		if (!parsedDetails.success) {
			const fieldErrors = parsedDetails.error.flatten().fieldErrors;
			detailFieldErrors = {
				phoneModelId: fieldErrors.phoneModelId?.[0],
				phoneColor: fieldErrors.phoneColor?.[0],
				imei: fieldErrors.imei?.[0]
			};
			return;
		}

		detailFieldErrors = {};
		phoneColor = parsedDetails.data.phoneColor;
		imei = parsedDetails.data.imei;
		currentStep = 1;
		questionStepError = '';
	};

	const getAbandonedDraftPayload = (): AbandonedDraftPayload | null => {
		if (
			selectedModelId === null ||
			questionPowerOn === null ||
			questionHasLock === null ||
			questionHasVisibleDamage === null ||
			questionAllFunctionsWork === null ||
			questionCosmeticCondition === null
		) {
			return null;
		}

		return {
			phoneModelId: selectedModelId,
			phoneColor,
			imeiUnreadable,
			imei,
			questionPowerOn,
			questionHasLock,
			questionHasVisibleDamage,
			questionAllFunctionsWork,
			questionCosmeticCondition
		};
	};

	const saveAbandonedDraft = async () => {
		if (abandonedValuationId || isSavingAbandonedDraft) {
			return true;
		}

		const payload = getAbandonedDraftPayload();
		if (!payload) {
			abandonedDraftError = 'errors.missingValuationAnswers';
			return false;
		}

		isSavingAbandonedDraft = true;
		abandonedDraftError = '';

		try {
			const response = await fetch('/api/valuations/abandon', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			const responsePayload = (await response
				.json()
				.catch(() => null)) as AbandonedDraftResponse | null;

			if (!response.ok || !responsePayload?.valuationId) {
				abandonedDraftError = responsePayload?.message ?? 'errors.couldNotStoreDraft';
				return false;
			}

			abandonedValuationId = responsePayload.valuationId;
			return true;
		} catch {
			abandonedDraftError = 'errors.unexpectedStoreDraft';
			return false;
		} finally {
			isSavingAbandonedDraft = false;
		}
	};

	const continueCurrentStep = async () => {
		if (currentStep === 0) {
			startQuestions();
			return;
		}

		if (!currentQuestion) {
			return;
		}

		if (getCurrentQuestionValue() === null) {
			questionStepError = 'errors.chooseAnswer';
			return;
		}

		questionStepError = '';
		if (currentStep < questionDefinitions.length) {
			currentStep += 1;
		} else {
			const draftSaved = await saveAbandonedDraft();
			if (!draftSaved) {
				questionStepError = 'errors.couldNotContinue';
				return;
			}
			currentStep = questionDefinitions.length + 1;
		}
	};

	const toggleImeiUnreadable = (event: Event) => {
		imeiUnreadable = (event.currentTarget as HTMLInputElement).checked;
		detailFieldErrors = {
			...detailFieldErrors,
			imei: undefined
		};
		if (imeiUnreadable) {
			imei = '';
		}
	};

	const submitEnhance: SubmitFunction = ({ formData }) => {
		const decisionValue = String(formData.get('decision') ?? '');
		const decision =
			decisionValue === 'accepted' || decisionValue === 'rejected'
				? (decisionValue as ValuationDecision)
				: null;

		return async ({ result, update }) => {
			await update();
			if (result.type === 'success') {
				if (!decision) {
					resetWizard();
					return;
				}

				finalDecision = decision;
				currentStep = questionDefinitions.length + 2;
				scheduleResultReset();
			}
		};
	};
</script>

<section class="flex h-full w-full flex-col items-center justify-center">
	<div class="w-full sm:w-auto">
		<div class="relative mb-6">
			<div class="relative px-1 sm:min-w-2xl">
				<div class="absolute top-4 right-8 left-8 h-[1.5px] bg-border/70"></div>
				<div
					class="absolute top-4 left-8 h-[1.5px] bg-linear-to-r from-accent to-focus transition-[width] duration-500 ease-out"
					style={`width: calc((100% - 4rem) * ${timelineProgressRatio})`}
				></div>

				<ol class="relative z-1 flex items-start justify-between gap-2">
					{#each timelineSteps as timelineStep, index (timelineStep.type + '-' + index)}
						{@const status = getTimelineStepStatus(index)}
						<li class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
							<div class="relative" in:fly={{ y: 8, duration: 200 + index * 40 }}>
								<span
									class={`inline-flex size-8 items-center justify-center rounded-full border text-xs transition-all duration-300 ${
										status === 'done' || status === 'summary-final'
											? 'border-accent bg-accent text-accent-foreground'
											: status === 'active'
												? 'border-focus bg-canvas text-title'
												: 'border-border bg-sidebar text-foreground-muted'
									}`}
								>
									{#if status === 'done'}
										<Check class="size-4" strokeWidth={2.75} />
									{:else}
										{index + 1}
									{/if}
								</span>
								{#if status === 'active'}
									<span
										class="pointer-events-none absolute inset-0 rounded-full border border-focus/45"
										in:scale={{ duration: 180 }}
										out:fade={{ duration: 120 }}
									></span>
								{/if}
							</div>
							<span
								class={`px-1 text-[10px] leading-tight font-medium sm:text-[11px] ${
									status === 'active' ? 'text-title' : 'text-foreground-muted'
								}`}
							>
								{#if timelineStep.type === 'details'}
									<span class="sm:hidden">{$t('valuation.timeline.detailsShort')}</span>
									<span class="hidden sm:inline">{$t('valuation.timeline.details')}</span>
								{:else if timelineStep.type === 'question'}
									<span class="sm:hidden">
										{$t('valuation.timeline.questionShort', {
											values: { index: timelineStep.index }
										})}
									</span>
									<span class="hidden sm:inline">
										{$t('valuation.timeline.questionLong', {
											values: { index: timelineStep.index }
										})}
									</span>
								{:else}
									<span class="sm:hidden">{$t('valuation.timeline.summaryShort')}</span>
									<span class="hidden sm:inline">{$t('valuation.timeline.summary')}</span>
								{/if}
							</span>
						</li>
					{/each}
				</ol>
			</div>
		</div>
		<Card class="relative w-full max-w-4xl space-y-6 p-6 pt-8">
			<div class="absolute top-3 right-3 z-30">
				<div
					bind:this={tipsRoot}
					class="relative"
					onmouseenter={() => setTipsOpen(true)}
					onmouseleave={() => setTipsOpen(false)}
					role="presentation"
				>
					<Button
						size="iconSm"
						variant="secondary"
						aria-label={$t('valuation.tips.button')}
						aria-expanded={isTipsOpen}
						aria-haspopup="dialog"
						onclick={toggleTips}
					>
						<Lightbulb class="size-4" strokeWidth={2} />
					</Button>

					{#if isTipsOpen}
						<div
							class="ui-card absolute top-full right-0 z-20 mt-2 w-[min(92vw,22rem)] rounded-2xl bg-surface p-4 text-xs text-foreground shadow-[0_20px_40px_-24px_var(--color-card-shadow-drop)] backdrop-blur-xl"
							in:fly={{ duration: 120, y: -6, opacity: 0 }}
							out:fade={{ duration: 100 }}
							role="dialog"
							aria-label={$t('valuation.tips.title')}
						>
							<div class="space-y-4">
								{#if activeTips.length === 0}
									<p class="text-foreground-muted">{$t('valuation.tips.empty')}</p>
								{:else}
									{#each activeTips as tip (tip.slug)}
										<section class="space-y-2">
											<p class="text-sm font-medium text-title">
												{tip.title[currentLocale]}
											</p>
											<div class="space-y-2 text-foreground-muted">
												{#each tip.content[currentLocale] as block, blockIndex (block.type + '-' + blockIndex)}
													{#if block.type === 'paragraph'}
														<p>{block.text}</p>
													{:else if block.type === 'bullets'}
														<ul class="list-disc space-y-1 pl-4">
															{#each block.items as item (item)}
																<li>{item}</li>
															{/each}
														</ul>
													{/if}
												{/each}
											</div>
										</section>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
			<div
				class="relative overflow-hidden transition-[height] duration-300 ease-out"
				style={`height: ${contentHeight === null ? 'auto' : `${contentHeight}px`}`}
			>
				{#key currentStep}
					<div
						class={contentHeight === null ? 'w-full' : 'absolute inset-0 '}
						in:slideBlur={{ x: 60, blur: 10, duration: 300 }}
						out:slideBlur={{ x: -60, blur: 10, duration: 260 }}
					>
						<div class="p-1" bind:this={activeStepContentElement}>
							{#if currentStep === 0}
								<div class="space-y-4">
									<div>
										<label class="mb-1.5 inline-block text-label select-none" for="phone-model">
											{$t('valuation.details.phoneModel')}
										</label>
										<PhoneModelCombobox
											options={phoneModels}
											bind:value={selectedModelId}
											id="phone-model"
											invalid={Boolean(detailFieldErrors.phoneModelId)}
											placeholder={$t('valuation.details.phoneModelPlaceholder')}
											emptyStateLabel={$t('valuation.details.phoneModelEmpty')}
										/>
										{#if detailFieldErrors.phoneModelId}
											<p class="mt-1.5 text-xs text-destructive">
												{$t(detailFieldErrors.phoneModelId)}
											</p>
										{/if}
									</div>

									<div>
										<label class="mb-1.5 inline-block text-label select-none" for="phoneColor">
											{$t('valuation.details.color')}
										</label>
										<Input
											id="phoneColor"
											type="text"
											value={phoneColor}
											oninput={(event) => {
												phoneColor = (event.currentTarget as HTMLInputElement).value;
												detailFieldErrors = { ...detailFieldErrors, phoneColor: undefined };
											}}
											placeholder={$t('valuation.details.colorPlaceholder')}
											aria-invalid={Boolean(detailFieldErrors.phoneColor)}
											class={detailFieldErrors.phoneColor
												? 'border-destructive/70 focus-visible:ring-destructive/55'
												: ''}
										/>
										{#if detailFieldErrors.phoneColor}
											<p class="mt-1.5 text-xs text-destructive">
												{$t(detailFieldErrors.phoneColor)}
											</p>
										{/if}
									</div>

									<div class="space-y-2">
										<label class="mb-1.5 inline-block text-label select-none" for="imei">
											{$t('valuation.details.imei')}
										</label>
										<Input
											id="imei"
											type="text"
											value={imei}
											oninput={(event) => {
												imei = (event.currentTarget as HTMLInputElement).value;
												detailFieldErrors = { ...detailFieldErrors, imei: undefined };
											}}
											placeholder={$t('valuation.details.imeiPlaceholder')}
											inputmode="numeric"
											autocomplete="off"
											disabled={imeiUnreadable}
											aria-invalid={Boolean(detailFieldErrors.imei)}
											class={detailFieldErrors.imei
												? 'border-destructive/70 focus-visible:ring-destructive/55'
												: ''}
										/>
										<Checkbox checked={imeiUnreadable} onchange={toggleImeiUnreadable}>
											{$t('valuation.details.imeiUnreadable')}
										</Checkbox>
										{#if detailFieldErrors.imei}
											<p class="text-xs text-destructive">
												{$t(detailFieldErrors.imei)}
											</p>
										{/if}
									</div>
								</div>
							{:else if currentQuestion}
								<div class="space-y-5">
									<h3 class="text-lg leading-tight tracking-tight text-title">
										{$t(currentQuestion.questionKey)}
									</h3>

									<div class="grid gap-3">
										{#each currentQuestion.options as option (option.value)}
											<button
												type="button"
												class={`relative inline-flex h-8 w-full appearance-none items-center justify-start rounded-xl border-none px-2.5 text-sm leading-none font-medium tracking-wide transition-all duration-200 select-none focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-focus/65 disabled:pointer-events-none disabled:opacity-50 ${
													getCurrentQuestionValue() === option.value
														? 'bg-button-secondary-foreground/10 text-title'
														: 'text-foreground-muted hover:bg-button-secondary-foreground/10 hover:text-foreground'
												}`}
												onclick={() => setCurrentQuestionValue(option.value)}
											>
												{$t(option.labelKey)}
											</button>
										{/each}
									</div>
									{#if questionStepError}
										<p class="text-xs text-destructive">{$t(questionStepError)}</p>
									{/if}
								</div>
							{:else if isSummaryStep}
								<div class="space-y-5">
									<div class="text-center">
										<p
											class="text-2xl leading-none font-medium tracking-tight text-title sm:text-3xl"
										>
											{$t('valuation.summary.title')}
										</p>
										<p class="mt-3 text-sm text-foreground-muted">
											{$t('valuation.summary.subtitle')}
										</p>
										<div class="mt-8 flex justify-center">
											<div class="w-full max-w-md space-y-4 text-center">
												<div class="space-y-2">
													<p class="text-sm text-foreground-muted">
														{$t('valuation.summary.suggestedBuybackPrice')}
													</p>
													<p
														class="text-4xl leading-none font-medium tracking-tight text-title sm:text-5xl"
													>
														{suggestedBuybackPrice === null
															? '-'
															: formatPrice(suggestedBuybackPrice)}
													</p>
												</div>

												<p
													class="flex items-baseline justify-center gap-1 text-xs whitespace-nowrap text-foreground-muted"
												>
													<span>{$t('valuation.summary.fixbeeBuybackPrice')}:</span>
													<span class="font-medium text-foreground">
														{calculatedPrice === null ? '-' : formatPrice(calculatedPrice)}
													</span>
												</p>

												<div
													class="mx-auto mt-2 hidden w-fit items-center gap-1 rounded-2xl border border-border/70 px-3 py-1"
												>
													<span class="text-[10px] text-foreground-muted">
														{$t('valuation.summary.grade')}
													</span>
													<span class="text-sm font-medium text-title">
														{calculatedGrade ?? '-'}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							{:else if isResultStep}
								<div class="space-y-5">
									<div class="text-center">
										{#if finalDecision === 'accepted'}
											<svg
												viewBox="0 0 24 24"
												fill="none"
												class="mx-auto size-20 text-button-success-background sm:size-24"
												aria-hidden="true"
											>
												<circle
													cx="12"
													cy="12"
													r="9"
													stroke="currentColor"
													stroke-width="1.9"
													pathLength="1"
													class="result-icon-circle"
													style="animation-delay: 40ms;"
												/>
												<path
													d="M8 12.5l2.6 2.6L16.5 9.2"
													stroke="currentColor"
													stroke-width="2.2"
													stroke-linecap="round"
													stroke-linejoin="round"
													pathLength="1"
													class="result-icon-stroke"
													style="animation-delay: 240ms;"
												/>
											</svg>
											<p
												class="mt-6 text-2xl leading-none font-medium tracking-tight text-title sm:text-3xl"
											>
												{$t('valuation.result.acceptedTitle')}
											</p>
											<p class="mt-3 text-sm text-foreground-muted">
												{$t('valuation.result.acceptedBody')}
											</p>
										{:else}
											<svg
												viewBox="0 0 24 24"
												fill="none"
												class="mx-auto size-20 text-destructive sm:size-24"
												aria-hidden="true"
											>
												<circle
													cx="12"
													cy="12"
													r="9"
													stroke="currentColor"
													stroke-width="1.9"
													pathLength="1"
													class="result-icon-circle"
													style="animation-delay: 40ms;"
												/>
												<path
													d="M9 9l6 6"
													stroke="currentColor"
													stroke-width="2.2"
													stroke-linecap="round"
													pathLength="1"
													class="result-icon-stroke"
													style="animation-delay: 210ms;"
												/>
												<path
													d="M15 9l-6 6"
													stroke="currentColor"
													stroke-width="2.2"
													stroke-linecap="round"
													pathLength="1"
													class="result-icon-stroke"
													style="animation-delay: 330ms;"
												/>
											</svg>
											<p
												class="mt-6 text-2xl leading-none font-medium tracking-tight text-title sm:text-3xl"
											>
												{$t('valuation.result.declinedTitle')}
											</p>
											<p class="mt-3 text-sm text-foreground-muted">
												{$t('valuation.result.declinedBody')}
											</p>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/key}
			</div>

			<div class="mt-6 pt-4">
				{#if isSummaryStep}
					<form class="space-y-3" method="POST" use:enhance={submitEnhance}>
						<input type="hidden" name="valuationId" value={abandonedValuationId ?? ''} />
						<input type="hidden" name="phoneModelId" value={selectedModelId ?? ''} />
						<input type="hidden" name="phoneColor" value={phoneColor} />
						<input type="hidden" name="imeiUnreadable" value={String(imeiUnreadable)} />
						<input type="hidden" name="imei" value={imei} />
						<input type="hidden" name="questionPowerOn" value={questionPowerOn ?? ''} />
						<input type="hidden" name="questionHasLock" value={questionHasLock ?? ''} />
						<input
							type="hidden"
							name="questionHasVisibleDamage"
							value={questionHasVisibleDamage ?? ''}
						/>
						<input
							type="hidden"
							name="questionAllFunctionsWork"
							value={questionAllFunctionsWork ?? ''}
						/>
						<input
							type="hidden"
							name="questionCosmeticCondition"
							value={questionCosmeticCondition ?? ''}
						/>

						<div class="grid gap-3 sm:grid-cols-2">
							<Button
								size="full"
								variant="destructive"
								type="submit"
								name="decision"
								value="rejected"
								disabled={isSavingAbandonedDraft || !abandonedValuationId}
							>
								{$t('common.decline')}
							</Button>
							<Button
								size="full"
								variant="success"
								type="submit"
								name="decision"
								value="accepted"
								disabled={isSavingAbandonedDraft || !abandonedValuationId}
							>
								{$t('common.accept')}
							</Button>
						</div>

						{#if isSavingAbandonedDraft}
							<p class="text-xs text-foreground-muted">
								{$t('valuation.draftSaving')}
							</p>
						{/if}
						{#if abandonedDraftError}
							<p class="text-xs text-destructive">{$t(abandonedDraftError)}</p>
						{/if}

						{#if form?.formError}
							<p class="text-xs text-destructive">{$t(form.formError)}</p>
						{/if}
						{#if form?.successMessage}
							<p class="text-xs text-foreground">{$t(form.successMessage)}</p>
						{/if}
					</form>
				{:else if isResultStep}
					<p class="text-center text-xs text-foreground-muted">
						{$t('valuation.result.restart')}
					</p>
				{:else}
					<div class="grid gap-3 sm:grid-cols-2">
						{#if currentStep === 0}
							<div class="sm:col-start-2">
								<Button size="full" type="button" onclick={continueCurrentStep}>
									{$t('common.next')}
								</Button>
							</div>
						{:else}
							<Button size="full" variant="secondary" type="button" onclick={moveBack}>
								{$t('common.back')}
							</Button>
							<Button size="full" type="button" onclick={continueCurrentStep}>
								{$t('common.next')}
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		</Card>
	</div>
</section>

<style>
	.result-icon-circle {
		stroke-linecap: round;
		stroke-dasharray: 1.02;
		stroke-dashoffset: 1.02;
		animation: result-icon-draw-circle 760ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	.result-icon-stroke {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: result-icon-draw 720ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	@keyframes result-icon-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes result-icon-draw-circle {
		to {
			stroke-dashoffset: -0.001;
		}
	}

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
