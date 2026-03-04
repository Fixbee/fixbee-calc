CREATE TYPE "public"."phone_cosmetic_condition" AS ENUM('none', 'light', 'heavy');--> statement-breakpoint
CREATE TYPE "public"."valuation_grade" AS ENUM('A', 'B', 'C', 'D');--> statement-breakpoint
CREATE TYPE "public"."valuation_status" AS ENUM('accepted', 'rejected', 'abandoned');--> statement-breakpoint
CREATE TABLE "phone_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"price_a" integer NOT NULL,
	"price_b" integer NOT NULL,
	"price_c" integer NOT NULL,
	"price_d" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phone_models_model_unique" UNIQUE("model")
);
--> statement-breakpoint
CREATE TABLE "valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phone_model_id" integer NOT NULL,
	"phone_color" text NOT NULL,
	"imei" text,
	"imei_unreadable" boolean DEFAULT false NOT NULL,
	"powers_on_and_displays_image" boolean NOT NULL,
	"has_lock" boolean NOT NULL,
	"has_visible_damage" boolean NOT NULL,
	"all_functions_work" boolean NOT NULL,
	"cosmetic_condition" "phone_cosmetic_condition" NOT NULL,
	"grade" "valuation_grade" NOT NULL,
	"proposed_price" integer NOT NULL,
	"status" "valuation_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_phone_model_id_phone_models_id_fk" FOREIGN KEY ("phone_model_id") REFERENCES "public"."phone_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "valuations_user_id_created_at_idx" ON "valuations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "valuations_status_idx" ON "valuations" USING btree ("status");--> statement-breakpoint

ALTER TABLE "phone_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "valuations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "phone_models_select_authenticated"
ON "phone_models"
FOR SELECT
TO authenticated
USING (true);--> statement-breakpoint

CREATE POLICY "valuations_select_own"
ON "valuations"
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);--> statement-breakpoint

CREATE POLICY "valuations_insert_own"
ON "valuations"
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);--> statement-breakpoint

CREATE POLICY "valuations_update_own"
ON "valuations"
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);--> statement-breakpoint

INSERT INTO "phone_models" ("id", "model", "price_a", "price_b", "price_c", "price_d")
VALUES
	(1, 'iPhone 12 - 64 GB', 60000, 45000, 33000, 13800),
	(2, 'iPhone 12 - 128 GB', 65000, 48800, 35800, 15000),
	(3, 'iPhone 12 Pro - 128 GB', 80000, 60000, 44000, 18400),
	(4, 'iPhone 12 Pro - 256 GB', 90000, 67500, 49500, 20700),
	(5, 'iPhone 13 Pro - 128 GB', 120000, 90000, 66000, 27600),
	(6, 'iPhone 13 Pro Max - 128 GB', 130000, 97500, 71500, 29900),
	(7, 'iPhone 14 Pro - 128 GB', 140000, 105000, 77000, 32200),
	(8, 'iPhone 14 Pro - 256 GB', 145000, 108800, 79800, 33400),
	(9, 'iPhone 15 Pro - 128 GB', 180000, 135000, 99000, 41400),
	(10, 'Samsung S22 Ultra - 128 GB', 110000, 82500, 60500, 25300),
	(11, 'Samsung S23 Ultra - 128 GB', 130000, 97500, 71500, 29900),
	(12, 'Samsung S24 Ultra - 128GB', 170000, 127500, 93500, 39100)
ON CONFLICT ("id") DO UPDATE
SET model = excluded.model,
	price_a = excluded.price_a,
	price_b = excluded.price_b,
	price_c = excluded.price_c,
	price_d = excluded.price_d,
	updated_at = now();--> statement-breakpoint

SELECT setval(
	pg_get_serial_sequence('phone_models', 'id'),
	(SELECT COALESCE(MAX(id), 1) FROM "phone_models")
);
