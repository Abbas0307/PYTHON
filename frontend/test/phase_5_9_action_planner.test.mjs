import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Action Library Integrity
test('Action Library: Curated collection contains >= 25 distinct, typed collegiate actions', async () => {
  const { ACTION_LIBRARY } = await import('../src/engines/actionLibrary.ts');

  assert.ok(ACTION_LIBRARY.length >= 25, `Expected >= 25 actions, found ${ACTION_LIBRARY.length}`);
  assert.equal(ACTION_LIBRARY.length, 30);

  const seenIds = new Set();
  const categories = new Set();

  for (const action of ACTION_LIBRARY) {
    // Unique ID
    assert.ok(!seenIds.has(action.id), `Duplicate action ID: ${action.id}`);
    seenIds.add(action.id);

    // Non-empty fields
    assert.ok(action.title && action.title.length > 0);
    assert.ok(action.shortDescription && action.shortDescription.length > 0);
    assert.ok(action.instructions && action.instructions.length >= 2);
    assert.ok(action.estimatedDuration > 0 && action.estimatedDuration <= 60);
    assert.ok(['easy', 'moderate'].includes(action.difficulty));
    assert.ok(action.rationaleTemplate && action.rationaleTemplate.length > 0);

    categories.add(action.category);

    // Clinical and safety boundaries
    const textToCheck = `${action.title} ${action.shortDescription} ${action.instructions.join(' ')} ${action.rationaleTemplate}`;
    assert.doesNotMatch(textToCheck, /antidepressant|ssri|medication|diagnos|patholog|depressed|disorder/i);
    assert.doesNotMatch(textToCheck, /sleep less|skip sleep|reduce sleep/i);
  }

  // All 6 categories represented
  assert.equal(categories.size, 6);
  assert.ok(categories.has('Study & Focus'));
  assert.ok(categories.has('Sleep Routine'));
  assert.ok(categories.has('Relaxation'));
  assert.ok(categories.has('Daily Movement'));
  assert.ok(categories.has('Personal Routine'));
  assert.ok(categories.has('Time Management'));
});

// 2. Rule 1: Low Sleep Quality Recommendation
test('Recommendation Engine: Rule 1 triggers Sleep Routine for low sleep quality (<= 2)', async () => {
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');

  const checkIn = {
    id: 'c1',
    weekIdentifier: '2026-W46',
    date: '2026-11-16',
    timestamp: Date.now(),
    sleepQuality: 2, // Low sleep quality
    academicPressure: 3,
    studySatisfaction: 3,
    dailyEnergy: 3,
    routineBalance: 3
  };

  const recommendations = generateDailyRecommendations({
    latestCheckIn: checkIn,
    preferredDailyCount: 3
  });

  assert.equal(recommendations.length, 3);
  const sleepRec = recommendations.find((r) => r.action.category === 'Sleep Routine');
  assert.ok(sleepRec, 'Expected a Sleep Routine action to be recommended');
  assert.equal(sleepRec.priority, 'high');
  assert.match(sleepRec.whySuggested, /sleep quality reflection was in the lower range/);
  assert.match(sleepRec.whySuggested, /2\/5/);
});

// 3. Rule 2: High Academic Pressure Recommendation
test('Recommendation Engine: Rule 2 triggers Time Management or Study Chunking for high pressure (>= 4)', async () => {
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');

  const checkIn = {
    id: 'c2',
    weekIdentifier: '2026-W46',
    date: '2026-11-16',
    timestamp: Date.now(),
    sleepQuality: 4,
    academicPressure: 5, // High academic pressure
    studySatisfaction: 3,
    dailyEnergy: 3,
    routineBalance: 3
  };

  const recommendations = generateDailyRecommendations({
    latestCheckIn: checkIn,
    preferredDailyCount: 3
  });

  assert.equal(recommendations.length, 3);
  const pressureRec = recommendations.find(
    (r) => r.action.category === 'Time Management' || r.action.category === 'Study & Focus'
  );
  assert.ok(pressureRec, 'Expected Time Management or Study & Focus action');
  assert.equal(pressureRec.priority, 'high');
  assert.match(pressureRec.whySuggested, /academic pressure reflection indicated elevated deadlines/);
  assert.match(pressureRec.whySuggested, /5\/5/);
});

