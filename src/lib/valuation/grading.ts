export type ValuationGrade = 'A' | 'B' | 'C' | 'D';
export type CosmeticCondition = 'none' | 'light' | 'heavy';

export type ValuationAnswers = {
	powersOnAndDisplaysImage: boolean;
	hasLock: boolean;
	hasVisibleDamage: boolean;
	allFunctionsWork: boolean;
	cosmeticCondition: CosmeticCondition;
};

export type GradePercentages = {
	A: number;
	B: number;
	C: number;
	D: number;
};

export const computeValuationGrade = (answers: ValuationAnswers): ValuationGrade => {
	if (!answers.powersOnAndDisplaysImage || answers.hasLock || answers.hasVisibleDamage) {
		return 'D';
	}

	if (!answers.allFunctionsWork) {
		return 'C';
	}

	if (answers.cosmeticCondition === 'none') {
		return 'A';
	}

	if (answers.cosmeticCondition === 'light') {
		return 'B';
	}

	return 'C';
};

export const getPriceForGrade = (
	basePrice: number,
	gradePercentages: GradePercentages,
	grade: ValuationGrade
) => Math.round((basePrice * gradePercentages[grade]) / 100);

export const applyInstalmentDiscount = (priceInGrosz: number, isInstalmentPhone: boolean) =>
	isInstalmentPhone ? Math.round(priceInGrosz * 0.5) : priceInGrosz;
