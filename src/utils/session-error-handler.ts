/**
 * Session Creation Error Handler
 * 
 * Provides comprehensive error handling for exam and practice session creation
 * with user-friendly messages and proper logging.
 */

export interface SessionErrorDetails {
  type: 'NO_QUESTIONS' | 'INVALID_FILTERS' | 'SERVER_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  userMessage: string;
  technicalMessage: string;
  statusCode?: number;
  suggestedActions: string[];
  highlightFields?: string[];
}

export interface ApiErrorResponse {
  success: boolean;
  error: string;
  statusCode: number;
}

/**
 * Analyzes API error response and returns structured error details
 */
export function analyzeSessionCreationError(
  error: any,
  sessionType: 'EXAM' | 'PRACTICE' = 'EXAM'
): SessionErrorDetails {
  // Log full error for debugging
  console.error('🚨 [SessionErrorHandler] Full error object:', {
    error,
    type: typeof error,
    hasResponse: !!error?.response,
    hasData: !!error?.response?.data,
    hasMessage: !!error?.message,
    statusCode: error?.response?.status || error?.statusCode,
    timestamp: new Date().toISOString()
  });

  // Handle API response with success: false
  if (error && typeof error === 'object' && 'success' in error && error.success === false) {
    return handleApiResponseError(error as ApiErrorResponse, sessionType);
  }

  // Handle axios/fetch errors
  if (error?.response) {
    return handleHttpError(error, sessionType);
  }

  // Handle network/connection errors
  if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
    return {
      type: 'NETWORK_ERROR',
      userMessage: 'Problème de connexion. Veuillez vérifier votre connexion internet et réessayer.',
      technicalMessage: `Network error: ${error.message || 'Connection failed'}`,
      statusCode: 0,
      suggestedActions: [
        'Vérifiez votre connexion internet',
        'Réessayez dans quelques instants',
        'Contactez le support si le problème persiste'
      ]
    };
  }

  // Handle generic errors
  return handleGenericError(error, sessionType);
}

/**
 * Handles API response errors (success: false)
 */
function handleApiResponseError(error: ApiErrorResponse, sessionType: 'EXAM' | 'PRACTICE'): SessionErrorDetails {
  const errorMessage = error.error?.toLowerCase() || '';
  const statusCode = error.statusCode || 400;

  // No questions found (404)
  if (statusCode === 404 || errorMessage.includes('no questions found') || errorMessage.includes('not found')) {
    return {
      type: 'NO_QUESTIONS',
      userMessage: 'Aucune question trouvée pour les filtres sélectionnés. Veuillez modifier vos filtres et réessayer.',
      technicalMessage: error.error,
      statusCode,
      suggestedActions: [
        'Sélectionnez une autre année',
        'Choisissez une université différente',
        'Modifiez la source des questions',
        'Sélectionnez d\'autres modules/unités'
      ],
      highlightFields: ['year', 'university', 'source', 'modules']
    };
  }

  // Validation errors (400)
  if (statusCode === 400 || errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return {
      type: 'VALIDATION_ERROR',
      userMessage: 'Les filtres sélectionnés ne sont pas valides. Veuillez vérifier vos sélections.',
      technicalMessage: error.error,
      statusCode,
      suggestedActions: [
        'Vérifiez que tous les champs requis sont remplis',
        'Assurez-vous que les valeurs sélectionnées sont valides',
        'Réessayez avec des filtres différents'
      ],
      highlightFields: ['title', 'courses', 'year', 'university']
    };
  }

  // Server errors (500+)
  if (statusCode >= 500) {
    return {
      type: 'SERVER_ERROR',
      userMessage: 'Erreur du serveur. Veuillez réessayer dans quelques instants.',
      technicalMessage: error.error,
      statusCode,
      suggestedActions: [
        'Réessayez dans quelques minutes',
        'Contactez le support si le problème persiste'
      ]
    };
  }

  // Generic API error
  return {
    type: 'UNKNOWN',
    userMessage: 'Une erreur est survenue lors de la création de la session. Veuillez réessayer.',
    technicalMessage: error.error,
    statusCode,
    suggestedActions: [
      'Vérifiez vos sélections',
      'Réessayez avec des filtres différents',
      'Contactez le support si le problème persiste'
    ]
  };
}

