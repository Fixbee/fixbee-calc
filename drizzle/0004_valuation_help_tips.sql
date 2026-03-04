CREATE TABLE "valuation_help_tips" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "valuation_help_tips_slug_unique" ON "valuation_help_tips" ("slug");

INSERT INTO "valuation_help_tips" ("slug", "title", "content", "sort_order")
VALUES
	(
		'imei',
		'IMEI',
		'[{"type":"paragraph","text":"IMEI is a unique phone number (15 digits)."},{"type":"paragraph","text":"You can check it:"},{"type":"bullets","items":["in Settings → About device","by dialing: *#06#"]}]'::jsonb,
		1
	),
	(
		'model',
		'Model',
		'[{"type":"paragraph","text":"If you are not sure about the model:"},{"type":"bullets","items":["check Settings → About device","or on the back cover of the phone"]}]'::jsonb,
		2
	),
	(
		'question-1',
		'Question 1',
		'[{"type":"paragraph","text":"Does the phone power on and display an image?"},{"type":"paragraph","text":"Try turning the phone on with the power button."},{"type":"paragraph","text":"If the screen does not light up or is completely black, choose NO."}]'::jsonb,
		3
	),
	(
		'question-2',
		'Question 2',
		'[{"type":"paragraph","text":"Does the phone have a lock (iCloud / Google / PIN / account)?"},{"type":"paragraph","text":"If the phone requires logging in to the previous owner account or entering a password, it means there is a lock."},{"type":"paragraph","text":"You can check this in: Settings → Accounts."},{"type":"paragraph","text":"In that case choose YES."}]'::jsonb,
		4
	),
	(
		'question-3',
		'Question 3',
		'[{"type":"paragraph","text":"Does the phone have serious damage?"},{"type":"paragraph","text":"Check whether the phone:"},{"type":"bullets","items":["is cracked or bent","has been water damaged","has missing parts (e.g. camera, buttons)"]},{"type":"paragraph","text":"Small scratches are NOT serious damage."}]'::jsonb,
		5
	),
	(
		'question-4',
		'Question 4',
		'[{"type":"paragraph","text":"Do all functions work?"},{"type":"paragraph","text":"Check the basic functions:"},{"type":"bullets","items":["touch","camera","charging"]},{"type":"paragraph","text":"If something does not work or works incorrectly, choose NO."}]'::jsonb,
		6
	),
	(
		'question-5',
		'Question 5',
		'[{"type":"paragraph","text":"Are the screen and housing scratched?"},{"type":"paragraph","text":"Inspect the device from about 20–30 cm at different angles."},{"type":"bullets","items":["no scratches → choose NO","light scratches → choose Light","deep scratches / dents → choose Deep"]}]'::jsonb,
		7
	),
	(
		'summary',
		'Summary',
		'[{"type":"paragraph","text":"The price is calculated automatically based on the device condition."},{"type":"paragraph","text":"The suggested maximum buyback price from the customer is about 80% of the further resale value."},{"type":"paragraph","text":"You can accept or reject the offer."}]'::jsonb,
		8
	);
