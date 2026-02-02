-- ============================================================
-- Migration: Update Services
-- Description: 
--   - Remove 'lawyer' service
--   - Rename 'immigration_lawyer' to 'document_assistant'
--   - Rename 'music_teacher' to 'music_instructor'
--   - Add new services
-- ============================================================

-- 1. Delete lawyer service
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'lawyer');
DELETE FROM provider_services WHERE service_type_id IN (SELECT id FROM service_types WHERE slug = 'lawyer');
DELETE FROM service_types WHERE slug = 'lawyer';

-- 2. Update immigration_lawyer to document_assistant
UPDATE service_types SET slug = 'document_assistant', icon = '📋' WHERE slug = 'immigration_lawyer';
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'document_assistant');
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Document Filling Assistant' FROM service_types WHERE slug = 'document_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Помощник по заполнению документов' FROM service_types WHERE slug = 'document_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Помічник із заповнення документів' FROM service_types WHERE slug = 'document_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Asistente de Llenado de Documentos' FROM service_types WHERE slug = 'document_assistant' ON CONFLICT DO NOTHING;

-- 3. Update music_teacher to music_instructor
UPDATE service_types SET slug = 'music_instructor' WHERE slug = 'music_teacher';
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'music_instructor');
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Music Instructor' FROM service_types WHERE slug = 'music_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Преподаватель музыки' FROM service_types WHERE slug = 'music_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Викладач музики' FROM service_types WHERE slug = 'music_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Instructor de Música' FROM service_types WHERE slug = 'music_instructor' ON CONFLICT DO NOTHING;

-- 4. Add new services

-- Education category services
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'solfeggio_teacher', '🎼', 20, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Solfeggio Teacher' FROM service_types WHERE slug = 'solfeggio_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Преподаватель сольфеджио' FROM service_types WHERE slug = 'solfeggio_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Викладач сольфеджіо' FROM service_types WHERE slug = 'solfeggio_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Profesor de Solfeo' FROM service_types WHERE slug = 'solfeggio_teacher' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'conversation_club', '💬', 21, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Conversation Club' FROM service_types WHERE slug = 'conversation_club' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Разговорный клуб' FROM service_types WHERE slug = 'conversation_club' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Розмовний клуб' FROM service_types WHERE slug = 'conversation_club' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Club de Conversación' FROM service_types WHERE slug = 'conversation_club' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'acting_coach', '🎭', 22, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Acting Coach' FROM service_types WHERE slug = 'acting_coach' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Актерское мастерство' FROM service_types WHERE slug = 'acting_coach' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Акторська майстерність' FROM service_types WHERE slug = 'acting_coach' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Coach de Actuación' FROM service_types WHERE slug = 'acting_coach' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'public_speaking', '🎤', 23, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Public Speaking Coach' FROM service_types WHERE slug = 'public_speaking' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Ораторское искусство' FROM service_types WHERE slug = 'public_speaking' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Ораторське мистецтво' FROM service_types WHERE slug = 'public_speaking' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Coach de Oratoria' FROM service_types WHERE slug = 'public_speaking' ON CONFLICT DO NOTHING;

-- Real Estate category services
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'business_relocation', '🏢', 20, FALSE FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Business Relocation Consultant' FROM service_types WHERE slug = 'business_relocation' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Консультант по релокации бизнеса' FROM service_types WHERE slug = 'business_relocation' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Консультант з релокації бізнесу' FROM service_types WHERE slug = 'business_relocation' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Reubicación de Negocios' FROM service_types WHERE slug = 'business_relocation' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'passenger_transport', '🚐', 21, FALSE FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Passenger Transportation' FROM service_types WHERE slug = 'passenger_transport' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Пассажирские перевозки' FROM service_types WHERE slug = 'passenger_transport' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Пасажирські перевезення' FROM service_types WHERE slug = 'passenger_transport' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Transporte de Pasajeros' FROM service_types WHERE slug = 'passenger_transport' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'freight_transport', '🚛', 22, FALSE FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Freight Transportation' FROM service_types WHERE slug = 'freight_transport' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Грузовые перевозки' FROM service_types WHERE slug = 'freight_transport' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Вантажні перевезення' FROM service_types WHERE slug = 'freight_transport' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Transporte de Carga' FROM service_types WHERE slug = 'freight_transport' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'goods_delivery', '📦', 23, FALSE FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Goods Delivery' FROM service_types WHERE slug = 'goods_delivery' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Доставка товаров' FROM service_types WHERE slug = 'goods_delivery' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Доставка товарів' FROM service_types WHERE slug = 'goods_delivery' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Entrega de Productos' FROM service_types WHERE slug = 'goods_delivery' ON CONFLICT DO NOTHING;

