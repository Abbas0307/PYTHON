import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Weekly Check-In Validation
test('Weekly Check-In: Strict input validation on [1, 5] bounds and types', async () => {
  const { validateWeeklyCheckInInput, getISOWeekIdentifier } = await import('../src/contracts/trendsContract.ts');

  // Valid check-in
  const valid = validateWeeklyCheckInInput({
    date: '2026-11-16',
    sleepQuality: 4,
    academicPressure: 3,
    studySatisfaction: 4,
    dailyEnergy: 3,
    routineBalance: 5
  });
  assert.equal(valid.isValid, true);
  assert.ok(valid.sanitized);
  assert.equal(valid.sanitized.sleepQuality, 4);
  assert.equal(valid.sanitized.routineBalance, 5);
  assert.equal(valid.sanitized.weekIdentifier, getISOWeekIdentifier('2026-11-16'));

  // Out of bounds (< 1 or > 5)
  const outOfBounds = validateWeeklyCheckInInput({
    date: '2026-11-16',
    sleepQuality: 0,
    academicPressure: 6,
    studySatisfaction: 3,
    dailyEnergy: 3,
    routineBalance: 3
  });
  assert.equal(outOfBounds.isValid, false);
  assert.ok(outOfBounds.errors.some((e) => e.includes('sleepQuality must be an integer between 1 and 5')));
  assert.ok(outOfBounds.errors.some((e) => e.includes('academicPressure must be an integer between 1 and 5')));

  // Non-integer or NaN
  const nonInteger = validateWeeklyCheckInInput({
    date: '2026-11-16',
    sleepQuality: 3.5,
    academicPressure: 'three',
    studySatisfaction: 4,
    dailyEnergy: 2,
    routineBalance: 3
  });
  assert.equal(nonInteger.isValid, false);
  assert.ok(nonInteger.errors.length >= 2);

  // Missing fields
  const missing = validateWeeklyCheckInInput({
    date: '2026-11-16',
    sleepQuality: 3
  });
  assert.equal(missing.isValid, false);
  assert.ok(missing.errors.some((e) => e.includes('Missing rating for academicPressure')));
});

// 2. Security & Privacy Boundary: Prohibit PHQ-9 & Clinical Fields in Trends
test('Privacy Boundary: Rejects any payload containing PHQ-9, Item 9, or clinical depression data', async () => {
  const { validateWeeklyCheckInInput } = await import('../src/contracts/trendsContract.ts');

  const contaminatedPayload = {
    date: '2026-11-16',
    sleepQuality: 3,
    academicPressure: 3,
    studySatisfaction: 3,
    dailyEnergy: 3,
    routineBalance: 3,
    phq9Answers: [1, 2, 0, 1, 0, 0, 0, 0, 0],
    item9: 1,
    depression: true
  };

  const result = validateWeeklyCheckInInput(contaminatedPayload);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('Security violation: Prohibited field "phq9Answers"')));
  assert.ok(result.errors.some((e) => e.includes('Security violation: Prohibited field "item9"')));
  assert.ok(result.errors.some((e) => e.includes('Security violation: Prohibited field "depression"')));
});

// 3. Duplicate Weekly Submission Handling
test('Duplicate Handling: Updating check-in for the same week replaces previous entry without duplicates', async () => {
  const { trendStorage } = await import('../src/storage/vault/trendStorage.ts');

  await trendStorage.clearAllData();

  // Save initial check-in for Week 46
  await trendStorage.saveCheckIn({
    weekIdentifier: '2026-W46',
    date: '2026-11-16',
    sleepQuality: 3,
    academicPressure: 4,
    studySatisfaction: 3,
    dailyEnergy: 2,
    routineBalance: 3
  });

  let records = trendStorage.getCheckIns();
  assert.equal(records.length, 1);
  assert.equal(records[0].sleepQuality, 3);
  assert.equal(records[0].dailyEnergy, 2);

  // Submit second check-in for the SAME week (e.g. updated reflection)
  await trendStorage.saveCheckIn({
    weekIdentifier: '2026-W46',
    date: '2026-11-17',
    sleepQuality: 4,
    academicPressure: 3,
    studySatisfaction: 4,
    dailyEnergy: 4,
    routineBalance: 4
  });

  records = trendStorage.getCheckIns();
  assert.equal(records.length, 1, 'Must still contain exactly 1 record for Week 46');
  assert.equal(records[0].sleepQuality, 4, 'Must be updated to 4');
  assert.equal(records[0].dailyEnergy, 4, 'Must be updated to 4');

  await trendStorage.clearAllData();
});

