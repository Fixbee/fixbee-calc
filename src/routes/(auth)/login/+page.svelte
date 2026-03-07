<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { AuthLogo, Button, Card, Checkbox, Input } from '$lib';
	import { resolve } from '$app/paths';
	import { t } from 'svelte-i18n';

	let { data, form } = $props();
	const currentYear = new Date().getFullYear();
	let isSubmitting = $state(false);

	const submitEnhance: SubmitFunction = () => {
		isSubmitting = true;

		return async ({ update }) => {
			try {
				await update();
			} finally {
				isSubmitting = false;
			}
		};
	};
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
						{$t('auth.login.title')}
					</h1>
					<p class="text-sm font-medium text-foreground-muted">
						{$t('auth.login.subtitle')}
					</p>
				</header>

				<form class="space-y-5" method="POST" novalidate use:enhance={submitEnhance}>
					<div>
						<label class="mb-1.5 inline-block text-label select-none" for="email">
							{$t('common.email')}
						</label>
						<Input
							id="email"
							type="email"
							name="email"
							placeholder={$t('auth.login.emailPlaceholder')}
							autocomplete="email"
							required
							value={form?.values?.email ?? ''}
							aria-invalid={Boolean(form?.fieldErrors?.email)}
							class={form?.fieldErrors?.email
								? 'border-destructive/70 focus-visible:ring-destructive/55'
								: ''}
						/>
						{#if form?.fieldErrors?.email}
							<p class="mt-1.5 text-xs text-destructive">
								{$t(form.fieldErrors.email)}
							</p>
						{/if}
					</div>

					<div>
						<label class="mb-1.5 inline-block text-label select-none" for="password">
							{$t('common.password')}
						</label>
						<Input
							id="password"
							type="password"
							name="password"
							placeholder={$t('auth.login.passwordPlaceholder')}
							autocomplete="current-password"
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

					<div class="flex items-center justify-between text-xs text-foreground-muted">
						<Checkbox name="remember" checked={form?.values?.remember ?? data.remember}>
							{$t('common.rememberMe')}
						</Checkbox>
						<a
							class="text-link underline underline-offset-4 transition-all duration-200 hover:text-link-hover"
							href={resolve(`/forgot-password` as Parameters<typeof resolve>[0])}
						>
							{$t('common.forgotPassword')}
						</a>
					</div>

					<div class="grid grid-cols-1 gap-3 pt-1">
						<Button class="hidden" size="full" variant="secondary" type="button">
							{$t('common.requestAccess')}
						</Button>
						<Button size="full" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
							{#if isSubmitting}
								<span class="inline-flex items-center gap-2">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										class="size-3.5 animate-spin"
										aria-hidden="true"
									>
										<circle
											cx="12"
											cy="12"
											r="9"
											stroke="currentColor"
											stroke-opacity="0.3"
											stroke-width="2"
										/>
										<path
											d="M12 3a9 9 0 0 1 9 9"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
										/>
									</svg>
									{$t('common.loggingIn')}
								</span>
							{:else}
								{$t('common.logIn')}
							{/if}
						</Button>
					</div>

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
