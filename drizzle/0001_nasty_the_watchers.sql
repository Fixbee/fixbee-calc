ALTER TABLE "users" ADD COLUMN "avatar_url" text;

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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'company-avatars',
	'company-avatars',
	true,
	5242880,
	ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;
