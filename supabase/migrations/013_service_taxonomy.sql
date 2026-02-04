-- ============================================================
-- Migration: Service Taxonomy
-- Description: Restructure services into categories with i18n support
--              and proper relational model for provider services
-- ============================================================

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

-- Service Categories (top-level grouping)
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(10) DEFAULT '📁',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Types (individual services within categories)
CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  slug VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(10) DEFAULT '💼',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internationalization table for both categories and types
CREATE TABLE IF NOT EXISTS service_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('category', 'type')),
  entity_id UUID NOT NULL,
  locale VARCHAR(5) NOT NULL,
  title VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, locale)
);

-- Provider-Services join table (many-to-many)
CREATE TABLE IF NOT EXISTS provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(user_id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, service_type_id)
);

-- ============================================================
-- 2. CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_service_types_category ON service_types(category_id);
CREATE INDEX IF NOT EXISTS idx_service_types_popular ON service_types(is_popular) WHERE is_popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_i18n_lookup ON service_i18n(entity_type, entity_id, locale);
CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_type ON provider_services(service_type_id);

-- ============================================================
-- 3. ADD LEGACY FIELD TO PROVIDER_PROFILES FOR MIGRATION
-- ============================================================

ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS legacy_services TEXT[] DEFAULT '{}';

-- Copy current services to legacy field (for rollback if needed)
UPDATE provider_profiles 
SET legacy_services = services 
WHERE services IS NOT NULL AND array_length(services, 1) > 0;

-- ============================================================
-- 4. SEED CATEGORIES
-- ============================================================

INSERT INTO service_categories (slug, icon, sort_order) VALUES
  ('legal_immigration', '⚖️', 1),
  ('accounting_finance', '📊', 2),
  ('real_estate', '🏠', 3),
  ('home_services', '🔧', 4),
  ('business_it', '💼', 5),
  ('education', '📚', 6),
  ('lifestyle_wellness', '🧘', 7),
  ('events_tourism', '🎉', 8),
  ('creative_digital', '🎨', 9)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. SEED CATEGORY I18N
-- ============================================================

-- Legal & Immigration
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Legal & Immigration' FROM service_categories WHERE slug = 'legal_immigration'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Юридические и иммиграционные' FROM service_categories WHERE slug = 'legal_immigration'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Юридичні та імміграційні' FROM service_categories WHERE slug = 'legal_immigration'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Legal e Inmigración' FROM service_categories WHERE slug = 'legal_immigration'
ON CONFLICT DO NOTHING;

-- Accounting & Finance
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Accounting & Finance' FROM service_categories WHERE slug = 'accounting_finance'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Бухгалтерия и финансы' FROM service_categories WHERE slug = 'accounting_finance'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Бухгалтерія та фінанси' FROM service_categories WHERE slug = 'accounting_finance'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Contabilidad y Finanzas' FROM service_categories WHERE slug = 'accounting_finance'
ON CONFLICT DO NOTHING;

-- Real Estate & Housing
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Real Estate & Housing' FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Недвижимость и жильё' FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Нерухомість та житло' FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Bienes Raíces y Vivienda' FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT DO NOTHING;

-- Home & Local Services
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Home & Local Services' FROM service_categories WHERE slug = 'home_services'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Дом и бытовые услуги' FROM service_categories WHERE slug = 'home_services'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Дім і побутові послуги' FROM service_categories WHERE slug = 'home_services'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Hogar y Servicios Locales' FROM service_categories WHERE slug = 'home_services'
ON CONFLICT DO NOTHING;

-- Business & IT
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Business & IT' FROM service_categories WHERE slug = 'business_it'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Бизнес и IT' FROM service_categories WHERE slug = 'business_it'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Бізнес та IT' FROM service_categories WHERE slug = 'business_it'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Negocios y TI' FROM service_categories WHERE slug = 'business_it'
ON CONFLICT DO NOTHING;

-- Education & Languages
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Education & Languages' FROM service_categories WHERE slug = 'education'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Образование и языки' FROM service_categories WHERE slug = 'education'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Освіта та мови' FROM service_categories WHERE slug = 'education'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Educación e Idiomas' FROM service_categories WHERE slug = 'education'
ON CONFLICT DO NOTHING;

