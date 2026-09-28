import { getApiErrorMessage } from './api-error';

/**
 * Activation Code Error Handling Utilities
 * Provides user-friendly French error messages for activation code operations
 */

export interface ActivationCodeError {
  code?: string;
  message: string;
  statusCode?: number;
  details?: any;
}

/**
 * Maps API error codes to user-friendly French messages
 */
export const ERROR_MESSAGES = {
  // Validation errors
  INVALID_CODE: 'Code d\'activation invalide',
  EXPIRED: 'Ce code d\'activation a expiré',
  EXHAUSTED: 'Ce code d\'activation a atteint sa limite d\'utilisation',
  ALREADY_REDEEMED: 'Vous avez déjà utilisé ce code d\'activation',
  
  // General errors
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Code d\'activation introuvable',
  VALIDATION_ERROR: 'Erreur de validation des données',
  DUPLICATE_CODE: 'Ce code d\'activation existe déjà',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'Erreur interne du serveur',
  SERVICE_UNAVAILABLE: 'Service temporairement indisponible',
  
  // Network errors
  NETWORK_ERROR: 'Erreur de connexion réseau',
  TIMEOUT: 'Délai d\'attente dépassé',
  
  // Default fallback
  UNKNOWN_ERROR: 'Une erreur est survenue. Veuillez réessayer.',
} as const;

/**
 * Extracts and formats error messages from API responses
 */
