<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import LanguageCombobox from '$lib/components/account/LanguageCombobox.svelte';
	import { ALLOWED_AVATAR_ACCEPT } from '$lib/account/profile';
	import { Camera } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import { t } from 'svelte-i18n';

	type ProfileFieldErrors = {
		companyName?: string;
		avatar?: string;
	};

	type Props = {
		open: boolean;
		isSaving: boolean;
		profileDraftCompanyName: string;
		avatarPreviewUrl: string;
		profileFieldErrors: ProfileFieldErrors;
		profileFormError: string;
		accountName: string;
		currentLocale: string;
		getInitials: (value: string) => string;
		onClose: () => void;
		onSubmit: (event: SubmitEvent) => void;
		onAvatarChange: (event: Event) => void;
		onCompanyNameInput: (event: Event) => void;
		onLanguageChange: (value: string) => void;
	};

	let {
		open,
		isSaving,
		profileDraftCompanyName,
		avatarPreviewUrl,
		profileFieldErrors,
		profileFormError,
		accountName,
		currentLocale,
		getInitials,
		onClose,
		onSubmit,
		onAvatarChange,
		onCompanyNameInput,
		onLanguageChange
	}: Props = $props();

	const getDisplayName = () => profileDraftCompanyName || accountName;
	let avatarFileName = $state('');

	const handleAvatarChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement | null;
		avatarFileName = input?.files?.[0]?.name ?? '';
		onAvatarChange(event);
	};

	const languageOptions = $derived.by(() => [
		{ id: 'en', label: $t('common.english') },
		{ id: 'pl', label: $t('common.polish') }
	]);
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
		<button
			type="button"
			class="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
			onclick={onClose}
			aria-label={$t('aria.closeProfileModal')}
			in:fade={{ duration: 130 }}
			out:fade={{ duration: 110 }}
		></button>

		<div in:scale={{ duration: 180, start: 0.96 }} out:scale={{ duration: 140, start: 0.98 }}>
			<Card class="relative z-1 w-sm p-6 sm:w-lg">
				<header class="mb-6 space-y-2">
					<h2
						id="profile-modal-title"
						class="text-xl leading-none tracking-tight text-foreground text-shadow-2xs text-shadow-title-shadow"
					>
						{$t('profile.title')}
					</h2>
					<p class="text-sm font-medium text-foreground-muted">
						{$t('profile.subtitle')}
					</p>
				</header>

				<form class="space-y-5" onsubmit={onSubmit} novalidate>
					<div class="flex items-center gap-4">
						<div class="relative size-16 shrink-0">
							{#if avatarPreviewUrl}
								<img
									src={avatarPreviewUrl}
									alt={getDisplayName()}
									class="size-full rounded-full border border-border object-cover"
								/>
							{:else}
								<div
									class="inline-flex size-full items-center justify-center rounded-full bg-accent text-base font-medium text-accent-foreground"
								>
									{getInitials(getDisplayName())}
								</div>
							{/if}
							<input
								id="avatar"
								type="file"
								accept={ALLOWED_AVATAR_ACCEPT}
								onchange={handleAvatarChange}
								class="peer sr-only"
							/>
							<label
								for="avatar"
								class="peer-focus-visible:ring-ring absolute -right-1 -bottom-1 inline-flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-canvas text-foreground shadow-sm transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 hover:bg-sidebar"
							>
								<span class="sr-only">{$t('profile.changeAvatar')}</span>
								<Camera class="size-3.5" aria-hidden="true" />
							</label>
						</div>

						<div class="min-w-0 flex-1">
							<p class="mb-1.5 text-label select-none">
								{$t('profile.avatar')}
							</p>
							<p class="mt-1.5 truncate text-xs text-foreground-muted">
								{avatarFileName || $t('profile.noFileSelected')}
							</p>
							{#if profileFieldErrors.avatar}
								<p class="mt-1.5 text-xs text-destructive">
									{$t(profileFieldErrors.avatar)}
								</p>
							{/if}
						</div>
					</div>

					<div>
						<label class="mb-1.5 inline-block text-label select-none" for="companyName">
							{$t('profile.companyName')}
						</label>
						<Input
							id="companyName"
							type="text"
							name="companyName"
							required
							value={profileDraftCompanyName}
							oninput={onCompanyNameInput}
							aria-invalid={Boolean(profileFieldErrors.companyName)}
							class={profileFieldErrors.companyName
								? 'border-destructive/70 focus-visible:ring-destructive/55'
								: ''}
						/>
						{#if profileFieldErrors.companyName}
							<p class="mt-1.5 text-xs text-destructive">
								{$t(profileFieldErrors.companyName)}
							</p>
						{/if}
					</div>

					<div>
						<label class="mb-1.5 inline-block text-label select-none" for="language">
							{$t('common.language')}
						</label>
						<LanguageCombobox
							id="language"
							options={languageOptions}
							placeholder={$t('common.language')}
							value={currentLocale}
							onChange={onLanguageChange}
						/>
					</div>

					<div class="grid grid-cols-2 gap-3 pt-1">
						<Button
							size="full"
							variant="secondary"
							type="button"
							onclick={onClose}
							disabled={isSaving}
						>
							{$t('common.cancel')}
						</Button>
						<Button size="full" type="submit" disabled={isSaving}>
							{isSaving ? $t('common.saving') : $t('common.saveChanges')}
						</Button>
					</div>

					{#if profileFormError}
						<p class="text-xs text-destructive">{$t(profileFormError)}</p>
					{/if}
				</form>
			</Card>
		</div>
	</div>
{/if}
