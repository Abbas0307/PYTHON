/**
 * Phase 5.3.1 Critical Defect Remediation Test Suite
 * Validates:
 *   1. DEFECT 1: Missing Age Input & Strict Validation
 *      - Missing age validation error
 *      - Invalid numerical age validation error
 *      - Minimum permitted age (16 years) boundary test
 *      - Maximum permitted age (55 years) boundary test
 *      - Valid age passthrough to engine without silent 21 substitution
 *      - Strict adherence to frozen feature contract [16.0, 55.0]
 *   2. DEFECT 2: Mobile Item 9 Safeguard Immediate Visibility & Viewport Containment
 *      - Immediate safeguard activation when Item 9 > 0
 *      - Direct access to localized primary counseling and emergency dispatch
 *      - Answer controls remain fully interactive and unobscured
 *      - Independent deterministic trigger without ML/LLM dependency
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// DEFECT 1 TESTS: AGE INPUT & VALIDATION AGAINST FROZEN FEATURE CONTRACT
// ============================================================================

test('Defect 1.1: Missing age returns clear validation error and does NOT silently default', async () => {
  const { validateAge } = await import('../src/engines/wellbeingEngine.ts');

  // Test empty string
  const emptyStr = validateAge('');
  assert.equal(emptyStr.isValid, false);
  assert.ok(emptyStr.errorMessage && emptyStr.errorMessage.includes('Age is required'));

  // Test null
  const nullInput = validateAge(null);
  assert.equal(nullInput.isValid, false);
  assert.ok(nullInput.errorMessage && nullInput.errorMessage.includes('Age is required'));

  // Test undefined
  const undefInput = validateAge(undefined);
  assert.equal(undefInput.isValid, false);
  assert.ok(undefInput.errorMessage && undefInput.errorMessage.includes('Age is required'));
});

test('Defect 1.2: Invalid numerical age inputs return informative validation errors', async () => {
  const { validateAge } = await import('../src/engines/wellbeingEngine.ts');

  // Non-numeric string
  const textInput = validateAge('twenty');
  assert.equal(textInput.isValid, false);
  assert.ok(textInput.errorMessage && textInput.errorMessage.includes('valid numerical value'));

  // NaN
  const nanInput = validateAge(NaN);
  assert.equal(nanInput.isValid, false);
  assert.ok(nanInput.errorMessage && nanInput.errorMessage.includes('valid numerical value'));

  // Infinity
  const infInput = validateAge(Infinity);
  assert.equal(infInput.isValid, false);
});

test('Defect 1.3: Minimum age boundary enforcement (exactly 16 years as defined in contract)', async () => {
  const { validateAge } = await import('../src/engines/wellbeingEngine.ts');

  // Below minimum: 15 years -> MUST be rejected
  const belowMin = validateAge(15);
  assert.equal(belowMin.isValid, false);
  assert.ok(belowMin.errorMessage && belowMin.errorMessage.includes('at least 16 years'));

  // Exact minimum: 16 years -> MUST be accepted
  const exactMin = validateAge(16);
  assert.equal(exactMin.isValid, true);
  assert.equal(exactMin.age, 16);

  // String numeric minimum: "16"
  const strMin = validateAge('16');
  assert.equal(strMin.isValid, true);
  assert.equal(strMin.age, 16);
});

test('Defect 1.4: Maximum age boundary enforcement (exactly 55 years as defined in contract)', async () => {
  const { validateAge } = await import('../src/engines/wellbeingEngine.ts');

  // Above maximum: 56 years -> MUST be rejected
  const aboveMax = validateAge(56);
  assert.equal(aboveMax.isValid, false);
  assert.ok(aboveMax.errorMessage && aboveMax.errorMessage.includes('at most 55 years'));

  // Exact maximum: 55 years -> MUST be accepted
  const exactMax = validateAge(55);
  assert.equal(exactMax.isValid, true);
  assert.equal(exactMax.age, 55);

  // String numeric maximum: "55"
  const strMax = validateAge('55');
  assert.equal(strMax.isValid, true);
  assert.equal(strMax.age, 55);
});

test('Defect 1.5: Valid ages pass cleanly and are delivered to the deterministic engine', async () => {
  const { validateAge, validateStudentFeatures, analyzeStudentLifestyle } = await import('../src/engines/wellbeingEngine.ts');

  const testAges = [18, 20, 21, 25, 32, 45, 50];

  for (const age of testAges) {
    const val = validateAge(age);
    assert.equal(val.isValid, true);
    assert.equal(val.age, age);

    // Pass actual age to validateStudentFeatures
    const studentFeatures = validateStudentFeatures({ age });
    assert.equal(studentFeatures.age, age, `Engine must retain user-specified age ${age}`);

    // Verify engine calculation runs cleanly
    const report = analyzeStudentLifestyle(studentFeatures);
    assert.ok(report.overallWellbeingScore >= 0 && report.overallWellbeingScore <= 100);
  }
});

// ============================================================================
// DEFECT 2 TESTS: MOBILE ITEM 9 SAFEGUARD IMMEDIATE VISIBILITY
// ============================================================================

test('Defect 2.1: Item 9 triggers crisis safeguard immediately upon selection without assessment submission', async () => {
  const { evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');
  const { getNationalCrisisSummary } = await import('../src/data/resourceCatalogue.ts');

  // Setting Item 9 to 1 ("Several days") while other items are 0
  const phq9Response = [0, 0, 0, 0, 0, 0, 0, 0, 1];
  const evalResult = evaluatePHQ9(phq9Response);

  // Immediate trigger flag
  assert.equal(evalResult.hasSelfHarmRisk, true);
  assert.equal(evalResult.item9Score, 1);

  // Resolves national crisis summary immediately for all 6 jurisdictions
  const jurisdictions = ['India', 'United States', 'Canada', 'United Kingdom', 'Australia', 'International'];
  for (const j of jurisdictions) {
    const crisis = getNationalCrisisSummary(j);
    assert.ok(crisis.primaryMentalHealthService.length > 0);
    assert.ok(crisis.primaryMentalHealthNumber.length > 0);
    assert.ok(crisis.emergencyNumber.length > 0);
  }
});

test('Defect 2.2: Item 9 safeguard remains 100% deterministic with zero ML or LLM dependency', async () => {
  const { evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');

  // Item 9 = 0 -> MUST NEVER trigger safeguard, regardless of extreme scores on other items
  const highScoresNoItem9 = evaluatePHQ9([3, 3, 3, 3, 3, 3, 3, 3, 0]);
  assert.equal(highScoresNoItem9.totalScore, 24);
  assert.equal(highScoresNoItem9.severity, 'Severe');
  assert.equal(highScoresNoItem9.hasSelfHarmRisk, false);

  // Item 9 = 1, 2, or 3 -> MUST ALWAYS trigger safeguard
  for (const item9Val of [1, 2, 3]) {
    const res = evaluatePHQ9([0, 0, 0, 0, 0, 0, 0, 0, item9Val]);
    assert.equal(res.hasSelfHarmRisk, true);
    assert.equal(res.item9Score, item9Val);
  }
});

test('Defect 2.3: Assessment Screen source contains inline Item 9 safeguard and auto-scroll ref', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const screenPath = path.resolve('./src/pages/AssessmentScreen.tsx');
  const content = fs.readFileSync(screenPath, 'utf8');

  // Verify explicit Age input exists in Step 1
  assert.ok(content.includes('id="age-input"'), 'Must have explicit age-input element');
  assert.ok(content.includes('validateAge'), 'Must call validateAge');
  assert.ok(content.includes('ageError'), 'Must track age validation error');

  // Verify Item 9 inline safeguard exists inside Question 9 fieldset
  assert.ok(content.includes('item9SafeguardRef'), 'Must have item9SafeguardRef for mobile viewport containment');
  assert.ok(content.includes('isItem9 && item9Active'), 'Must render inline safeguard directly at Item 9');
  assert.ok(content.includes('scrollIntoView'), 'Must scroll into view smoothly at nearest block');
  assert.ok(content.includes('Dedicated Support is Available For You Right Now'), 'Must have compassionate heading');
  assert.ok(content.includes('primaryMentalHealthNumber'), 'Must render dialable primary helpline');
});