// 4. Deterministic Trend Calculations & Deltas
test('Trend Calculations: Computes accurate deltas and directional changes across weeks', async () => {
  const { computeMetricDeltas, calculateTrendSummary } = await import('../src/engines/trendEngine.ts');

  const checkIns = [
    {
      id: 'c1',
      weekIdentifier: '2026-W44',
      date: '2026-11-02',
      timestamp: 1000,
      sleepQuality: 2,
      academicPressure: 5,
      studySatisfaction: 2,
      dailyEnergy: 2,
      routineBalance: 2
    },
    {
      id: 'c2',
      weekIdentifier: '2026-W45',
      date: '2026-11-09',
      timestamp: 2000,
      sleepQuality: 4,
      academicPressure: 3,
      studySatisfaction: 4,
      dailyEnergy: 4,
      routineBalance: 4
    }
  ];

  const deltas = computeMetricDeltas(checkIns);

  // Sleep quality: 2 -> 4 (+2)
  assert.equal(deltas.sleepQuality.delta, 2);
  assert.equal(deltas.sleepQuality.direction, 'improved');

  // Academic pressure: 5 -> 3 (-2). For pressure, lower is less strain ('improved')
  assert.equal(deltas.academicPressure.delta, -2);
  assert.equal(deltas.academicPressure.direction, 'improved');

  // Study satisfaction: 2 -> 4 (+2)
  assert.equal(deltas.studySatisfaction.delta, 2);
  assert.equal(deltas.studySatisfaction.direction, 'improved');

  // Summary statistics
  const summary = calculateTrendSummary(checkIns);
  assert.equal(summary.totalCheckIns, 2);
  assert.equal(summary.metricAverages.sleepQuality, 3.0);
  assert.equal(summary.metricAverages.academicPressure, 4.0);
});

// 5. Missing & Incomplete Data Handling (First-Time User Experience)
test('Incomplete Data: Gracefully handles 0 or 1 check-in without NaN or errors', async () => {
  const { computeMetricDeltas, generateGentleInsights, calculateTrendSummary } = await import('../src/engines/trendEngine.ts');

  // Zero check-ins (brand new user)
  const emptySummary = calculateTrendSummary([]);
  assert.equal(emptySummary.totalCheckIns, 0);
  assert.equal(emptySummary.latestDate, null);
  assert.equal(emptySummary.metricAverages.sleepQuality, 0);
  assert.equal(emptySummary.insights.length, 0);

  const emptyDeltas = computeMetricDeltas([]);
  assert.equal(emptyDeltas.sleepQuality.delta, null);
  assert.equal(emptyDeltas.sleepQuality.direction, 'none');

  // Single check-in (baseline week)
  const single = [
    {
      id: 'c1',
      weekIdentifier: '2026-W46',
      date: '2026-11-16',
      timestamp: 1000,
      sleepQuality: 4,
      academicPressure: 3,
      studySatisfaction: 4,
      dailyEnergy: 3,
      routineBalance: 4
    }
  ];
  const singleSummary = calculateTrendSummary(single);
  assert.equal(singleSummary.totalCheckIns, 1);
  assert.equal(singleSummary.metricDeltas.sleepQuality.delta, null);
  assert.equal(singleSummary.metricDeltas.sleepQuality.direction, 'none');
  // Insights must be SUPPRESSED when fewer than 2 check-ins exist
  const singleInsights = generateGentleInsights(single);
  assert.equal(singleInsights.length, 0, 'Must not generate insights with only 1 check-in');
});

