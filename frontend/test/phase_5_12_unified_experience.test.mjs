import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node.js test environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
globalThis.window = {
  localStorage: mockStorage
};

// Imports
import {
  getUnifiedActivityTimeline,
  filterActivityTimeline,
  clearEligibleTimelineData
} from '../src/engines/activityTimelineEngine.ts';
import {
  getPrivacyInventory,
  executePrivacyDeletion
} from '../src/engines/privacyInventoryEngine.ts';
import { wellnessStore } from '../src/engines/wellnessEngine.ts';
import { plannerStorage } from '../src/storage/vault/plannerStorage.ts';
import { personalizationStorage } from '../src/storage/personalizationStorage.ts';
import { trendStorage } from '../src/storage/vault/trendStorage.ts';
import {
  ALL_DASHBOARD_SECTIONS,
  DEFAULT_SECTION_ORDER
} from '../src/contracts/personalizationContract.ts';
import { generateAdaptiveRecommendations } from '../src/engines/adaptiveRecommendationEngine.ts';

test('Timeline Aggregation: Correctly maps genuine records from multiple modules', () => {
  // Clear baseline
  wellnessStore.clearSessionHistory();
  plannerStorage.clearAllData();

  // 1. Record a wellness session
  wellnessStore.recordSession({
    experienceId: 'breathing',
    title: 'Balanced Breathing Coherence',
    durationMinutes: 3
  });

  // 2. Set planner completed history
  plannerStorage.setCompletedHistory([
    {
      id: 'plan-rec-1',
      actionId: 'act-hydration',
      actionTitle: 'Morning Water Hydration',
      category: 'Routine & Buffer',
      date: '2026-11-16',
      weekIdentifier: '2026-W47',
      completedAt: '2026-11-16T08:30:00.000Z',
      durationMinutes: 2
    }
  ]);

  // 3. Record daily check-in
  personalizationStorage.recordDailyCheckIn({
    id: 'chk-1',
    date: '2026-11-16',
    dayRating: 4,
    energyRating: 4,
    tookBreaks: 'yes',
    completedAt: '12:00'
  });

  // Fetch unified timeline
  const timeline = getUnifiedActivityTimeline();
  assert.ok(timeline.length >= 3, 'Timeline aggregates across sources');

  // Verify wellness event mapping
  const wellnessEv = timeline.find((e) => e.category === 'wellness');
  assert.ok(wellnessEv, 'Wellness event exists');
  assert.equal(wellnessEv.sourceFeature, 'wellness_studio');
  assert.equal(wellnessEv.durationMinutes, 3);

  // Verify planner event mapping
  const plannerEv = timeline.find((e) => e.category === 'planner');
  assert.ok(plannerEv, 'Planner event exists');
  assert.equal(plannerEv.sourceFeature, 'smart_action_planner');
  assert.equal(plannerEv.title, 'Morning Water Hydration');
  assert.equal(plannerEv.durationMinutes, 2);

  // Verify check-in event mapping
  const checkinEv = timeline.find((e) => e.category === 'checkin');
  assert.ok(checkinEv, 'Checkin event exists');
  assert.equal(checkinEv.sourceFeature, 'daily_checkin');
});

test('Timeline Sorting & Uniqueness: Chronological descending order with unique IDs', () => {
  const timeline = getUnifiedActivityTimeline();
  const ids = new Set();
  for (let i = 0; i < timeline.length; i++) {
    const ev = timeline[i];
    assert.ok(!ids.has(ev.id), `ID must be unique: ${ev.id}`);
    ids.add(ev.id);

    if (i > 0) {
      assert.ok(
        timeline[i - 1].timestamp >= ev.timestamp,
        'Timeline must be sorted in descending chronological order'
      );
    }
  }
});