// 4. Rule 3: Low Study Satisfaction Recommendation
test('Recommendation Engine: Rule 3 triggers Study & Focus for low study satisfaction (<= 2)', async () => {
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');

  const checkIn = {
    id: 'c3',
    weekIdentifier: '2026-W46',
    date: '2026-11-16',
    timestamp: Date.now(),
    sleepQuality: 4,
    academicPressure: 3,
    studySatisfaction: 1, // Very low study satisfaction
    dailyEnergy: 4,
    routineBalance: 4
  };

  const recommendations = generateDailyRecommendations({
    latestCheckIn: checkIn,
    preferredDailyCount: 3
  });

  const studyRec = recommendations.find((r) => r.action.category === 'Study & Focus');
  assert.ok(studyRec, 'Expected Study & Focus action');
  assert.match(studyRec.whySuggested, /study satisfaction reflection showed friction/);
  assert.match(studyRec.whySuggested, /1\/5/);
});

// 5. Rule 4: Low Daily Energy Recommendation
test('Recommendation Engine: Rule 4 triggers Movement or Rest for low daily energy (<= 2)', async () => {
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');

  const checkIn = {
    id: 'c4',
    weekIdentifier: '2026-W46',
    date: '2026-11-16',
    timestamp: Date.now(),
    sleepQuality: 4,
    academicPressure: 3,
    studySatisfaction: 3,
    dailyEnergy: 2, // Low energy
    routineBalance: 3
  };

  const recommendations = generateDailyRecommendations({
    latestCheckIn: checkIn,
    preferredDailyCount: 3
  });

  const energyRec = recommendations.find(
    (r) => r.action.category === 'Daily Movement' || r.action.category === 'Relaxation'
  );
  assert.ok(energyRec, 'Expected Daily Movement or Relaxation action');
  assert.equal(energyRec.priority, 'high');
  assert.match(energyRec.whySuggested, /daily energy reflection was low/);
});

// 6. Rule 5: Low Routine Balance Recommendation
test('Recommendation Engine: Rule 5 triggers Routine or Buffer action for low routine balance (<= 2)', async () => {
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');

  const checkIn = {
    id: 'c5',
    weekIdentifier: '2026-W46',
    date: '2026-11-16',
    timestamp: Date.now(),
    sleepQuality: 4,
    academicPressure: 3,
    studySatisfaction: 4,
    dailyEnergy: 4,
    routineBalance: 1 // Very low routine balance
  };

  const recommendations = generateDailyRecommendations({
    latestCheckIn: checkIn,
    preferredDailyCount: 3
  });

  const routineRec = recommendations.find(
    (r) => r.action.category === 'Personal Routine' || r.action.category === 'Time Management'
  );
  assert.ok(routineRec, 'Expected Personal Routine or Time Management action');
  assert.match(routineRec.whySuggested, /routine balance reflection showed scheduling congestion/);
});

// 7. Missing Check-in History (Fresh Student Baseline)
test('Fresh Student Baseline: Gracefully generates balanced recommendations without check-in history', async () => {
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');

  // No check-in history (null)
  const recommendations = generateDailyRecommendations({
    latestCheckIn: null,
    selectedGoals: [],
    preferredDailyCount: 3
  });

  assert.equal(recommendations.length, 3);
  for (const item of recommendations) {
    assert.equal(item.status, 'pending');
    assert.ok(item.action.title.length > 0);
    assert.ok(item.whySuggested.includes('foundational habit'));
    assert.equal(item.priority, 'low');
  }

  // Ensure variety of categories in fallback
  const cats = new Set(recommendations.map((r) => r.action.category));
  assert.ok(cats.size >= 2, 'Default fallback should offer varied categories');
});

