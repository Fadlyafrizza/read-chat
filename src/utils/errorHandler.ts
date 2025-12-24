/**
 * Global error handler to handle unhandled errors
 */
export class ErrorHandler {
  static setup() {
    // Handle uncaught exceptions
    if (typeof ErrorUtils !== 'undefined') {
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('Global error:', error, 'isFatal:', isFatal);
        this.logError(error, isFatal);
      });
    }
  }

  static logError(error: any, isFatal: boolean = false) {
    const errorLog = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
      isFatal,
      timestamp: new Date().toISOString(),
    };
    
    console.error('Error logged:', errorLog);
    // Can be extended to send to external logging service
  }

  static wrapAsync<T>(
    fn: () => Promise<T>,
    fallback: T,
    errorMessage: string = 'Operation failed'
  ): () => Promise<T> {
    return async () => {
      try {
        return await fn();
      } catch (error) {
        console.error(errorMessage, error);
        this.logError(error);
        return fallback;
      }
    };
  }
}