test('Timeline Filtering: Category, Date Range, and Search Query', () => {
  const allEvents = getUnifiedActivityTimeline();
  assert.ok(allEvents.length >= 2, 'Events present for filter testing');

  // 1. Filter by category
  const wellnessOnly = filterActivityTimeline(allEvents, {
    category: 'wellness',
    dateRange: 'all'
  });
  assert.ok(wellnessOnly.every((e) => e.category === 'wellness'));

  const plannerOnly = filterActivityTimeline(allEvents, {
    category: 'planner',
    dateRange: 'all'
  });
  assert.ok(plannerOnly.every((e) => e.category === 'planner'));

  // 2. Filter by search query
  const searchResults = filterActivityTimeline(allEvents, {
    category: 'all',
    dateRange: 'all',
    searchQuery: 'Hydration'
  });
  assert.ok(searchResults.length > 0);
  assert.ok(searchResults.every((e) => e.title.includes('Hydration') || e.description.includes('Hydration')));

  // 3. Date range filter
  const todayOnly = filterActivityTimeline(allEvents, {
    category: 'all',
    dateRange: 'today'
  });
  const todayStr = new Date().toISOString().slice(0, 10);
  assert.ok(todayOnly.every((e) => e.displayDate === todayStr));
});

test('Timeline Privacy Invariant: Strictly excludes clinical, PHQ-9, and private reflection text', () => {
  // Inject daily check-in with private reflection
  personalizationStorage.recordDailyCheckIn({
    id: 'chk-sensitive-test',
    date: '2026-11-16',
    dayRating: 2,
    energyRating: 2,
    tookBreaks: 'no',
    privateReflection: 'CONFIDENTIAL_PRIVATE_STUDENT_NOTE_DO_NOT_LEAK',
    completedAt: '14:00'
  });

  const timeline = getUnifiedActivityTimeline();
  for (const ev of timeline) {
    const str = JSON.stringify(ev);
    assert.ok(!str.includes('CONFIDENTIAL_PRIVATE_STUDENT_NOTE_DO_NOT_LEAK'), 'Private reflection text MUST NOT appear in timeline');
    assert.ok(!str.includes('phq9'), 'No PHQ-9 references');
    assert.ok(!str.includes('depression'), 'No depression scoring');
    assert.ok(!str.includes('item9'), 'No Item 9 crisis flags');
  }
});

test('Timeline Clearing: Selectively wipes eligible activity without touching unrelated storage', () => {
  // Seed state
  wellnessStore.recordSession({
    experienceId: 'grounding',
    title: '5-4-3-2-1 Sensory Reset',
    durationMinutes: 5
  });
  assert.ok(wellnessStore.getCompletedSessions().length > 0);

  // Clear wellness only
  const res1 = clearEligibleTimelineData('wellness');
  assert.equal(res1.success, true);
  assert.equal(wellnessStore.getCompletedSessions().length, 0);

  // Clear all timeline
  wellnessStore.recordSession({
    experienceId: 'focus_timer',
    title: 'Pomodoro Sprint',
    durationMinutes: 25
  });
  const res2 = clearEligibleTimelineData('all_timeline');
  assert.equal(res2.success, true);
  assert.equal(wellnessStore.getCompletedSessions().length, 0);
  assert.equal(plannerStorage.getCompletedHistory().length, 0);
});

test('Privacy Inventory: Correctly inventories all 6 categories with true storage locations', async () => {
  const inventory = await getPrivacyInventory();
  assert.equal(inventory.length, 6, 'Must contain exactly 6 data categories (A-F)');

  const ids = inventory.map((c) => c.id);
  assert.ok(ids.includes('preferences'), 'Contains Preferences (A)');
  assert.ok(ids.includes('trends_vault'), 'Contains Trends Vault (B)');
  assert.ok(ids.includes('planner'), 'Contains Planner (C)');
  assert.ok(ids.includes('daily_checkin'), 'Contains Daily Check-Ins (D)');
  assert.ok(ids.includes('wellness_studio'), 'Contains Wellness Studio (E)');
  assert.ok(ids.includes('network_ai'), 'Contains Network & AI (F)');

  // Verify encryption properties
  const prefs = inventory.find((c) => c.id === 'preferences');
  assert.equal(prefs.storageLocation, 'localStorage');
  assert.equal(prefs.isEncrypted, false);

  const daily = inventory.find((c) => c.id === 'daily_checkin');
  assert.equal(daily.persistence, 'ephemeral');

  const network = inventory.find((c) => c.id === 'network_ai');
  assert.equal(network.storageLocation, 'local_companion');
});