// 8. Student-Selected Goals
test('Student Goals: Prioritizes actions aligned with student-selected focus goals', async () => {
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');

  const recommendations = generateDailyRecommendations({
    latestCheckIn: null,
    selectedGoals: ['maintain_sleep_routine', 'take_regular_breaks'],
    preferredDailyCount: 3
  });

  assert.equal(recommendations.length, 3);

  const hasSleepGoalAction = recommendations.some(
    (r) => r.action.category === 'Sleep Routine' && r.whySuggested.includes('Maintain a regular sleep routine')
  );
  const hasBreakGoalAction = recommendations.some(
    (r) => r.action.category === 'Relaxation' && r.whySuggested.includes('Take regular breaks')
  );

  assert.ok(hasSleepGoalAction, 'Expected sleep routine action for sleep goal');
  assert.ok(hasBreakGoalAction, 'Expected relaxation action for take breaks goal');
});

// 9. Duplicate Prevention & Preferred Daily Count
test('Deduplication & Count: Never duplicates actions and adheres to preferred daily count [2, 5]', async () => {
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');

  for (const preferred of [2, 3, 4, 5]) {
    const recs = generateDailyRecommendations({
      latestCheckIn: null,
      selectedGoals: ['improve_study_consistency', 'build_balanced_routine'],
      preferredDailyCount: preferred
    });

    assert.equal(recs.length, preferred);

    // Verify zero duplicates
    const ids = recs.map((r) => r.actionId);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'All recommended actions must have unique IDs');
  }
});

// 10. Recommendation Dismissal & Replacement
test('Dismissal: Dismissed actions are excluded and replaced to maintain preferred count', async () => {
  const { plannerStorage } = await import('../src/storage/vault/plannerStorage.ts');

  plannerStorage.clearAllData();
  const initialPlan = plannerStorage.getPlan('2026-11-16');
  assert.equal(initialPlan.items.length, 3);

  const actionToDismiss = initialPlan.items[0].actionId;

  // Dismiss action
  plannerStorage.dismissAction(actionToDismiss);

  const updatedPlan = plannerStorage.getPlan('2026-11-16');
  assert.equal(updatedPlan.items.length, 3, 'Must maintain preferred count of 3');
  assert.ok(updatedPlan.dismissedActionIds.includes(actionToDismiss));
  assert.ok(!updatedPlan.items.some((i) => i.actionId === actionToDismiss), 'Dismissed action must not be in active plan');

  plannerStorage.clearAllData();
});

// 11. Action Completion, Skip, Postpone, and Undo
test('Task Tracking: Mark complete, skip, postpone, and undo behave deterministically', async () => {
  const { plannerStorage } = await import('../src/storage/vault/plannerStorage.ts');

  plannerStorage.clearAllData();
  const plan = plannerStorage.getPlan('2026-11-16');
  const action1 = plan.items[0].actionId;
  const action2 = plan.items[1].actionId;
  const action3 = plan.items[2].actionId;

  // 1. Complete action 1
  plannerStorage.updateActionStatus(action1, 'completed');
  let progress = plannerStorage.getProgress();
  assert.equal(progress.completedCount, 1);
  assert.equal(progress.remainingCount, 2);
  assert.equal(progress.completionPercentage, 33);

  const history = plannerStorage.getCompletedHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].actionId, action1);

  // 2. Skip action 2
  plannerStorage.updateActionStatus(action2, 'skipped');
  progress = plannerStorage.getProgress();
  assert.equal(progress.skippedCount, 1);
  assert.equal(progress.completedCount, 1);
  assert.equal(progress.remainingCount, 1);

  // 3. Postpone action 3
  plannerStorage.updateActionStatus(action3, 'postponed');
  progress = plannerStorage.getProgress();
  assert.equal(progress.postponedCount, 1);
  assert.equal(progress.remainingCount, 0);

  // 4. Undo action 1
  plannerStorage.updateActionStatus(action1, 'pending');
  progress = plannerStorage.getProgress();
  assert.equal(progress.completedCount, 0);
  assert.equal(progress.remainingCount, 1);
  assert.equal(plannerStorage.getCompletedHistory().length, 0);

  plannerStorage.clearAllData();
});

