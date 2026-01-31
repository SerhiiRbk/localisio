// ============================================================
// Service Taxonomy Types
// ============================================================

/**
 * Service category - top-level grouping
 */
export interface ServiceCategory {
  id: string;
  slug: string;
  icon: string;
  sort_order: number;
  title: string; // Localized title
}

/**
 * Service type - individual service within a category
 */
export interface ServiceType {
  id: string;
  category_id: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_popular: boolean;
  title: string; // Localized title
}

/**
 * Category with nested service types
 */
export interface ServiceCategoryWithTypes extends ServiceCategory {
  types: ServiceType[];
}

/**
 * Full service taxonomy response
 */
export interface ServiceTaxonomy {
  categories: ServiceCategoryWithTypes[];
  popularTypes: ServiceType[];
  allTypes: ServiceType[];
}

/**
 * Provider service relation
 */
export interface ProviderService {
  id: string;
  provider_id: string;
  service_type_id: string;
  service_type?: ServiceType;
}

/**
 * Selected service for UI components
 */
export interface SelectedService {
  id: string;
  slug: string;
  title: string;
  icon: string;
  category_slug?: string;
  category_title?: string;
}

/**
 * Supported locales for service taxonomy
 */
export type ServiceLocale = 'en' | 'ru' | 'uk' | 'es';

/**
 * Raw database row types (before joining with i18n)
 */
export interface ServiceCategoryRow {
  id: string;
  slug: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface ServiceTypeRow {
  id: string;
  category_id: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_popular: boolean;
  created_at: string;
}

export interface ServiceI18nRow {
  id: string;
  entity_type: 'category' | 'type';
  entity_id: string;
  locale: string;
  title: string;
  created_at: string;
}