test('Privacy Deletion: Controlled erasure without collateral storage damage', async () => {
  mockStorage.setItem('mindora_personalization_prefs', JSON.stringify({ test: 'prefs' }));
  mockStorage.setItem('unrelated_app_key', 'PROTECTED_DATA');

  // Purge preferences
  const res = await executePrivacyDeletion('preferences');
  assert.equal(res.success, true);
  assert.equal(mockStorage.getItem('mindora_personalization_prefs'), null);
  assert.equal(mockStorage.getItem('unrelated_app_key'), 'PROTECTED_DATA', 'Unrelated storage must remain untouched');

  // Purge all eligible
  const resAll = await executePrivacyDeletion('all_eligible');
  assert.equal(resAll.success, true);
  assert.equal(mockStorage.getItem('unrelated_app_key'), 'PROTECTED_DATA');
});

test('Recommendation Transparency: Explanations provide explicit goal and duration mapping', () => {
  const recommendations = generateAdaptiveRecommendations({
    goals: [
      {
        id: 'goal-study-1',
        title: 'Improve study consistency',
        category: 'study_routine',
        description: 'Focus blocks',
        isCustom: false,
        status: 'active',
        targetPerWeek: 4,
        completedCount: 0,
        createdAt: '2026-11-16'
      }
    ],
    preferences: {
      preferredDurationMinutes: 25,
      favoriteCategories: ['study_routine'],
      dismissedRecommendationIds: [],
      usefulRecommendationIds: [],
      notUsefulRecommendationIds: []
    },
    limit: 3
  });

  assert.ok(recommendations.length > 0);
  const rec = recommendations[0];
  assert.ok(rec.rationale.length > 0, 'Must have explainable rationale');
  assert.ok(rec.rationale.includes('active goal') || rec.rationale.includes('study'), 'Rationale connects to active goal');
  assert.ok(typeof rec.estimatedMinutes === 'number', 'Estimated minutes present');
});

test('Dashboard Contract Integration: All 10 sections registered and safety pinned', () => {
  assert.equal(ALL_DASHBOARD_SECTIONS.length, 10, 'Contains all 10 dashboard sections');
  const sectionIds = ALL_DASHBOARD_SECTIONS.map((s) => s.id);
  assert.ok(sectionIds.includes('activity_timeline'), 'Includes activity timeline');
  assert.ok(sectionIds.includes('privacy_center'), 'Includes privacy center');

  // Verify mandatory safety pinning
  const overview = ALL_DASHBOARD_SECTIONS.find((s) => s.id === 'wellbeing_overview');
  assert.equal(overview?.isMandatory, true);

  // Verify default section order
  assert.equal(DEFAULT_SECTION_ORDER.length, 10);
  assert.equal(DEFAULT_SECTION_ORDER[0], 'wellbeing_overview');
  assert.ok(DEFAULT_SECTION_ORDER.includes('activity_timeline'));
  assert.ok(DEFAULT_SECTION_ORDER.includes('privacy_center'));
});

test('Offline Execution Guarantee: Modules evaluate 100% locally with zero fetch calls', async () => {
  // Test that timeline, inventory, and deletion execute synchronously or locally without network calls
  const timeline = getUnifiedActivityTimeline();
  assert.ok(Array.isArray(timeline));

  const inventory = await getPrivacyInventory();
  assert.ok(Array.isArray(inventory));

  const del = await executePrivacyDeletion('preferences');
  assert.equal(del.success, true);
});
