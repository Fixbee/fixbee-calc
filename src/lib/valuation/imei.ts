export const normalizeImei = (value: string) => value.replace(/[\s-]+/g, '').trim();

export const isValidImei = (rawValue: string) => {
	const imei = normalizeImei(rawValue);

	if (!/^\d{15}$/.test(imei)) {
		return false;
	}

	let sum = 0;
	let shouldDouble = false;

	for (let index = imei.length - 1; index >= 0; index -= 1) {
		let digit = Number(imei[index]);

		if (shouldDouble) {
			digit *= 2;
			if (digit > 9) {
				digit -= 9;
			}
		}

		sum += digit;
		shouldDouble = !shouldDouble;
	}

	return sum % 10 === 0;
};
