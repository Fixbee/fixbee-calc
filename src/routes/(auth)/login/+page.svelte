<script lang="ts">
	import { Button, Input } from '$lib';
</script>

<div class="auth-shell">
	<div class="auth-stage">
		<section class="auth-card">
			<header class="mb-8 space-y-2">
				<h1 class="auth-title">Welcome back</h1>
				<p class="auth-subtitle">Log in to continue to your secured workspace.</p>
			</header>

			<form class="space-y-5">
				<div>
					<label class="auth-label" for="email">Email</label>
					<Input
						id="email"
						type="email"
						name="email"
						placeholder="you@company.com"
						autocomplete="email"
					/>
				</div>

				<div>
					<label class="auth-label" for="password">Password</label>
					<Input
						id="password"
						type="password"
						name="password"
						placeholder="Enter your password"
						autocomplete="current-password"
					/>
				</div>

				<div class="flex items-center justify-between text-xs text-auth-foreground-muted">
					<label class="inline-flex items-center gap-2">
						<input
							class="size-4 rounded border-auth-border bg-auth-input accent-auth-accent"
							type="checkbox"
							name="remember"
						/>
						Remember me
					</label>
					<a class="auth-link" href="/forgot-password">Forgot password?</a>
				</div>

				<div class="grid grid-cols-2 gap-3 pt-1">
					<Button size="full" variant="secondary" type="button">Request access</Button>
					<Button size="full" type="submit">Log in</Button>
				</div>
			</form>
		</section>
	</div>
</div>