// 12. Weekly Summary Calculations & Reflection
test('Weekly Summary: Calculates accurate completion counts, top category, and consistency tier', async () => {
  const { computeWeeklySummary } = await import('../src/engines/plannerEngine.ts');

  const history = [
    {
      id: 'h1',
      actionId: 'act-study-pomodoro-25',
      actionTitle: 'Pomodoro',
      category: 'Study & Focus',
      date: '2026-11-16',
      weekIdentifier: '2026-W46',
      completedAt: new Date().toISOString(),
      durationMinutes: 25
    },
    {
      id: 'h2',
      actionId: 'act-study-three-priorities',
      actionTitle: 'Top 3',
      category: 'Study & Focus',
      date: '2026-11-16',
      weekIdentifier: '2026-W46',
      completedAt: new Date().toISOString(),
      durationMinutes: 10
    },
    {
      id: 'h3',
      actionId: 'act-move-campus-stroll',
      actionTitle: 'Stroll',
      category: 'Daily Movement',
      date: '2026-11-17',
      weekIdentifier: '2026-W46',
      completedAt: new Date().toISOString(),
      durationMinutes: 10
    },
    {
      id: 'h4',
      actionId: 'act-move-spine-mobility',
      actionTitle: 'Stretch',
      category: 'Daily Movement',
      date: '2026-11-18',
      weekIdentifier: '2026-W46',
      completedAt: new Date().toISOString(),
      durationMinutes: 5
    },
    // Old record from previous week
    {
      id: 'h0',
      actionId: 'act-old',
      actionTitle: 'Old',
      category: 'Sleep Routine',
      date: '2026-11-09',
      weekIdentifier: '2026-W45',
      completedAt: new Date().toISOString(),
      durationMinutes: 10
    }
  ];

  const summary = computeWeeklySummary(history, '2026-W46');
  assert.equal(summary.weekIdentifier, '2026-W46');
  assert.equal(summary.totalActionsCompleted, 4, 'Must count only actions in 2026-W46');
  assert.equal(summary.weeklyConsistency, 'Building Momentum'); // 3 to 5 actions
  assert.ok(summary.mostFrequentCategory === 'Study & Focus' || summary.mostFrequentCategory === 'Daily Movement');
  assert.match(summary.friendlyReflection, /You completed 4 actions this week/);
});

// 13. Privacy Boundary & Input Safety
test('Privacy Boundary: Prohibits clinical depression fields in planner contracts', async () => {
  const { validatePlannerInputSafety } = await import('../src/contracts/plannerContract.ts');

  // Valid payload
  const valid = validatePlannerInputSafety({
    date: '2026-11-16',
    actionId: 'act-study-pomodoro-25',
    status: 'completed'
  });
  assert.equal(valid.isValid, true);

  // Prohibited clinical fields
  const forbiddenKeys = ['phq9Answers', 'item9', 'depression', 'severity', 'riskTier', 'suicide'];
  for (const key of forbiddenKeys) {
    const invalid = validatePlannerInputSafety({
      date: '2026-11-16',
      [key]: 'prohibited_data'
    });
    assert.equal(invalid.isValid, false);
    assert.match(invalid.error, /Security violation: Prohibited clinical field/);
  }
});

// 14. In-Memory Isolation and Data Export
test('Storage & Export: Supports JSON export while maintaining in-memory isolation', async () => {
  const { plannerStorage } = await import('../src/storage/vault/plannerStorage.ts');

  plannerStorage.clearAllData();
  plannerStorage.getPlan('2026-11-16');

  const exportResult = plannerStorage.exportData();
  assert.ok(exportResult.filename.startsWith('mindora_action_planner_'));
  assert.ok(exportResult.filename.endsWith('.json'));
  assert.equal(exportResult.mimeType, 'application/json');

  const parsed = JSON.parse(exportResult.content);
  assert.ok(parsed.plan);
  assert.ok(parsed.progress);
  assert.ok(parsed.weeklySummary);

  plannerStorage.clearAllData();
});

// 15. Encrypted Vault Compatibility: Preserves Weekly Trends Vault Integrity
test('Vault Compatibility: Weekly Trends 600,000 PBKDF2 vault remains functional and untampered', async () => {
  const { encryptVaultPayload, decryptVaultPayload, DEFAULT_PBKDF2_ITERATIONS } = await import(
    '../src/storage/vault/encryptedVault.ts'
  );

  const passphrase = 'PreserveVault2026!';
  const plaintext = JSON.stringify([{ id: 'trend-w46', weekIdentifier: '2026-W46', sleepQuality: 4 }]);

  const record = await encryptVaultPayload(plaintext, passphrase);
  assert.equal(record.iterations, DEFAULT_PBKDF2_ITERATIONS);
  assert.equal(record.iterations, 600000);

  const decrypted = await decryptVaultPayload(record, passphrase);
  assert.equal(decrypted, plaintext);
});

