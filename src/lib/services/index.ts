// ============================================================
// Services Module Exports
// ============================================================

export * from './taxonomy';

// Re-export legacy service config for backward compatibility
// TODO: Remove after full migration to new taxonomy
export {
  services,
  serviceCodes,
  servicesByCode,
  getServiceLabel,
  getServiceIcon,
} from '@/config/services';
