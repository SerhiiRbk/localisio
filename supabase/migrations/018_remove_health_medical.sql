-- ============================================================
-- Migration: Remove Health & Medical Category
-- Description: Delete health_medical category and all related services
-- ============================================================

-- Delete service type i18n for health_medical services
DELETE FROM service_i18n
WHERE entity_type = 'type' 
  AND entity_id IN (
    SELECT st.id FROM service_types st
    JOIN service_categories sc ON st.category_id = sc.id
    WHERE sc.slug = 'health_medical'
  );

-- Delete provider_services associations for these service types
DELETE FROM provider_services
WHERE service_type_id IN (
  SELECT st.id FROM service_types st
  JOIN service_categories sc ON st.category_id = sc.id
  WHERE sc.slug = 'health_medical'
);

-- Delete service types for health_medical category
DELETE FROM service_types
WHERE category_id IN (
  SELECT id FROM service_categories WHERE slug = 'health_medical'
);

-- Delete category i18n for health_medical
DELETE FROM service_i18n
WHERE entity_type = 'category'
  AND entity_id IN (
    SELECT id FROM service_categories WHERE slug = 'health_medical'
  );

-- Delete the health_medical category itself
DELETE FROM service_categories WHERE slug = 'health_medical';

-- Update sort_order for remaining categories to fill the gap
UPDATE service_categories SET sort_order = sort_order - 1 WHERE sort_order > 3;
