/**
 * Validation script for residency feature unlock for yearNumber = SEVEN
 * This script tests the selectEffectiveActiveSubscription function logic
 */

// Mock the selectEffectiveActiveSubscription function with the updated logic
function selectEffectiveActiveSubscription(subscriptions) {
  const list = Array.isArray(subscriptions) ? subscriptions : [];
  const now = new Date().getTime();

  const active = list.filter((s) => String(s?.status || '').toUpperCase() === 'ACTIVE' && (!s?.endDate || new Date(s.endDate).getTime() >= now));
  if (active.length === 0) return { effective: null, allowedYearLevels: [], isResidency: false };

  // Helper function to check if a subscription is a residency pack
  const isResidencyPack = (s) => {
    const packType = String(s?.studyPack?.type || s?.type || '').toUpperCase();
    const yearNumber = String(s?.studyPack?.yearNumber || s?.yearNumber || '').toUpperCase();
    
    // Check if type is explicitly RESIDENCY or if yearNumber is SEVEN (residency year)
    return packType === 'RESIDENCY' || yearNumber === 'SEVEN';
  };

  // Residency takes precedence (unlocks all years). If multiple residencies, pick the one with latest endDate.
  const residencies = active.filter(isResidencyPack);
  const byEndDesc = (a, b) => (new Date(b?.endDate || 0).getTime() - new Date(a?.endDate || 0).getTime()) || (new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
  if (residencies.length > 0) {
    const effective = [...residencies].sort(byEndDesc)[0];
    return {
      effective,
      allowedYearLevels: ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN'],
      isResidency: true,
    };
  }

  // Otherwise pick the non-residency with the latest endDate
  const nonResidency = active.filter((s) => !isResidencyPack(s));
  const effective = [...nonResidency].sort(byEndDesc)[0] || null;

  const normalize = (val) => {
    if (!val) return null;
    const s = String(val).toUpperCase();
    const map = {
      '1': 'ONE', 'ONE': 'ONE', 'L1': 'ONE',
      '2': 'TWO', 'TWO': 'TWO', 'L2': 'TWO',
      '3': 'THREE', 'THREE': 'THREE', 'L3': 'THREE',
      '4': 'FOUR', 'FOUR': 'FOUR', 'L4': 'FOUR',
      '5': 'FIVE', 'FIVE': 'FIVE', 'L5': 'FIVE',
      '6': 'SIX', 'SIX': 'SIX', 'L6': 'SIX',
      '7': 'SEVEN', 'SEVEN': 'SEVEN', 'L7': 'SEVEN',
    };
    return map[s] || null;
  };

  const y = effective?.studyPack?.yearNumber ?? effective?.yearNumber;
  const ny = normalize(y);
  return { effective, allowedYearLevels: ny ? [ny] : [], isResidency: false };
}

// Test cases
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Test 1: Real subscription data from docs/subscriptions-response.md
test('Should recognize YEAR type with yearNumber=SEVEN as residency', () => {
  const subscriptions = [{
    id: 553,
    status: 'ACTIVE',
    startDate: '2025-10-15T15:31:54.911Z',
    endDate: '2025-11-15T15:31:54.911Z',
    amountPaid: 0,
    paymentMethod: 'ACTIVATION_CODE',
    studyPack: {
      id: 7,
      name: 'Résidanat',
      description: 'Pack spécialisé pour la préparation au résidanat',
      type: 'YEAR',
      yearNumber: 'SEVEN',
      pricePerMonth: '990',
      pricePerYear: '5500',
      statistics: { totalCourses: 0, totalModules: 0, totalUnites: 0 }
    },
    isActive: true,
    daysRemaining: 31,
    createdAt: '2025-10-15T15:31:54.913Z'
  }];

  const result = selectEffectiveActiveSubscription(subscriptions);
  assert(result.isResidency === true, 'isResidency should be true');
  assert(result.allowedYearLevels.includes('SEVEN'), 'allowedYearLevels should include SEVEN');
  assert(result.allowedYearLevels.length === 7, 'allowedYearLevels should have all 7 years');
  assert(result.effective !== null, 'effective subscription should be set');
});

// Test 2: Explicit RESIDENCY type
test('Should recognize explicit RESIDENCY type as residency', () => {
  const subscriptions = [{
    id: 554,
    status: 'ACTIVE',
    startDate: '2025-10-15T15:31:54.911Z',
    endDate: '2025-11-15T15:31:54.911Z',
    studyPack: {
      id: 8,
      name: 'Residency Pack',
      type: 'RESIDENCY',
      yearNumber: 'SEVEN'
    },
    isActive: true,
    createdAt: '2025-10-15T15:31:54.913Z'
  }];

  const result = selectEffectiveActiveSubscription(subscriptions);
  assert(result.isResidency === true, 'isResidency should be true');
  assert(result.allowedYearLevels.length === 7, 'allowedYearLevels should have all 7 years');
});

// Test 3: Non-SEVEN year should not be residency
test('Should NOT treat non-SEVEN year as residency', () => {
  const subscriptions = [{
    id: 555,
    status: 'ACTIVE',
    startDate: '2025-10-15T15:31:54.911Z',
    endDate: '2025-11-15T15:31:54.911Z',
    studyPack: {
      id: 9,
      name: 'Year 6 Pack',
      type: 'YEAR',
      yearNumber: 'SIX'
    },
    isActive: true,
    createdAt: '2025-10-15T15:31:54.913Z'
  }];

  const result = selectEffectiveActiveSubscription(subscriptions);
  assert(result.isResidency === false, 'isResidency should be false');
  assert(result.allowedYearLevels.includes('SIX'), 'allowedYearLevels should include SIX');
  assert(result.allowedYearLevels.length === 1, 'allowedYearLevels should only have SIX');
});

// Test 4: Expired subscription should not be considered
test('Should ignore expired subscriptions', () => {
  const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const subscriptions = [{
    id: 556,
    status: 'ACTIVE',
    startDate: '2025-10-15T15:31:54.911Z',
    endDate: pastDate,
    studyPack: {
      id: 10,
      name: 'Résidanat',
      type: 'YEAR',
      yearNumber: 'SEVEN'
    },
    isActive: false,
    createdAt: '2025-10-15T15:31:54.913Z'
  }];

  const result = selectEffectiveActiveSubscription(subscriptions);
  assert(result.isResidency === false, 'isResidency should be false for expired');
  assert(result.effective === null, 'effective should be null for expired');
});

// Test 5: Residency takes precedence over non-residency
test('Should prioritize residency over non-residency subscriptions', () => {
  const subscriptions = [
    {
      id: 557,
      status: 'ACTIVE',
      startDate: '2025-10-15T15:31:54.911Z',
      endDate: '2025-11-15T15:31:54.911Z',
      studyPack: {
        id: 11,
        name: 'Year 5 Pack',
        type: 'YEAR',
        yearNumber: 'FIVE'
      },
      isActive: true,
      createdAt: '2025-10-15T15:31:54.913Z'
    },
    {
      id: 558,
      status: 'ACTIVE',
      startDate: '2025-10-15T15:31:54.911Z',
      endDate: '2025-11-15T15:31:54.911Z',
      studyPack: {
        id: 12,
        name: 'Résidanat',
        type: 'YEAR',
        yearNumber: 'SEVEN'
      },
      isActive: true,
      createdAt: '2025-10-15T15:31:54.913Z'
    }
  ];

  const result = selectEffectiveActiveSubscription(subscriptions);
  assert(result.isResidency === true, 'isResidency should be true');
  assert(result.allowedYearLevels.length === 7, 'allowedYearLevels should have all 7 years');
  assert(result.effective?.studyPack?.yearNumber === 'SEVEN', 'effective should be SEVEN subscription');
});

console.log('\n' + '='.repeat(60));
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}

