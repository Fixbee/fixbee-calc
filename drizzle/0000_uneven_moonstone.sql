CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"company_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "users" ADD CONSTRAINT "users_id_auth_users_fk" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE cascade;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
	INSERT INTO public.users (id, email, company_name)
	VALUES (new.id, new.email, new.raw_user_meta_data ->> 'company_name')
	ON CONFLICT (id) DO UPDATE
	SET email = excluded.email,
		company_name = excluded.company_name,
		updated_at = now();

	RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user();

CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user();

CREATE POLICY "users_select_own"
ON "users"
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

CREATE POLICY "users_update_own"
ON "users"
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);
