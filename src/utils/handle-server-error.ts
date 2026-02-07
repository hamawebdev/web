// @ts-nocheck
import { AxiosError } from 'axios'
import { toast } from 'sonner'

// Enhanced error handling with more specific error types
export function handleServerError(error: unknown, showToast: boolean = true) {
  // eslint-disable-next-line no-console
  console.error('Server error:', error)

  let errMsg = 'Something went wrong!'
  let statusCode: number | undefined

  // Handle different error types
  if (error instanceof AxiosError) {
    statusCode = error.response?.status

    // Handle specific HTTP status codes
    switch (statusCode) {
      case 400:
        errMsg = error.response?.data?.error || error.response?.data?.message || 'Bad request'
        break
      case 401:
        errMsg = 'Authentication required. Please log in again.'
        break
      case 403:
        errMsg = 'Access denied. You don\'t have permission to perform this action.'
        break
      case 404:
        errMsg = 'The requested resource was not found.'
        break
      case 409:
        errMsg = error.response?.data?.error || 'Conflict occurred'
        break
      case 422:
        errMsg = error.response?.data?.error || 'Validation failed'
        break
      case 429:
        errMsg = 'Too many requests. Please try again later.'
        break
      case 500:
        errMsg = 'Internal server error. Please try again later.'
        break
      case 502:
        errMsg = 'Service temporarily unavailable. Please try again later.'
        break
      case 503:
        errMsg = 'Service unavailable. Please try again later.'
        break
      default:
        errMsg = error.response?.data?.error ||
                 error.response?.data?.message ||
                 error.message ||
                 'Network error occurred'
    }
  } else if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
    errMsg = 'Network error: Unable to connect to the server. Please check your internet connection and ensure the backend server is running.'
  } else if (error instanceof Error) {
    errMsg = error.message
  } else if (typeof error === 'string') {
    errMsg = error
  } else {
    errMsg = 'An unknown error occurred'
  }

  if (showToast) {
    toast.error(errMsg)
  }

  return {
    message: errMsg,
    statusCode,
    originalError: error
  }
}



export function handleAuthError(error: unknown) {
  const result = handleServerError(error, false) // Don't show toast for auth errors

  // Redirect to login for auth errors
  if (result.statusCode === 401 && typeof window !== 'undefined') {
    window.location.href = '/login'
  }

  return result
}

export function handleValidationError(error: unknown) {
  const result = handleServerError(error, false)

  // Extract validation errors if available
  if (error instanceof AxiosError && error.response?.data?.validationErrors) {
    return {
      ...result,
      validationErrors: error.response.data.validationErrors
    }
  }

  return result
}

export function handleNetworkError(error: unknown) {
  if (error instanceof AxiosError && !error.response) {
    // Network error (no response received)
    const message = 'Network error. Please check your internet connection.'
    toast.error(message)
    return {
      message,
      statusCode: undefined,
      originalError: error,
      isNetworkError: true
    }
  }

  return handleServerError(error)
}

// Utility to get user-friendly error message
export function getErrorMessage(error: unknown): string {
  return handleServerError(error, false).message
}