-- Lifestyle & Wellness
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Lifestyle & Wellness' FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Стиль жизни и здоровье' FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Стиль життя та здоров''я' FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Estilo de Vida y Bienestar' FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT DO NOTHING;

-- Events & Tourism
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Events & Tourism' FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Мероприятия и туризм' FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Заходи та туризм' FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Eventos y Turismo' FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT DO NOTHING;

-- Creative & Digital
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'en', 'Creative & Digital' FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'ru', 'Творчество и digital' FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'uk', 'Творчість та digital' FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'category', id, 'es', 'Creatividad y Digital' FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. SEED SERVICE TYPES
-- ============================================================

-- Legal & Immigration category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'document_assistant', '📋', 1, TRUE FROM service_categories WHERE slug = 'legal_immigration'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'immigration_consultant', '🛂', 2, TRUE FROM service_categories WHERE slug = 'legal_immigration'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'translator', '🌍', 4, TRUE FROM service_categories WHERE slug = 'legal_immigration'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'customs_broker', '📦', 6, FALSE FROM service_categories WHERE slug = 'legal_immigration'
ON CONFLICT (slug) DO NOTHING;

-- Accounting & Finance category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'accounting_assistant', '📊', 1, TRUE FROM service_categories WHERE slug = 'accounting_finance'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'investment_consultant', '💰', 2, FALSE FROM service_categories WHERE slug = 'accounting_finance'
ON CONFLICT (slug) DO NOTHING;

-- Real Estate & Housing category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'real_estate_agent', '🏢', 1, TRUE FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'relocation_assistant', '📦', 2, FALSE FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'mover', '🚚', 3, FALSE FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'interior_design', '🏠', 4, FALSE FROM service_categories WHERE slug = 'real_estate'
ON CONFLICT (slug) DO NOTHING;

-- Home & Local Services category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'handyman', '🔧', 1, TRUE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'cleaning', '🧹', 2, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'dry_cleaning', '👔', 3, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'electrician', '⚡', 4, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, ', 5, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'auto_mechanic', '⚙️', 6, TRUE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'tech_repair', '🔌', 7, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'construction_consultant', '🏗️', 8, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'tailor', '🧵', 9, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'shoe_repair', '👞', 10, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'locksmith', '🔑', 11, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'pet_sitter', '🐕', 12, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'driver', '🚕', 9, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'courier', '📬', 10, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'personal_assistant', '👤', 11, FALSE FROM service_categories WHERE slug = 'home_services'
ON CONFLICT (slug) DO NOTHING;

-- Business & IT category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'business_consultant', '💼', 1, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'it_consultant', '🖥️', 2, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'marketer', '📈', 3, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'ai_automation', '🤖', 4, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'hr_consultant', '👥', 5, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'web_developer', '💻', 6, FALSE FROM service_categories WHERE slug = 'business_it'
ON CONFLICT (slug) DO NOTHING;

-- Education & Languages category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'language_teacher', '📚', 1, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'school_tutor', '📖', 2, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'programming_teacher', '💻', 3, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'music_instructor', '🎵', 4, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'driving_instructor', '🚗', 5, FALSE FROM service_categories WHERE slug = 'education'
ON CONFLICT (slug) DO NOTHING;

-- Lifestyle & Wellness category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'yoga_instructor', '🧘', 1, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'fitness_trainer', '💪', 2, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'sports_instructor', '⚽', 3, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'dietitian', '🥗', 4, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'rehabilitation_specialist', '🏃', 5, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'massage_therapist', '💆', 6, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'beauty_consultant', '🫦', 7, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'hairdresser', '💇', 8, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'makeup_artist', '💄', 8, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'nail_technician', '💅', 9, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'stylist', '👗', 10, FALSE FROM service_categories WHERE slug = 'lifestyle_wellness'
ON CONFLICT (slug) DO NOTHING;

