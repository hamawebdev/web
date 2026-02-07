/**
 * Session Logo Validator
 * Utility to validate session data with unit/module logo integration
 */

export interface SessionWithLogo {
  sessionId: number;
  title: string;
  status: string;
  type: 'PRACTICE' | 'EXAM';
  unit?: {
    id: number;
    name: string;
    logoUrl?: string | null;
  };
  module?: {
    id: number;
    name: string;
    logoUrl?: string | null;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  logoInfo: {
    hasUnitLogo: boolean;
    hasModuleLogo: boolean;
    unitLogoUrl?: string;
    moduleLogoUrl?: string;
  };
}

/**
 * Validates a session object for proper logo integration
 */
export function validateSessionLogo(session: SessionWithLogo): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic session validation
  if (!session.sessionId) {
    errors.push('Session ID is required');
  }
  
  if (!session.title) {
    errors.push('Session title is required');
  }
  
  if (!['PRACTICE', 'EXAM'].includes(session.type)) {
    errors.push('Session type must be PRACTICE or EXAM');
  }
  
  // Logo validation
  const logoInfo = {
    hasUnitLogo: false,
    hasModuleLogo: false,
    unitLogoUrl: undefined as string | undefined,
    moduleLogoUrl: undefined as string | undefined
  };
  
  // Validate unit information
  if (session.unit) {
    if (!session.unit.id) {
      errors.push('Unit ID is required when unit is present');
    }
    
    if (!session.unit.name) {
      errors.push('Unit name is required when unit is present');
    }
    
    if (session.unit.logoUrl) {
      logoInfo.hasUnitLogo = true;
      logoInfo.unitLogoUrl = session.unit.logoUrl;
      
      // Validate logo URL format
      if (!isValidLogoUrl(session.unit.logoUrl)) {
        warnings.push('Unit logo URL format may be invalid');
      }
    } else {
      warnings.push('Unit has no logo URL - fallback icon will be used');
    }
  }
  
  // Validate module information
  if (session.module) {
    if (!session.module.id) {
      errors.push('Module ID is required when module is present');
    }
    
    if (!session.module.name) {
      errors.push('Module name is required when module is present');
    }
    
    if (session.module.logoUrl) {
      logoInfo.hasModuleLogo = true;
      logoInfo.moduleLogoUrl = session.module.logoUrl;
      
      // Validate logo URL format
      if (!isValidLogoUrl(session.module.logoUrl)) {
        warnings.push('Module logo URL format may be invalid');
      }
    } else {
      warnings.push('Module has no logo URL - fallback icon will be used');
    }
  }
  
  // Check if session has neither unit nor module
  if (!session.unit && !session.module) {
    warnings.push('Session has no unit or module information - no logos will be displayed');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    logoInfo
  };
}

/**
 * Validates if a logo URL follows the expected format
 */
function isValidLogoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a med-cortex logo URL
    if (urlObj.hostname === 'med-cortex.com' && urlObj.pathname.startsWith('/api/v1/media/logos/')) {
      return true;
    }
    
    // Check if it's a valid image URL (for testing purposes)
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Validates an array of sessions
 */
export function validateSessionArray(sessions: SessionWithLogo[]): {
  totalSessions: number;
  validSessions: number;
  invalidSessions: number;
  sessionsWithLogos: number;
  sessionsWithoutLogos: number;
  results: ValidationResult[];
} {
  const results = sessions.map(validateSessionLogo);
  
  return {
    totalSessions: sessions.length,
    validSessions: results.filter(r => r.isValid).length,
    invalidSessions: results.filter(r => !r.isValid).length,
    sessionsWithLogos: results.filter(r => r.logoInfo.hasUnitLogo || r.logoInfo.hasModuleLogo).length,
    sessionsWithoutLogos: results.filter(r => !r.logoInfo.hasUnitLogo && !r.logoInfo.hasModuleLogo).length,
    results
  };
}

/**
 * Example usage and testing
 */
export function runValidationTests(): void {
  console.log('🧪 Running Session Logo Validation Tests...\n');
  
  // Test data
  const testSessions: SessionWithLogo[] = [
    {
      sessionId: 123,
      title: 'Practice Session - Cardiology',
      status: 'COMPLETED',
      type: 'PRACTICE',
      unit: {
        id: 32,
        name: 'Endocrinologie-Maladies Métabolique',
        logoUrl: 'https://med-cortex.com/api/v1/media/logos/logos_1758301482502-236176390.png'
      }
    },
    {
      sessionId: 124,
      title: 'Exam Session - Gynécologie',
      status: 'COMPLETED',
      type: 'EXAM',
      module: {
        id: 33,
        name: 'Gynécologie-Obstétrique',
        logoUrl: 'https://med-cortex.com/api/v1/media/logos/logos_1758301491749-937875837.jpg'
      }
    },
    {
      sessionId: 125,
      title: 'Practice Session - Psychiatrie',
      status: 'IN_PROGRESS',
      type: 'PRACTICE',
      module: {
        id: 35,
        name: 'Psychiatrie',
        logoUrl: null
      }
    }
  ];
  
  const summary = validateSessionArray(testSessions);
  
  console.log('📊 Validation Summary:');
  console.log(`Total Sessions: ${summary.totalSessions}`);
  console.log(`Valid Sessions: ${summary.validSessions}`);
  console.log(`Invalid Sessions: ${summary.invalidSessions}`);
  console.log(`Sessions with Logos: ${summary.sessionsWithLogos}`);
  console.log(`Sessions without Logos: ${summary.sessionsWithoutLogos}\n`);
  
  summary.results.forEach((result, index) => {
    const session = testSessions[index];
    console.log(`Session ${session.sessionId} (${session.title}):`);
    console.log(`  Valid: ${result.isValid}`);
    console.log(`  Has Unit Logo: ${result.logoInfo.hasUnitLogo}`);
    console.log(`  Has Module Logo: ${result.logoInfo.hasModuleLogo}`);
    
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.join(', ')}`);
    }
    
    if (result.warnings.length > 0) {
      console.log(`  Warnings: ${result.warnings.join(', ')}`);
    }
    
    console.log('');
  });
}