// 6. Gentle Non-Diagnostic Insights
test('Gentle Insights: Generates non-clinical observations only when sufficient history exists', async () => {
  const { generateGentleInsights } = await import('../src/engines/trendEngine.ts');

  // Case 1: Improvement in sleep and satisfaction
  const history = [
    {
      id: 'w1',
      weekIdentifier: '2026-W44',
      date: '2026-11-02',
      timestamp: 1000,
      sleepQuality: 2,
      academicPressure: 4,
      studySatisfaction: 2,
      dailyEnergy: 2,
      routineBalance: 2
    },
    {
      id: 'w2',
      weekIdentifier: '2026-W45',
      date: '2026-11-09',
      timestamp: 2000,
      sleepQuality: 4,
      academicPressure: 4,
      studySatisfaction: 4,
      dailyEnergy: 3,
      routineBalance: 3
    }
  ];

  const insights = generateGentleInsights(history);
  assert.ok(insights.length >= 1);
  assert.ok(insights.some((i) => i.observation.includes('sleep quality rating improved')));
  assert.ok(insights.some((i) => i.observation.includes('study satisfaction rating increased')));

  // Verify non-clinical language: zero diagnosis or clinical risk words
  for (const ins of insights) {
    assert.doesNotMatch(ins.observation, /depression|depressed|disorder|clinical|patholog|risk/i);
    assert.doesNotMatch(ins.context, /depression|depressed|disorder|clinical|patholog|risk/i);
  }
});

// 7. Web Crypto AES-256-GCM Encryption and Decryption (600,000 PBKDF2 Iterations Default)
test('Web Crypto Vault: Authenticated AES-256-GCM encryption with 600,000 iterations and fresh 96-bit IV', async () => {
  const { encryptVaultPayload, decryptVaultPayload, DEFAULT_PBKDF2_ITERATIONS } = await import('../src/storage/vault/encryptedVault.ts');

  const testPassphrase = 'SuperSecretPassphrase123!';
  const plaintext = JSON.stringify([
    { id: 'c1', weekIdentifier: '2026-W45', sleepQuality: 4, academicPressure: 2 }
  ]);

  // First encryption - must use new hardened default of 600,000 iterations
  const record1 = await encryptVaultPayload(plaintext, testPassphrase);
  assert.equal(record1.kdf, 'PBKDF2_SHA256');
  assert.equal(record1.iterations, 600000, 'New vault record must use 600,000 PBKDF2 iterations');
  assert.equal(record1.iterations, DEFAULT_PBKDF2_ITERATIONS);
  assert.equal(record1.saltHex.length, 32, 'Salt must be 16 bytes (32 hex characters)');
  assert.equal(record1.ivHex.length, 24, 'IV must be 12 bytes / 96 bits (24 hex characters)');
  assert.ok(record1.ciphertextHex.length > 0);

  // Second encryption (verify FRESH random IV on every write — zero nonce reuse)
  const record2 = await encryptVaultPayload(plaintext, testPassphrase);
  assert.notEqual(record1.ivHex, record2.ivHex, 'Each encryption must use a fresh random 96-bit IV');
  assert.notEqual(record1.saltHex, record2.saltHex, 'Each encryption must use a fresh random salt');

  // Successful decryption with correct passphrase
  const decrypted = await decryptVaultPayload(record1, testPassphrase);
  assert.equal(decrypted, plaintext);
  const parsed = JSON.parse(decrypted);
  assert.equal(parsed[0].sleepQuality, 4);
});

