<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import LanguageCombobox from '$lib/components/account/LanguageCombobox.svelte';
	import { ALLOWED_AVATAR_ACCEPT } from '$lib/account/profile';
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
						{#if avatarPreviewUrl}
							<img
								src={avatarPreviewUrl}
								alt={getDisplayName()}
								class="size-16 rounded-full border border-border object-cover"
							/>
						{:else}
							<div
								class="inline-flex size-16 items-center justify-center rounded-full bg-accent text-base font-medium text-accent-foreground"
							>
								{getInitials(getDisplayName())}
							</div>
						{/if}

						<div class="min-w-0 flex-1">
							<label class="mb-1.5 inline-block text-label select-none" for="avatar">
								{$t('profile.avatar')}
							</label>
							<input
								id="avatar"
								type="file"
								accept={ALLOWED_AVATAR_ACCEPT}
								onchange={onAvatarChange}
								class="block w-full text-xs text-foreground-muted transition-all duration-200 file:mr-3 file:rounded-xl file:border-0 file:bg-input file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground hover:file:bg-input-secondary"
							/>
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