/**
 * Handles HTTP errors from axios/fetch
 */
function handleHttpError(error: any, sessionType: 'EXAM' | 'PRACTICE'): SessionErrorDetails {
  const statusCode = error.response?.status || 0;
  const responseData = error.response?.data;

  // Try to extract meaningful error message from response
  let technicalMessage = error.message;
  if (responseData?.message) {
    technicalMessage = responseData.message;
  } else if (responseData?.error) {
    technicalMessage = responseData.error;
  } else if (typeof responseData === 'string') {
    technicalMessage = responseData;
  }

  switch (statusCode) {
    case 401:
      return {
        type: 'VALIDATION_ERROR',
        userMessage: 'Session expirée. Veuillez vous reconnecter.',
        technicalMessage,
        statusCode,
        suggestedActions: ['Reconnectez-vous à votre compte']
      };

    case 403:
      return {
        type: 'VALIDATION_ERROR',
        userMessage: 'Vous n\'avez pas l\'autorisation d\'accéder à ces questions.',
        technicalMessage,
        statusCode,
        suggestedActions: [
          'Vérifiez votre abonnement',
          'Sélectionnez des modules/unités autorisés'
        ],
        highlightFields: ['modules', 'university']
      };

    case 404:
      return {
        type: 'NO_QUESTIONS',
        userMessage: 'Aucune question trouvée pour les filtres sélectionnés.',
        technicalMessage,
        statusCode,
        suggestedActions: [
          'Modifiez vos filtres',
          'Sélectionnez d\'autres modules/unités'
        ],
        highlightFields: ['modules', 'year', 'university']
      };

    case 429:
      return {
        type: 'SERVER_ERROR',
        userMessage: 'Trop de tentatives. Veuillez attendre avant de réessayer.',
        technicalMessage,
        statusCode,
        suggestedActions: ['Attendez quelques minutes avant de réessayer']
      };

    default:
      return handleGenericError(error, sessionType);
  }
}

/**
 * Handles generic/unknown errors
 */
function handleGenericError(error: any, sessionType: 'EXAM' | 'PRACTICE'): SessionErrorDetails {
  const message = error?.message || 'Unknown error';
  
  return {
    type: 'UNKNOWN',
    userMessage: `Une erreur inattendue est survenue lors de la création de la session ${sessionType.toLowerCase()}. Veuillez réessayer.`,
    technicalMessage: message,
    statusCode: 0,
    suggestedActions: [
      'Réessayez dans quelques instants',
      'Vérifiez vos sélections',
      'Contactez le support si le problème persiste'
    ]
  };
}

/**
 * Gets user-friendly error message for display
 */
export function getUserErrorMessage(errorDetails: SessionErrorDetails): string {
  return errorDetails.userMessage;
}

/**
 * Gets suggested actions for the user
 */
export function getSuggestedActions(errorDetails: SessionErrorDetails): string[] {
  return errorDetails.suggestedActions;
}

/**
 * Gets fields that should be highlighted in the UI
 */
export function getHighlightFields(errorDetails: SessionErrorDetails): string[] {
  return errorDetails.highlightFields || [];
}

/**
 * Logs error details for debugging
 */
export function logErrorDetails(errorDetails: SessionErrorDetails, context: string): void {
  console.group(`🚨 [SessionErrorHandler] ${context}`);
  console.log('Error Type:', errorDetails.type);
  console.log('User Message:', errorDetails.userMessage);
  console.log('Technical Message:', errorDetails.technicalMessage);
  console.log('Status Code:', errorDetails.statusCode);
  console.log('Suggested Actions:', errorDetails.suggestedActions);
  console.log('Highlight Fields:', errorDetails.highlightFields);
  console.groupEnd();
}
