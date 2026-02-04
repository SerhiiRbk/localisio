-- ============================================================
-- Migration: Add New Service Types
-- Description: Add new service types:
--   - personal_branding (Business)
--   - project_manager (Business)
--   - qa_tester (Business)
--   - mobile_app_developer (Business)
--   - musician (Events)
--   - glazier (Home Services)
--   - furniture_assembly (Home Services)
--   - custom_furniture (Home Services)
--   - nanny (Personal Services)
--   - handmade_crafts (Creative)
-- ============================================================

-- Get category IDs
DO $$
DECLARE
    business_id UUID;
    home_id UUID;
    creative_id UUID;
    events_id UUID;
    personal_id UUID;
    new_type_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO business_id FROM service_categories WHERE slug = 'business_it';
    SELECT id INTO home_id FROM service_categories WHERE slug = 'home_services';
    SELECT id INTO creative_id FROM service_categories WHERE slug = 'creative_digital';
    SELECT id INTO events_id FROM service_categories WHERE slug = 'events_lifestyle';
    
    -- For personal services, we'll use home_services as there's no dedicated personal category
    -- Or create under the closest matching category
    
    -- 1. Personal Branding Consultant (Business)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'personal_branding') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (business_id, 'personal_branding', 100) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Personal Branding Consultant'),
            ('type', new_type_id, 'ru', 'Консультант по созданию личного бренда'),
            ('type', new_type_id, 'uk', 'Консультант зі створення особистого бренду'),
            ('type', new_type_id, 'es', 'Consultor de Marca Personal');
    END IF;

    -- 2. Project Manager (Business)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'project_manager') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (business_id, 'project_manager', 101) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Project Manager'),
            ('type', new_type_id, 'ru', 'Проектный менеджер'),
            ('type', new_type_id, 'uk', 'Проєктний менеджер'),
            ('type', new_type_id, 'es', 'Gerente de Proyectos');
    END IF;

    -- 3. QA Tester (Business)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'qa_tester') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (business_id, 'qa_tester', 102) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Software Tester / QA'),
            ('type', new_type_id, 'ru', 'Тестировщик программного обеспечения'),
            ('type', new_type_id, 'uk', 'Тестувальник програмного забезпечення'),
            ('type', new_type_id, 'es', 'Probador de Software / QA');
    END IF;

    -- 4. Mobile App Developer (Business/Creative)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'mobile_app_developer') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (creative_id, 'mobile_app_developer', 103) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Mobile App Developer'),
            ('type', new_type_id, 'ru', 'Создание мобильных приложений'),
            ('type', new_type_id, 'uk', 'Створення мобільних додатків'),
            ('type', new_type_id, 'es', 'Desarrollador de Aplicaciones Móviles');
    END IF;

    -- 5. Musician (Events)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'musician') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (events_id, 'musician', 104) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Musician'),
            ('type', new_type_id, 'ru', 'Музыкант'),
            ('type', new_type_id, 'uk', 'Музикант'),
            ('type', new_type_id, 'es', 'Músico');
    END IF;

    -- 6. Glazier (Home Services)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'glazier') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (home_id, 'glazier', 105) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Glazier'),
            ('type', new_type_id, 'ru', 'Стекольщик'),
            ('type', new_type_id, 'uk', 'Скляр'),
            ('type', new_type_id, 'es', 'Vidriero');
    END IF;

    -- 7. Furniture Assembly (Home Services)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'furniture_assembly') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (home_id, 'furniture_assembly', 106) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Furniture Assembly'),
            ('type', new_type_id, 'ru', 'Сборка мебели'),
            ('type', new_type_id, 'uk', 'Збирання меблів'),
            ('type', new_type_id, 'es', 'Montaje de Muebles');
    END IF;

    -- 8. Custom Furniture (Home Services)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'custom_furniture') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (home_id, 'custom_furniture', 107) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Custom Furniture'),
            ('type', new_type_id, 'ru', 'Мебель на заказ'),
            ('type', new_type_id, 'uk', 'Меблі на замовлення'),
            ('type', new_type_id, 'es', 'Muebles a Medida');
    END IF;

    -- 9. Nanny (Home Services - closest category for personal/family services)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'nanny') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (home_id, 'nanny', 108) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Nanny / Babysitter'),
            ('type', new_type_id, 'ru', 'Няня'),
            ('type', new_type_id, 'uk', 'Няня'),
            ('type', new_type_id, 'es', 'Niñera');
    END IF;

    -- 10. Handmade Crafts (Creative)
    IF NOT EXISTS (SELECT 1 FROM service_types WHERE slug = 'handmade_crafts') THEN
        INSERT INTO service_types (category_id, slug, sort_order) 
        VALUES (creative_id, 'handmade_crafts', 109) RETURNING id INTO new_type_id;
        
        INSERT INTO service_i18n (entity_type, entity_id, locale, name) VALUES
            ('type', new_type_id, 'en', 'Handmade Crafts'),
            ('type', new_type_id, 'ru', 'Хендмейд'),
            ('type', new_type_id, 'uk', 'Хендмейд'),
            ('type', new_type_id, 'es', 'Artesanías');
    END IF;

END $$;