// 16. Component & Dashboard Integration
test('Component Integration: SmartActionPlannerSection is properly integrated in DashboardScreen', async () => {
  const dashPath = path.resolve(__dirname, '../src/pages/DashboardScreen.tsx');
  assert.ok(fs.existsSync(dashPath));
  const content = fs.readFileSync(dashPath, 'utf8');

  assert.match(content, /SmartActionPlannerSection/, 'DashboardScreen must import SmartActionPlannerSection');
  assert.match(
    content,
    /<SmartActionPlannerSection isPreviewMode=\{isPreviewMode\} \/>/,
    'DashboardScreen must render SmartActionPlannerSection'
  );
});

// 17. Regression Suite for FIX 1: Daily Plan Overflow & Replacement Constraints
test('FIX 1 Regression: Preferred daily targets (2, 3, 4, 5) strictly maintained without overflow', async () => {
  const { plannerStorage } = await import('../src/storage/vault/plannerStorage.ts');
  const { generateDailyRecommendations } = await import('../src/engines/plannerEngine.ts');
  const { ACTION_LIBRARY } = await import('../src/engines/actionLibrary.ts');

  // A. Verify generateDailyRecommendations handles count 0 and 1 cleanly
  const zeroRecs = generateDailyRecommendations({ preferredDailyCount: 0 });
  assert.equal(zeroRecs.length, 0, 'Count 0 must return empty array');

  const oneRec = generateDailyRecommendations({ preferredDailyCount: 1 });
  assert.equal(oneRec.length, 1, 'Count 1 must return exactly 1 item');

  // B. Verify targets 2, 3, 4, 5 in plannerStorage
  for (const target of [2, 3, 4, 5]) {
    plannerStorage.clearAllData();
    const plan = plannerStorage.getPlan('2026-11-16');
    plannerStorage.setPreferredDailyCount(target);
    const updated = plannerStorage.getPlan('2026-11-16');
    assert.equal(updated.items.length, target, `Plan must have exactly ${target} items for target ${target}`);
  }

  // C. All tasks completed in plan -> regeneration/goal update must not overflow target
  plannerStorage.clearAllData();
  plannerStorage.getPlan('2026-11-16');
  plannerStorage.setPreferredDailyCount(3);
  let plan = plannerStorage.getPlan('2026-11-16');
  assert.equal(plan.items.length, 3);

  // Mark all 3 completed
  for (const item of plan.items) {
    plannerStorage.updateActionStatus(item.actionId, 'completed');
  }
  // Change goals: neededCount = 3 - 3 = 0, items length must remain exactly 3
  plannerStorage.setGoals(['reduce_academic_pressure']);
  plan = plannerStorage.getPlan('2026-11-16');
  assert.equal(plan.items.length, 3, 'Plan with all completed items must remain at target 3');
  assert.equal(plan.items.filter((i) => i.status === 'completed').length, 3);

  // D. Dismissing multiple tasks in sequence maintains exact count
  plannerStorage.clearAllData();
  plan = plannerStorage.getPlan('2026-11-16');
  plannerStorage.setPreferredDailyCount(3);
  plan = plannerStorage.getPlan('2026-11-16');

  // Dismiss item 0
  const d1 = plan.items[0].actionId;
  plannerStorage.dismissAction(d1);
  plan = plannerStorage.getPlan('2026-11-16');
  assert.equal(plan.items.length, 3, 'Must maintain 3 after 1st dismissal');
  assert.ok(!plan.items.some((i) => i.actionId === d1));

  // Dismiss item 1
  const d2 = plan.items[1].actionId;
  plannerStorage.dismissAction(d2);
  plan = plannerStorage.getPlan('2026-11-16');
  assert.equal(plan.items.length, 3, 'Must maintain 3 after 2nd dismissal');
  assert.ok(!plan.items.some((i) => i.actionId === d2));

  // Dismiss item 2
  const d3 = plan.items[2].actionId;
  plannerStorage.dismissAction(d3);
  plan = plannerStorage.getPlan('2026-11-16');
  assert.equal(plan.items.length, 3, 'Must maintain 3 after 3rd dismissal');

  // Verify all action IDs are unique
  const itemIds = plan.items.map((i) => i.actionId);
  assert.equal(new Set(itemIds).size, 3, 'All items must have unique IDs');

  // E. Exactly one replacement slot remaining
  const partialRecs = generateDailyRecommendations({
    preferredDailyCount: 1,
    existingPlanActionIds: [itemIds[0], itemIds[1]]
  });
  assert.equal(partialRecs.length, 1, 'Exactly one replacement slot must yield 1 item');
  assert.ok(![itemIds[0], itemIds[1]].includes(partialRecs[0].actionId));

  // F. Zero replacement actions remaining in library
  const allLibraryIds = ACTION_LIBRARY.map((a) => a.id);
  const exhaustedRecs = generateDailyRecommendations({
    preferredDailyCount: 3,
    existingPlanActionIds: allLibraryIds
  });
  assert.equal(exhaustedRecs.length, 0, 'Exhausted library must return empty array without crashing');

  // G. Completed action followed by plan regeneration
  plannerStorage.clearAllData();
  plan = plannerStorage.getPlan('2026-11-16');
  plannerStorage.setPreferredDailyCount(4);
  plan = plannerStorage.getPlan('2026-11-16');
  assert.equal(plan.items.length, 4);

  // Complete 2 items
  plannerStorage.updateActionStatus(plan.items[0].actionId, 'completed');
  plannerStorage.updateActionStatus(plan.items[1].actionId, 'completed');

  // Regenerate pending items
  plannerStorage.regeneratePendingItems();
  plan = plannerStorage.getPlan('2026-11-16');
  assert.equal(plan.items.length, 4, 'Must maintain count of 4 after regeneration');
  assert.equal(plan.items.filter((i) => i.status === 'completed').length, 2);
  assert.equal(plan.items.filter((i) => i.status === 'pending').length, 2);

  plannerStorage.clearAllData();
});

