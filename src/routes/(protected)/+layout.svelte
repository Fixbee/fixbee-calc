<script lang="ts">
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { locale, t } from 'svelte-i18n';
	import { getNormalizedLocale, setAppLocale } from '$lib/i18n';
	import { getAvatarValidationError } from '$lib/account/profile';
	import ProfileSettingsModal from '$lib/components/account/ProfileSettingsModal.svelte';
	import ProtectedDesktopHeader from '$lib/components/protected/ProtectedDesktopHeader.svelte';
	import ProtectedMobileHeader from '$lib/components/protected/ProtectedMobileHeader.svelte';
	import ProtectedMobileSheet from '$lib/components/protected/ProtectedMobileSheet.svelte';

	type ProfileUpdateResponse = {
		profile?: {
			email: string;
			companyName: string | null;
			avatarUrl: string | null;
		};
		message?: string;
		fieldErrors?: {
			companyName?: string;
			avatar?: string;
		};
	};

	let { data, children } = $props();

	const navigationItems = $derived.by(() => [
		{ href: '/valuation', label: $t('navigation.valuation') },
		{ href: '/history', label: $t('navigation.history') }
	]);
	const currentPath = $derived(page.url.pathname);

	const getUserMetadata = () => {
		const value = data.user?.user_metadata;
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			return {} as Record<string, unknown>;
		}

		return value as Record<string, unknown>;
	};

	const getMetadataCompanyName = () => {
		const value = getUserMetadata().company_name;
		return typeof value === 'string' ? value : '';
	};

	const getMetadataAvatarUrl = () => {
		const value = getUserMetadata().avatar_url;
		return typeof value === 'string' ? value : '';
	};

	const getInitialCompanyName = () => data.profile?.companyName ?? getMetadataCompanyName();
	const getInitialAvatarUrl = () => data.profile?.avatarUrl ?? getMetadataAvatarUrl();

	let companyName = $state(getInitialCompanyName());
	let avatarUrl = $state(getInitialAvatarUrl());

	let isProfileModalOpen = $state(false);
	let isMobileNavOpen = $state(false);
	let isProfileSaving = $state(false);
	let profileDraftCompanyName = $state(getInitialCompanyName());
	let avatarPreviewUrl = $state(getInitialAvatarUrl());
	let avatarFile = $state<File | null>(null);
	let avatarLoadFailed = $state(false);
	let avatarObjectUrl: string | null = null;
	let profileFormError = $state('');
	let profileFieldErrors = $state<{ companyName?: string; avatar?: string }>({});
	const hasAvatar = () => avatarUrl.trim().length > 0 && !avatarLoadFailed;

	const accountName = $derived.by(() => companyName.trim() || $t('profile.companyAccount'));
	const accountEmail = $derived.by(
		() => data.profile?.email ?? data.user.email ?? $t('profile.unknownEmail')
	);
	const normalizedLocale = $derived.by(() => getNormalizedLocale($locale));

	const getInitials = (value: string) => {
		const initials = value
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('');

		return initials || 'CC';
	};

	const clearLocalAvatarObjectUrl = () => {
		if (avatarObjectUrl) {
			URL.revokeObjectURL(avatarObjectUrl);
			avatarObjectUrl = null;
		}
	};

	onDestroy(() => {
		clearLocalAvatarObjectUrl();
	});

	const openMobileNav = () => {
		isMobileNavOpen = true;
	};

	const closeMobileNav = () => {
		isMobileNavOpen = false;
	};

	const handleAvatarImageError = () => {
		avatarLoadFailed = true;
	};

	const openProfileModal = () => {
		profileDraftCompanyName = companyName;
		avatarPreviewUrl = avatarUrl;
		avatarFile = null;
		avatarLoadFailed = false;
		profileFormError = '';
		profileFieldErrors = {};
		isProfileModalOpen = true;
	};

	const closeProfileModal = () => {
		if (isProfileSaving) {
			return;
		}

		clearLocalAvatarObjectUrl();
		avatarFile = null;
		avatarPreviewUrl = avatarUrl;
		profileFormError = '';
		profileFieldErrors = {};
		isProfileModalOpen = false;
	};

	const handleCompanyNameInput = (event: Event) => {
		profileDraftCompanyName = (event.currentTarget as HTMLInputElement).value;
		profileFieldErrors = {
			...profileFieldErrors,
			companyName: undefined
		};
		profileFormError = '';
	};

	const handleAvatarChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const selectedFile = input.files?.[0] ?? null;

		profileFieldErrors = {
			...profileFieldErrors,
			avatar: undefined
		};
		profileFormError = '';

		if (!selectedFile) {
			avatarFile = null;
			clearLocalAvatarObjectUrl();
			avatarPreviewUrl = avatarUrl;
			return;
		}

		const avatarValidationError = getAvatarValidationError(selectedFile);
		if (avatarValidationError) {
			avatarFile = null;
			profileFieldErrors = {
				...profileFieldErrors,
				avatar: avatarValidationError
			};
			input.value = '';
			return;
		}

		avatarFile = selectedFile;
		clearLocalAvatarObjectUrl();
		avatarObjectUrl = URL.createObjectURL(selectedFile);
		avatarPreviewUrl = avatarObjectUrl;
	};

	const handleLanguageChange = (value: string) => {
		setAppLocale(value);
	};

	const submitProfileUpdate = async (event: SubmitEvent) => {
		event.preventDefault();
		profileFormError = '';
		profileFieldErrors = {};

		const trimmedCompanyName = profileDraftCompanyName.trim();
		if (trimmedCompanyName.length < 2) {
			profileFieldErrors = {
				companyName: 'errors.companyNameMin'
			};
			return;
		}

		isProfileSaving = true;
		try {
			const formData = new FormData();
			formData.set('companyName', trimmedCompanyName);
			if (avatarFile) {
				formData.set('avatar', avatarFile);
			}

			const response = await fetch('/api/account/profile', {
				method: 'POST',
				body: formData
			});

			const payload = (await response.json().catch(() => null)) as ProfileUpdateResponse | null;

			if (!response.ok || !payload?.profile) {
				profileFieldErrors = payload?.fieldErrors ?? {};
				profileFormError = payload?.message ?? 'errors.profileUpdateFailedTryAgain';
				return;
			}

			companyName = payload.profile.companyName ?? '';
			avatarUrl = payload.profile.avatarUrl ?? '';
			avatarLoadFailed = false;
			profileDraftCompanyName = companyName;
			clearLocalAvatarObjectUrl();
			avatarFile = null;
			avatarPreviewUrl = avatarUrl;
			isProfileModalOpen = false;
		} catch {
			profileFormError = 'errors.profileUpdateUnexpected';
		} finally {
			isProfileSaving = false;
		}
	};
