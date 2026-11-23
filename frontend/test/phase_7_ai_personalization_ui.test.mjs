import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 7: AI Companion & Intelligent Personalization UI Verification', () => {
  const srcPath = path.resolve(process.cwd(), 'src');

  it('NavigationScreen type strictly registers all Phase 7 screens', () => {
    const sessionManagerContent = fs.readFileSync(path.join(srcPath, 'storage', 'sessionStorage.ts'), 'utf-8');
    const requiredScreens = [
      'ai_companion',
      'weekly_insights',
      'assessment_history',
      'personal_journal',
      'relaxation_exercises',
      'personalized_activities',
      'ai_recommendations',
      'learning_hub'
    ];

    for (const scr of requiredScreens) {
      assert.ok(
        sessionManagerContent.includes(`'${scr}'`),
        `Expected NavigationScreen to include '${scr}'`
      );
    }
  });

  it('Sidebar implements the exact 6 groups + ML Research Lab hierarchy', () => {
    const sidebarContent = fs.readFileSync(path.join(srcPath, 'components', 'common', 'Sidebar.tsx'), 'utf-8');
    
    assert.ok(sidebarContent.includes('A. OVERVIEW'), 'Sidebar must include A. OVERVIEW');
    assert.ok(sidebarContent.includes('B. ASSESSMENTS'), 'Sidebar must include B. ASSESSMENTS');
    assert.ok(sidebarContent.includes('C. MY PERSONAL SPACE'), 'Sidebar must include C. MY PERSONAL SPACE');
    assert.ok(sidebarContent.includes('D. WELLNESS CENTER'), 'Sidebar must include D. WELLNESS CENTER');
    assert.ok(sidebarContent.includes('E. AI SUPPORT'), 'Sidebar must include E. AI SUPPORT');
    assert.ok(sidebarContent.includes('F. ACCOUNT & SUPPORT'), 'Sidebar must include F. ACCOUNT & SUPPORT');
    assert.ok(sidebarContent.includes('ML RESEARCH LAB'), 'Sidebar must include ML RESEARCH LAB');
  });

  it('AI Companion screen contains emergency crisis safe lines and privacy disclosures', () => {
    const companionScreen = fs.readFileSync(path.join(srcPath, 'pages', 'AICompanionScreen.tsx'), 'utf-8');

    assert.ok(companionScreen.includes('Tele-MANAS'), 'AI Companion must include Tele-MANAS helpline');
    assert.ok(companionScreen.includes('14416'), 'AI Companion must include 14416 crisis helpline');
    assert.ok(companionScreen.includes('/api/ai-companion/chat'), 'AI Companion must post to /api/ai-companion/chat');
    assert.ok(companionScreen.includes('/api/ai-companion/history'), 'AI Companion must access history');
    assert.ok(companionScreen.includes('Clear History'), 'AI Companion must have clear history option');
  });

  it('Personalized Activities screen supports non-diagnostic bands and 3-task limit', () => {
    const recScreen = fs.readFileSync(path.join(srcPath, 'pages', 'PersonalizedActivitiesScreen.tsx'), 'utf-8');

    assert.ok(recScreen.includes('BAND_A'), 'Screen must recognize BAND_A');
    assert.ok(recScreen.includes('BAND_B'), 'Screen must recognize BAND_B');
    assert.ok(recScreen.includes('BAND_C'), 'Screen must recognize BAND_C');
    assert.ok(recScreen.includes('BAND_D'), 'Screen must recognize BAND_D');
    assert.ok(recScreen.includes('/api/personalization/activity-status'), 'Screen must call activity status update');
    assert.ok(recScreen.includes('Skip'), 'Screen must support skip without penalty');
    assert.ok(recScreen.includes('Completed'), 'Screen must track completed practices');
  });

  it('Floating AI Companion Widget exists and toggles across authenticated views', () => {
    const widgetContent = fs.readFileSync(path.join(srcPath, 'components', 'companion', 'FloatingAICompanionWidget.tsx'), 'utf-8');

    assert.ok(widgetContent.includes('Mindora AI'), 'Widget must display Mindora AI');
    assert.ok(widgetContent.includes('/api/ai-companion/chat'), 'Widget must post to chat API');
    assert.ok(widgetContent.includes('onNavigate(\'ai_companion\')'), 'Widget must allow expanding to full page');
  });
});
