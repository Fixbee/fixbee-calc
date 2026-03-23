-- Hotfix for environments where 0007 was applied before trigger hardening.
-- Ensures auth.users sync cannot elevate/downgrade roles via raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
	INSERT INTO public.users (id, email, company_name, avatar_url)
	VALUES (
		new.id,
		new.email,
		new.raw_user_meta_data ->> 'company_name',
		new.raw_user_meta_data ->> 'avatar_url'
	)
	ON CONFLICT (id) DO UPDATE
	SET email = excluded.email,
		company_name = excluded.company_name,
		avatar_url = excluded.avatar_url,
		updated_at = now();

	RETURN new;
END;
$$;