-- Home Services category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'jeweler', '💎', 20, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Jeweler' FROM service_types WHERE slug = 'jeweler' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Ювелир' FROM service_types WHERE slug = 'jeweler' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Ювелір' FROM service_types WHERE slug = 'jeweler' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Joyero' FROM service_types WHERE slug = 'jeweler' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'dog_walking', '🐕‍🦺', 21, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Dog Walking' FROM service_types WHERE slug = 'dog_walking' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Выгул собак' FROM service_types WHERE slug = 'dog_walking' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Вигул собак' FROM service_types WHERE slug = 'dog_walking' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Paseo de Perros' FROM service_types WHERE slug = 'dog_walking' ON CONFLICT DO NOTHING;

-- Business IT category services
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'ml_specialist', '🤖', 20, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Machine Learning Specialist' FROM service_types WHERE slug = 'ml_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Специалист по машинному обучению' FROM service_types WHERE slug = 'ml_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Спеціаліст з машинного навчання' FROM service_types WHERE slug = 'ml_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Especialista en Machine Learning' FROM service_types WHERE slug = 'ml_specialist' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'devops_consultant', '⚙️', 21, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'DevOps Consultant' FROM service_types WHERE slug = 'devops_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'DevOps консультант' FROM service_types WHERE slug = 'devops_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'DevOps консультант' FROM service_types WHERE slug = 'devops_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor DevOps' FROM service_types WHERE slug = 'devops_consultant' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'sales_specialist', '📊', 22, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Sales Specialist' FROM service_types WHERE slug = 'sales_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Специалист по продажам' FROM service_types WHERE slug = 'sales_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Спеціаліст з продажів' FROM service_types WHERE slug = 'sales_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Especialista en Ventas' FROM service_types WHERE slug = 'sales_specialist' ON CONFLICT DO NOTHING;

-- Creative Digital category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'video_editor', '🎬', 20, FALSE FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Video Editor' FROM service_types WHERE slug = 'video_editor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Видео-монтаж' FROM service_types WHERE slug = 'video_editor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Відео-монтаж' FROM service_types WHERE slug = 'video_editor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Editor de Video' FROM service_types WHERE slug = 'video_editor' ON CONFLICT DO NOTHING;

-- Lifestyle Wellness category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'motivation_consultant', '🎯', 20, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Motivation Consultant' FROM service_types WHERE slug = 'motivation_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Консультант по мотивации' FROM service_types WHERE slug = 'motivation_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Консультант з мотивації' FROM service_types WHERE slug = 'motivation_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Motivación' FROM service_types WHERE slug = 'motivation_consultant' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'tarot_reader', '🔮', 21, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Tarot Reader' FROM service_types WHERE slug = 'tarot_reader' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Таролог' FROM service_types WHERE slug = 'tarot_reader' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Таролог' FROM service_types WHERE slug = 'tarot_reader' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Lector de Tarot' FROM service_types WHERE slug = 'tarot_reader' ON CONFLICT DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'shopping_consultant', '🛍️', 22, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Shopping Consultant' FROM service_types WHERE slug = 'shopping_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Консультант по шоппингу' FROM service_types WHERE slug = 'shopping_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Консультант з шопінгу' FROM service_types WHERE slug = 'shopping_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Compras' FROM service_types WHERE slug = 'shopping_consultant' ON CONFLICT DO NOTHING;