export function getActivationCodeErrorMessage(error: any): string {
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle API error responses
  if (error?.response?.data?.error) {
    const apiError = error.response.data.error;
    
    // Check for specific error codes
    if (apiError.details?.code) {
      const errorCode = apiError.details.code as keyof typeof ERROR_MESSAGES;
      if (ERROR_MESSAGES[errorCode]) {
        return ERROR_MESSAGES[errorCode];
      }
    }
    
    // Check for status code based errors
    if (apiError.statusCode) {
      switch (apiError.statusCode) {
        case 400:
          return ERROR_MESSAGES.VALIDATION_ERROR;
        case 401:
          return ERROR_MESSAGES.UNAUTHORIZED;
        case 403:
          return ERROR_MESSAGES.FORBIDDEN;
        case 404:
          return ERROR_MESSAGES.NOT_FOUND;
        case 409:
          return ERROR_MESSAGES.DUPLICATE_CODE;
        case 500:
          return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
        case 503:
          return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
        default:
          return apiError.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      }
    }
    
    // Return the API error message if available
    if (apiError.message) {
      return apiError.message;
    }
  }

  // Handle direct API error structure (apiClient rejection), with validation details if any
  if (error?.error) {
    return getApiErrorMessage(error, ERROR_MESSAGES.UNKNOWN_ERROR);
  }

  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Handle timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  // Handle specific activation code errors by message content
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid') && message.includes('code')) {
      return ERROR_MESSAGES.INVALID_CODE;
    }
    
    if (message.includes('expired')) {
      return ERROR_MESSAGES.EXPIRED;
    }
    
    if (message.includes('exhausted') || message.includes('limit')) {
      return ERROR_MESSAGES.EXHAUSTED;
    }
    
    if (message.includes('already') && message.includes('redeemed')) {
      return ERROR_MESSAGES.ALREADY_REDEEMED;
    }
    
    if (message.includes('unauthorized')) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    
    if (message.includes('forbidden')) {
      return ERROR_MESSAGES.FORBIDDEN;
    }
    
    if (message.includes('not found')) {
      return ERROR_MESSAGES.NOT_FOUND;
    }
    
    // Return the original message if it's user-friendly
    if (error.message.length < 200 && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  // Fallback to default error message
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Messages of the student's activation code dialog, one per way a redemption can fail.
 * Keys are the backend's error codes (see code-redemption.service.ts on the API).
 */
export const REDEEM_ERROR_MESSAGES = {
  ACTIVATION_CODE_ALREADY_REDEEMED: 'Vous avez déjà utilisé ce code d\'activation.',
  ACTIVATION_CODE_USED_UP: 'Ce code d\'activation a déjà été utilisé et n\'est plus disponible.',
  ACTIVATION_CODE_EXPIRED: 'Ce code d\'activation a expiré.',
  ACTIVATION_CODE_DEACTIVATED: 'Ce code d\'activation a été désactivé.',
  ACTIVATION_CODE_NOT_FOUND: 'Ce code d\'activation n\'existe pas. Vérifiez qu\'il est bien saisi.',
  ACTIVATION_CODE_NO_ACTIVE_PACKS: 'Ce code ne donne accès à aucun pack disponible pour le moment. Contactez-nous.',
  INVALID_FORMAT: 'Code invalide : il doit contenir de 8 à 32 caractères (lettres, chiffres et tirets).',
  EMPTY: 'Veuillez saisir votre code d\'activation.',
  SESSION_EXPIRED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  STUDENTS_ONLY: 'Seul un compte étudiant peut utiliser un code d\'activation.',
  NETWORK_ERROR: 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.',
  UNKNOWN_ERROR: ERROR_MESSAGES.UNKNOWN_ERROR,
} as const;

function tooManyAttemptsMessage(retryAfterSeconds: unknown): string {
  if (typeof retryAfterSeconds !== 'number' || retryAfterSeconds <= 0) {
    return 'Trop de tentatives. Réessayez plus tard.';
  }
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`;
}

/**
 * French message for a failed redemption. `error` is the apiClient rejection
 * ({ error, statusCode, code?, details? }) or an unsuccessful response body.
 */
export function getRedeemErrorMessage(error: any): string {
  const code: unknown = error?.code;
  if (typeof code === 'string' && code in REDEEM_ERROR_MESSAGES) {
    return REDEEM_ERROR_MESSAGES[code as keyof typeof REDEEM_ERROR_MESSAGES];
  }

  const status = error?.statusCode;
  if (code === 'RATE_LIMITED' || status === 429) {
    return tooManyAttemptsMessage(error?.details?.retryAfterSeconds);
  }
  if (code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return REDEEM_ERROR_MESSAGES.NETWORK_ERROR;
  }
  // The code itself was rejected by validation (too short, too long, other characters)
  const issues = error?.details?.errors ?? error?.details?.fieldErrors;
  if (status === 400 && Array.isArray(issues) && issues.some((issue: any) => issue?.field === 'code')) {
    return REDEEM_ERROR_MESSAGES.INVALID_FORMAT;
  }
  if (status === 401) {
    return REDEEM_ERROR_MESSAGES.SESSION_EXPIRED;
  }
  if (status === 403) {
    return REDEEM_ERROR_MESSAGES.STUDENTS_ONLY;
  }
  return REDEEM_ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Creates a standardized error object for activation code operations
 */
export function createActivationCodeError(
  message: string,
  code?: string,
  statusCode?: number,
  details?: any
): ActivationCodeError {
  return {
    code,
    message,
    statusCode,
    details,
  };
}

/**
 * Checks if an error is a specific activation code error type
 */
export function isActivationCodeError(error: any, errorCode: keyof typeof ERROR_MESSAGES): boolean {
  if (!error) return false;
  
  // Check direct error code
  if (error.code === errorCode) return true;
  
  // Check nested error code
  if (error?.details?.code === errorCode) return true;
  if (error?.error?.details?.code === errorCode) return true;
  if (error?.response?.data?.error?.details?.code === errorCode) return true;
  
  return false;
}

/**
 * Formats validation errors for form display
 */
export function formatValidationErrors(error: any): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Handle API validation errors
  if (error?.response?.data?.error?.details?.fieldErrors) {
    const fieldErrors = error.response.data.error.details.fieldErrors;
    fieldErrors.forEach((fieldError: { field: string; message: string }) => {
      errors[fieldError.field] = fieldError.message;
    });
  }
  
  // Handle direct field errors
  if (error?.details?.fieldErrors) {
    error.details.fieldErrors.forEach((fieldError: { field: string; message: string }) => {
      errors[fieldError.field] = fieldError.message;
    });
  }
  
  return errors;
}
