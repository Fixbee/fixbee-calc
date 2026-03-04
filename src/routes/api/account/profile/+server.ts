import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { AVATARS_BUCKET, getSupabaseAdmin } from '$lib/server/supabase/admin';
import { getAvatarValidationError } from '$lib/account/profile';
import { eq, sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const avatarMimeToExtension: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/avif': 'avif'
};

const profileSchema = z.object({
	companyName: z
		.string()
		.trim()
		.min(2, 'errors.companyNameMin')
		.max(120, 'errors.companyNameTooLong')
});

const normalizeMetadata = (value: unknown) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {} as Record<string, unknown>;
	}

	return { ...value } as Record<string, unknown>;
};

const extractAvatarObjectPath = (avatarUrl: string | null) => {
	if (!avatarUrl) {
		return null;
	}

	try {
		const parsedUrl = new URL(avatarUrl);
		const marker = `/storage/v1/object/public/${AVATARS_BUCKET}/`;
		const markerIndex = parsedUrl.pathname.indexOf(marker);
		if (markerIndex === -1) {
			return null;
		}

		const rawPath = parsedUrl.pathname.slice(markerIndex + marker.length);
		return rawPath ? decodeURIComponent(rawPath) : null;
	} catch {
		return null;
	}
};

const removeAvatarObject = async (objectPath: string | null) => {
	if (!objectPath) {
		return;
	}

	try {
		const supabaseAdmin = getSupabaseAdmin();
		await supabaseAdmin.storage.from(AVATARS_BUCKET).remove([objectPath]);
	} catch {
		// Avatar cleanup is best-effort and should not fail the main request flow.
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return json({ message: 'errors.unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const parsedData = profileSchema.safeParse({
		companyName: String(formData.get('companyName') ?? '')
	});

	if (!parsedData.success) {
		const { fieldErrors } = parsedData.error.flatten();
		return json(
			{
				message: 'errors.validationFix',
				fieldErrors: {
					companyName: fieldErrors.companyName?.[0]
				}
			},
			{ status: 400 }
		);
	}

	const avatarValue = formData.get('avatar');
	const avatarFile = avatarValue instanceof File && avatarValue.size > 0 ? avatarValue : null;

	if (avatarValue && !(avatarValue instanceof File)) {
		return json({ message: 'errors.avatarUploadInvalid' }, { status: 400 });
	}

	if (avatarFile) {
		const avatarValidationError = getAvatarValidationError(avatarFile);
		if (avatarValidationError) {
			return json(
				{
					message: 'errors.avatarUploadFailed',
					fieldErrors: {
						avatar: avatarValidationError
					}
				},
				{ status: 400 }
			);
		}
	}

	const email = user.email;
	if (!email) {
		return json({ message: 'errors.accountMissingEmail' }, { status: 500 });
	}

	const previousProfile = await db.query.users.findFirst({
		where: eq(users.id, user.id)
	});
	const previousMetadata = normalizeMetadata(user.user_metadata);
	const previousAvatarUrlFromMetadata =
		typeof previousMetadata.avatar_url === 'string' ? previousMetadata.avatar_url : null;
	const previousAvatarUrl = previousAvatarUrlFromMetadata ?? previousProfile?.avatarUrl ?? null;

	const companyName = parsedData.data.companyName;
	const supabaseAdmin = getSupabaseAdmin();
	let avatarUrl = previousAvatarUrl;
	let uploadedAvatarObjectPath: string | null = null;

	if (avatarFile) {
		const extension = avatarMimeToExtension[avatarFile.type] ?? 'bin';
		uploadedAvatarObjectPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

		const { error: uploadError } = await supabaseAdmin.storage
			.from(AVATARS_BUCKET)
			.upload(uploadedAvatarObjectPath, avatarFile, {
				contentType: avatarFile.type,
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			return json(
				{
					message: 'errors.avatarUploadFailedTryAgain',
					fieldErrors: {
						avatar: 'errors.avatarUploadCouldNotUpload'
					}
				},
				{ status: 500 }
			);
		}

		const {
			data: { publicUrl }
		} = supabaseAdmin.storage.from(AVATARS_BUCKET).getPublicUrl(uploadedAvatarObjectPath);
		avatarUrl = publicUrl;
	}

	const nextMetadata = {
		...previousMetadata,
		company_name: companyName,
		avatar_url: avatarUrl
	};
	const { error: userUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
		user_metadata: nextMetadata
	});

	if (userUpdateError) {
		await removeAvatarObject(uploadedAvatarObjectPath);
		return json({ message: 'errors.profileUpdateFailed' }, { status: 500 });
	}

	try {
		const savedProfile = await db
			.insert(users)
			.values({
				id: user.id,
				email,
				companyName,
				avatarUrl
			})
			.onConflictDoUpdate({
				target: users.id,
				set: {
					email,
					companyName,
					avatarUrl,
					updatedAt: sql`now()`
				}
			})
			.returning({
				email: users.email,
				companyName: users.companyName,
				avatarUrl: users.avatarUrl
			});

		const profile = savedProfile[0] ?? null;
		if (!profile) {
			throw new Error('Profile update completed, but no profile was returned.');
		}

		if (uploadedAvatarObjectPath) {
			const previousAvatarObjectPath = extractAvatarObjectPath(previousAvatarUrl);
			if (previousAvatarObjectPath && previousAvatarObjectPath !== uploadedAvatarObjectPath) {
				await removeAvatarObject(previousAvatarObjectPath);
			}
		}

		return json({
			profile: {
				email: profile.email,
				companyName: profile.companyName,
				avatarUrl: profile.avatarUrl
			}
		});
	} catch {
		await supabaseAdmin.auth.admin.updateUserById(user.id, {
			user_metadata: previousMetadata
		});
		await removeAvatarObject(uploadedAvatarObjectPath);
		return json({ message: 'errors.profileUpdateFailed' }, { status: 500 });
	}
};