// 18. Unit Tests for FIX 2: Local Calendar Date Utility
test('FIX 2: getLocalDateString correctly isolates local day avoiding UTC drift', async () => {
  const { getLocalDateString } = await import('../src/engines/plannerEngine.ts');

  // Specific Date object
  const testDate = new Date(2026, 10, 16, 23, 45, 0); // Nov 16, 2026 23:45 local
  const dateStr = getLocalDateString(testDate);
  assert.equal(dateStr, '2026-11-16');

  // Date around early morning
  const morningDate = new Date(2026, 0, 1, 0, 5, 0); // Jan 1, 2026 00:05 local
  const morningStr = getLocalDateString(morningDate);
  assert.equal(morningStr, '2026-01-01');

  // Format regex
  assert.match(getLocalDateString(), /^\d{4}-\d{2}-\d{2}$/);
});

// 19. Unit Test for FIX 3: Herbal Tea Safety Disclaimer
test('FIX 3: act-sleep-warm-beverage safety disclaimer contains allergy & non-treatment guidance', async () => {
  const { ACTION_BY_ID } = await import('../src/engines/actionLibrary.ts');

  const teaAction = ACTION_BY_ID.get('act-sleep-warm-beverage');
  assert.ok(teaAction, 'act-sleep-warm-beverage must exist');

  const note = teaAction.safetyOrSuitabilityNote;
  assert.ok(note, 'Safety note must be defined');

  // Must clarify comfort ritual / non-treatment
  assert.match(note, /optional comfort ritual/i);
  assert.match(note, /not medical treatment|not.*treatment for sleep disorders/i);

  // Must mention botanical allergies / medication concerns / healthcare professional
  assert.match(note, /botanical allergies|dietary sensitivities/i);
  assert.match(note, /medication.*concern/i);
  assert.match(note, /plain warm water/i);
  assert.match(note, /healthcare professional/i);
});