-- Events & Tourism category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'tour_guide', '🗺️', 1, TRUE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'travel_manager', '✈️', 2, FALSE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'hiking_organizer', '🥾', 3, FALSE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'event_planner', '🎉', 4, FALSE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'mc_host', '🎤', 5, FALSE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'florist', '💐', 6, FALSE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'pastry_chef', '🎂', 7, FALSE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'catering', '🍽️', 8, FALSE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'sommelier', '🍷', 9, FALSE FROM service_categories WHERE slug = 'events_tourism'
ON CONFLICT (slug) DO NOTHING;

-- Creative & Digital category
INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'photographer', '📷', 1, FALSE FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'videographer', '🎥', 2, FALSE FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'content_creator', '📱', 3, FALSE FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'copywriter', '✍️', 4, FALSE FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'smm_manager', '📲', 5, FALSE FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, 'designer', '🎨', 6, FALSE FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_types (category_id, slug, icon, sort_order, is_popular)
SELECT id, '3d_printing', '🖨️', 7, FALSE FROM service_categories WHERE slug = 'creative_digital'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 7. SEED SERVICE TYPE I18N (all 69+ services)
-- ============================================================

-- document_assistant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Document Filling Assistant' FROM service_types WHERE slug = 'document_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Помощник по заполнению документов' FROM service_types WHERE slug = 'document_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Помічник із заповнення документів' FROM service_types WHERE slug = 'document_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Asistente de Llenado de Documentos' FROM service_types WHERE slug = 'document_assistant' ON CONFLICT DO NOTHING;

-- immigration_consultant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Immigration Consultant' FROM service_types WHERE slug = 'immigration_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Иммиграционный консультант' FROM service_types WHERE slug = 'immigration_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Імміграційний консультант' FROM service_types WHERE slug = 'immigration_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Inmigración' FROM service_types WHERE slug = 'immigration_consultant' ON CONFLICT DO NOTHING;

-- accounting_assistant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Accounting Assistant' FROM service_types WHERE slug = 'accounting_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Бухгалтерский ассистент' FROM service_types WHERE slug = 'accounting_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Бухгалтерський асистент' FROM service_types WHERE slug = 'accounting_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Asistente Contable' FROM service_types WHERE slug = 'accounting_assistant' ON CONFLICT DO NOTHING;

-- investment_consultant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Investment Consultant' FROM service_types WHERE slug = 'investment_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Консультант по инвестициям' FROM service_types WHERE slug = 'investment_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Консультант з інвестицій' FROM service_types WHERE slug = 'investment_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Inversiones' FROM service_types WHERE slug = 'investment_consultant' ON CONFLICT DO NOTHING;

-- real_estate_agent
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Real Estate Agent' FROM service_types WHERE slug = 'real_estate_agent' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Риелтор' FROM service_types WHERE slug = 'real_estate_agent' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Ріелтор' FROM service_types WHERE slug = 'real_estate_agent' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Agente Inmobiliario' FROM service_types WHERE slug = 'real_estate_agent' ON CONFLICT DO NOTHING;

-- relocation_assistant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Relocation Assistant' FROM service_types WHERE slug = 'relocation_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Помощник по переезду' FROM service_types WHERE slug = 'relocation_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Асистент з переїзду' FROM service_types WHERE slug = 'relocation_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Asistente de Reubicación' FROM service_types WHERE slug = 'relocation_assistant' ON CONFLICT DO NOTHING;

-- mover
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Mover / Transport' FROM service_types WHERE slug = 'mover' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Перевозчик' FROM service_types WHERE slug = 'mover' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Перевізник' FROM service_types WHERE slug = 'mover' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Transportista' FROM service_types WHERE slug = 'mover' ON CONFLICT DO NOTHING;

-- interior_design
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Interior Design' FROM service_types WHERE slug = 'interior_design' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Дизайн интерьеров' FROM service_types WHERE slug = 'interior_design' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Дизайн інтер''єрів' FROM service_types WHERE slug = 'interior_design' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Diseño de Interiores' FROM service_types WHERE slug = 'interior_design' ON CONFLICT DO NOTHING;

-- handyman
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Handyman' FROM service_types WHERE slug = 'handyman' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Мастер по дому' FROM service_types WHERE slug = 'handyman' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Майстер по дому' FROM service_types WHERE slug = 'handyman' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Manitas' FROM service_types WHERE slug = 'handyman' ON CONFLICT DO NOTHING;

