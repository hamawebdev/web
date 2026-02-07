/**
 * Forgot Password Workflow Tests
 * 
 * Tests the complete password reset workflow according to the API documentation:
 * 1. Request password reset (send verification code)
 * 2. Reset password (verify code and set new password)
 */

import AuthAPI from '@/lib/auth-api';
import { AuthService } from '@/lib/api-services';

// Mock data for testing
const TEST_EMAIL = 'test@example.com';
const TEST_CODE = 'ABC123';
const TEST_NEW_PASSWORD = 'NewSecurePassword123';

/**
 * Test 1: Request Password Reset
 * 
 * Endpoint: POST /auth/forgot-password
 * Request: { email: string }
 * Expected Response: { success: true, data: { message: string }, meta: { timestamp, requestId } }
 */
export async function testForgotPassword() {
  console.log('\n=== Test 1: Request Password Reset ===');
  console.log(`Testing: POST /auth/forgot-password with email: ${TEST_EMAIL}`);
  
  try {
    const result = await AuthAPI.forgotPassword(TEST_EMAIL);
    
    console.log('✅ Success! Response:', result);
    console.log('Message:', result.message);
    
    return {
      success: true,
      message: 'Forgot password request successful',
      data: result
    };
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      message: error.message,
      error
    };
  }
}

/**
 * Test 2: Reset Password with Verification Code
 * 
 * Endpoint: POST /auth/reset-password
 * Request: { email: string, code: string, newPassword: string }
 * Expected Response: { success: true, data: { message: string }, meta: { timestamp, requestId } }
 * 
 * Validation Rules:
 * - email: Valid email address format (required)
 * - code: 6-character verification code (required)
 * - newPassword: Minimum 8 characters (required)
 */
export async function testResetPassword() {
  console.log('\n=== Test 2: Reset Password with Verification Code ===');
  console.log(`Testing: POST /auth/reset-password`);
  console.log(`  Email: ${TEST_EMAIL}`);
  console.log(`  Code: ${TEST_CODE}`);
  console.log(`  New Password: ${TEST_NEW_PASSWORD}`);
  
  try {
    const result = await AuthAPI.resetPassword(TEST_EMAIL, TEST_CODE, TEST_NEW_PASSWORD);
    
    console.log('✅ Success! Response:', result);
    console.log('Message:', result.message);
    
    return {
      success: true,
      message: 'Password reset successful',
      data: result
    };
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      message: error.message,
      error
    };
  }
}

/**
 * Test 3: Validation - Invalid Email Format
 * 
 * Expected: Should return error "A valid email is required"
 */
export async function testInvalidEmailFormat() {
  console.log('\n=== Test 3: Validation - Invalid Email Format ===');
  console.log('Testing: Invalid email format');
  
  try {
    await AuthAPI.forgotPassword('invalid-email');
    console.error('❌ Should have thrown an error for invalid email');
    return { success: false, message: 'Should have thrown an error' };
  } catch (error: any) {
    console.log('✅ Correctly rejected invalid email');
    console.log('Error message:', error.message);
    return { success: true, message: 'Invalid email correctly rejected' };
  }
}

/**
 * Test 4: Validation - Password Too Short
 * 
 * Expected: Should return error "New password must be at least 8 characters long"
 */
export async function testPasswordTooShort() {
  console.log('\n=== Test 4: Validation - Password Too Short ===');
  console.log('Testing: Password with less than 8 characters');
  
  try {
    await AuthAPI.resetPassword(TEST_EMAIL, TEST_CODE, 'short');
    console.error('❌ Should have thrown an error for short password');
    return { success: false, message: 'Should have thrown an error' };
  } catch (error: any) {
    console.log('✅ Correctly rejected short password');
    console.log('Error message:', error.message);
    return { success: true, message: 'Short password correctly rejected' };
  }
}

/**
 * Test 5: Validation - Invalid Verification Code
 * 
 * Expected: Should return error "Invalid verification code"
 */
export async function testInvalidVerificationCode() {
  console.log('\n=== Test 5: Validation - Invalid Verification Code ===');
  console.log('Testing: Invalid verification code');
  
  try {
    await AuthAPI.resetPassword(TEST_EMAIL, 'INVALID', TEST_NEW_PASSWORD);
    console.error('❌ Should have thrown an error for invalid code');
    return { success: false, message: 'Should have thrown an error' };
  } catch (error: any) {
    console.log('✅ Correctly rejected invalid code');
    console.log('Error message:', error.message);
    return { success: true, message: 'Invalid code correctly rejected' };
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🧪 Starting Forgot Password Workflow Tests...\n');
  
  const results = [];
  
  // Test 1: Request password reset
  results.push(await testForgotPassword());
  
  // Test 2: Reset password
  results.push(await testResetPassword());
  
  // Test 3: Invalid email validation
  results.push(await testInvalidEmailFormat());
  
  // Test 4: Password too short validation
  results.push(await testPasswordTooShort());
  
  // Test 5: Invalid verification code validation
  results.push(await testInvalidVerificationCode());
  
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  
  return results;
}

// Export for use in test runners
export default {
  testForgotPassword,
  testResetPassword,
  testInvalidEmailFormat,
  testPasswordTooShort,
  testInvalidVerificationCode,
  runAllTests
};

