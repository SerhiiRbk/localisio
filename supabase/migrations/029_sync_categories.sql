-- ============================================================
-- Migration: Sync DB categories with frontend services page
-- Description:
--   1. Rename categories to match frontend IDs
--   2. Create missing categories (personal_services, beauty_style)
--   3. Move services to correct categories
--   4. Remove empty accounting_finance category
--   5. Update i18n for all changed categories
-- ============================================================

DO $$
DECLARE
    cat_documents_consulting UUID;
    cat_education UUID;
    cat_real_estate_relocation UUID;
    cat_home_services UUID;
    cat_creative_digital UUID;
    cat_personal_services UUID;
    cat_business_it UUID;
    cat_events_tourism UUID;
    cat_wellness_lifestyle UUID;
    cat_beauty_style UUID;
    old_accounting_finance UUID;
BEGIN

    -- ============================================================
    -- STEP 1: Rename existing categories to match frontend
    -- ============================================================

    -- legal_immigration → documents_consulting
    UPDATE service_categories SET slug = 'documents_consulting', icon = '📋', sort_order = 1
    WHERE slug = 'legal_immigration';

    -- real_estate → real_estate_relocation
    UPDATE service_categories SET slug = 'real_estate_relocation', sort_order = 3
    WHERE slug = 'real_estate';

    -- lifestyle_wellness → wellness_lifestyle
    UPDATE service_categories SET slug = 'wellness_lifestyle', sort_order = 9
    WHERE slug = 'lifestyle_wellness';

    -- Update sort_order for existing categories
    UPDATE service_categories SET sort_order = 2 WHERE slug = 'education';
    UPDATE service_categories SET sort_order = 4 WHERE slug = 'home_services';
    UPDATE service_categories SET sort_order = 5 WHERE slug = 'creative_digital';
    UPDATE service_categories SET sort_order = 7 WHERE slug = 'business_it';
    UPDATE service_categories SET sort_order = 8 WHERE slug = 'events_tourism';

    -- ============================================================
    -- STEP 2: Create missing categories
    -- ============================================================

    INSERT INTO service_categories (slug, icon, sort_order)
    VALUES ('personal_services', '👤', 6)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO service_categories (slug, icon, sort_order)
    VALUES ('beauty_style', '💅', 10)
    ON CONFLICT (slug) DO NOTHING;

    -- ============================================================
    -- STEP 3: Get all category IDs
    -- ============================================================

    SELECT id INTO cat_documents_consulting FROM service_categories WHERE slug = 'documents_consulting';
    SELECT id INTO cat_education FROM service_categories WHERE slug = 'education';
    SELECT id INTO cat_real_estate_relocation FROM service_categories WHERE slug = 'real_estate_relocation';
    SELECT id INTO cat_home_services FROM service_categories WHERE slug = 'home_services';
    SELECT id INTO cat_creative_digital FROM service_categories WHERE slug = 'creative_digital';
    SELECT id INTO cat_personal_services FROM service_categories WHERE slug = 'personal_services';
    SELECT id INTO cat_business_it FROM service_categories WHERE slug = 'business_it';
    SELECT id INTO cat_events_tourism FROM service_categories WHERE slug = 'events_tourism';
    SELECT id INTO cat_wellness_lifestyle FROM service_categories WHERE slug = 'wellness_lifestyle';
    SELECT id INTO cat_beauty_style FROM service_categories WHERE slug = 'beauty_style';
    SELECT id INTO old_accounting_finance FROM service_categories WHERE slug = 'accounting_finance';

    -- ============================================================
    -- STEP 4: Move services to correct categories
    -- ============================================================

    -- accounting_assistant: accounting_finance → documents_consulting
    UPDATE service_types SET category_id = cat_documents_consulting WHERE slug = 'accounting_assistant';

    -- investment_consultant: accounting_finance → business_it
    UPDATE service_types SET category_id = cat_business_it WHERE slug = 'investment_consultant';

    -- interior_design: was in real_estate → home_services
    UPDATE service_types SET category_id = cat_home_services WHERE slug = 'interior_design';

    -- personal_assistant, driver, nanny, pet_sitter, dog_walking, courier: home_services → personal_services
    UPDATE service_types SET category_id = cat_personal_services WHERE slug = 'personal_assistant';
    UPDATE service_types SET category_id = cat_personal_services WHERE slug = 'driver';
    UPDATE service_types SET category_id = cat_personal_services WHERE slug = 'nanny';
    UPDATE service_types SET category_id = cat_personal_services WHERE slug = 'pet_sitter';
    UPDATE service_types SET category_id = cat_personal_services WHERE slug = 'dog_walking';
    UPDATE service_types SET category_id = cat_personal_services WHERE slug = 'courier';

    -- pet_grooming, pet_transport: home_services → personal_services (from migration 028)
    UPDATE service_types SET category_id = cat_personal_services WHERE slug = 'pet_grooming';
    UPDATE service_types SET category_id = cat_personal_services WHERE slug = 'pet_transport';

    -- web_developer: business_it → creative_digital
    UPDATE service_types SET category_id = cat_creative_digital WHERE slug = 'web_developer';

    -- hairdresser, makeup_artist, nail_technician, stylist: wellness_lifestyle → beauty_style
    UPDATE service_types SET category_id = cat_beauty_style WHERE slug = 'hairdresser';
    UPDATE service_types SET category_id = cat_beauty_style WHERE slug = 'makeup_artist';
    UPDATE service_types SET category_id = cat_beauty_style WHERE slug = 'nail_technician';
    UPDATE service_types SET category_id = cat_beauty_style WHERE slug = 'stylist';

    -- ============================================================
    -- STEP 5: Delete accounting_finance category (now empty)
    -- ============================================================

    IF old_accounting_finance IS NOT NULL THEN
        DELETE FROM service_i18n WHERE entity_type = 'category' AND entity_id = old_accounting_finance;
        DELETE FROM service_categories WHERE id = old_accounting_finance;
    END IF;

    -- ============================================================
    -- STEP 6: Update i18n for renamed categories
    -- ============================================================

    -- documents_consulting (was legal_immigration)
    UPDATE service_i18n SET title = 'Documents & Consulting'
    WHERE entity_type = 'category' AND entity_id = cat_documents_consulting AND locale = 'en';
    UPDATE service_i18n SET title = 'Документы и консультации'
    WHERE entity_type = 'category' AND entity_id = cat_documents_consulting AND locale = 'ru';
    UPDATE service_i18n SET title = 'Документи та консультації'
    WHERE entity_type = 'category' AND entity_id = cat_documents_consulting AND locale = 'uk';
    UPDATE service_i18n SET title = 'Documentos y Consultoría'
    WHERE entity_type = 'category' AND entity_id = cat_documents_consulting AND locale = 'es';

    -- real_estate_relocation (was real_estate)
    UPDATE service_i18n SET title = 'Real Estate & Relocation'
    WHERE entity_type = 'category' AND entity_id = cat_real_estate_relocation AND locale = 'en';
    UPDATE service_i18n SET title = 'Недвижимость и переезд'
    WHERE entity_type = 'category' AND entity_id = cat_real_estate_relocation AND locale = 'ru';
    UPDATE service_i18n SET title = 'Нерухомість та переїзд'
    WHERE entity_type = 'category' AND entity_id = cat_real_estate_relocation AND locale = 'uk';
    UPDATE service_i18n SET title = 'Bienes Raíces y Reubicación'
    WHERE entity_type = 'category' AND entity_id = cat_real_estate_relocation AND locale = 'es';

    -- wellness_lifestyle (was lifestyle_wellness)
    UPDATE service_i18n SET title = 'Wellness & Lifestyle'
    WHERE entity_type = 'category' AND entity_id = cat_wellness_lifestyle AND locale = 'en';
    UPDATE service_i18n SET title = 'Здоровье и образ жизни'
    WHERE entity_type = 'category' AND entity_id = cat_wellness_lifestyle AND locale = 'ru';
    UPDATE service_i18n SET title = 'Здоров''я та спосіб життя'
    WHERE entity_type = 'category' AND entity_id = cat_wellness_lifestyle AND locale = 'uk';
    UPDATE service_i18n SET title = 'Bienestar y Estilo de Vida'
    WHERE entity_type = 'category' AND entity_id = cat_wellness_lifestyle AND locale = 'es';

    -- ============================================================
    -- STEP 7: Add i18n for new categories
    -- ============================================================

    -- personal_services
    INSERT INTO service_i18n (entity_type, entity_id, locale, title)
    VALUES ('category', cat_personal_services, 'en', 'Personal Services')
    ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET title = 'Personal Services';
    INSERT INTO service_i18n (entity_type, entity_id, locale, title)
    VALUES ('category', cat_personal_services, 'ru', 'Персональные услуги')
    ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET title = 'Персональные услуги';
    INSERT INTO service_i18n (entity_type, entity_id, locale, title)
    VALUES ('category', cat_personal_services, 'uk', 'Персональні послуги')
    ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET title = 'Персональні послуги';
    INSERT INTO service_i18n (entity_type, entity_id, locale, title)
    VALUES ('category', cat_personal_services, 'es', 'Servicios Personales')
    ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET title = 'Servicios Personales';

    -- beauty_style
    INSERT INTO service_i18n (entity_type, entity_id, locale, title)
    VALUES ('category', cat_beauty_style, 'en', 'Beauty & Style')
    ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET title = 'Beauty & Style';
    INSERT INTO service_i18n (entity_type, entity_id, locale, title)
    VALUES ('category', cat_beauty_style, 'ru', 'Красота и стиль')
    ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET title = 'Красота и стиль';
    INSERT INTO service_i18n (entity_type, entity_id, locale, title)
    VALUES ('category', cat_beauty_style, 'uk', 'Краса та стиль')
    ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET title = 'Краса та стиль';
    INSERT INTO service_i18n (entity_type, entity_id, locale, title)
    VALUES ('category', cat_beauty_style, 'es', 'Belleza y Estilo')
    ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET title = 'Belleza y Estilo';

    -- ============================================================
    -- STEP 8: Update i18n for existing unchanged categories (titles)
    -- ============================================================

    -- education
    UPDATE service_i18n SET title = 'Education & Learning'
    WHERE entity_type = 'category' AND entity_id = cat_education AND locale = 'en';
    UPDATE service_i18n SET title = 'Образование и обучение'
    WHERE entity_type = 'category' AND entity_id = cat_education AND locale = 'ru';
    UPDATE service_i18n SET title = 'Освіта та навчання'
    WHERE entity_type = 'category' AND entity_id = cat_education AND locale = 'uk';
    UPDATE service_i18n SET title = 'Educación y Aprendizaje'
    WHERE entity_type = 'category' AND entity_id = cat_education AND locale = 'es';

    -- home_services
    UPDATE service_i18n SET title = 'Home & Repair Services'
    WHERE entity_type = 'category' AND entity_id = cat_home_services AND locale = 'en';
    UPDATE service_i18n SET title = 'Дом и ремонт'
    WHERE entity_type = 'category' AND entity_id = cat_home_services AND locale = 'ru';
    UPDATE service_i18n SET title = 'Дім та ремонт'
    WHERE entity_type = 'category' AND entity_id = cat_home_services AND locale = 'uk';
    UPDATE service_i18n SET title = 'Hogar y Reparaciones'
    WHERE entity_type = 'category' AND entity_id = cat_home_services AND locale = 'es';

    -- creative_digital
    UPDATE service_i18n SET title = 'Creative & Digital'
    WHERE entity_type = 'category' AND entity_id = cat_creative_digital AND locale = 'en';
    UPDATE service_i18n SET title = 'Креатив и digital'
    WHERE entity_type = 'category' AND entity_id = cat_creative_digital AND locale = 'ru';
    UPDATE service_i18n SET title = 'Креатив та digital'
    WHERE entity_type = 'category' AND entity_id = cat_creative_digital AND locale = 'uk';
    UPDATE service_i18n SET title = 'Creatividad y Digital'
    WHERE entity_type = 'category' AND entity_id = cat_creative_digital AND locale = 'es';

    -- business_it
    UPDATE service_i18n SET title = 'Business & IT'
    WHERE entity_type = 'category' AND entity_id = cat_business_it AND locale = 'en';
    UPDATE service_i18n SET title = 'Бизнес и IT'
    WHERE entity_type = 'category' AND entity_id = cat_business_it AND locale = 'ru';
    UPDATE service_i18n SET title = 'Бізнес та IT'
    WHERE entity_type = 'category' AND entity_id = cat_business_it AND locale = 'uk';
    UPDATE service_i18n SET title = 'Negocios y TI'
    WHERE entity_type = 'category' AND entity_id = cat_business_it AND locale = 'es';

    -- events_tourism
    UPDATE service_i18n SET title = 'Events & Tourism'
    WHERE entity_type = 'category' AND entity_id = cat_events_tourism AND locale = 'en';
    UPDATE service_i18n SET title = 'Мероприятия и туризм'
    WHERE entity_type = 'category' AND entity_id = cat_events_tourism AND locale = 'ru';
    UPDATE service_i18n SET title = 'Заходи та туризм'
    WHERE entity_type = 'category' AND entity_id = cat_events_tourism AND locale = 'uk';
    UPDATE service_i18n SET title = 'Eventos y Turismo'
    WHERE entity_type = 'category' AND entity_id = cat_events_tourism AND locale = 'es';

END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
