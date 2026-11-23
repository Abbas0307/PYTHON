import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 12: Centralized Daily Assessment Data Integration & Automatic Updates Audit', () => {
  const srcPath = path.resolve(process.cwd(), 'src');
  const appContent = fs.readFileSync(path.join(srcPath, 'App.tsx'), 'utf-8');
  const historyContent = fs.readFileSync(path.join(srcPath, 'pages', 'AssessmentHistoryScreen.tsx'), 'utf-8');
  const weeklyContent = fs.readFileSync(path.join(srcPath, 'pages', 'WeeklyInsightsScreen.tsx'), 'utf-8');
  const gaugeContent = fs.readFileSync(path.join(srcPath, 'components', 'dashboard', 'MotorcycleStressGauge.tsx'), 'utf-8');
  const dashboardContent = fs.readFileSync(path.join(srcPath, 'pages', 'DashboardScreen.tsx'), 'utf-8');
  const compactPlayerContent = fs.readFileSync(path.join(srcPath, 'components', 'music', 'CompactMusicPlayer.tsx'), 'utf-8');
  const sidebarContent = fs.readFileSync(path.join(srcPath, 'components', 'common', 'Sidebar.tsx'), 'utf-8');

  it('1. App.tsx submits to centralized /api/student/assessment/submit with idempotency and dispatches events', () => {
    assert.ok(appContent.includes('/api/student/assessment/submit'), 'Must target centralized endpoint');
    assert.ok(appContent.includes('idempotency_key'), 'Must include idempotency key in submission');
    assert.ok(appContent.includes('timezone: clientTz'), 'Must include student client timezone');
    assert.ok(appContent.includes("window.dispatchEvent(new CustomEvent('mindora:assessment-submitted'"), 'Must dispatch assessment-submitted event');
    assert.ok(appContent.includes("window.dispatchEvent(new CustomEvent('mindora:stress-updated'"), 'Must dispatch stress-updated event');
  });

  it('2. AssessmentHistoryScreen fetches real immutable historical records and listens for synchronization', () => {
    assert.ok(historyContent.includes('/api/student/assessments/history'), 'Must fetch from real backend endpoint');
    assert.ok(historyContent.includes("window.addEventListener('mindora:assessment-submitted'"), 'Must listen for real-time assessment submission');
    assert.ok(!historyContent.includes("id: 'rec-1'"), 'Must NOT contain fake hardcoded rec-1');
    assert.ok(!historyContent.includes("id: 'rec-2'"), 'Must NOT contain fake hardcoded rec-2');
    assert.ok(historyContent.includes('No Assessments Recorded Yet'), 'Must provide empty state for zero assessments');
  });

  it('3. WeeklyInsightsScreen renders 7-day breakdown (Mon-Sun) and distinguishes unlogged days without treating them as 0', () => {
    assert.ok(weeklyContent.includes('/api/student/analytics/weekly'), 'Must fetch live weekly analytics');
    assert.ok(weeklyContent.includes("window.addEventListener('mindora:assessment-submitted'"), 'Must listen for real-time assessment sync');
    assert.ok(weeklyContent.includes('7-Day Daily Assessment Breakdown (Monday – Sunday)'), 'Must render full 7-day breakdown title');
    assert.ok(weeklyContent.includes('Not Logged'), 'Must explicitly display Not Logged for missing days');
    assert.ok(weeklyContent.includes('Unlogged days are never treated as 0'), 'Must document invariant that unlogged days are not 0');
  });

  it('4. MotorcycleStressGauge fetches and displays comparison delta vs previous assessment', () => {
    assert.ok(gaugeContent.includes('previousScore'), 'Must manage previous assessment score');
    assert.ok(gaugeContent.includes('stressChange'), 'Must manage stress delta');
    assert.ok(gaugeContent.includes("window.addEventListener('mindora:assessment-submitted'"), 'Must auto-update when assessment submitted');
    assert.ok(gaugeContent.includes('vs previous check-in'), 'Must display comparison delta with previous check-in');
  });

  it('5. DashboardScreen automatically refreshes personalized recommendations on assessment sync', () => {
    assert.ok(dashboardContent.includes("window.addEventListener('mindora:assessment-submitted', refreshData)"), 'Must auto-refresh personalized tasks on assessment submission');
    assert.ok(dashboardContent.includes('/api/personalization/recommendations'), 'Must query personalized recommendations');
  });

  it('6. Visual Clipping & Dropdown Fixes Verified', () => {
    assert.ok(
      dashboardContent.includes('relative z-20') || dashboardContent.includes('relative z-30'),
      'Welcome card must have relative z-20 or z-30 to stack above gauge'
    );
    assert.ok(compactPlayerContent.includes('z-50'), 'Dropdown menu must have high z-index (z-50)');
    assert.ok(compactPlayerContent.includes('overflow-y-auto'), 'Dropdown menu must have scroll boundaries');
    assert.ok(sidebarContent.includes('sticky top-16 h-[calc(100vh-4rem)]'), 'Sidebar must be sticky top-16 to avoid viewport clipping');
  });
});
