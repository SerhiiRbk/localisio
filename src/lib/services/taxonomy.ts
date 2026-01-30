// ============================================================
// Service Taxonomy Server Functions
// ============================================================

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type {
  ServiceTaxonomy,
  ServiceCategory,
  ServiceType,
  ServiceCategoryWithTypes,
  ServiceLocale,
  ServiceCategoryRow,
  ServiceTypeRow,
  ServiceI18nRow,
} from '@/types/services';

/**
 * Fetch service taxonomy with localized titles
 * Uses React cache() for deduplication within a single request
 * 
 * @param locale - The locale for i18n titles (en, ru, uk, es)
 * @returns ServiceTaxonomy with categories, types, and popular types
 */
export const getServiceTaxonomy = cache(async (locale: string): Promise<ServiceTaxonomy> => {
  const supabase = await createClient();
  const validLocale = validateLocale(locale);

  // Fetch all data in parallel
  const [categoriesResult, typesResult, i18nResult] = await Promise.all([
    supabase
      .from('service_categories')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('service_types')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('service_i18n')
      .select('*')
      .in('locale', [validLocale, 'en']), // Fallback to 'en' if translation missing
  ]);

  if (categoriesResult.error) {
    console.error('Error fetching categories:', categoriesResult.error);
    return emptyTaxonomy();
  }

  if (typesResult.error) {
    console.error('Error fetching types:', typesResult.error);
    return emptyTaxonomy();
  }

  if (i18nResult.error) {
    console.error('Error fetching i18n:', i18nResult.error);
    return emptyTaxonomy();
  }

  const categories = categoriesResult.data as ServiceCategoryRow[];
  const types = typesResult.data as ServiceTypeRow[];
  const i18n = i18nResult.data as ServiceI18nRow[];

  // Build i18n lookup maps
  const categoryTitles = buildI18nMap(i18n, 'category', validLocale);
  const typeTitles = buildI18nMap(i18n, 'type', validLocale);

  // Transform categories with titles
  const categoriesWithTitles: ServiceCategory[] = categories.map(cat => ({
    id: cat.id,
    slug: cat.slug,
    icon: cat.icon,
    sort_order: cat.sort_order,
    title: categoryTitles.get(cat.id) || cat.slug,
  }));

  // Transform types with titles
  const allTypes: ServiceType[] = types.map(type => ({
    id: type.id,
    category_id: type.category_id,
    slug: type.slug,
    icon: type.icon,
    sort_order: type.sort_order,
    is_popular: type.is_popular,
    title: typeTitles.get(type.id) || type.slug,
  }));

  // Group types by category
  const typesByCategory = new Map<string, ServiceType[]>();
  for (const type of allTypes) {
    const existing = typesByCategory.get(type.category_id) || [];
    existing.push(type);
    typesByCategory.set(type.category_id, existing);
  }

  // Build categories with nested types
  const categoriesWithTypes: ServiceCategoryWithTypes[] = categoriesWithTitles.map(cat => ({
    ...cat,
    types: typesByCategory.get(cat.id) || [],
  }));

  // Get popular types
  const popularTypes = allTypes.filter(t => t.is_popular);

  return {
    categories: categoriesWithTypes,
    popularTypes,
    allTypes,
  };
});

/**
 * Get a single service type by ID with localized title
 */
export const getServiceTypeById = cache(async (id: string, locale: string): Promise<ServiceType | null> => {
  const supabase = await createClient();
  const validLocale = validateLocale(locale);

  const { data: type, error } = await supabase
    .from('service_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !type) {
    return null;
  }

  const { data: i18n } = await supabase
    .from('service_i18n')
    .select('title')
    .eq('entity_type', 'type')
    .eq('entity_id', id)
    .eq('locale', validLocale)
    .single();

  const { data: fallbackI18n } = i18n ? { data: null } : await supabase
    .from('service_i18n')
    .select('title')
    .eq('entity_type', 'type')
    .eq('entity_id', id)
    .eq('locale', 'en')
    .single();

  return {
    id: type.id,
    category_id: type.category_id,
    slug: type.slug,
    icon: type.icon,
    sort_order: type.sort_order,
    is_popular: type.is_popular,
    title: i18n?.title || fallbackI18n?.title || type.slug,
  };
});

/**
 * Get service type by slug with localized title
 */