-- cleaning
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Cleaning Service' FROM service_types WHERE slug = 'cleaning' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Клининг' FROM service_types WHERE slug = 'cleaning' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Клінінг' FROM service_types WHERE slug = 'cleaning' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Servicio de Limpieza' FROM service_types WHERE slug = 'cleaning' ON CONFLICT DO NOTHING;

-- dry_cleaning
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Dry Cleaning' FROM service_types WHERE slug = 'dry_cleaning' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Химчистка' FROM service_types WHERE slug = 'dry_cleaning' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Хімчистка' FROM service_types WHERE slug = 'dry_cleaning' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Tintorería' FROM service_types WHERE slug = 'dry_cleaning' ON CONFLICT DO NOTHING;

-- electrician
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Electrician' FROM service_types WHERE slug = 'electrician' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Электрик' FROM service_types WHERE slug = 'electrician' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Електрик' FROM service_types WHERE slug = 'electrician' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Electricista' FROM service_types WHERE slug = 'electrician' ON CONFLICT DO NOTHING;

-- plumber
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Plumber' FROM service_types WHERE slug = 'plumber' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Сантехник' FROM service_types WHERE slug = 'plumber' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Сантехнік' FROM service_types WHERE slug = 'plumber' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Fontanero' FROM service_types WHERE slug = 'plumber' ON CONFLICT DO NOTHING;

-- auto_mechanic
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Auto Mechanic' FROM service_types WHERE slug = 'auto_mechanic' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Автомеханик' FROM service_types WHERE slug = 'auto_mechanic' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Автомеханік' FROM service_types WHERE slug = 'auto_mechanic' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Mecánico de Autos' FROM service_types WHERE slug = 'auto_mechanic' ON CONFLICT DO NOTHING;

-- tech_repair
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Tech Repair' FROM service_types WHERE slug = 'tech_repair' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Ремонт техники' FROM service_types WHERE slug = 'tech_repair' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Ремонт техніки' FROM service_types WHERE slug = 'tech_repair' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Reparación de Tecnología' FROM service_types WHERE slug = 'tech_repair' ON CONFLICT DO NOTHING;

-- pet_sitter
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Pet Sitter' FROM service_types WHERE slug = 'pet_sitter' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Передержка животных' FROM service_types WHERE slug = 'pet_sitter' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Перетримка тварин' FROM service_types WHERE slug = 'pet_sitter' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Cuidador de Mascotas' FROM service_types WHERE slug = 'pet_sitter' ON CONFLICT DO NOTHING;

-- driver
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Driver' FROM service_types WHERE slug = 'driver' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Водитель' FROM service_types WHERE slug = 'driver' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Водій' FROM service_types WHERE slug = 'driver' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Conductor' FROM service_types WHERE slug = 'driver' ON CONFLICT DO NOTHING;

-- courier
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Courier' FROM service_types WHERE slug = 'courier' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Курьер' FROM service_types WHERE slug = 'courier' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Кур''єр' FROM service_types WHERE slug = 'courier' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Mensajero' FROM service_types WHERE slug = 'courier' ON CONFLICT DO NOTHING;

-- personal_assistant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Personal Assistant' FROM service_types WHERE slug = 'personal_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Персональный помощник' FROM service_types WHERE slug = 'personal_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Персональний помічник' FROM service_types WHERE slug = 'personal_assistant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Asistente Personal' FROM service_types WHERE slug = 'personal_assistant' ON CONFLICT DO NOTHING;

-- business_consultant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Business Consultant' FROM service_types WHERE slug = 'business_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Бизнес консультант' FROM service_types WHERE slug = 'business_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Бізнес консультант' FROM service_types WHERE slug = 'business_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Negocios' FROM service_types WHERE slug = 'business_consultant' ON CONFLICT DO NOTHING;

-- it_consultant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'IT Consultant' FROM service_types WHERE slug = 'it_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'IT консультант' FROM service_types WHERE slug = 'it_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'IT консультант' FROM service_types WHERE slug = 'it_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de TI' FROM service_types WHERE slug = 'it_consultant' ON CONFLICT DO NOTHING;

