ALTER TABLE "valuations" DROP CONSTRAINT IF EXISTS "valuations_phone_model_id_phone_models_id_fk";--> statement-breakpoint

CREATE TABLE "phone_models_backup_v3" AS
SELECT
	"id",
	"model",
	"price_a" AS "base_price",
	"created_at",
	"updated_at"
FROM "phone_models";--> statement-breakpoint

DROP TABLE "phone_models";--> statement-breakpoint

CREATE TABLE "phone_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"base_price" integer NOT NULL,
	"grade_a_percent" integer NOT NULL,
	"grade_b_percent" integer NOT NULL,
	"grade_c_percent" integer NOT NULL,
	"grade_d_percent" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phone_models_model_unique" UNIQUE("model")
);
--> statement-breakpoint

INSERT INTO "phone_models" (
	"id",
	"model",
	"base_price",
	"grade_a_percent",
	"grade_b_percent",
	"grade_c_percent",
	"grade_d_percent",
	"created_at",
	"updated_at"
)
SELECT
	"id",
	"model",
	"base_price",
	100,
	75,
	55,
	23,
	"created_at",
	"updated_at"
FROM "phone_models_backup_v3"
ORDER BY "id";--> statement-breakpoint

DROP TABLE "phone_models_backup_v3";--> statement-breakpoint

ALTER TABLE "phone_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "phone_models_select_authenticated"
ON "phone_models"
FOR SELECT
TO authenticated
USING (true);--> statement-breakpoint

ALTER TABLE "valuations" ADD CONSTRAINT "valuations_phone_model_id_phone_models_id_fk" FOREIGN KEY ("phone_model_id") REFERENCES "public"."phone_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

SELECT setval(
	pg_get_serial_sequence('phone_models', 'id'),
	(SELECT COALESCE(MAX(id), 1) FROM "phone_models")
);--> statement-breakpoint
