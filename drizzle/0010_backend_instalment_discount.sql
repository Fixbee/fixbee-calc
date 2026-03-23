CREATE TABLE "app_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"instalment_discount_percent" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_singleton_id" CHECK ("id" = 1),
	CONSTRAINT "app_settings_instalment_discount_percent_range" CHECK ("instalment_discount_percent" >= 0 AND "instalment_discount_percent" <= 100)
);
--> statement-breakpoint

INSERT INTO "app_settings" ("id", "instalment_discount_percent")
VALUES (1, 50)
ON CONFLICT ("id") DO UPDATE
SET
	"instalment_discount_percent" = excluded."instalment_discount_percent",
	"updated_at" = now();
--> statement-breakpoint

ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "app_settings_select_authenticated"
ON "app_settings"
FOR SELECT
TO authenticated
USING (true);--> statement-breakpoint

CREATE POLICY "app_settings_insert_admin"
ON "app_settings"
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());--> statement-breakpoint

CREATE POLICY "app_settings_update_admin"
ON "app_settings"
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());--> statement-breakpoint

CREATE POLICY "app_settings_delete_admin"
ON "app_settings"
FOR DELETE
TO authenticated
USING (public.is_admin());--> statement-breakpoint

UPDATE "valuation_help_tips"
SET
	"content" = '[{"type":"paragraph","text":"If the phone is under instalment financing, mark this option in details."},{"type":"paragraph","text":"When enabled, the final valuation is automatically reduced according to current settings."}]'::jsonb,
	"content_en" = '[{"type":"paragraph","text":"If the phone is under instalment financing, mark this option in details."},{"type":"paragraph","text":"When enabled, the final valuation is automatically reduced according to current settings."}]'::jsonb,
	"content_pl" = '[{"type":"paragraph","text":"Jeśli telefon jest w trakcie spłaty ratalnej, zaznacz tę opcję w danych urządzenia."},{"type":"paragraph","text":"Po zaznaczeniu końcowa wycena zostanie automatycznie obniżona zgodnie z aktualnymi ustawieniami."}]'::jsonb,
	"updated_at" = now()
WHERE "slug" = 'instalment-phone';--> statement-breakpoint
