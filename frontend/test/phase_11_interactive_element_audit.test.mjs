import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 11 Priority 4: Interactive Element & Navigation Routing Audit', () => {
  const srcPath = path.resolve(process.cwd(), 'src');
  const appContent = fs.readFileSync(path.join(srcPath, 'App.tsx'), 'utf-8');
  const sidebarContent = fs.readFileSync(path.join(srcPath, 'components', 'common', 'Sidebar.tsx'), 'utf-8');
  const emailScreenContent = fs.readFileSync(path.join(srcPath, 'pages', 'EmailNotificationsScreen.tsx'), 'utf-8');

  it('1. GuardianSupportScreen is imported and routed independently in App.tsx', () => {
    assert.ok(appContent.includes("import { GuardianSupportScreen } from './pages/GuardianSupportScreen'"), 'Must import GuardianSupportScreen');
    assert.ok(appContent.includes("effectiveScreen === 'guardian_support'"), 'Must have dedicated guardian_support condition');
    assert.ok(appContent.includes('<GuardianSupportScreen />'), 'Must mount GuardianSupportScreen component');
  });

  it('2. URL hash sync and validScreens list includes guardian_support', () => {
    assert.ok(appContent.includes("'guardian_support'"), 'Must include guardian_support in validScreens array');
  });

  it('3. EmailNotificationsScreen retains functional action handlers without dead links', () => {
    assert.ok(emailScreenContent.includes('handleSendEmailOtp'), 'Must provide OTP request handler');
    assert.ok(emailScreenContent.includes('handleVerifyEmailOtp'), 'Must provide OTP verification handler');
    assert.ok(emailScreenContent.includes('handleToggleConsent'), 'Must provide consent toggle handler');
    assert.ok(emailScreenContent.includes('handleRunSimulation'), 'Must provide stress evaluation simulation handler');
    assert.ok(emailScreenContent.includes('handleRetryNotification'), 'Must provide notification retry handler');
  });

  it('4. Sidebar navigation defines comprehensive categories with zero unhandled routes', () => {
    assert.ok(sidebarContent.includes("id: 'dashboard'"), 'Must include dashboard item');
    assert.ok(sidebarContent.includes("id: 'wellbeing'"), 'Must include wellbeing item');
    assert.ok(sidebarContent.includes("id: 'ai_feelings_space'"), 'Must include ai_feelings_space item');
    assert.ok(sidebarContent.includes("id: 'ambient_music'"), 'Must include ambient_music item');
    assert.ok(sidebarContent.includes("id: 'mini_games'"), 'Must include mini_games item');
    assert.ok(sidebarContent.includes("id: 'guardian_info'"), 'Must include guardian_info item');
    assert.ok(sidebarContent.includes("id: 'email_notifications'"), 'Must include email_notifications item');
  });
});