</script>

<div class="h-dvh bg-surface text-foreground">
	<div class="flex h-full flex-col p-3">
		<ProtectedMobileHeader onOpenMenu={openMobileNav} />

		<ProtectedDesktopHeader
			{navigationItems}
			{currentPath}
			hasAvatar={hasAvatar()}
			{avatarUrl}
			{accountName}
			{accountEmail}
			{getInitials}
			onOpenProfile={openProfileModal}
			onAvatarError={handleAvatarImageError}
		/>

		<main class="relative min-w-0 flex-1 overflow-auto overscroll-none sm:mt-4">
			<div
				class="absolute inset-0 overflow-hidden overscroll-none rounded-4xl bg-canvas p-4 sm:p-8"
			>
				{@render children()}
			</div>
		</main>
	</div>

	<ProtectedMobileSheet
		open={isMobileNavOpen}
		{navigationItems}
		{currentPath}
		hasAvatar={hasAvatar()}
		{avatarUrl}
		{accountName}
		{accountEmail}
		{getInitials}
		onClose={closeMobileNav}
		onOpenProfile={openProfileModal}
		onAvatarError={handleAvatarImageError}
	/>
</div>

<ProfileSettingsModal
	open={isProfileModalOpen}
	isSaving={isProfileSaving}
	{profileDraftCompanyName}
	{avatarPreviewUrl}
	{profileFieldErrors}
	{profileFormError}
	{accountName}
	currentLocale={normalizedLocale}
	{getInitials}
	onClose={closeProfileModal}
	onSubmit={submitProfileUpdate}
	onAvatarChange={handleAvatarChange}
	onCompanyNameInput={handleCompanyNameInput}
	onLanguageChange={handleLanguageChange}
/>