-- marketer
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Marketing Specialist' FROM service_types WHERE slug = 'marketer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Маркетолог' FROM service_types WHERE slug = 'marketer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Маркетолог' FROM service_types WHERE slug = 'marketer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Especialista en Marketing' FROM service_types WHERE slug = 'marketer' ON CONFLICT DO NOTHING;

-- ai_automation
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'AI Automation Specialist' FROM service_types WHERE slug = 'ai_automation' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'AI автоматизатор' FROM service_types WHERE slug = 'ai_automation' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'AI автоматизатор' FROM service_types WHERE slug = 'ai_automation' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Especialista en Automatización IA' FROM service_types WHERE slug = 'ai_automation' ON CONFLICT DO NOTHING;

-- web_developer
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Web Developer' FROM service_types WHERE slug = 'web_developer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Создание сайтов' FROM service_types WHERE slug = 'web_developer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Створення сайтів' FROM service_types WHERE slug = 'web_developer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Desarrollador Web' FROM service_types WHERE slug = 'web_developer' ON CONFLICT DO NOTHING;

-- translator
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Translator' FROM service_types WHERE slug = 'translator' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Переводчик' FROM service_types WHERE slug = 'translator' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Перекладач' FROM service_types WHERE slug = 'translator' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Traductor' FROM service_types WHERE slug = 'translator' ON CONFLICT DO NOTHING;

-- language_teacher
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Language Teacher' FROM service_types WHERE slug = 'language_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Преподаватель языка' FROM service_types WHERE slug = 'language_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Викладач мови' FROM service_types WHERE slug = 'language_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Profesor de Idiomas' FROM service_types WHERE slug = 'language_teacher' ON CONFLICT DO NOTHING;

-- school_tutor
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'School Tutor' FROM service_types WHERE slug = 'school_tutor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Репетитор для школьников' FROM service_types WHERE slug = 'school_tutor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Репетитор для школярів' FROM service_types WHERE slug = 'school_tutor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Tutor Escolar' FROM service_types WHERE slug = 'school_tutor' ON CONFLICT DO NOTHING;

-- programming_teacher
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Programming Teacher' FROM service_types WHERE slug = 'programming_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Преподаватель программирования' FROM service_types WHERE slug = 'programming_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Викладач програмування' FROM service_types WHERE slug = 'programming_teacher' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Profesor de Programación' FROM service_types WHERE slug = 'programming_teacher' ON CONFLICT DO NOTHING;

-- music_instructor
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Music Instructor' FROM service_types WHERE slug = 'music_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Преподаватель музыки' FROM service_types WHERE slug = 'music_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Викладач музики' FROM service_types WHERE slug = 'music_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Instructor de Música' FROM service_types WHERE slug = 'music_instructor' ON CONFLICT DO NOTHING;

-- yoga_instructor
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Yoga Instructor' FROM service_types WHERE slug = 'yoga_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Инструктор по йоге' FROM service_types WHERE slug = 'yoga_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Інструктор з йоги' FROM service_types WHERE slug = 'yoga_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Instructor de Yoga' FROM service_types WHERE slug = 'yoga_instructor' ON CONFLICT DO NOTHING;

-- fitness_trainer
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Fitness Trainer' FROM service_types WHERE slug = 'fitness_trainer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Тренер' FROM service_types WHERE slug = 'fitness_trainer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Тренер' FROM service_types WHERE slug = 'fitness_trainer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Entrenador Personal' FROM service_types WHERE slug = 'fitness_trainer' ON CONFLICT DO NOTHING;

-- sports_instructor
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Sports Instructor' FROM service_types WHERE slug = 'sports_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Спортивный инструктор' FROM service_types WHERE slug = 'sports_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Спортивний інструктор' FROM service_types WHERE slug = 'sports_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Instructor Deportivo' FROM service_types WHERE slug = 'sports_instructor' ON CONFLICT DO NOTHING;

-- dietitian
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Dietitian' FROM service_types WHERE slug = 'dietitian' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Диетолог' FROM service_types WHERE slug = 'dietitian' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Дієтолог' FROM service_types WHERE slug = 'dietitian' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Dietista' FROM service_types WHERE slug = 'dietitian' ON CONFLICT DO NOTHING;

