// @ts-nocheck
/**
 * Centralized logging utility to reduce console spam in development
 * and provide better control over logging levels
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: number;
}

class Logger {
  private static instance: Logger;
  private logCache = new Map<string, number>();
  private recentLogs: LogEntry[] = [];
  private maxRecentLogs = 100;
  
  // Throttling settings
  private throttleWindow = 5000; // 5 seconds
  private maxLogsPerWindow = 3;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Check if we should log this message based on throttling rules
   */
  private shouldLog(key: string): boolean {
    const now = Date.now();
    const lastLogTime = this.logCache.get(key) || 0;
    
    // If enough time has passed, allow logging
    if (now - lastLogTime > this.throttleWindow) {
      this.logCache.set(key, now);
      return true;
    }
    
    return false;
  }

  /**
   * Create a unique key for throttling based on message and context
   */
  private createLogKey(message: string, context?: string): string {
    return context ? `${context}:${message}` : message;
  }

  /**
   * Add log entry to recent logs for debugging
   */
  private addToRecentLogs(level: LogLevel, message: string, data?: any) {
    this.recentLogs.push({
      level,
      message,
      data,
      timestamp: Date.now()
    });

    // Keep only recent logs
    if (this.recentLogs.length > this.maxRecentLogs) {
      this.recentLogs.shift();
    }
  }

  /**
   * Log with throttling - reduces spam for repeated messages
   */
  throttledLog(level: LogLevel, message: string, data?: any, context?: string) {
    // Only apply throttling in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const logKey = this.createLogKey(message, context);

    if (this.shouldLog(logKey)) {
      this.addToRecentLogs(level, message, data);

      switch (level) {
        case 'error':
          console.error(message, data);
          break;
        case 'warn':
          console.warn(message, data);
          break;
        case 'info':
          console.info(message, data);
          break;
        case 'debug':
          console.log(message, data);
          break;
      }
    }
  }

  /**
   * Always log errors regardless of throttling
   * In production, this could be sent to an error monitoring service
   */
  error(message: string, data?: any) {
    this.addToRecentLogs('error', message, data);

    // Always log errors, even in production
    console.error(`[${new Date().toISOString()}] ERROR:`, message, data);

    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true') {
      // TODO: Integrate with error monitoring service (e.g., Sentry)
      // errorMonitoringService.captureException(new Error(message), { extra: data });
    }
  }

  /**
   * Always log warnings regardless of throttling
   */
  warn(message: string, data?: any) {
    this.addToRecentLogs('warn', message, data);

    // Log warnings in development and production
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      console.warn(`[${new Date().toISOString()}] WARN:`, message, data);
    }
  }

  /**
   * Throttled info logging
   */
  info(message: string, data?: any, context?: string) {
    this.throttledLog('info', message, data, context);
  }

  /**
   * Throttled debug logging
   */
  debug(message: string, data?: any, context?: string) {
    this.throttledLog('debug', message, data, context);
  }

  /**
   * Production-safe logging for important events
   */
  production(message: string, data?: any) {
    this.addToRecentLogs('info', message, data);

    // Always log important production events
    if (process.env.NODE_ENV === 'production') {
      console.log(`[${new Date().toISOString()}] PRODUCTION:`, message, data);
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(): LogEntry[] {
    return [...this.recentLogs];
  }

  /**
   * Clear log cache and recent logs
   */
  clear() {
    this.logCache.clear();
    this.recentLogs = [];
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common logging patterns
export const logApiRequest = (url: string, method: string, hasToken: boolean) => {
  logger.debug(
    `🔐 API Request: ${method} ${url}`,
    { hasToken, tokenPreview: hasToken ? 'present' : 'none' },
    'api-client'
  );
};

export const logApiResponse = (url: string, success: boolean, data?: any) => {
  logger.debug(
    `📡 API Response: ${url}`,
    { success, hasData: !!data },
    'api-client'
  );
};

export const logServiceCall = (service: string, method: string, params?: any) => {
  logger.debug(
    `🌐 ${service}.${method}: Making API call`,
    { params },
    service.toLowerCase()
  );
};

export const logHookOperation = (hook: string, operation: string, data?: any) => {
  logger.debug(
    `📝 ${hook}: ${operation}`,
    data,
    hook.toLowerCase()
  );
};
