<script lang="ts">
	import { AuthLogo, Button, Card, Input } from '$lib';
	import { t } from 'svelte-i18n';

	let { form } = $props();
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
						{$t('auth.forgotPassword.title')}
					</h1>
					<p class="text-sm font-medium text-foreground-muted">
						{$t('auth.forgotPassword.subtitle')}
					</p>
				</header>

				<form class="space-y-6" method="POST" novalidate>
					<div>
						<label class="mb-1.5 inline-block text-label select-none" for="recovery-email">
							{$t('common.email')}
						</label>
						<Input
							id="recovery-email"
							type="email"
							name="email"
							placeholder={$t('auth.forgotPassword.emailPlaceholder')}
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

					<div class="grid grid-cols-2 gap-3">
						<Button size="full" variant="secondary" type="button" onclick={() => history.back()}>
							{$t('common.goBack')}
						</Button>
						<Button size="full" type="submit">{$t('common.sendLink')}</Button>
					</div>

					{#if form?.formError}
						<p class="text-xs text-destructive">{$t(form.formError)}</p>
					{/if}

					{#if form?.success}
						<p class="text-xs text-foreground">{$t(form.message)}</p>
					{/if}
				</form>
			</Card>
		</div>
	</div>
</div>
