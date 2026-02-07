// @ts-nocheck
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger, logApiRequest } from './logger';

// API Configuration - reads from environment variable, falls back to production URL
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://med-adn.com/api/v1',
  timeout: 30000, // 30 seconds
};

// Determine credential usage based on environment
const isProductionApi = API_CONFIG.baseURL.includes('med-adn.com');
const isLocalDevelopment = API_CONFIG.baseURL.includes('localhost') || API_CONFIG.baseURL.includes('127.0.0.1');
const needsCredentials = isLocalDevelopment && !process.env.NEXT_PUBLIC_DISABLE_CREDENTIALS;

// Check if the API URL is using ngrok tunnel
const isNgrokUrl = API_CONFIG.baseURL.includes('ngrok.io') || API_CONFIG.baseURL.includes('ngrok-free.app');

// API configuration is set up silently

// Token storage keys
const TOKEN_STORAGE_KEY = 'auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Error response interface
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private tokenLoggedThisSession = false;
  private isRefreshing = false;
  private failedQueue: { resolve: Function; reject: Function; config: any }[] = [];

  constructor() {
    // Prepare headers for the axios instance
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add production-specific headers
    if (isProductionApi) {
      defaultHeaders['User-Agent'] = 'MedAdn-Web-Client/1.0';
      defaultHeaders['X-Client-Version'] = '1.0.0';
      defaultHeaders['X-Requested-With'] = 'XMLHttpRequest';
      // Add any other production-specific headers here
    }

    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      withCredentials: needsCredentials, // Only enabled for local development
      headers: defaultHeaders,
    });

    this.setupInterceptors();
  }



  private setupInterceptors() {
    // Request interceptor - Add auth token to requests
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();

        // Do NOT attach Authorization header for auth endpoints that should not require it
        const url = config.url || '';
        const isAuthEndpoint = url.includes('/auth/login') ||
          url.includes('/auth/register') ||
          url.includes('/auth/forgot-password') ||
          url.includes('/auth/reset-password') ||
          url.includes('/auth/refresh');

        if (!isAuthEndpoint && token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Debug logging for residency question requests
        if (url.includes('/residency-questions')) {
          console.log('🔍 [ApiClient Interceptor] Residency question request:', {
            url,
            method: config.method,
            dataType: config.data?.constructor?.name,
            isFormData: config.data instanceof FormData,
            hasData: !!config.data,
          });

          if (config.data instanceof FormData) {
            console.log('📋 [ApiClient Interceptor] FormData detected, entries:');
            for (const [key, value] of config.data.entries()) {
              if (value instanceof File) {
                console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
              } else {
                console.log(`  ${key}: ${value}`);
              }
            }
          }
        }

        // Only set Content-Type to JSON if data is not FormData
        // FormData should not have Content-Type set - let browser set it with boundary
        if (!(config.data instanceof FormData)) {
          if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
          }
        } else {
          // Explicitly remove Content-Type for FormData to let browser set it with boundary
          delete config.headers['Content-Type'];
          console.log('✅ [ApiClient Interceptor] Removed Content-Type for FormData');
        }
        if (!config.headers['Accept']) {
          config.headers['Accept'] = 'application/json';
        }

        // Add production-specific headers if needed
        if (isProductionApi) {
          if (!config.headers['User-Agent']) {
            config.headers['User-Agent'] = 'MedAdn-Web-Client/1.0';
          }
          if (!config.headers['X-Client-Version']) {
            config.headers['X-Client-Version'] = '1.0.0';
          }
          if (!config.headers['X-Requested-With']) {
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
          }
        }

        // Debug logging for content filters endpoint
        if (config.url?.includes('content/filters')) {
          console.log('🔍 [ApiClient] Content filters request details:', {
            url: config.url,
            fullUrl: `${config.baseURL}${config.url}`,
            hasToken: !!token,
            tokenLength: token?.length || 0,
            headers: config.headers
          });
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle 401 errors with automatic token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Debug logging for content filters endpoint
        if (response.config.url?.includes('content/filters')) {
          console.log('🔍 [ApiClient] Content filters response details:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            dataStructure: {
              hasData: !!response.data,
              dataKeys: response.data ? Object.keys(response.data) : [],
              hasUnites: !!response.data?.data?.unites,
              hasIndependentModules: !!response.data?.data?.independentModules,
              unitesCount: response.data?.data?.unites?.length || 0,
              independentModulesCount: response.data?.data?.independentModules?.length || 0
            },
            rawData: response.data
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Skip refresh for auth endpoints to prevent infinite loops
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
          originalRequest?.url?.includes('/auth/register') ||
          originalRequest?.url?.includes('/auth/forgot-password') ||
          originalRequest?.url?.includes('/auth/reset-password') ||
          originalRequest?.url?.includes('/auth/refresh');

        // Handle 401 errors with automatic token refresh
        if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
          // If already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getStoredRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            console.log('🔄 [ApiClient] Refreshing access token...');

            // Make refresh request directly with axios (not through interceptors)
            const response = await axios.post(
              `${API_CONFIG.baseURL}/auth/refresh`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            const tokens = response.data?.data?.tokens;
            if (!tokens?.accessToken) {
              throw new Error('Invalid refresh response');
            }

            console.log('✅ [ApiClient] Token refreshed successfully');

            // Store new tokens
            this.setTokens(tokens.accessToken, tokens.refreshToken);

            // Process queued requests with new token
            this.processQueue(null, tokens.accessToken);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError: any) {
            console.error('❌ [ApiClient] Token refresh failed:', refreshError.message);

            // Process queued requests with error
            this.processQueue(refreshError, null);

            // Clear tokens and redirect to login
            this.handleAuthError();

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // For non-401 errors or auth endpoints, just reject
        return Promise.reject(error);
      }
    );
  }

  // Process queued requests after token refresh
  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        resolve(this.client(config));
      }
    });
    this.failedQueue = [];
  }



  private handleAuthError() {
    console.log('🚨 API Client: Handling authentication error, clearing tokens');
    this.clearStoredTokens();

    // Only redirect if we're not already on the login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      console.log('🚨 API Client: Redirecting to login page');
      // Use a small delay to prevent immediate redirect during API calls
      setTimeout(() => {
        if (!window.location.pathname.includes('/login')) {
          console.log('🚨 API Client: Executing redirect to /login');
          window.location.href = '/login';
        }
      }, 500); // Increased delay to prevent race conditions
    }
  }

  // Token management methods
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    // Use centralized logging with throttling
    if (!this.tokenLoggedThisSession) {
      logger.debug('🔐 Getting stored token:', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        tokenKey: TOKEN_STORAGE_KEY
      }, 'token-management');
      this.tokenLoggedThisSession = true;
    }

    return token;
  }

  private setStoredToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);

      // Only log token storage once per session to reduce spam
      if (process.env.NODE_ENV === 'development' && !this.tokenLoggedThisSession) {
        console.log('🔐 Token stored in localStorage:', {
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
          tokenKey: TOKEN_STORAGE_KEY
        });
      }
    }
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  private setStoredRefreshToken(refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
  }

  private clearStoredTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  }

  // Public methods for token management
  public setTokens(token: string, refreshToken?: string): void {
    // Only log token operations in development and reduce frequency
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Storing tokens in localStorage:', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });
    }

    this.setStoredToken(token);
    if (refreshToken) {
      this.setStoredRefreshToken(refreshToken);
    }

    // Verify tokens were stored (only in development)
    if (process.env.NODE_ENV === 'development') {
      const storedToken = this.getStoredToken();
      console.log('🔐 Token storage verification:', {
        tokenStored: !!storedToken,
        tokensMatch: storedToken === token
      });
    }
  }

  public getRefreshToken(): string | null {
    return this.getStoredRefreshToken();
  }

  public clearTokens(): void {
    this.clearStoredTokens();
  }

  public isAuthenticated(): boolean {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }

    // Basic token format validation (JWT should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('🔐 Invalid token format detected, clearing token');
      this.clearStoredTokens();
      return false;
    }

    return true;
  }

  // HTTP methods
  private async makeRequest<T>(
    requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      console.error('🚨 makeRequest caught error:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): ApiError {
    // Gracefully handle request cancellations (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.message === 'canceled') {
      // Do not toast for canceled requests; treat as benign
      return {
        success: false,
        error: 'Request canceled',
        statusCode: 0,
      };
    }

    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    // Enhanced error logging for debugging
    console.error('🔍 Raw error object:', error);
    console.error('🔍 Error type:', typeof error);
    console.error('🔍 Error constructor:', error?.constructor?.name);
    console.error('🔍 Error message:', error?.message);
    console.error('🔍 Error response:', error?.response);
    console.error('🔍 Error request:', error?.request);
    console.error('🔍 Error config:', error?.config);

    // Check if it's an AxiosError
    const isAxiosError = error?.isAxiosError || error?.response || error?.request;

    if (!isAxiosError) {
      console.error('⚠️ Not an Axios error, treating as generic error');
      return {
        message: error?.message || errorMessage,
        statusCode: 500,
        details: { originalError: error }
      };
    }

    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseData: error.response?.data,
      hasAuthHeader: !!(error.config?.headers?.Authorization),
      code: error.code,
      baseURL: error.config?.baseURL,
      timeout: error.config?.timeout,
      isNetworkError: !error.response && error.request,
      isTimeoutError: error.code === 'ECONNABORTED',
    };

    console.error('API Error Details:', errorDetails);

    if (error.response) {
      statusCode = error.response.status;
      const responseData = error.response.data as any;

      // Log detailed info for 401 errors to help debug authentication issues
      if (statusCode === 401) {
        console.error('🔐 401 Unauthorized Error Details:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          responseData: responseData,
          responseHeaders: error.response.headers,
        });
      }

      // Handle different response data structures
      if (responseData?.error) {
        // Handle structured error object from API
        if (typeof responseData.error === 'object' && responseData.error.message) {
          errorMessage = responseData.error.message;
        } else if (typeof responseData.error === 'string') {
          errorMessage = responseData.error;
        } else {
          errorMessage = 'An error occurred';
        }
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else {
        errorMessage = `HTTP ${statusCode}: ${error.response.statusText || 'Request failed'}`;
      }

      // Only override error message for specific status codes if we don't have a proper API error message
      if (!responseData?.error?.message && !responseData?.error) {
        switch (statusCode) {
          case 404:
            errorMessage = 'Resource not found - please check the API endpoint';
            break;
          case 403:
            errorMessage = 'Access forbidden - please check your permissions';
            break;
          case 500:
            errorMessage = 'Server error - please try again later';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable - please try again later';
            break;
        }
      }
    } else if (error.request) {
      // Network error or no response received
      console.error('🌐 Network error details:', {
        code: error.code,
        message: error.message,
        baseURL: API_CONFIG.baseURL,
        isNgrok: isNgrokUrl,
        requestStatus: error.request?.status,
        requestReadyState: error.request?.readyState,
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        if (isProductionApi) {
          errorMessage = `Cannot connect to production API at ${API_CONFIG.baseURL}. Please check your internet connection and try again.`;
        } else {
          errorMessage = `Cannot connect to API server at ${API_CONFIG.baseURL}. Please check if the backend server is running.`;
        }
      } else if (error.code === 'ENOTFOUND') {
        if (isProductionApi) {
          errorMessage = `Production API not found at ${API_CONFIG.baseURL}. Please check your internet connection.`;
        } else {
          errorMessage = `API server not found at ${API_CONFIG.baseURL}. Please check the API URL configuration.`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = `Request timeout - the API server at ${API_CONFIG.baseURL} is taking too long to respond.`;
      } else {
        errorMessage = `Network error - please check your connection and API URL (${API_CONFIG.baseURL})`;
      }
    } else {
      // Request setup error
      console.error('🔧 Request setup error:', {
        message: error.message,
        code: error.code,
        config: error.config,
      });
      errorMessage = error.message || 'Request setup error';
    }


    return {
      success: false,
      error: errorMessage,
      statusCode,
    };
  }

  // Public HTTP methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest(() => this.client.get<ApiResponse<T>>(url, config));
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest(() => this.client.post<ApiResponse<T>>(url, data, config));
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest(() => this.client.put<ApiResponse<T>>(url, data, config));
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest(() => this.client.delete<ApiResponse<T>>(url, config));
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest(() => this.client.patch<ApiResponse<T>>(url, data, config));
  }


}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing purposes
export { ApiClient };
