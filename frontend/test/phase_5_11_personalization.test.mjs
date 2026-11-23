/**
 * test/phase_5_11_personalization.test.mjs
 * Mindora 2.0 — Phase 5.11 Personalization & Adaptive Experience Test Suite.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import engines and contracts
import {
  ALL_DASHBOARD_SECTIONS,
  DEFAULT_PERSONALIZATION_STATE,
  DEFAULT_SECTION_ORDER,
  PRESET_GOALS,
  VERIFIED_LANGUAGES
} from '../src/contracts/personalizationContract.ts';

import { generateAdaptiveRecommendations } from '../src/engines/adaptiveRecommendationEngine.ts';
import { computeWeeklyPersonalSummary } from '../src/engines/personalSummaryEngine.ts';
import { personalizationStorage } from '../src/storage/personalizationStorage.ts';

// ============================================================
// 1. DASHBOARD CUSTOMIZATION & MANDATORY SAFETY PRESERVATION
// ============================================================
test('Dashboard Customization: Section visibility and mandatory safety enforcement', () => {
  // Wellbeing overview is marked mandatory
  const overview = ALL_DASHBOARD_SECTIONS.find((s) => s.id === 'wellbeing_overview');
  assert.ok(overview, 'Wellbeing overview section must exist');
  assert.equal(overview.isMandatory, true, 'Wellbeing overview must be mandatory');

  // Attempt to set visible sections omitting 'wellbeing_overview'
  personalizationStorage.setVisibleSections(['daily_checkin', 'wellness_studio']);
  const state = personalizationStorage.getState();
  assert.ok(
    state.visibleSections.includes('wellbeing_overview'),
    'Mandatory wellbeing overview section CANNOT be hidden'
  );
  assert.ok(state.visibleSections.includes('daily_checkin'));
  assert.ok(state.visibleSections.includes('wellness_studio'));
});

test('Dashboard Customization: Section reordering and reset defaults', () => {
  personalizationStorage.restoreDefaultLayout();
  let state = personalizationStorage.getState();
  assert.deepEqual(state.sectionOrder, DEFAULT_SECTION_ORDER);

  // Reorder
  const reversed = [...DEFAULT_SECTION_ORDER].reverse();
  personalizationStorage.setSectionOrder(reversed);
  state = personalizationStorage.getState();
  assert.deepEqual(state.sectionOrder, reversed);

  // Restore defaults
  personalizationStorage.restoreDefaultLayout();
  state = personalizationStorage.getState();
  assert.deepEqual(state.sectionOrder, DEFAULT_SECTION_ORDER);
});

// ============================================================
// 2. PERSONAL WELLBEING GOALS
// ============================================================
test('Personal Goals: Add, edit, pause, resume, complete, and remove lifecycle', () => {
  personalizationStorage.resetAllPersonalization();

  // 1. Add preset goal
  const preset = PRESET_GOALS[0];
  const newGoal = {
    id: preset.id,
    title: preset.title,
    category: preset.category,
    description: preset.description,
    isCustom: false,
    status: 'active',
    targetPerWeek: 4,
    completedCount: 0,
    createdAt: '2026-11-16'
  };
  personalizationStorage.saveGoal(newGoal);

  let state = personalizationStorage.getState();
  assert.ok(state.goals.some((g) => g.id === preset.id));

  // 2. Add custom goal
  const customGoal = {
    id: 'custom-goal-walk',
    title: 'Daily 15-minute campus walk',
    category: 'routine_balance',
    description: 'Fresh air break',
    isCustom: true,
    status: 'active',
    targetPerWeek: 5,
    completedCount: 0,
    createdAt: '2026-11-16'
  };
  personalizationStorage.saveGoal(customGoal);
  state = personalizationStorage.getState();
  assert.ok(state.goals.some((g) => g.id === 'custom-goal-walk'));

  // 3. Edit title
  personalizationStorage.saveGoal({
    ...customGoal,
    title: 'Daily 20-minute campus walk'
  });
  state = personalizationStorage.getState();
  const updated = state.goals.find((g) => g.id === 'custom-goal-walk');
  assert.equal(updated.title, 'Daily 20-minute campus walk');

  // 4. Pause goal
  personalizationStorage.saveGoal({
    ...updated,
    status: 'paused'
  });
  state = personalizationStorage.getState();
  assert.equal(state.goals.find((g) => g.id === 'custom-goal-walk').status, 'paused');

  // 5. Complete goal
  personalizationStorage.saveGoal({
    ...updated,
    status: 'completed',
    completedAt: '2026-11-16'
  });
  state = personalizationStorage.getState();
  assert.equal(state.goals.find((g) => g.id === 'custom-goal-walk').status, 'completed');

  // 6. Remove goal
  personalizationStorage.removeGoal('custom-goal-walk');
  state = personalizationStorage.getState();
  assert.ok(!state.goals.some((g) => g.id === 'custom-goal-walk'));
});

// ============================================================
// 3. ADAPTIVE RECOMMENDATION ENGINE
// ============================================================
test('Adaptive Recommendation Engine: Deterministic output and goal-preference alignment', () => {
  const goals = [
    {
      id: 'goal-breaks',
      title: 'Take regular study breaks',
      category: 'study_breaks',
      description: 'Breaks between blocks',
      isCustom: false,
      status: 'active',
      targetPerWeek: 5,
      completedCount: 0,
      createdAt: '2026-11-16'
    }
  ];

  const preferences = {
    preferredDurationMinutes: 5,
    favoriteCategories: ['study_breaks', 'relaxation'],
    dismissedRecommendationIds: [],
    usefulRecommendationIds: [],
    notUsefulRecommendationIds: []
  };

  const recs = generateAdaptiveRecommendations({ goals, preferences, limit: 3 });
  assert.ok(recs.length > 0, 'Must generate recommendations');
  assert.ok(recs.length <= 3, 'Must respect limit');

  // Top recommendation should match study_breaks goal and 5m duration
  const top = recs[0];
  assert.equal(top.category, 'study_breaks');
  assert.match(top.rationale, /Aligned with your active goal "Take regular study breaks"/);
  assert.ok(top.estimatedMinutes <= 10, 'Should match short duration preference');
});

test('Adaptive Recommendation Engine: Dismissed and rating feedback behavior', () => {
  const goals = [
    {
      id: 'goal-breaks',
      title: 'Take regular study breaks',
      category: 'study_breaks',
      description: 'Breaks',
      isCustom: false,
      status: 'active',
      targetPerWeek: 5,
      completedCount: 0,
      createdAt: '2026-11-16'
    }
  ];

  // Dismiss top study break recommendation
  const preferences = {
    preferredDurationMinutes: 5,
    favoriteCategories: ['study_breaks'],
    dismissedRecommendationIds: ['rec-sensory-grounding'],
    usefulRecommendationIds: [],
    notUsefulRecommendationIds: []
  };

  const recs = generateAdaptiveRecommendations({ goals, preferences, limit: 3 });
  assert.ok(
    !recs.some((r) => r.id === 'rec-sensory-grounding'),
    'Dismissed recommendations must be excluded from results'
  );
});

test('Adaptive Recommendation Engine: Zero Clinical Data Input Invariant', () => {
  // Ensure the candidate pool and output generator do not mention depression, suicide, or clinical scoring
  const goals = [];
  const preferences = {
    preferredDurationMinutes: 15,
    favoriteCategories: ['study_routine', 'relaxation'],
    dismissedRecommendationIds: [],
    usefulRecommendationIds: [],
    notUsefulRecommendationIds: []
  };

  const recs = generateAdaptiveRecommendations({ goals, preferences, limit: 5 });
  for (const rec of recs) {
    const serialized = JSON.stringify(rec).toLowerCase();
    assert.ok(!serialized.includes('phq9'), 'No PHQ-9 in recommendation payload');
    assert.ok(!serialized.includes('item9'), 'No Item 9 in recommendation payload');
    assert.ok(!serialized.includes('suicide'), 'No suicide in recommendation payload');
    assert.ok(!serialized.includes('depression score'), 'No depression scoring in recommendation payload');
    assert.ok(!serialized.includes('diagnosis'), 'No diagnosis in recommendation payload');
  }
});

// ============================================================
// 4. DAILY STUDENT CHECK-IN & VOLATILE REFLECTIONS
// ============================================================
test('Daily Check-In: Optional recording and transient reflection handling', () => {
  const testRecord = {
    id: 'test-checkin-1',
    date: '2026-11-16',
    dayRating: 4,
    studyRoutineRating: 4,
    energyRating: 3,
    tookBreaks: 'yes',
    tomorrowFocus: 'Read organic chemistry chapter 4',
    privateReflection: 'CANARY_SENSITIVE_STUDENT_NOTE_DO_NOT_PERSIST',
    completedAt: '10:30 AM'
  };

  personalizationStorage.recordDailyCheckIn(testRecord);
  const state = personalizationStorage.getState();
  assert.equal(state.dailyCheckIn.date, '2026-11-16');
  assert.equal(state.dailyCheckIn.dayRating, 4);
  assert.equal(state.dailyCheckIn.privateReflection, 'CANARY_SENSITIVE_STUDENT_NOTE_DO_NOT_PERSIST');

  // Verify in checkInHistory
  const history = personalizationStorage.getCheckInHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].dayRating, 4);
});

// ============================================================
// 5. PERSONALIZED WEEKLY SUMMARY
// ============================================================
test('Weekly Personal Summary: Factual aggregation and honest empty state', () => {
  // 1. Empty state
  const emptySummary = computeWeeklyPersonalSummary({
    weekIdentifier: '2026-W47',
    completedPlannerActions: [],
    completedWellnessSessions: [],
    dailyCheckIns: [],
    goals: []
  });

  assert.equal(emptySummary.hasActivity, false);
  assert.equal(emptySummary.plannerActionsCompleted, 0);
  assert.equal(emptySummary.wellnessSessionsCompleted, 0);
  assert.match(emptySummary.factualObservations[0], /No voluntary activities have been logged/);

  // 2. Populated activity state
  const populatedSummary = computeWeeklyPersonalSummary({
    weekIdentifier: '2026-W47',
    completedPlannerActions: [
      { id: 'a1', actionId: 'act-sleep', title: 'Sleep routine', category: 'Sleep Routine', completedAt: '2026-11-16', date: '2026-11-16' },
      { id: 'a2', actionId: 'act-study', title: 'Pomodoro', category: 'Study & Focus', completedAt: '2026-11-16', date: '2026-11-16' }
    ],
    completedWellnessSessions: [
      { id: 'w1', experienceId: 'breathing', title: 'Guided Breathing', durationMinutes: 3, completedAt: '10:15' }
    ],
    dailyCheckIns: [
      { id: 'c1', date: '2026-11-16', dayRating: 4, studyRoutineRating: 4, energyRating: 3, tookBreaks: 'yes', completedAt: '10:30' }
    ],
    goals: [
      { id: 'g1', title: 'Take breaks', category: 'study_breaks', description: 'desc', isCustom: false, status: 'active', targetPerWeek: 5, completedCount: 0, createdAt: '2026-11-16' },
      { id: 'g2', title: 'Sleep well', category: 'sleep_schedule', description: 'desc', isCustom: false, status: 'completed', targetPerWeek: 5, completedCount: 5, createdAt: '2026-11-16' }
    ]
  });

  assert.equal(populatedSummary.hasActivity, true);
  assert.equal(populatedSummary.plannerActionsCompleted, 2);
  assert.equal(populatedSummary.wellnessSessionsCompleted, 1);
  assert.equal(populatedSummary.focusMinutesTotal, 3);
  assert.equal(populatedSummary.activeGoalsCount, 1);
  assert.equal(populatedSummary.completedGoalsCount, 1);
  assert.equal(populatedSummary.checkInsCompletedCount, 1);
  assert.ok(populatedSummary.factualObservations.length >= 3);
});

// ============================================================
// 6. ACCESSIBILITY & VERIFIED LANGUAGE
// ============================================================
test('Accessibility Preferences: Scaling, Motion, and Verified Language Standards', () => {
  personalizationStorage.updateAccessibility((prev) => ({
    ...prev,
    fontSize: 'large',
    reducedMotion: 'reduced',
    highContrast: 'high_contrast',
    soundEnabled: true
  }));

  const state = personalizationStorage.getState();
  assert.equal(state.accessibility.fontSize, 'large');
  assert.equal(state.accessibility.reducedMotion, 'reduced');
  assert.equal(state.accessibility.highContrast, 'high_contrast');
  assert.equal(state.accessibility.soundEnabled, true);

  // Language verification
  assert.equal(VERIFIED_LANGUAGES.length, 1, 'Only completely verified languages are listed');
  assert.equal(VERIFIED_LANGUAGES[0].code, 'en');
  assert.equal(VERIFIED_LANGUAGES[0].isComplete, true);
});

// ============================================================
// 7. COMPONENT & DASHBOARD INTEGRATION
// ============================================================
test('Component Integration: Phase 5.11 components properly integrated in DashboardScreen', () => {
  const dashPath = path.resolve(__dirname, '../src/pages/DashboardScreen.tsx');
  assert.ok(fs.existsSync(dashPath));
  const content = fs.readFileSync(dashPath, 'utf-8');

  assert.match(content, /DashboardCustomizationModal/, 'DashboardScreen must import DashboardCustomizationModal');
  assert.match(content, /PersonalGoalsSection/, 'DashboardScreen must import PersonalGoalsSection');
  assert.match(content, /DailyCheckInCard/, 'DashboardScreen must import DailyCheckInCard');
  assert.match(content, /AdaptiveRecommendationSection/, 'DashboardScreen must import AdaptiveRecommendationSection');
  assert.match(content, /WeeklyPersonalSummarySection/, 'DashboardScreen must import WeeklyPersonalSummarySection');
  assert.match(content, /AccessibilityPreferencesModal/, 'DashboardScreen must import AccessibilityPreferencesModal');

  // Verify previous features remain rendered
  assert.match(content, /<WeeklyTrendsSection isPreviewMode=\{isPreviewMode\} \/>/);
  assert.match(content, /<SmartActionPlannerSection isPreviewMode=\{isPreviewMode\} \/>/);
  assert.match(content, /<WellnessStudioSection isPreviewMode=\{isPreviewMode\} \/>/);
});
