// Feature flags for enabling/disabling features based on backend availability
// These flags help gracefully handle features that are planned but not yet implemented in the backend

export const FEATURE_FLAGS = {
  // Activity Logs - Backend endpoints not yet implemented
  ACTIVITY_LOGS: process.env.NEXT_PUBLIC_ENABLE_ACTIVITY_LOGS === 'true',
  
  // Access Overview/Matrix - Backend endpoints not yet implemented
  ACCESS_OVERVIEW: process.env.NEXT_PUBLIC_ENABLE_ACCESS_OVERVIEW === 'true',
  
  // Permission Analytics - Backend endpoints not yet implemented
  PERMISSION_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_PERMISSION_ANALYTICS === 'true',
  
  // Bulk Module Assignment - Backend endpoints not yet implemented
  BULK_ASSIGN_MODULES: process.env.NEXT_PUBLIC_ENABLE_BULK_ASSIGN_MODULES === 'true',
} as const;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

// Get a user-friendly message for disabled features
export const getDisabledFeatureMessage = (feature: keyof typeof FEATURE_FLAGS): string => {
  const messages: Record<keyof typeof FEATURE_FLAGS, string> = {
    ACTIVITY_LOGS: 'Activity logs feature is not yet available. This feature will be enabled once the backend implementation is complete.',
    ACCESS_OVERVIEW: 'Access overview feature is not yet available. This feature will be enabled once the backend implementation is complete.',
    PERMISSION_ANALYTICS: 'Permission analytics feature is not yet available. This feature will be enabled once the backend implementation is complete.',
    BULK_ASSIGN_MODULES: 'Bulk module assignment feature is not yet available. This feature will be enabled once the backend implementation is complete.',
  };
  
  return messages[feature] || 'This feature is currently unavailable.';
};

export default FEATURE_FLAGS;
