<script lang="ts">
	import { AuthLogo, Button, Card, Input } from '$lib';
	import { t } from 'svelte-i18n';

	let { form } = $props();
	const currentYear = new Date().getFullYear();
</script>

<div class="relative isolate h-dvh overflow-hidden bg-canvas">
	<div class="relative z-3 flex h-dvh items-center justify-center p-8">
		<div class="w-full max-w-120">
			<AuthLogo />
			<Card>
				<header class="mb-6 space-y-2">
					<h1
						class="text-xl leading-none tracking-tight text-foreground text-shadow-2xs text-shadow-title-shadow"
					>
						{$t('auth.updatePassword.title')}
					</h1>
					<p class="text-sm font-medium text-foreground-muted">
						{$t('auth.updatePassword.subtitle')}
					</p>
				</header>

				<form class="space-y-5" method="POST" novalidate>
					<div>
						<label class="mb-1.5 inline-block text-label select-none" for="password">
							{$t('common.password')}
						</label>
						<Input
							id="password"
							type="password"
							name="password"
							autocomplete="new-password"
							placeholder={$t('auth.updatePassword.passwordPlaceholder')}
							required
							aria-invalid={Boolean(form?.fieldErrors?.password)}
							class={form?.fieldErrors?.password
								? 'border-destructive/70 focus-visible:ring-destructive/55'
								: ''}
						/>
						{#if form?.fieldErrors?.password}
							<p class="mt-1.5 text-xs text-destructive">
								{$t(form.fieldErrors.password)}
							</p>
						{/if}
					</div>

					<div>
						<label class="mb-1.5 inline-block text-label select-none" for="confirmPassword">
							{$t('common.confirmPassword')}
						</label>
						<Input
							id="confirmPassword"
							type="password"
							name="confirmPassword"
							autocomplete="new-password"
							placeholder={$t('auth.updatePassword.confirmPasswordPlaceholder')}
							required
							aria-invalid={Boolean(form?.fieldErrors?.confirmPassword)}
							class={form?.fieldErrors?.confirmPassword
								? 'border-destructive/70 focus-visible:ring-destructive/55'
								: ''}
						/>
						{#if form?.fieldErrors?.confirmPassword}
							<p class="mt-1.5 text-xs text-destructive">
								{$t(form.fieldErrors.confirmPassword)}
							</p>
						{/if}
					</div>

					<Button size="full" type="submit">{$t('common.savePassword')}</Button>

					{#if form?.formError}
						<p class="text-xs text-destructive">{$t(form.formError)}</p>
					{/if}
				</form>
			</Card>
		</div>
	</div>
	<p
		class="pointer-events-none absolute right-0 bottom-4 left-0 z-4 text-center text-[11px] text-foreground-muted/85"
	>
		{$t('common.rightsReserved', { values: { year: currentYear } })}
	</p>
</div>