export const getServiceTypeBySlug = cache(async (slug: string, locale: string): Promise<ServiceType | null> => {
  const supabase = await createClient();
  const validLocale = validateLocale(locale);

  const { data: type, error } = await supabase
    .from('service_types')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !type) {
    return null;
  }

  const { data: i18n } = await supabase
    .from('service_i18n')
    .select('title')
    .eq('entity_type', 'type')
    .eq('entity_id', type.id)
    .eq('locale', validLocale)
    .single();

  const { data: fallbackI18n } = i18n ? { data: null } : await supabase
    .from('service_i18n')
    .select('title')
    .eq('entity_type', 'type')
    .eq('entity_id', type.id)
    .eq('locale', 'en')
    .single();

  return {
    id: type.id,
    category_id: type.category_id,
    slug: type.slug,
    icon: type.icon,
    sort_order: type.sort_order,
    is_popular: type.is_popular,
    title: i18n?.title || fallbackI18n?.title || type.slug,
  };
});

/**
 * Get provider's selected services
 */
export const getProviderServices = cache(async (providerId: string, locale: string): Promise<ServiceType[]> => {
  const supabase = await createClient();
  const validLocale = validateLocale(locale);

  const { data: providerServices, error } = await supabase
    .from('provider_services')
    .select('service_type_id')
    .eq('provider_id', providerId);

  if (error || !providerServices?.length) {
    return [];
  }

  const typeIds = providerServices.map(ps => ps.service_type_id);

  const { data: types } = await supabase
    .from('service_types')
    .select('*')
    .in('id', typeIds);

  if (!types?.length) {
    return [];
  }

  const { data: i18n } = await supabase
    .from('service_i18n')
    .select('*')
    .eq('entity_type', 'type')
    .in('entity_id', typeIds)
    .in('locale', [validLocale, 'en']);

  const titleMap = buildI18nMap(i18n || [], 'type', validLocale);

  return types.map(type => ({
    id: type.id,
    category_id: type.category_id,
    slug: type.slug,
    icon: type.icon,
    sort_order: type.sort_order,
    is_popular: type.is_popular,
    title: titleMap.get(type.id) || type.slug,
  }));
});

/**
 * Update provider's services (replace all)
 */
export async function updateProviderServices(
  providerId: string,
  serviceTypeIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Delete existing services
  const { error: deleteError } = await supabase
    .from('provider_services')
    .delete()
    .eq('provider_id', providerId);

  if (deleteError) {
    console.error('Error deleting provider services:', deleteError);
    return { success: false, error: 'Failed to update services' };
  }

  // Insert new services
  if (serviceTypeIds.length > 0) {
    const inserts = serviceTypeIds.map(serviceTypeId => ({
      provider_id: providerId,
      service_type_id: serviceTypeId,
    }));

    const { error: insertError } = await supabase
      .from('provider_services')
      .insert(inserts);

    if (insertError) {
      console.error('Error inserting provider services:', insertError);
      return { success: false, error: 'Failed to update services' };
    }
  }

  return { success: true };
}

// ============================================================
// Helper Functions
// ============================================================

function validateLocale(locale: string): ServiceLocale {
  const valid: ServiceLocale[] = ['en', 'ru', 'uk', 'es'];
  return valid.includes(locale as ServiceLocale) ? (locale as ServiceLocale) : 'en';
}

function buildI18nMap(
  i18n: ServiceI18nRow[],
  entityType: 'category' | 'type',
  preferredLocale: string
): Map<string, string> {
  const map = new Map<string, string>();
  
  // First pass: add English as fallback
  for (const item of i18n) {
    if (item.entity_type === entityType && item.locale === 'en') {
      map.set(item.entity_id, item.title);
    }
  }
  
  // Second pass: override with preferred locale
  for (const item of i18n) {
    if (item.entity_type === entityType && item.locale === preferredLocale) {
      map.set(item.entity_id, item.title);
    }
  }
  
  return map;
}

function emptyTaxonomy(): ServiceTaxonomy {
  return {
    categories: [],
    popularTypes: [],
    allTypes: [],
  };
}

// ============================================================
// Slug to ID mapping for backward compatibility
// ============================================================

/**
 * Map legacy service slugs to new service type IDs
 * Used for migration and backward compatibility
 */
export async function getServiceTypeIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('service_types')
    .select('id')
    .eq('slug', slug)
    .single();
  
  return data?.id || null;
}

/**
 * Map multiple slugs to IDs
 */
export async function getServiceTypeIdsBySlugs(slugs: string[]): Promise<Map<string, string>> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('service_types')
    .select('id, slug')
    .in('slug', slugs);
  
  const map = new Map<string, string>();
  for (const item of data || []) {
    map.set(item.slug, item.id);
  }
  
  return map;
}
