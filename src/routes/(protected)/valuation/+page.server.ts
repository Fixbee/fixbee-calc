import { closeDbClient, createDbClient } from '$lib/server/db/client';
import { phoneModels, valuationHelpTips, valuations } from '$lib/server/db/schema';
import { computeValuationGrade, getPriceForGrade } from '$lib/valuation/grading';
import { valuationSubmissionSchema } from '$lib/valuation/schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type ActionFieldErrors = {
	phoneModelId?: string;
	phoneColor?: string;
	imei?: string;
	form?: string;
};

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

const mapFieldErrors = (error: ReturnType<typeof valuationSubmissionSchema.safeParse>) => {
	if (error.success) {
		return {} as ActionFieldErrors;
	}

	const flattened = error.error.flatten();
	return {
		phoneModelId: flattened.fieldErrors.phoneModelId?.[0],
		phoneColor: flattened.fieldErrors.phoneColor?.[0],
		imei: flattened.fieldErrors.imei?.[0]
	} as ActionFieldErrors;
};

export const load: PageServerLoad = async () => {
	const { db, sql } = createDbClient();

	try {
		const models = await db
			.select({
				id: phoneModels.id,
				model: phoneModels.model,
				basePrice: phoneModels.basePrice,
				gradeAPercent: phoneModels.gradeAPercent,
				gradeBPercent: phoneModels.gradeBPercent,
				gradeCPercent: phoneModels.gradeCPercent,
				gradeDPercent: phoneModels.gradeDPercent
			})
			.from(phoneModels)
			.orderBy(asc(phoneModels.model));

		const helpTips = await db
			.select({
				slug: valuationHelpTips.slug,
				titleEn: valuationHelpTips.titleEn,
				titlePl: valuationHelpTips.titlePl,
				contentEn: valuationHelpTips.contentEn,
				contentPl: valuationHelpTips.contentPl,
				sortOrder: valuationHelpTips.sortOrder
			})
			.from(valuationHelpTips)
			.orderBy(asc(valuationHelpTips.sortOrder));
		const normalizedHelpTips: HelpTip[] = helpTips.map((tip) => ({
			slug: tip.slug,
			title: {
				en: tip.titleEn,
				pl: tip.titlePl
			},
			content: {
				en: tip.contentEn as HelpTipBlock[],
				pl: tip.contentPl as HelpTipBlock[]
			},
			sortOrder: tip.sortOrder
		}));

		return {
			phoneModels: models,
			helpTips: normalizedHelpTips
		};
	} finally {
		await closeDbClient(sql);
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();

		if (!user) {
			return fail(401, {
				formError: 'errors.unauthorizedSession'
			});
		}

		const formData = await request.formData();
		const valuationId = String(formData.get('valuationId') ?? '').trim();
		const parsedData = valuationSubmissionSchema.safeParse({
			phoneModelId: Number(formData.get('phoneModelId')),
			phoneColor: String(formData.get('phoneColor') ?? ''),
			imeiUnreadable: String(formData.get('imeiUnreadable') ?? 'false') === 'true',
			imei: String(formData.get('imei') ?? ''),
			questionPowerOn: String(formData.get('questionPowerOn') ?? ''),
			questionHasLock: String(formData.get('questionHasLock') ?? ''),
			questionHasVisibleDamage: String(formData.get('questionHasVisibleDamage') ?? ''),
			questionAllFunctionsWork: String(formData.get('questionAllFunctionsWork') ?? ''),
			questionCosmeticCondition: String(formData.get('questionCosmeticCondition') ?? ''),
			decision: String(formData.get('decision') ?? '')
		});

		if (!parsedData.success) {
			return fail(400, {
				fieldErrors: mapFieldErrors(parsedData),
				formError: 'errors.validationFixSubmit'
			});
		}

		if (parsedData.data.decision === 'abandoned') {
			return fail(400, {
				formError: 'errors.onlyAcceptDecline'
			});
		}

		const { db, sql: clientSql } = createDbClient();

		try {
			const model = await db
				.select({
					id: phoneModels.id,
					model: phoneModels.model,
					basePrice: phoneModels.basePrice,
					gradeAPercent: phoneModels.gradeAPercent,
					gradeBPercent: phoneModels.gradeBPercent,
					gradeCPercent: phoneModels.gradeCPercent,
					gradeDPercent: phoneModels.gradeDPercent
				})
				.from(phoneModels)
				.where(eq(phoneModels.id, parsedData.data.phoneModelId))
				.limit(1)
				.then((rows) => rows[0] ?? null);

			if (!model) {
				return fail(400, {
					fieldErrors: {
						phoneModelId: 'errors.selectedModelUnavailable'
					},
					formError: 'errors.pickAnotherModel'
				});
			}

			const answers = {
				powersOnAndDisplaysImage: parsedData.data.questionPowerOn === 'yes',
				hasLock: parsedData.data.questionHasLock === 'yes',
				hasVisibleDamage: parsedData.data.questionHasVisibleDamage === 'yes',
				allFunctionsWork: parsedData.data.questionAllFunctionsWork === 'yes',
				cosmeticCondition: parsedData.data.questionCosmeticCondition
			};
			const grade = computeValuationGrade(answers);
			const proposedPrice = getPriceForGrade(
				model.basePrice,
				{
					A: model.gradeAPercent,
					B: model.gradeBPercent,
					C: model.gradeCPercent,
					D: model.gradeDPercent
				},
				grade
			);

			let storedValuationId = valuationId;
			if (valuationId) {
				const updatedValuation = await db
					.update(valuations)
					.set({
						phoneModelId: model.id,
						phoneColor: parsedData.data.phoneColor,
						imei: parsedData.data.imeiUnreadable ? null : parsedData.data.imei,
						imeiUnreadable: parsedData.data.imeiUnreadable,
						powersOnAndDisplaysImage: answers.powersOnAndDisplaysImage,
						hasLock: answers.hasLock,
						hasVisibleDamage: answers.hasVisibleDamage,
						allFunctionsWork: answers.allFunctionsWork,
						cosmeticCondition: answers.cosmeticCondition,
						grade,
						proposedPrice,
						status: parsedData.data.decision,
						updatedAt: sql`now()`
					})
					.where(
						and(
							eq(valuations.id, valuationId),
							eq(valuations.userId, user.id),
							eq(valuations.status, 'abandoned')
						)
					)
					.returning({
						id: valuations.id
					});

				if (updatedValuation.length === 0) {
					return fail(404, {
						formError: 'errors.valuationDraftNotFound'
					});
				}

				storedValuationId = updatedValuation[0]?.id ?? valuationId;
			} else {
				const insertedValuation = await db
					.insert(valuations)
					.values({
						userId: user.id,
						phoneModelId: model.id,
						phoneColor: parsedData.data.phoneColor,
						imei: parsedData.data.imeiUnreadable ? null : parsedData.data.imei,
						imeiUnreadable: parsedData.data.imeiUnreadable,
						powersOnAndDisplaysImage: answers.powersOnAndDisplaysImage,
						hasLock: answers.hasLock,
						hasVisibleDamage: answers.hasVisibleDamage,
						allFunctionsWork: answers.allFunctionsWork,
						cosmeticCondition: answers.cosmeticCondition,
						grade,
						proposedPrice,
						status: parsedData.data.decision
					})
					.returning({
						id: valuations.id
					});
				storedValuationId = insertedValuation[0]?.id ?? '';
			}

			const decisionMessage = {
				accepted: 'messages.valuationAcceptedSaved',
				rejected: 'messages.valuationDeclinedSaved'
			}[parsedData.data.decision];

			return {
				success: true,
				successMessage: decisionMessage,
				valuation: {
					id: storedValuationId,
					grade,
					proposedPrice,
					status: parsedData.data.decision,
					model: model.model
				}
			};
		} finally {
			await closeDbClient(clientSql);
		}
	}
};
