// @ts-nocheck
/**
 * Authentication Types
 * Based on actual API responses from the Medical Education Platform
 */

// User roles as returned by the API
export type UserRole = 'STUDENT' | 'ADMIN' | 'EMPLOYEE';

// Current year enum values from API
export type CurrentYear = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';

// University interface based on API response
export interface University {
  id: number;
  name: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

// Specialty interface based on API response
export interface Specialty {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Study pack interface from subscription data
export interface StudyPack {
  id: number;
  name: string;
  description: string;
  type: 'YEAR' | 'RESIDENCY';
  yearNumber: CurrentYear | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// User subscription interface
export interface UserSubscription {
  id: number;
  userId: number;
  studyPackId: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startDate: string;
  endDate: string;
  amountPaid: number;
  paymentMethod: string;
  paymentReference: string;
  createdAt: string;
  updatedAt: string;
  studyPack: StudyPack;
}

// Main User interface based on actual API profile response
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  universityId: number;
  specialtyId: number;
  currentYear: CurrentYear;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  university: University;
  specialty: Specialty;
  subscriptions: UserSubscription[];
}

// Legacy user interface for backward compatibility
export interface LegacyUser {
  id: number;
  email: string;
  fullName: string;
  role: 'student' | 'admin' | 'employee'; // lowercase for legacy compatibility
  universityId: number;
  specialtyId: number;
  currentYear: CurrentYear;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: Date | string;
}

// Login request data
export interface LoginData {
  email: string;
  password: string;
}

// Registration request data
export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  universityId: number;
  specialtyId: number;
  currentYear: CurrentYear;
}

// Authentication tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Login response from API
export interface LoginResponse {
  message: string;
  tokens: AuthTokens;
}

// Registration response from API
export interface RegisterResponse {
  message: string;
  tokens: AuthTokens;
}

// Auth response for internal use
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Authentication state for React hooks
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Profile update data
export interface ProfileUpdateData {
  fullName: string;
  universityId: number;
  specialtyId: number;
  currentYear: CurrentYear;
}

// Password change data
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// Password reset data
export interface PasswordResetData {
  token: string;
  newPassword: string;
}



// Forgot password data
export interface ForgotPasswordData {
  email: string;
}

// API Error structure
export interface ApiError {
  type: 'ValidationError' | 'UnauthorizedError' | 'ConflictError' | 'NotFoundError' | 'BadRequestError' | 'InternalServerError';
  message: string;
  details?: {
    fieldErrors: Array<{
      field: string;
      message: string;
    }>;
  };
  timestamp: string;
  requestId: string;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Utility function to convert API user to legacy format
export function convertApiUserToLegacy(apiUser: User): LegacyUser {
  return {
    id: apiUser.id,
    email: apiUser.email,
    fullName: apiUser.fullName,
    role: apiUser.role.toLowerCase() as 'student' | 'admin' | 'employee',
    universityId: apiUser.universityId,
    specialtyId: apiUser.specialtyId,
    currentYear: apiUser.currentYear,
    isActive: apiUser.isActive,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
    lastLogin: apiUser.lastLogin,
  };
}