// 8. Backward Compatibility: 100,000-Iteration Existing Vaults
test('Backward Compatibility: Existing 100,000-iteration vaults decrypt correctly without migration', async () => {
  const { encryptVaultPayload, decryptVaultPayload } = await import('../src/storage/vault/encryptedVault.ts');

  const passphrase = 'LegacyVaultPassword2026!';
  const plaintext = JSON.stringify([
    { id: 'legacy-1', weekIdentifier: '2026-W40', sleepQuality: 5, academicPressure: 1 }
  ]);

  // Explicitly create a legacy 100,000-iteration record
  const legacyRecord = await encryptVaultPayload(plaintext, passphrase, 100000);
  assert.equal(legacyRecord.iterations, 100000, 'Legacy record must retain 100,000 iterations');

  // Decryption must inspect stored record.iterations (100,000) and succeed
  const decrypted = await decryptVaultPayload(legacyRecord, passphrase);
  assert.equal(decrypted, plaintext, 'Decrypted plaintext must match original payload exactly');

  // Wrong passphrase with legacy record must still reject
  await assert.rejects(
    async () => {
      await decryptVaultPayload(legacyRecord, 'WrongPassword123');
    },
    /Incorrect passphrase or corrupted encrypted record/
  );
});

// 9. Incorrect Passphrase and Tampering Protection
test('Vault Security: Decryption fails immediately with incorrect passphrase or tampered ciphertext', async () => {
  const { encryptVaultPayload, decryptVaultPayload } = await import('../src/storage/vault/encryptedVault.ts');

  const correctPassphrase = 'CorrectPassword999';
  const wrongPassphrase = 'WrongPassword000';
  const plaintext = '{"test": "confidential_trends"}';

  const record = await encryptVaultPayload(plaintext, correctPassphrase);

  // Incorrect passphrase rejection
  await assert.rejects(
    async () => {
      await decryptVaultPayload(record, wrongPassphrase);
    },
    /Incorrect passphrase or corrupted encrypted record/
  );

  // Tampered ciphertext rejection (authenticated AES-GCM tag verification)
  const tamperedRecord = {
    ...record,
    // Flip first character of ciphertext
    ciphertextHex: (record.ciphertextHex[0] === 'a' ? 'b' : 'a') + record.ciphertextHex.substring(1)
  };

  await assert.rejects(
    async () => {
      await decryptVaultPayload(tamperedRecord, correctPassphrase);
    },
    /Incorrect passphrase or corrupted encrypted record/
  );
});

// 10. Iteration Count & Cryptographic Boundary Validation
test('Cryptographic Hardening: Rejects missing, invalid, negative, zero, and excessive iteration counts', async () => {
  const { encryptVaultPayload, decryptVaultPayload } = await import('../src/storage/vault/encryptedVault.ts');

  const passphrase = 'ValidPassword123!';
  const validRecord = await encryptVaultPayload('{"ok": true}', passphrase);

  // Missing iterations
  const missingIter = { ...validRecord, iterations: undefined };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(missingIter, passphrase);
    },
    /missing iteration count/
  );

  // Non-integer string iterations
  const stringIter = { ...validRecord, iterations: '600000' };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(stringIter, passphrase);
    },
    /must be a valid integer/
  );

  // NaN iterations
  const nanIter = { ...validRecord, iterations: NaN };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(nanIter, passphrase);
    },
    /must be a valid integer/
  );

  // Zero iterations
  const zeroIter = { ...validRecord, iterations: 0 };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(zeroIter, passphrase);
    },
    /must be greater than zero/
  );

  // Negative iterations
  const negativeIter = { ...validRecord, iterations: -500 };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(negativeIter, passphrase);
    },
    /must be greater than zero/
  );

  // Unsupported low iterations (< 10,000)
  const lowIter = { ...validRecord, iterations: 500 };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(lowIter, passphrase);
    },
    /Unsupported iteration count.*must be at least 10,000/
  );

  // Excessively high iterations (> 5,000,000 - DoS prevention)
  const excessiveIter = { ...validRecord, iterations: 10000000 };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(excessiveIter, passphrase);
    },
    /Excessive iteration count.*exceeds safe threshold/
  );

  // Malformed saltHex length
  const shortSalt = { ...validRecord, saltHex: 'deadbeef' };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(shortSalt, passphrase);
    },
    /saltHex must be a 32-character hex string/
  );

  // Malformed ivHex length
  const shortIv = { ...validRecord, ivHex: '0102030405' };
  await assert.rejects(
    async () => {
      await decryptVaultPayload(shortIv, passphrase);
    },
    /ivHex must be a 24-character hex string/
  );
});

