// @ts-nocheck
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger, logApiRequest } from './logger';
import { API_BASE_URL } from './config';

// API Configuration - base URL comes from NEXT_PUBLIC_API_URL (see src/lib/config.ts)
const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
};

// Authentication uses Bearer tokens from localStorage, never cookies, so credentials
// (cookies) are only sent to a local development backend that explicitly needs them.
const apiHostname = new URL(API_CONFIG.baseURL).hostname;
const isLocalDevelopment = apiHostname === 'localhost' || apiHostname === '127.0.0.1';
const isProductionApi = !isLocalDevelopment;
const needsCredentials = isLocalDevelopment && !process.env.NEXT_PUBLIC_DISABLE_CREDENTIALS;

// Check if the API URL is using ngrok tunnel
const isNgrokUrl = API_CONFIG.baseURL.includes('ngrok.io') || API_CONFIG.baseURL.includes('ngrok-free.app');

// API configuration is set up silently

// Token storage keys
/** localStorage key holding the access token (also read by keepalive requests outside axios). */
export const AUTH_TOKEN_STORAGE_KEY = 'auth_token';
const TOKEN_STORAGE_KEY = AUTH_TOKEN_STORAGE_KEY;
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

/** Window event fired when the session ends because the refresh token was rejected. */
export const AUTH_LOGOUT_EVENT = 'auth:logout';

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * Some backend endpoints reply with the raw payload (`res.json(result)`) instead of
 * the `{ success, data }` envelope. apiClient only resolves on 2xx, so a resolved
 * body without a boolean `success` is a successful call: wrap it so callers can
 * keep checking `response.success` and reading `response.data`.
 */
export function normalizeApiResponse<T = any>(body: any): ApiResponse<T> {
  if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.success === 'boolean') {
    return body as ApiResponse<T>;
  }
  return {
    success: true,
    data: body as T,
    ...(body && typeof body === 'object' && typeof body.message === 'string' ? { message: body.message } : {}),
  };
}

// Error response interface
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
  /**
   * Machine-readable reason: the backend's error.code (e.g. ACTIVATION_CODE_EXPIRED, RATE_LIMITED),
   * or NETWORK_ERROR / TIMEOUT when no response came back
   */
  code?: string;
  /** Backend validation details (e.g. { errors: [{ field, message }] }), when the API sent any */
  details?: unknown;
}

/**
 * Loggable summary of a request error. Never log the raw AxiosError or
 * error.response/error.request: they carry config.headers.Authorization
 * (the Bearer token).
 */
function summarizeRequestError(error: any) {
  return {
    message: error?.message,
    status: error?.response?.status,
    data: error?.response?.data,
    url: error?.config?.url,
    method: error?.config?.method,
  };
}

class ApiClient {
  private client: AxiosInstance;
  private tokenLoggedThisSession = false;
  private isRefreshing = false;
  private failedQueue: {
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
    config: any;
  }[] = [];

