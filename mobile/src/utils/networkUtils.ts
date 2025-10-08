interface NetworkConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  fromCache: boolean;
}

class NetworkUtils {
  private static defaultConfig: NetworkConfig = {
    timeout: 5000,
    retries: 2,
    retryDelay: 1000,
  };

  // Enhanced fetch with timeout and retry logic
  static async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    config: NetworkConfig = {}
  ): Promise<ApiResponse<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { timeout, retries, retryDelay } = finalConfig;

    for (let attempt = 0; attempt <= (retries || 3); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          data,
          error: null,
          fromCache: false,
        };
      } catch (error) {
        const isLastAttempt = attempt === retries;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (isLastAttempt) {
          if (__DEV__) {
            console.log(`Network request failed after ${retries + 1} attempts:`, errorMessage);
          }
          return {
            data: null,
            error: errorMessage,
            fromCache: false,
          };
        }

        // Wait before retry
        if ((retryDelay || 0) > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    return {
      data: null,
      error: 'Max retries exceeded',
      fromCache: false,
    };
  }

  // Check if error is network-related
  static isNetworkError(error: unknown): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    const networkErrorPatterns = [
      'Network request failed',
      'fetch',
      'timeout',
      'aborted',
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_CONNECTION_REFUSED',
      'ERR_CONNECTION_TIMED_OUT',
    ];

    return networkErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Get user-friendly error message
  static getUserFriendlyError(error: unknown): string {
    if (!error) return 'An unknown error occurred';

    const errorMessage = error.message || error.toString();

    if (this.isNetworkError(error)) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (errorMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (errorMessage.includes('404')) {
      return 'The requested resource was not found.';
    }

    if (errorMessage.includes('500')) {
      return 'Server error. Please try again later.';
    }

    return 'An error occurred. Please try again.';
  }

  // Check if endpoint is available
  static async checkEndpointHealth(url: string): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'HEAD',
      }, { timeout: 3000, retries: 1 });
      
      return response.data !== null;
    } catch {
      return false;
    }
  }

  // Create a fallback data provider
  static createFallbackProvider<T>(
    apiCall: () => Promise<T>,
    fallbackData: T,
    serviceName: string
  ): () => Promise<T> {
    return async (): Promise<T> => {
      try {
        const result = await apiCall();
        return result;
      } catch (error) {
        console.warn(`${serviceName} API unavailable, using fallback data:`, error);
        return fallbackData;
      }
    };
  }
}

export default NetworkUtils;
export type { NetworkConfig, ApiResponse };