// 11. IndexedDB Deletion Hardening: Blocked, Failure, and Success Handlers
test('IndexedDB Deletion: Handles onblocked, onerror, and onsuccess accurately without hanging', async () => {
  const { deleteEncryptedVault } = await import('../src/storage/vault/encryptedVault.ts');

  const originalIndexedDB = globalThis.indexedDB;

  try {
    // 1. Success case
    globalThis.indexedDB = {
      deleteDatabase: () => {
        const req = {};
        setTimeout(() => {
          if (typeof req.onsuccess === 'function') req.onsuccess({});
        }, 5);
        return req;
      }
    };
    await deleteEncryptedVault(); // should resolve cleanly

    // 2. Blocked case (another tab holding database open)
    globalThis.indexedDB = {
      deleteDatabase: () => {
        const req = {};
        setTimeout(() => {
          if (typeof req.onblocked === 'function') req.onblocked({});
        }, 5);
        return req;
      }
    };
    await assert.rejects(
      async () => {
        await deleteEncryptedVault();
      },
      /Database deletion blocked: another tab or connection is keeping the database open/
    );

    // 3. Error case
    globalThis.indexedDB = {
      deleteDatabase: () => {
        const req = { error: new Error('Simulated disk IO failure during delete') };
        setTimeout(() => {
          if (typeof req.onerror === 'function') req.onerror({});
        }, 5);
        return req;
      }
    };
    await assert.rejects(
      async () => {
        await deleteEncryptedVault();
      },
      /Simulated disk IO failure during delete/
    );
  } finally {
    globalThis.indexedDB = originalIndexedDB;
  }
});

// 12. Export and Permanent Deletion
test('Export & Deletion: Generates valid export containers and permanently wipes data', async () => {
  const { trendStorage } = await import('../src/storage/vault/trendStorage.ts');

  await trendStorage.clearAllData();

  await trendStorage.saveCheckIn({
    weekIdentifier: '2026-W45',
    date: '2026-11-09',
    sleepQuality: 4,
    academicPressure: 3,
    studySatisfaction: 4,
    dailyEnergy: 3,
    routineBalance: 4
  });

  // Export JSON
  const jsonExport = await trendStorage.exportData('json');
  assert.ok(jsonExport.filename.endsWith('.json'));
  assert.equal(jsonExport.mimeType, 'application/json');
  const parsedJson = JSON.parse(jsonExport.content);
  assert.equal(parsedJson.length, 1);
  assert.equal(parsedJson[0].sleepQuality, 4);

  // Permanent Wipe
  await trendStorage.clearAllData();
  const remaining = trendStorage.getCheckIns();
  assert.equal(remaining.length, 0, 'In-memory records must be 0 after clearAllData');
  const status = await trendStorage.getStatus();
  assert.equal(status.mode, 'in-memory');
  assert.equal(status.recordCount, 0);
});

// 13. Component & Layout Integrity
test('Component Architecture: WeeklyTrendsSection is properly integrated in DashboardScreen', async () => {
  const dashPath = path.resolve(__dirname, '../src/pages/DashboardScreen.tsx');
  assert.ok(fs.existsSync(dashPath));
  const dashContent = fs.readFileSync(dashPath, 'utf8');

  assert.match(dashContent, /WeeklyTrendsSection/, 'DashboardScreen must import WeeklyTrendsSection');
  assert.match(dashContent, /<WeeklyTrendsSection isPreviewMode={isPreviewMode} \/>/, 'DashboardScreen must render WeeklyTrendsSection');
});
