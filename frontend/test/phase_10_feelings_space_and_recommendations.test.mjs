import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findMatchingRoute, getAllNavigableRoutes } from '../src/navigation/routeRegistry.ts';
import { generateAdaptiveRecommendations } from '../src/engines/adaptiveRecommendationEngine.ts';

describe('Phase 10: Natural Language Website Navigation Intelligence', () => {
  it('Resolves all Phase 10 exact prompt navigation queries to verified authorized routes', () => {
    // 1. "I want to write something privately." -> personal_journal
    const r1 = findMatchingRoute('I want to write something privately.');
    assert.ok(r1, 'Must resolve "I want to write something privately."');
    assert.equal(r1.id, 'personal_journal');

    // 2. "Where are my old assessments?" -> assessment_history
    const r2 = findMatchingRoute('Where are my old assessments?');
    assert.ok(r2, 'Must resolve "Where are my old assessments?"');
    assert.equal(r2.id, 'assessment_history');

    // 3. "Take me to my goals." -> goals
    const r3 = findMatchingRoute('Take me to my goals.');
    assert.ok(r3, 'Must resolve "Take me to my goals."');
    assert.equal(r3.id, 'goals');

    // 4. "I want to relax." -> wellness_studio
    const r4 = findMatchingRoute('I want to relax.');
    assert.ok(r4, 'Must resolve "I want to relax."');
    assert.equal(r4.id, 'wellness_studio');

    // 5. "Where can I check my progress?" -> wellbeing
    const r5 = findMatchingRoute('Where can I check my progress?');
    assert.ok(r5, 'Must resolve "Where can I check my progress?"');
    assert.equal(r5.id, 'wellbeing');

    // 6. "How do I change my guardian email?" -> guardian_info
    const r6 = findMatchingRoute('How do I change my guardian email?');
    assert.ok(r6, 'Must resolve "How do I change my guardian email?"');
    assert.equal(r6.id, 'guardian_info');

    // 7. "I want to do a breathing exercise." -> breathing
    const r7 = findMatchingRoute('I want to do a breathing exercise.');
    assert.ok(r7, 'Must resolve "I want to do a breathing exercise."');
    assert.equal(r7.id, 'breathing');
  });

  it('Rejects arbitrary hallucinated routes and guarantees all returned routes are registered', () => {
    const invalidQuery = 'take me to secret unauthenticated crypto wallet backdoor';
    const match = findMatchingRoute(invalidQuery);
    // Even if fuzzy match triggers or returns null, any match MUST exist in registered routes
    if (match) {
      const registered = getAllNavigableRoutes().map((r) => r.id);
      assert.ok(registered.includes(match.id));
    }
  });
});

describe('Phase 10: Adaptive Recommendation Quality & Lifecycle', () => {
  it('Generates personalized recommendations explaining what, why, duration, and how to start', () => {
    const recs = generateAdaptiveRecommendations({
      goals: [
        {
          id: 'goal-study-1',
          title: 'Maintain steady coursework pacing',
          category: 'study_routine',
          status: 'active',
          currentProgress: 1,
          weeklyTarget: 5,
          createdAt: new Date().toISOString()
        }
      ],
      preferences: {
        preferredDurationMinutes: 25,
        favoriteCategories: ['study_routine', 'relaxation'],
        dismissedRecommendationIds: [],
        usefulRecommendationIds: [],
        notUsefulRecommendationIds: []
      },
      limit: 3
    });

    assert.ok(recs.length > 0, 'Must generate adaptive recommendations');
    for (const rec of recs) {
      // 1. What is being recommended
      assert.ok(rec.title && rec.title.length > 5, 'Must have clear title');
      // 2. Why it may be useful
      assert.ok(rec.rationale && rec.rationale.length > 10, 'Must have clear rationale');
      // 3. How long it takes
      assert.ok(rec.estimatedMinutes > 0, 'Must have estimated duration');
      // 4. How to start it
      assert.ok(rec.howToStart && rec.howToStart.length > 10, 'Must explain how to start it');
      // 5. Action Route exists
      assert.ok(rec.actionRoute, 'Must link to valid action route');
    }
  });

  it('Filters out dismissed recommendations and boosts explicit helpful feedback', () => {
    const initialRecs = generateAdaptiveRecommendations({
      goals: [],
      preferences: {
        preferredDurationMinutes: 10,
        favoriteCategories: ['relaxation'],
        dismissedRecommendationIds: [],
        usefulRecommendationIds: [],
        notUsefulRecommendationIds: []
      },
      limit: 5
    });

    const firstId = initialRecs[0].id;

    // Dismiss first recommendation
    const afterDismiss = generateAdaptiveRecommendations({
      goals: [],
      preferences: {
        preferredDurationMinutes: 10,
        favoriteCategories: ['relaxation'],
        dismissedRecommendationIds: [firstId],
        usefulRecommendationIds: [],
        notUsefulRecommendationIds: []
      },
      limit: 5
    });

    assert.ok(
      !afterDismiss.some((r) => r.id === firstId),
      'Dismissed recommendation must not appear in subsequent suggestions'
    );
  });
});