-- rehabilitation_specialist
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Rehabilitation Specialist' FROM service_types WHERE slug = 'rehabilitation_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Реабилитолог' FROM service_types WHERE slug = 'rehabilitation_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Реабілітолог' FROM service_types WHERE slug = 'rehabilitation_specialist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Especialista en Rehabilitación' FROM service_types WHERE slug = 'rehabilitation_specialist' ON CONFLICT DO NOTHING;

-- massage_therapist
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Massage Therapist' FROM service_types WHERE slug = 'massage_therapist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Массажист' FROM service_types WHERE slug = 'massage_therapist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Масажист' FROM service_types WHERE slug = 'massage_therapist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Masajista' FROM service_types WHERE slug = 'massage_therapist' ON CONFLICT DO NOTHING;

-- hairdresser
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Hairdresser' FROM service_types WHERE slug = 'hairdresser' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Парикмахер' FROM service_types WHERE slug = 'hairdresser' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Перукар' FROM service_types WHERE slug = 'hairdresser' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Peluquero' FROM service_types WHERE slug = 'hairdresser' ON CONFLICT DO NOTHING;

-- makeup_artist
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Makeup Artist' FROM service_types WHERE slug = 'makeup_artist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Визажист' FROM service_types WHERE slug = 'makeup_artist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Візажист' FROM service_types WHERE slug = 'makeup_artist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Maquillador' FROM service_types WHERE slug = 'makeup_artist' ON CONFLICT DO NOTHING;

-- nail_technician
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Nail Technician' FROM service_types WHERE slug = 'nail_technician' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Мастер маникюра' FROM service_types WHERE slug = 'nail_technician' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Майстер манікюру' FROM service_types WHERE slug = 'nail_technician' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Manicurista' FROM service_types WHERE slug = 'nail_technician' ON CONFLICT DO NOTHING;

-- stylist
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Stylist' FROM service_types WHERE slug = 'stylist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Стилист' FROM service_types WHERE slug = 'stylist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Стиліст' FROM service_types WHERE slug = 'stylist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Estilista' FROM service_types WHERE slug = 'stylist' ON CONFLICT DO NOTHING;

-- tour_guide
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Tour Guide' FROM service_types WHERE slug = 'tour_guide' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Экскурсовод' FROM service_types WHERE slug = 'tour_guide' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Екскурсовод' FROM service_types WHERE slug = 'tour_guide' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Guía Turístico' FROM service_types WHERE slug = 'tour_guide' ON CONFLICT DO NOTHING;

-- travel_manager
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Travel Manager' FROM service_types WHERE slug = 'travel_manager' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Туристический менеджер' FROM service_types WHERE slug = 'travel_manager' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Туристичний менеджер' FROM service_types WHERE slug = 'travel_manager' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Gestor de Viajes' FROM service_types WHERE slug = 'travel_manager' ON CONFLICT DO NOTHING;

-- hiking_organizer
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Hiking / Outdoor Organizer' FROM service_types WHERE slug = 'hiking_organizer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Организация походов' FROM service_types WHERE slug = 'hiking_organizer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Організація походів' FROM service_types WHERE slug = 'hiking_organizer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Organizador de Excursiones' FROM service_types WHERE slug = 'hiking_organizer' ON CONFLICT DO NOTHING;

-- event_planner
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Event Planner' FROM service_types WHERE slug = 'event_planner' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Организатор мероприятий' FROM service_types WHERE slug = 'event_planner' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Організатор заходів' FROM service_types WHERE slug = 'event_planner' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Organizador de Eventos' FROM service_types WHERE slug = 'event_planner' ON CONFLICT DO NOTHING;

-- mc_host
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Professional MC / Host' FROM service_types WHERE slug = 'mc_host' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Профессиональный ведущий' FROM service_types WHERE slug = 'mc_host' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Професійний ведучий' FROM service_types WHERE slug = 'mc_host' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Presentador Profesional' FROM service_types WHERE slug = 'mc_host' ON CONFLICT DO NOTHING;

