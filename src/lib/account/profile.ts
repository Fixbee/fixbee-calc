export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME_TYPES = [
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/avif'
] as const;
export const ALLOWED_AVATAR_ACCEPT = ALLOWED_AVATAR_MIME_TYPES.join(',');

export const INVALID_AVATAR_TYPE_MESSAGE = 'errors.avatarInvalidType';
export const INVALID_AVATAR_SIZE_MESSAGE = 'errors.avatarTooLarge';

const ALLOWED_AVATAR_MIME_TYPES_SET = new Set<string>(ALLOWED_AVATAR_MIME_TYPES);

export const isAllowedAvatarMimeType = (value: string) => ALLOWED_AVATAR_MIME_TYPES_SET.has(value);

export const getAvatarValidationError = (file: Pick<File, 'type' | 'size'>) => {
	if (!isAllowedAvatarMimeType(file.type)) {
		return INVALID_AVATAR_TYPE_MESSAGE;
	}

	if (file.size > MAX_AVATAR_SIZE_BYTES) {
		return INVALID_AVATAR_SIZE_MESSAGE;
	}

	return null;
};
