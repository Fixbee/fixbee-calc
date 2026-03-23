UPDATE "valuation_help_tips"
SET
	"content" = '[{"type":"paragraph","text":"If the phone is under instalment financing, mark this option in details."}]'::jsonb,
	"content_en" = '[{"type":"paragraph","text":"If the phone is under instalment financing, mark this option in details."}]'::jsonb,
	"content_pl" = '[{"type":"paragraph","text":"Jeśli telefon jest w trakcie spłaty ratalnej, zaznacz tę opcję w danych urządzenia."}]'::jsonb,
	"updated_at" = now()
WHERE "slug" = 'instalment-phone';
