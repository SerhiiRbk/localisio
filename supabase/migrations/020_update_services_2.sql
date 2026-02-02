-- ============================================================
-- Migration: Update Services 2
-- Description: 
--   - Remove 'notary', 'tax_accountant', 'pest_control'
--   - Rename 'accountant' to 'accounting_assistant'
--   - Rename 'architect' to 'interior_design'
--   - Rename 'cosmetologist' to 'beauty_consultant'
-- ============================================================

-- 1. Delete notary service
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'notary');
DELETE FROM provider_services WHERE service_type_id IN (SELECT id FROM service_types WHERE slug = 'notary');
DELETE FROM service_types WHERE slug = 'notary';

-- 2. Delete tax_accountant service
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'tax_accountant');
DELETE FROM provider_services WHERE service_type_id IN (SELECT id FROM service_types WHERE slug = 'tax_accountant');
DELETE FROM service_types WHERE slug = 'tax_accountant';

-- 3. Delete pest_control service
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'pest_control');
DELETE FROM provider_services WHERE service_type_id IN (SELECT id FROM service_types WHERE slug = 'pest_control');
DELETE FROM service_types WHERE slug = 'pest_control';

-- 4. Update accountant to accounting_assistant
UPDATE service_types SET slug = 'accounting_assistant' WHERE slug = 'accountant';
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'accounting_assistant');
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Accounting Assistant' FROM service_types WHERE slug = 'accounting_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Бухгалтерский ассистент' FROM service_types WHERE slug = 'accounting_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Бухгалтерський асистент' FROM service_types WHERE slug = 'accounting_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Asistente Contable' FROM service_types WHERE slug = 'accounting_assistant' ON CONFLICT DO NOTHING;

-- 5. Update architect to interior_design
UPDATE service_types SET slug = 'interior_design', icon = '🏠' WHERE slug = 'architect';
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'interior_design');
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Interior Design' FROM service_types WHERE slug = 'interior_design' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Дизайн интерьеров' FROM service_types WHERE slug = 'interior_design' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Дизайн інтер''єрів' FROM service_types WHERE slug = 'interior_design' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Diseño de Interiores' FROM service_types WHERE slug = 'interior_design' ON CONFLICT DO NOTHING;

-- 6. Update cosmetologist to beauty_consultant
UPDATE service_types SET slug = 'beauty_consultant' WHERE slug = 'cosmetologist';
DELETE FROM service_i18n WHERE entity_type = 'type' AND entity_id IN (SELECT id FROM service_types WHERE slug = 'beauty_consultant');
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Beauty and Cosmetology Consultant' FROM service_types WHERE slug = 'beauty_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Консультант по красоте и косметологии' FROM service_types WHERE slug = 'beauty_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Консультант з краси та косметології' FROM service_types WHERE slug = 'beauty_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Belleza y Cosmetología' FROM service_types WHERE slug = 'beauty_consultant' ON CONFLICT DO NOTHING;
