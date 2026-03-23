CREATE TYPE "public"."report_period_type" AS ENUM('week', 'month');--> statement-breakpoint

CREATE TABLE "admin_device_sales" (
	"user_id" uuid NOT NULL,
	"period_type" "report_period_type" NOT NULL,
	"period_start" date NOT NULL,
	"sold_devices_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_device_sales_pk" PRIMARY KEY("user_id", "period_type", "period_start"),
	CONSTRAINT "admin_device_sales_non_negative" CHECK ("sold_devices_count" >= 0)
);
--> statement-breakpoint

ALTER TABLE "admin_device_sales"
ADD CONSTRAINT "admin_device_sales_user_id_users_id_fk"
FOREIGN KEY ("user_id")
REFERENCES "public"."users"("id")
ON DELETE cascade
ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "admin_device_sales_period_idx"
ON "admin_device_sales" USING btree ("period_type", "period_start");--> statement-breakpoint

ALTER TABLE "admin_device_sales" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "admin_device_sales_select_admin"
ON "admin_device_sales"
FOR SELECT
TO authenticated
USING (public.is_admin());--> statement-breakpoint

CREATE POLICY "admin_device_sales_insert_admin"
ON "admin_device_sales"
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());--> statement-breakpoint

CREATE POLICY "admin_device_sales_update_admin"
ON "admin_device_sales"
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());--> statement-breakpoint

CREATE POLICY "admin_device_sales_delete_admin"
ON "admin_device_sales"
FOR DELETE
TO authenticated
USING (public.is_admin());--> statement-breakpoint