-- florist
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Florist' FROM service_types WHERE slug = 'florist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Флорист' FROM service_types WHERE slug = 'florist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Флорист' FROM service_types WHERE slug = 'florist' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Florista' FROM service_types WHERE slug = 'florist' ON CONFLICT DO NOTHING;

-- pastry_chef
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Pastry Chef' FROM service_types WHERE slug = 'pastry_chef' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Кондитер' FROM service_types WHERE slug = 'pastry_chef' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Кондитер' FROM service_types WHERE slug = 'pastry_chef' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Pastelero' FROM service_types WHERE slug = 'pastry_chef' ON CONFLICT DO NOTHING;

-- catering
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Catering Service' FROM service_types WHERE slug = 'catering' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Кейтеринг' FROM service_types WHERE slug = 'catering' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Кейтеринг' FROM service_types WHERE slug = 'catering' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Servicio de Catering' FROM service_types WHERE slug = 'catering' ON CONFLICT DO NOTHING;

-- sommelier
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Sommelier' FROM service_types WHERE slug = 'sommelier' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Сомелье' FROM service_types WHERE slug = 'sommelier' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Сомельє' FROM service_types WHERE slug = 'sommelier' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Sommelier' FROM service_types WHERE slug = 'sommelier' ON CONFLICT DO NOTHING;

-- photographer
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Photographer' FROM service_types WHERE slug = 'photographer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Фотограф' FROM service_types WHERE slug = 'photographer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Фотограф' FROM service_types WHERE slug = 'photographer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Fotógrafo' FROM service_types WHERE slug = 'photographer' ON CONFLICT DO NOTHING;

-- videographer
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Videographer' FROM service_types WHERE slug = 'videographer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Видеооператор' FROM service_types WHERE slug = 'videographer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Відеооператор' FROM service_types WHERE slug = 'videographer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Videógrafo' FROM service_types WHERE slug = 'videographer' ON CONFLICT DO NOTHING;

-- content_creator
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Content Creator' FROM service_types WHERE slug = 'content_creator' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Создатель контента' FROM service_types WHERE slug = 'content_creator' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Контент-мейкер' FROM service_types WHERE slug = 'content_creator' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Creador de Contenido' FROM service_types WHERE slug = 'content_creator' ON CONFLICT DO NOTHING;

-- copywriter
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Copywriter' FROM service_types WHERE slug = 'copywriter' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Копирайтер' FROM service_types WHERE slug = 'copywriter' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Копірайтер' FROM service_types WHERE slug = 'copywriter' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Redactor Publicitario' FROM service_types WHERE slug = 'copywriter' ON CONFLICT DO NOTHING;

-- smm_manager
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'SMM Manager' FROM service_types WHERE slug = 'smm_manager' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'SMM менеджер' FROM service_types WHERE slug = 'smm_manager' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'SMM менеджер' FROM service_types WHERE slug = 'smm_manager' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Gestor de Redes Sociales' FROM service_types WHERE slug = 'smm_manager' ON CONFLICT DO NOTHING;

-- designer
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Designer' FROM service_types WHERE slug = 'designer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Дизайнер' FROM service_types WHERE slug = 'designer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Дизайнер' FROM service_types WHERE slug = 'designer' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Diseñador' FROM service_types WHERE slug = 'designer' ON CONFLICT DO NOTHING;

-- customs_broker
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Customs Broker' FROM service_types WHERE slug = 'customs_broker' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Таможенный брокер' FROM service_types WHERE slug = 'customs_broker' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Митний брокер' FROM service_types WHERE slug = 'customs_broker' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Agente de Aduanas' FROM service_types WHERE slug = 'customs_broker' ON CONFLICT DO NOTHING;

-- hr_consultant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'HR Consultant' FROM service_types WHERE slug = 'hr_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'HR консультант' FROM service_types WHERE slug = 'hr_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'HR консультант' FROM service_types WHERE slug = 'hr_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Recursos Humanos' FROM service_types WHERE slug = 'hr_consultant' ON CONFLICT DO NOTHING;