  constructor() {
    // Prepare headers for the axios instance
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add production-specific headers (browsers forbid setting User-Agent, so it is not set)
    if (isProductionApi) {
      defaultHeaders['X-Client-Version'] = '1.0.0';
      defaultHeaders['X-Requested-With'] = 'XMLHttpRequest';
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
        const lowerUrl = url.toLowerCase();

        // Public auth endpoints that don't need or shouldn't have the current token
        const isPublicAuthEndpoint =
          lowerUrl.includes('/auth/login') ||
          lowerUrl.includes('/auth/register') ||
          lowerUrl.includes('/auth/forgot-password') ||
          lowerUrl.includes('/auth/reset-password') ||
          (lowerUrl.includes('/auth/refresh') && !lowerUrl.includes('profile')); // Ensure profile is never matched here

        // Always attach token unless it's a strictly public endpoint
        // Special care for profile endpoint to ensure it gets the token despite having 'auth' in path
        if (!isPublicAuthEndpoint && token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log if token is missing for protected endpoints (except public ones)
        if (!token && !isPublicAuthEndpoint && lowerUrl.includes('/auth/')) {
          console.warn('⚠️ [ApiClient] No token available for protected auth endpoint:', url);
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

        const statusCode = error.response?.status;
        const needs401Refresh = statusCode === 401 && !isAuthEndpoint && !originalRequest._retry;
        const needsSubscription403Refresh =
          statusCode === 403 &&
          !isAuthEndpoint &&
          !originalRequest._subscriptionRetry &&
          this.isSubscriptionRequiredForbidden(error);

        // Handle 401 (expired token) and targeted 403 (stale subscription claims) with token refresh
        if (needs401Refresh || needsSubscription403Refresh) {
          // If already refreshing, queue this request. Flag it first so the replay
          // after the refresh cannot trigger yet another refresh.
          if (this.isRefreshing) {
            if (needs401Refresh) {
              originalRequest._retry = true;
            }
            if (needsSubscription403Refresh) {
              originalRequest._subscriptionRetry = true;
            }
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          if (needs401Refresh) {
            originalRequest._retry = true;
          }
          if (needsSubscription403Refresh) {
            originalRequest._subscriptionRetry = true;
          }

          const refreshToken = this.getStoredRefreshToken();
          if (!refreshToken) {
            if (needs401Refresh) {
              this.handleAuthError();
            }
            return Promise.reject(error);
          }

          this.isRefreshing = true;
          // The refresh token actually sent to /auth/refresh (may differ from the one read
          // above if another tab rotated it while this tab waited for the refresh lock).
          let usedRefreshToken = refreshToken;

          try {
            console.log(`🔄 [ApiClient] Refreshing access token after ${statusCode} response...`);
            const tokens = await this.refreshWithCrossTabLock(refreshToken, (sent) => {
              usedRefreshToken = sent;
            });
            console.log('✅ [ApiClient] Token refreshed successfully');

            // Process queued requests with new token
            this.processQueue(null, tokens.accessToken);

            // Retry the original request with new token
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError: any) {
            console.error('❌ [ApiClient] Token refresh failed:', refreshError.message);

            // Another tab may have rotated the refresh token while this refresh was in
            // flight (the backend keeps one rotating token per user). In that case the
            // stored tokens are fresh: use them instead of wiping them.
            const storedRefreshToken = this.getStoredRefreshToken();
            const storedAccessToken = this.getStoredToken();
            if (
              !refreshError?.isSessionEnded &&
              storedRefreshToken &&
              storedAccessToken &&
              storedRefreshToken !== usedRefreshToken
            ) {
              this.processQueue(null, storedAccessToken);
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${storedAccessToken}`;
              return this.client(originalRequest);
            }

            // Process queued requests with error
            this.processQueue(refreshError, null);

            // Only a definitive rejection of the refresh token (400/401/403) ends the
            // session. Network errors, timeouts and 5xx keep the tokens so the next
            // request can retry the refresh once the API is reachable again.
            const refreshStatus = refreshError?.response?.status;
            const refreshTokenRejected =
              refreshError?.isSessionEnded ||
              refreshStatus === 400 ||
              refreshStatus === 401 ||
              refreshStatus === 403;

            // For 401 failures, clear tokens. For 403 subscription refresh failures,
            // keep the existing session and return the original forbidden error.
            if (needs401Refresh) {
              if (refreshTokenRejected) {
                this.handleAuthError();
              }
              return Promise.reject(refreshError);
            }

            return Promise.reject(error);
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

  /**
   * Serialize refreshes across tabs. Every tab shares one refresh token in
   * localStorage and the backend rotates it on each refresh, so two tabs refreshing
   * with the same token would make the second one fail and log both out.
   * Inside the lock, the stored token is re-read: if another tab already rotated it,
   * its fresh access token is reused instead of refreshing again.
   */
  private async refreshWithCrossTabLock(
    staleRefreshToken: string,
    onSend: (refreshToken: string) => void
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const run = async () => {
      const currentRefreshToken = this.getStoredRefreshToken();
      if (!currentRefreshToken) {
        // Another tab ended the session while this one waited.
        const ended: any = new Error('Session ended');
        ended.isSessionEnded = true;
        throw ended;
      }
      if (currentRefreshToken !== staleRefreshToken) {
        const currentAccessToken = this.getStoredToken();
        if (currentAccessToken) {
          return { accessToken: currentAccessToken, refreshToken: currentRefreshToken };
        }
      }
      onSend(currentRefreshToken);
      return this.refreshAccessToken(currentRefreshToken);
    };

    const locks = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined;
    if (locks?.request) {
      return locks.request('medadn-auth-refresh', run);
    }
    return run();
  }

  private async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await axios.post(
      `${API_CONFIG.baseURL}/auth/refresh`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        // Without a timeout a hung refresh keeps isRefreshing set and every later
        // 401 request waits in failedQueue forever.
        timeout: API_CONFIG.timeout,
      }
    );

    const tokens = response.data?.data?.tokens;
    if (!tokens?.accessToken) {
      throw new Error('Invalid refresh response');
    }

    this.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  private isSubscriptionRequiredForbidden(error: AxiosError): boolean {
    const data: any = error.response?.data;
    const message = String(data?.error?.message || data?.message || '').toLowerCase();

    return message.includes('active subscription required');
  }



  private handleAuthError() {
    console.log('🚨 API Client: Handling authentication error, clearing tokens');
    this.clearStoredTokens();
    // Do NOT hard-redirect to /login here.
    // Notify the React auth layer (use-auth) instead: it resets its cached auth
    // state and the route guards redirect through the React router, which allows
    // proper handling of post-payment and other flows.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
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
          hasToken: !!token,
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
      console.error('🚨 makeRequest caught error:', summarizeRequestError(error));
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
    let details: unknown;
    let code: string | undefined;

    // Log a sanitized summary only (the raw error carries the Authorization header)
    console.error('🔍 Request error:', summarizeRequestError(error));

    // Check if it's an AxiosError
    const isAxiosError = error?.isAxiosError || error?.response || error?.request;

    if (!isAxiosError) {
      console.error('⚠️ Not an Axios error, treating as generic error');
      const message = error?.message || errorMessage;
      return {
        success: false,
        error: message,
        message,
        statusCode: 500,
        details: { originalError: error }
      };
    }

    console.error('API Error Details:', summarizeRequestError(error));

    if (error.response) {
      statusCode = error.response.status;
      const responseData = error.response.data as any;
      details = responseData?.error?.details ?? responseData?.details;
      const responseCode = responseData?.error?.code ?? responseData?.code;
      code = typeof responseCode === 'string' ? responseCode : undefined;

      // Log detailed info for 401 errors to help debug authentication issues
      if (statusCode === 401) {
        console.error('🔐 401 Unauthorized Error Details:', {
          url: error.config?.url,
          method: error.config?.method,
          responseData: responseData,
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
      code = error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR';
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
      });
      errorMessage = error.message || 'Request setup error';
    }


    // `message` repeats `error` so callers doing `error.message || fallback` show the API's message
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      statusCode,
      ...(details !== undefined ? { details } : {}),
      ...(code !== undefined ? { code } : {}),
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
