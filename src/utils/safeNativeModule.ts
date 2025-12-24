/**
 * Safe wrapper untuk native modules
 * Prevents "Cannot read property 'getConstants' of null" errors
 */
export const safeGetConstants = <T>(module: any): T | null => {
  try {
    if (!module) {
      console.warn('Native module is null');
      return null;
    }
    
    if (typeof module.getConstants !== 'function') {
      console.warn('getConstants is not a function');
      return null;
    }
    
    return module.getConstants();
  } catch (error) {
    console.error('Error getting constants:', error);
    return null;
  }
};

/**
 * Safe module access dengan fallback
 */
export const safeModuleAccess = <T>(
  accessor: () => T,
  fallback: T
): T => {
  try {
    const result = accessor();
    return result ?? fallback;
  } catch (error) {
    console.error('Module access error:', error);
    return fallback;
  }
};
