<script lang="ts">
	import { Button, Input } from '$lib';
</script>

<div class="auth-shell">
	<div class="auth-stage">
		<section class="auth-card">
			<header class="mb-8 space-y-2">
				<h1 class="auth-title">Reset password</h1>
				<p class="auth-subtitle">Enter your account email and we will send a reset link.</p>
			</header>

			<form class="space-y-6">
				<div>
					<label class="auth-label" for="recovery-email">Email</label>
					<Input
						id="recovery-email"
						type="email"
						name="email"
						placeholder="you@company.com"
						autocomplete="email"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<Button size="full" variant="secondary" type="button" onclick={() => history.back()}>
						Go back
					</Button>
					<Button size="full" type="submit">Send link</Button>
				</div>
			</form>

			<div class="auth-divider my-6"></div>

			<p class="auth-footnote">
				Back to <a class="auth-link" href="/login">log in</a> if you remembered your password.
			</p>
		</section>
	</div>
</div>
