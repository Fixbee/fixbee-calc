CREATE TYPE "public"."app_role" AS ENUM('admin', 'user');--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN "role" "app_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.users AS u
		WHERE u.id = auth.uid()
			AND u.role = 'admin'::public.app_role
	);
$$;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;--> statement-breakpoint

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
$$;--> statement-breakpoint

DROP POLICY IF EXISTS "users_select_own" ON "users";--> statement-breakpoint
DROP POLICY IF EXISTS "users_update_own" ON "users";--> statement-breakpoint

CREATE POLICY "users_select_self_or_admin"
ON "users"
FOR SELECT
TO authenticated
USING (((SELECT auth.uid()) = id) OR public.is_admin());--> statement-breakpoint

CREATE POLICY "users_update_self_or_admin"
ON "users"
FOR UPDATE
TO authenticated
USING (((SELECT auth.uid()) = id) OR public.is_admin())
WITH CHECK (((SELECT auth.uid()) = id) OR public.is_admin());--> statement-breakpoint

CREATE POLICY "users_insert_admin"
ON "users"
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());--> statement-breakpoint

CREATE POLICY "users_delete_admin"
ON "users"
FOR DELETE
TO authenticated
USING (public.is_admin());--> statement-breakpoint

DROP POLICY IF EXISTS "valuations_select_own" ON "valuations";--> statement-breakpoint
DROP POLICY IF EXISTS "valuations_insert_own" ON "valuations";--> statement-breakpoint
DROP POLICY IF EXISTS "valuations_update_own" ON "valuations";--> statement-breakpoint

CREATE POLICY "valuations_select_self_or_admin"
ON "valuations"
FOR SELECT
TO authenticated
USING (((SELECT auth.uid()) = user_id) OR public.is_admin());--> statement-breakpoint

CREATE POLICY "valuations_insert_self_or_admin"
ON "valuations"
FOR INSERT
TO authenticated
WITH CHECK (((SELECT auth.uid()) = user_id) OR public.is_admin());--> statement-breakpoint

CREATE POLICY "valuations_update_self_or_admin"
ON "valuations"
FOR UPDATE
TO authenticated
USING (((SELECT auth.uid()) = user_id) OR public.is_admin())
WITH CHECK (((SELECT auth.uid()) = user_id) OR public.is_admin());--> statement-breakpoint

CREATE POLICY "valuations_delete_self_or_admin"
ON "valuations"
FOR DELETE
TO authenticated
USING (((SELECT auth.uid()) = user_id) OR public.is_admin());--> statement-breakpoint

CREATE POLICY "phone_models_insert_admin"
ON "phone_models"
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());--> statement-breakpoint

CREATE POLICY "phone_models_update_admin"
ON "phone_models"
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());--> statement-breakpoint

CREATE POLICY "phone_models_delete_admin"
ON "phone_models"
FOR DELETE
TO authenticated
USING (public.is_admin());--> statement-breakpoint
