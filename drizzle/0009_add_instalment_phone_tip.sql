INSERT INTO "valuation_help_tips" (
	"slug",
	"title",
	"title_en",
	"title_pl",
	"content",
	"content_en",
	"content_pl",
	"sort_order"
)
VALUES (
	'instalment-phone',
	'Instalment phone',
	'Instalment phone',
	'Telefon ratalny',
	'[{"type":"paragraph","text":"If the phone is under instalment financing, mark this option in details."},{"type":"paragraph","text":"When enabled, the final valuation is automatically reduced by 50%."}]'::jsonb,
	'[{"type":"paragraph","text":"If the phone is under instalment financing, mark this option in details."},{"type":"paragraph","text":"When enabled, the final valuation is automatically reduced by 50%."}]'::jsonb,
	'[{"type":"paragraph","text":"Jeśli telefon jest w trakcie spłaty ratalnej, zaznacz tę opcję w danych urządzenia."},{"type":"paragraph","text":"Po zaznaczeniu końcowa wycena zostanie automatycznie obniżona o 50%."}]'::jsonb,
	9
)
ON CONFLICT ("slug") DO UPDATE
SET
	"title" = excluded."title",
	"title_en" = excluded."title_en",
	"title_pl" = excluded."title_pl",
	"content" = excluded."content",
	"content_en" = excluded."content_en",
	"content_pl" = excluded."content_pl",
	"sort_order" = excluded."sort_order",
	"updated_at" = now();
