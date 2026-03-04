ALTER TABLE "valuation_help_tips" ADD COLUMN "title_en" text;
ALTER TABLE "valuation_help_tips" ADD COLUMN "title_pl" text;
ALTER TABLE "valuation_help_tips" ADD COLUMN "content_en" jsonb;
ALTER TABLE "valuation_help_tips" ADD COLUMN "content_pl" jsonb;

UPDATE "valuation_help_tips"
SET
	"title_en" = "title",
	"content_en" = "content";

UPDATE "valuation_help_tips"
SET
	"title_pl" = 'IMEI',
	"content_pl" = '[{"type":"paragraph","text":"IMEI to unikalny numer telefonu (15 cyfr)."},{"type":"paragraph","text":"Możesz go sprawdzić:"},{"type":"bullets","items":["w Ustawieniach → Informacje o telefonie","wybierając kod: *#06#"]}]'::jsonb
WHERE "slug" = 'imei';

UPDATE "valuation_help_tips"
SET
	"title_pl" = 'Model',
	"content_pl" = '[{"type":"paragraph","text":"Jeśli nie masz pewności co do modelu:"},{"type":"bullets","items":["sprawdź Ustawienia → Informacje o telefonie","lub na tylnej obudowie telefonu"]}]'::jsonb
WHERE "slug" = 'model';

UPDATE "valuation_help_tips"
SET
	"title_pl" = 'Pytanie 1',
	"content_pl" = '[{"type":"paragraph","text":"Czy telefon się włącza i wyświetla obraz?"},{"type":"paragraph","text":"Spróbuj włączyć telefon przyciskiem zasilania."},{"type":"paragraph","text":"Jeśli ekran się nie podświetla lub jest całkiem czarny, wybierz NIE."}]'::jsonb
WHERE "slug" = 'question-1';

UPDATE "valuation_help_tips"
SET
	"title_pl" = 'Pytanie 2',
	"content_pl" = '[{"type":"paragraph","text":"Czy telefon ma blokadę (iCloud / Google / PIN / konto)?"},{"type":"paragraph","text":"Jeśli telefon wymaga zalogowania się na konto poprzedniego właściciela lub wpisania hasła, oznacza to blokadę."},{"type":"paragraph","text":"Możesz to sprawdzić w: Ustawienia → Konta."},{"type":"paragraph","text":"W takim przypadku wybierz TAK."}]'::jsonb
WHERE "slug" = 'question-2';

UPDATE "valuation_help_tips"
SET
	"title_pl" = 'Pytanie 3',
	"content_pl" = '[{"type":"paragraph","text":"Czy telefon ma poważne uszkodzenia?"},{"type":"paragraph","text":"Sprawdź, czy telefon:"},{"type":"bullets","items":["jest pęknięty lub wygięty","ma ślady zalania","ma brakujące elementy (np. aparat, przyciski)"]},{"type":"paragraph","text":"Drobne rysy NIE są poważnym uszkodzeniem."}]'::jsonb
WHERE "slug" = 'question-3';

UPDATE "valuation_help_tips"
SET
	"title_pl" = 'Pytanie 4',
	"content_pl" = '[{"type":"paragraph","text":"Czy wszystkie funkcje działają?"},{"type":"paragraph","text":"Sprawdź podstawowe funkcje:"},{"type":"bullets","items":["dotyk","aparat","ładowanie"]},{"type":"paragraph","text":"Jeśli coś nie działa lub działa nieprawidłowo, wybierz NIE."}]'::jsonb
WHERE "slug" = 'question-4';

UPDATE "valuation_help_tips"
SET
	"title_pl" = 'Pytanie 5',
	"content_pl" = '[{"type":"paragraph","text":"Czy ekran i obudowa są porysowane?"},{"type":"paragraph","text":"Oceń urządzenie z odległości ok. 20–30 cm pod różnymi kątami."},{"type":"bullets","items":["brak rys → wybierz NIE","lekkie rysy → wybierz Lekkie","głębokie rysy / wgniecenia → wybierz Głębokie"]}]'::jsonb
WHERE "slug" = 'question-5';

UPDATE "valuation_help_tips"
SET
	"title_pl" = 'Podsumowanie',
	"content_pl" = '[{"type":"paragraph","text":"Cena jest wyliczana automatycznie na podstawie stanu urządzenia."},{"type":"paragraph","text":"Sugerowana maksymalna cena odkupu od klienta to około 80% dalszej wartości odsprzedaży."},{"type":"paragraph","text":"Możesz zaakceptować lub odrzucić ofertę."}]'::jsonb
WHERE "slug" = 'summary';

ALTER TABLE "valuation_help_tips" ALTER COLUMN "title_en" SET NOT NULL;
ALTER TABLE "valuation_help_tips" ALTER COLUMN "title_pl" SET NOT NULL;
ALTER TABLE "valuation_help_tips" ALTER COLUMN "content_en" SET NOT NULL;
ALTER TABLE "valuation_help_tips" ALTER COLUMN "content_pl" SET NOT NULL;
