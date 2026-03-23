import { z } from 'zod';
import { isValidImei, normalizeImei } from '$lib/valuation/imei';

export const yesNoAnswerSchema = z.enum(['yes', 'no']);
export const cosmeticConditionSchema = z.enum(['none', 'light', 'heavy']);
export const valuationDecisionSchema = z.enum(['accepted', 'rejected', 'abandoned']);

const imeiValidation = (value: string, context: z.RefinementCtx) => {
	if (!value) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['imei'],
			message: 'errors.imeiRequiredUnlessUnreadable'
		});
		return;
	}

	if (!isValidImei(value)) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['imei'],
			message: 'errors.imeiInvalid'
		});
	}
};

const valuationDetailsBaseSchema = z.object({
	phoneModelId: z.number().int().positive('errors.phoneModelRequired'),
	phoneColor: z
		.string()
		.trim()
		.min(1, 'errors.phoneColorRequired')
		.refine((value) => !/\d/.test(value), 'errors.phoneColorNoDigits')
		.max(80, 'errors.phoneColorTooLong'),
	imeiUnreadable: z.boolean(),
	imei: z
		.string()
		.trim()
		.max(64, 'errors.imeiTooLong')
		.transform((value) => normalizeImei(value)),
	isInstalmentPhone: z.boolean()
});

export const valuationDetailsSchema = valuationDetailsBaseSchema.superRefine((value, context) => {
	if (!value.imeiUnreadable) {
		imeiValidation(value.imei, context);
	}
});

export const valuationSubmissionSchema = valuationDetailsBaseSchema
	.extend({
		questionPowerOn: yesNoAnswerSchema,
		questionHasLock: yesNoAnswerSchema,
		questionHasVisibleDamage: yesNoAnswerSchema,
		questionAllFunctionsWork: yesNoAnswerSchema,
		questionCosmeticCondition: cosmeticConditionSchema,
		decision: valuationDecisionSchema
	})
	.superRefine((value, context) => {
		if (!value.imeiUnreadable) {
			imeiValidation(value.imei, context);
		}
	});

export type ValuationSubmissionInput = z.infer<typeof valuationSubmissionSchema>;
