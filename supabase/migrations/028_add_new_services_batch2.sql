-- ============================================================
-- Migration: Add New Service Types (Batch 2)
-- Description: Add new service types:
--   - psychologist (Wellness)
--   - flower_gift_delivery (Events)
--   - ready_meals (Events)
--   - pet_grooming (Home Services)
--   - pet_transport (Home Services)
--   - welding (Home Services)
--   - engraving (Home Services)
--   - phone_tablet_repair (Home Services)
--   - audio_photo_repair (Home Services)
--   - esoterics (Wellness)
-- Also renames yoga_instructor to "Yoga & Meditation"
-- ============================================================

DO $$
DECLARE
    home_id UUID;
    events_id UUID;
    wellness_id UUID;
    new_type_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO home_id FROM service_categories WHERE slug = 'home_services';
    SELECT id INTO events_id FROM service_categories WHERE slug = 'events_tourism';
    SELECT id INTO wellness_id FROM service_categories WHERE slug = 'lifestyle_wellness';

    -- ============================================================
    -- Update yoga_instructor label to "Yoga & Meditation"
    -- ============================================================
    UPDATE service_i18n SET title = 'Yoga & Meditation'
    WHERE entity_id = (SELECT id FROM service_types WHERE slug = 'yoga_instructor') AND locale = 'en' AND entity_type = 'type';
    UPDATE service_i18n SET title = 'Йога и медитация'
    WHERE entity_id = (SELECT id FROM service_types WHERE slug = 'yoga_instructor') AND locale = 'ru' AND entity_type = 'type';
    UPDATE service_i18n SET title = 'Йога та медитація'
    WHERE entity_id = (SELECT id FROM service_types WHERE slug = 'yoga_instructor') AND locale = 'uk' AND entity_type = 'type';
    UPDATE service_i18n SET title = 'Yoga y Meditación'
    WHERE entity_id = (SELECT id FROM service_types WHERE slug = 'yoga_instructor') AND locale = 'es' AND entity_type = 'type';

    -- ============================================================
    -- 1. Psychologist (Wellness)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'psychologist') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (wellness_id, 'psychologist', '🧠', 110) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Psychologist'),
            ('type', new_type_id, 'ru', 'Психолог'),
            ('type', new_type_id, 'uk', 'Психолог'),
            ('type', new_type_id, 'es', 'Psicólogo');
    END IF;

    -- ============================================================
    -- 2. Flower & Gift Delivery (Events)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'flower_gift_delivery') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (events_id, 'flower_gift_delivery', '🎁', 111) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Flower & Gift Delivery'),
            ('type', new_type_id, 'ru', 'Доставка цветов и подарков'),
            ('type', new_type_id, 'uk', 'Доставка квітів та подарунків'),
            ('type', new_type_id, 'es', 'Entrega de Flores y Regalos');
    END IF;

    -- ============================================================
    -- 3. Ready Meals & Cooking (Events)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'ready_meals') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (events_id, 'ready_meals', '🍲', 112) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Ready Meals & Cooking'),
            ('type', new_type_id, 'ru', 'Готовые блюда и кулинария'),
            ('type', new_type_id, 'uk', 'Готові страви та кулінарія'),
            ('type', new_type_id, 'es', 'Comidas Preparadas y Cocina');
    END IF;

    -- ============================================================
    -- 4. Pet Grooming (Home Services)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'pet_grooming') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (home_id, 'pet_grooming', '✂️', 113) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Pet Grooming'),
            ('type', new_type_id, 'ru', 'Грумминг'),
            ('type', new_type_id, 'uk', 'Грумінг'),
            ('type', new_type_id, 'es', 'Peluquería de Mascotas');
    END IF;

    -- ============================================================
    -- 5. Pet Transport (Home Services)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'pet_transport') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (home_id, 'pet_transport', '🐾', 114) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Pet Transport'),
            ('type', new_type_id, 'ru', 'Перевозка животных'),
            ('type', new_type_id, 'uk', 'Перевезення тварин'),
            ('type', new_type_id, 'es', 'Transporte de Mascotas');
    END IF;

    -- ============================================================
    -- 6. Welding (Home Services)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'welding') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (home_id, 'welding', '🎇', 115) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Welding'),
            ('type', new_type_id, 'ru', 'Сварка'),
            ('type', new_type_id, 'uk', 'Зварювання'),
            ('type', new_type_id, 'es', 'Soldadura');
    END IF;

    -- ============================================================
    -- 7. Engraving (Home Services)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'engraving') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (home_id, 'engraving', '✒️', 116) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Engraving'),
            ('type', new_type_id, 'ru', 'Гравировка'),
            ('type', new_type_id, 'uk', 'Гравіювання'),
            ('type', new_type_id, 'es', 'Grabado');
    END IF;

    -- ============================================================
    -- 8. Phone & Tablet Repair (Home Services)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'phone_tablet_repair') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (home_id, 'phone_tablet_repair', '📱', 117) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Phone & Tablet Repair'),
            ('type', new_type_id, 'ru', 'Ремонт телефонов и планшетов'),
            ('type', new_type_id, 'uk', 'Ремонт телефонів та планшетів'),
            ('type', new_type_id, 'es', 'Reparación de Teléfonos y Tabletas');
    END IF;

    -- ============================================================
    -- 9. Audio & Photo Equipment Repair (Home Services)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'audio_photo_repair') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (home_id, 'audio_photo_repair', '📹', 118) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Audio & Photo Equipment Repair'),
            ('type', new_type_id, 'ru', 'Ремонт аудио и фототехники'),
            ('type', new_type_id, 'uk', 'Ремонт аудіо та фототехніки'),
            ('type', new_type_id, 'es', 'Reparación de Audio y Foto');
    END IF;

    -- ============================================================
    -- 10. Esoterics (Wellness)
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'esoterics') THEN
        INSERT INTO service_types (category_id, slug, icon, sort_order)
        VALUES (wellness_id, 'esoterics', '🪬', 119) RETURNING id INTO new_type_id;

        INSERT INTO service_i18n (entity_type, entity_id, locale, title) VALUES
            ('type', new_type_id, 'en', 'Esoterics'),
            ('type', new_type_id, 'ru', 'Эзотерика'),
            ('type', new_type_id, 'uk', 'Езотерика'),
            ('type', new_type_id, 'es', 'Esoterismo');
    END IF;

END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