-- driving_instructor
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Driving Instructor' FROM service_types WHERE slug = 'driving_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Автоинструктор' FROM service_types WHERE slug = 'driving_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Автоінструктор' FROM service_types WHERE slug = 'driving_instructor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Instructor de Conducción' FROM service_types WHERE slug = 'driving_instructor' ON CONFLICT DO NOTHING;

-- beauty_consultant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Beauty and Cosmetology Consultant' FROM service_types WHERE slug = 'beauty_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Консультант по красоте и косметологии' FROM service_types WHERE slug = 'beauty_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Консультант з краси та косметології' FROM service_types WHERE slug = 'beauty_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Belleza y Cosmetología' FROM service_types WHERE slug = 'beauty_consultant' ON CONFLICT DO NOTHING;

-- construction_consultant
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Construction & Renovation Consultant' FROM service_types WHERE slug = 'construction_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Консультант по строительству и ремонтам' FROM service_types WHERE slug = 'construction_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Консультант з будівництва та ремонту' FROM service_types WHERE slug = 'construction_consultant' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Consultor de Construcción y Renovación' FROM service_types WHERE slug = 'construction_consultant' ON CONFLICT DO NOTHING;

-- tailor
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Tailor' FROM service_types WHERE slug = 'tailor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Портной' FROM service_types WHERE slug = 'tailor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Кравець' FROM service_types WHERE slug = 'tailor' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Sastre' FROM service_types WHERE slug = 'tailor' ON CONFLICT DO NOTHING;

-- shoe_repair
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Shoe Repair' FROM service_types WHERE slug = 'shoe_repair' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Ремонт обуви' FROM service_types WHERE slug = 'shoe_repair' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Ремонт взуття' FROM service_types WHERE slug = 'shoe_repair' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Reparación de Calzado' FROM service_types WHERE slug = 'shoe_repair' ON CONFLICT DO NOTHING;

-- locksmith
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', 'Locksmith' FROM service_types WHERE slug = 'locksmith' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', 'Слесарь' FROM service_types WHERE slug = 'locksmith' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', 'Слюсар' FROM service_types WHERE slug = 'locksmith' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Cerrajero' FROM service_types WHERE slug = 'locksmith' ON CONFLICT DO NOTHING;

-- 3d_printing
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'en', '3D Printing' FROM service_types WHERE slug = '3d_printing' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'ru', '3D печать' FROM service_types WHERE slug = '3d_printing' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'uk', '3D друк' FROM service_types WHERE slug = '3d_printing' ON CONFLICT DO NOTHING;
INSERT INTO service_i18n (entity_type, entity_id, locale, title)
SELECT 'type', id, 'es', 'Impresión 3D' FROM service_types WHERE slug = '3d_printing' ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. DATA MIGRATION: Copy legacy services to provider_services
-- ============================================================

-- This will map existing string-based services to the new IDs
INSERT INTO provider_services (provider_id, service_type_id)
SELECT pp.user_id, st.id
FROM provider_profiles pp
CROSS JOIN LATERAL unnest(pp.services) AS service_slug
JOIN service_types st ON st.slug = service_slug
WHERE pp.services IS NOT NULL AND array_length(pp.services, 1) > 0
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;

-- Public read access for taxonomy tables
CREATE POLICY "Public read service_categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Public read service_types" ON service_types FOR SELECT USING (true);
CREATE POLICY "Public read service_i18n" ON service_i18n FOR SELECT USING (true);
CREATE POLICY "Public read provider_services" ON provider_services FOR SELECT USING (true);

-- Provider can manage their own services
CREATE POLICY "Provider manage own services" ON provider_services 
  FOR ALL USING (auth.uid() = provider_id);

-- ============================================================
-- 10. COMMENTS
-- ============================================================

COMMENT ON TABLE service_categories IS 'Top-level service category groupings';
COMMENT ON TABLE service_types IS 'Individual service types within categories';
COMMENT ON TABLE service_i18n IS 'Internationalization for categories and types';
COMMENT ON TABLE provider_services IS 'Many-to-many relation between providers and services';
COMMENT ON COLUMN provider_profiles.legacy_services IS 'Deprecated: original string-based services array. Use provider_services join table instead.';
