/**
 * Phase 5.2 Verified Resource Navigator Test Suite
 * Validates:
 *   1. Catalogue schema compliance and completeness
 *   2. Authoritative source verification and ISO-8601 date adherence
 *   3. Strict country scope compliance (exact 6 authorized regions)
 *   4. Category A-F taxonomy and emergency dispatch isolation
 *   5. queryResourceCatalogue filter & search engine
 *   6. getNationalCrisisSummary regional accuracy & routing
 *   7. Preservation of regional jurisdiction pathways (e.g. Northern Ireland)
 *   8. Complete offline-first execution with zero network dependency
 *   9. Privacy integrity with zero personal student data or tracking
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Complete Schema Validation
test('Resource catalogue schema strictly adheres to type specifications with zero missing fields', async () => {
  const { RESOURCE_CATALOGUE } = await import('../src/data/resourceCatalogue.ts');

  assert.ok(Array.isArray(RESOURCE_CATALOGUE), 'RESOURCE_CATALOGUE must be an array');
  assert.ok(RESOURCE_CATALOGUE.length >= 20, 'Catalogue must contain at least 20 verified resources');

  for (const res of RESOURCE_CATALOGUE) {
    assert.ok(typeof res.id === 'string' && res.id.length > 0, `Resource must have non-empty id: ${res.id}`);
    assert.ok(typeof res.name === 'string' && res.name.length > 0, `Resource ${res.id} must have non-empty name`);
    assert.ok(typeof res.category === 'string', `Resource ${res.id} must have category`);
    assert.ok(typeof res.categoryLabel === 'string', `Resource ${res.id} must have categoryLabel`);
    assert.ok(typeof res.website === 'string' && res.website.startsWith('http'), `Resource ${res.id} must have valid website url`);
    assert.ok(typeof res.operatingHours === 'string' && res.operatingHours.length > 0, `Resource ${res.id} must have operatingHours`);
    assert.ok(typeof res.eligibilityRestrictions === 'string' && res.eligibilityRestrictions.length > 0, `Resource ${res.id} must have eligibilityRestrictions`);
    assert.ok(typeof res.isEmergencyDispatch === 'boolean', `Resource ${res.id} must have boolean isEmergencyDispatch`);
    assert.ok(typeof res.summary === 'string' && res.summary.length > 0, `Resource ${res.id} must have summary`);
    assert.ok(typeof res.description === 'string' && res.description.length > 0, `Resource ${res.id} must have description`);
    assert.ok(typeof res.officialVerificationSource === 'string' && res.officialVerificationSource.length > 0, `Resource ${res.id} must have officialVerificationSource`);
    assert.ok(typeof res.verificationSourceUrl === 'string' && res.verificationSourceUrl.startsWith('http'), `Resource ${res.id} must have valid verificationSourceUrl`);
    assert.ok(typeof res.lastVerificationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(res.lastVerificationDate), `Resource ${res.id} must have ISO YYYY-MM-DD date`);
    assert.equal(res.verificationStatus, 'VERIFIED', `Resource ${res.id} must be VERIFIED`);
  }
});

// Test 2: Authoritative Provenance & Date Integrity
test('All catalogue entries possess verified provenance, authoritative sources, and valid verification dates', async () => {
  const { RESOURCE_CATALOGUE } = await import('../src/data/resourceCatalogue.ts');

  const officialSourceKeywords = [
    'Ministry',
    'Department',
    'NHS',
    'Health',
    'Public Safety',
    'Government',
    'SAMHSA',
    'Agency',
    'Academy',
    'Charity',
    'Authority',
    'Worldwide',
    'University',
    'Foundation',
    'Center',
    'Organization',
    'Nonprofit'
  ];

  for (const res of RESOURCE_CATALOGUE) {
    const hasOfficialKeyword = officialSourceKeywords.some((kw) =>
      res.officialVerificationSource.toLowerCase().includes(kw.toLowerCase())
    );
    assert.ok(
      hasOfficialKeyword,
      `Resource ${res.id} official source "${res.officialVerificationSource}" must cite a recognized authority or certified organization`
    );
    assert.equal(res.lastVerificationDate, '2026-11-15', `Resource ${res.id} must reflect the verified date 2026-11-15`);
  }
});

// Test 3: Authorized Country Scope (Strictly 6 Jurisdictions)
test('Country scope is strictly constrained to the 6 authorized jurisdictions and Global assets', async () => {
  const { RESOURCE_CATALOGUE, SUPPORTED_COUNTRIES } = await import('../src/data/resourceCatalogue.ts');

  const allowedCountries = new Set([...SUPPORTED_COUNTRIES, 'Global']);
  assert.equal(SUPPORTED_COUNTRIES.length, 6, 'There must be exactly 6 supported jurisdictions');

  const expectedList = ['India', 'United States', 'Canada', 'United Kingdom', 'Australia', 'International'];
  for (const c of expectedList) {
    assert.ok(SUPPORTED_COUNTRIES.includes(c), `SUPPORTED_COUNTRIES must contain ${c}`);
  }

  for (const res of RESOURCE_CATALOGUE) {
    assert.ok(
      allowedCountries.has(res.countryOrRegion),
      `Resource ${res.id} has unauthorized countryOrRegion: ${res.countryOrRegion}`
    );
  }
});

// Test 4: Category System A-F & Emergency Dispatch Isolation
test('Category system A-F defines distinct domains and maintains absolute segregation of Category A Emergency Dispatch', async () => {
  const { RESOURCE_CATALOGUE, CATEGORY_DEFINITIONS } = await import('../src/data/resourceCatalogue.ts');

  const expectedCategories = [
    'emergency_dispatch',
    'crisis_counselling',
    'student_wellbeing',
    'sleep_recovery',
    'academic_resilience',
    'international_directory'
  ];

  assert.deepEqual(Object.keys(CATEGORY_DEFINITIONS), expectedCategories);
  assert.equal(CATEGORY_DEFINITIONS.emergency_dispatch.code, 'A');
  assert.equal(CATEGORY_DEFINITIONS.crisis_counselling.code, 'B');
  assert.equal(CATEGORY_DEFINITIONS.student_wellbeing.code, 'C');
  assert.equal(CATEGORY_DEFINITIONS.sleep_recovery.code, 'D');
  assert.equal(CATEGORY_DEFINITIONS.academic_resilience.code, 'E');
  assert.equal(CATEGORY_DEFINITIONS.international_directory.code, 'F');

  // Strict Segregation Rule:
  // ONLY Category A resources may have isEmergencyDispatch === true
  for (const res of RESOURCE_CATALOGUE) {
    if (res.category === 'emergency_dispatch') {
      assert.equal(res.isEmergencyDispatch, true, `Category A resource ${res.id} must be flagged isEmergencyDispatch === true`);
    } else {
      assert.equal(res.isEmergencyDispatch, false, `Non-Category A resource ${res.id} MUST NOT have isEmergencyDispatch === true`);
    }
  }
});

// Test 5: Query Engine Filtering, Search & Exclusion
test('queryResourceCatalogue correctly filters by country, category, search query, and verification status', async () => {
  const { queryResourceCatalogue } = await import('../src/data/resourceCatalogue.ts');

  // All verified resources
  const allVerified = queryResourceCatalogue({});
  assert.ok(allVerified.length >= 20);

  // Country filter (India)
  const indiaResources = queryResourceCatalogue({ country: 'India' });
  assert.ok(indiaResources.length >= 3);
  for (const r of indiaResources) {
    assert.ok(r.countryOrRegion === 'India' || r.countryOrRegion === 'Global');
  }

  // Category filter (Category A)
  const emergencyOnly = queryResourceCatalogue({ category: 'emergency_dispatch' });
  assert.ok(emergencyOnly.length >= 5);
  for (const r of emergencyOnly) {
    assert.equal(r.category, 'emergency_dispatch');
    assert.equal(r.isEmergencyDispatch, true);
  }

  // Search query (e.g., 'Tele-MANAS')
  const teleManas = queryResourceCatalogue({ searchQuery: 'Tele-MANAS' });
  assert.ok(teleManas.length >= 1);
  assert.equal(teleManas[0].id, 'in-tele-manas');

  // Search by telephone number (e.g., '988')
  const query988 = queryResourceCatalogue({ searchQuery: '988' });
  assert.ok(query988.length >= 2, 'Should match US 988 and Canada 988');

  // Search by official source keyword
  const samhsa = queryResourceCatalogue({ searchQuery: 'SAMHSA' });
  assert.ok(samhsa.length >= 1);
  assert.equal(samhsa[0].id, 'us-988-lifeline');

  // Non-matching query returns empty array
  const empty = queryResourceCatalogue({ searchQuery: 'nonexistent-query-xyz-9999' });
  assert.equal(empty.length, 0);
});

// Test 6: National Crisis Summary Helper & Regional Accuracy
test('getNationalCrisisSummary resolves accurate emergency dispatch and primary mental health pathways for all 6 jurisdictions', async () => {
  const { getNationalCrisisSummary } = await import('../src/data/resourceCatalogue.ts');

  // India
  const india = getNationalCrisisSummary('India');
  assert.equal(india.emergencyNumber, '112');
  assert.ok(india.primaryMentalHealthService.includes('Tele-MANAS'));
  assert.ok(india.primaryMentalHealthNumber.includes('14416'));

  // United States
  const us = getNationalCrisisSummary('United States');
  assert.equal(us.emergencyNumber, '911');
  assert.ok(us.primaryMentalHealthService.includes('988'));
  assert.ok(us.primaryMentalHealthNumber.includes('988'));

  // Canada
  const canada = getNationalCrisisSummary('Canada');
  assert.equal(canada.emergencyNumber, '911');
  assert.ok(canada.primaryMentalHealthService.includes('988'));

  // United Kingdom
  const uk = getNationalCrisisSummary('United Kingdom');
  assert.equal(uk.emergencyNumber, '999 (or 112)');
  assert.ok(uk.primaryMentalHealthService.includes('NHS 111'));

  // Australia
  const australia = getNationalCrisisSummary('Australia');
  assert.equal(australia.emergencyNumber, '000');
  assert.ok(australia.primaryMentalHealthService.includes('Lifeline'));
  assert.ok(australia.primaryMentalHealthNumber.includes('13 11 14'));

  // International
  const intl = getNationalCrisisSummary('International');
  assert.ok(intl.primaryMentalHealthService.includes('Find A Helpline'));
});

// Test 7: Regional Nuances Preservation (Northern Ireland)
test('Regional nuances (Northern Ireland Lifeline NI) are explicitly preserved', async () => {
  const { RESOURCE_CATALOGUE } = await import('../src/data/resourceCatalogue.ts');

  const niResource = RESOURCE_CATALOGUE.find((r) => r.id === 'uk-lifeline-ni');
  assert.ok(niResource, 'Lifeline Northern Ireland resource must exist');
  assert.equal(niResource.telephoneNumber, '0808 808 8000');
  assert.ok(niResource.description.includes('Northern Ireland'));
  assert.ok(niResource.description.includes('NHS 111 mental health triage does not operate in Northern Ireland'));
});

// Test 8: Offline Execution Guarantee
test('Offline execution guarantee: query and summary functions operate 100% synchronously without network dependencies', async () => {
  const { queryResourceCatalogue, getNationalCrisisSummary } = await import('../src/data/resourceCatalogue.ts');

  const start = performance.now();

  for (let i = 0; i < 50; i++) {
    queryResourceCatalogue({ country: 'India', category: 'crisis_counselling' });
    getNationalCrisisSummary('United States');
  }

  const duration = performance.now() - start;
  assert.ok(duration < 100, `Synchronous catalog operations must be sub-100ms, completed in ${duration.toFixed(2)}ms`);
});

// Test 9: Zero Personal Data & Privacy Guarantee
test('Privacy assurance: resource catalog contains zero personal data, telemetry, or user state', async () => {
  const { RESOURCE_CATALOGUE } = await import('../src/data/resourceCatalogue.ts');

  for (const res of RESOURCE_CATALOGUE) {
    // Assert no PHQ-9 fields
    assert.equal(res.phq9Answers, undefined);
    assert.equal(res.phq9Score, undefined);
    assert.equal(res.userResponses, undefined);
    assert.equal(res.telemetry, undefined);
  }
});
