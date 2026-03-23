import { json } from '@sveltejs/kit';
import { closeDbClient, createDbClient } from '$lib/server/db/client';
import { phoneModels, valuations } from '$lib/server/db/schema';
import {
	applyInstalmentDiscount,
	computeValuationGrade,
	getPriceForGrade
} from '$lib/valuation/grading';
import { valuationSubmissionSchema } from '$lib/valuation/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

type ValuationAbandonPayload = {
	phoneModelId: number;
	phoneColor: string;
	imeiUnreadable: boolean;
	imei: string;
	isInstalmentPhone: boolean;
	questionPowerOn: 'yes' | 'no';
	questionHasLock: 'yes' | 'no';
	questionHasVisibleDamage: 'yes' | 'no';
	questionAllFunctionsWork: 'yes' | 'no';
	questionCosmeticCondition: 'none' | 'light' | 'heavy';
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return json({ message: 'errors.unauthorized' }, { status: 401 });
	}

	const payload = (await request.json().catch(() => null)) as ValuationAbandonPayload | null;

	if (!payload || typeof payload !== 'object') {
		return json({ message: 'errors.invalidPayload' }, { status: 400 });
	}

	const parsedData = valuationSubmissionSchema.safeParse({
		...payload,
		decision: 'abandoned'
	});

	if (!parsedData.success) {
		const fieldErrors = parsedData.error.flatten().fieldErrors;
		return json(
			{
				message: 'errors.validationFix',
				fieldErrors: {
					phoneModelId: fieldErrors.phoneModelId?.[0],
					phoneColor: fieldErrors.phoneColor?.[0],
					imei: fieldErrors.imei?.[0]
				}
			},
			{ status: 400 }
		);
	}

	const { db, sql } = createDbClient();

	try {
		const model = await db
			.select({
				id: phoneModels.id,
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
			return json(
				{
					message: 'errors.selectedModelUnavailable'
				},
				{ status: 400 }
			);
		}

		const answers = {
			powersOnAndDisplaysImage: parsedData.data.questionPowerOn === 'yes',
			hasLock: parsedData.data.questionHasLock === 'yes',
			hasVisibleDamage: parsedData.data.questionHasVisibleDamage === 'yes',
			allFunctionsWork: parsedData.data.questionAllFunctionsWork === 'yes',
			cosmeticCondition: parsedData.data.questionCosmeticCondition
		};
		const grade = computeValuationGrade(answers);
		const baseProposedPrice = getPriceForGrade(
			model.basePrice,
			{
				A: model.gradeAPercent,
				B: model.gradeBPercent,
				C: model.gradeCPercent,
				D: model.gradeDPercent
			},
			grade
		);
		const proposedPrice = applyInstalmentDiscount(
			baseProposedPrice,
			parsedData.data.isInstalmentPhone
		);

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
				status: 'abandoned'
			})
			.returning({
				id: valuations.id
			});

		return json({
			valuationId: insertedValuation[0]?.id ?? '',
			grade,
			proposedPrice
		});
	} finally {
		await closeDbClient(sql);
	}
};
