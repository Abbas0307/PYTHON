import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 9: Voice-Based AI Feelings Space, Global Floating AI Companion & Route Registry Verification', () => {
  const srcPath = path.resolve(process.cwd(), 'src');

  it('NavigationScreen type strictly registers ai_feelings_space', () => {
    const sessionManagerContent = fs.readFileSync(path.join(srcPath, 'storage', 'sessionStorage.ts'), 'utf-8');
    assert.ok(sessionManagerContent.includes("'ai_feelings_space'"), "NavigationScreen must include 'ai_feelings_space'");
  });

  it('Sidebar restructures AI Support to feature AI Feelings Space and AI Learning & Guidance without standalone companion page', () => {
    const sidebarContent = fs.readFileSync(path.join(srcPath, 'components', 'common', 'Sidebar.tsx'), 'utf-8');

    // Group E: AI Support
    assert.ok(sidebarContent.includes("'ai_feelings_space'"), "Sidebar must route to 'ai_feelings_space'");
    assert.ok(sidebarContent.includes('AI Feelings Space'), "Sidebar must label 'AI Feelings Space'");
    assert.ok(sidebarContent.includes('AI Learning & Guidance'), "Sidebar must label 'AI Learning & Guidance'");

    // Standalone full-page companion removed from sidebar items
    const aiSupportSlice = sidebarContent.slice(sidebarContent.indexOf("id: 'ai_support'"), sidebarContent.indexOf("id: 'account_support'"));
    assert.ok(!aiSupportSlice.includes("id: 'ai_companion'"), "Sidebar must NOT include 'ai_companion' in AI Support items");
  });

  it('Route Registry maps valid application screens and correctly resolves navigation intents', async () => {
    const registryPath = path.join(srcPath, 'navigation', 'routeRegistry.ts');
    assert.ok(fs.existsSync(registryPath), 'routeRegistry.ts must exist');

    const registryModule = await import('../src/navigation/routeRegistry.ts');
    const { findMatchingRoute, getAllNavigableRoutes } = registryModule;

    const routes = getAllNavigableRoutes();
    assert.ok(routes.length >= 15, 'Must register at least 15 navigable application routes');

    // Test intent queries from user prompt
    const feelingsMatch = findMatchingRoute('Where can I write about my feelings?');
    assert.ok(feelingsMatch, 'Must resolve feelings query');
    assert.strictEqual(feelingsMatch.id, 'personal_journal', 'Must map to personal_journal');

    const assessMatch = findMatchingRoute('Where can I check my previous assessments?');
    assert.ok(assessMatch, 'Must resolve assessment history query');
    assert.strictEqual(assessMatch.id, 'assessment_history', 'Must map to assessment_history');

    const breathMatch = findMatchingRoute('How can I start a breathing exercise?');
    assert.ok(breathMatch, 'Must resolve breathing exercise query');
    assert.strictEqual(breathMatch.id, 'breathing', 'Must map to breathing');

    const guardianMatch = findMatchingRoute('Where can I update my guardian email?');
    assert.ok(guardianMatch, 'Must resolve guardian email query');
    assert.strictEqual(guardianMatch.id, 'guardian_info', 'Must map to guardian_info');

    const feelingsSpaceMatch = findMatchingRoute('Take me to feelings space');
    assert.ok(feelingsSpaceMatch, 'Must resolve feelings space query');
    assert.strictEqual(feelingsSpaceMatch.id, 'ai_feelings_space', 'Must map to ai_feelings_space');
  });

  it('Floating AI Companion is globally available on authenticated views and hidden on login/signup', () => {
    const widgetContent = fs.readFileSync(path.join(srcPath, 'components', 'companion', 'FloatingAICompanionWidget.tsx'), 'utf-8');

    // Unauthenticated screens filter
    assert.ok(widgetContent.includes("'login'"), "Must hide on 'login'");
    assert.ok(widgetContent.includes("'signup'"), "Must hide on 'signup'");
    assert.ok(widgetContent.includes("'welcome'"), "Must hide on 'welcome'");
    assert.ok(widgetContent.includes("'parent_info'"), "Must hide on 'parent_info'");
    assert.ok(widgetContent.includes("'student_info'"), "Must hide on 'student_info'");

    // Fixed bottom-right positioning
    assert.ok(widgetContent.includes('fixed bottom-6 right-6'), 'Must use fixed bottom-right positioning');
    assert.ok(widgetContent.includes('Mindora AI'), 'Must display Mindora AI button');

    // Navigation intent button
    assert.ok(widgetContent.includes('findMatchingRoute'), 'Must call findMatchingRoute');
    assert.ok(widgetContent.includes('onNavigate(msg.navTarget!.id)'), 'Must trigger router navigation when action button clicked');

    // Clear history capability
    assert.ok(widgetContent.includes('handleClearHistory'), 'Must support clearing conversation history');
  });

  it('AIFeelingsSpaceScreen enforces voice-first UI, CPU-only Web Speech APIs, and strict privacy invariants', () => {
    const screenPath = path.join(srcPath, 'pages', 'AIFeelingsSpaceScreen.tsx');
    assert.ok(fs.existsSync(screenPath), 'AIFeelingsSpaceScreen.tsx must exist');

    const screenContent = fs.readFileSync(screenPath, 'utf-8');

    // Voice-First elements
    assert.ok(screenContent.includes('Your Feelings Space'), 'Must display title Your Feelings Space');
    assert.ok(screenContent.includes('Start Conversation'), 'Must provide Start Conversation CTA');
    assert.ok(screenContent.includes('End Session'), 'Must provide End Session CTA');
    assert.ok(screenContent.includes('Mute Mic'), 'Must provide microphone mute controls');
    assert.ok(screenContent.includes('formattedTime'), 'Must track session elapsed duration');

    // Web Speech API & SpeechSynthesis
    assert.ok(screenContent.includes('SpeechRecognition'), 'Must use browser SpeechRecognition API');
    assert.ok(screenContent.includes('speechSynthesis'), 'Must use browser SpeechSynthesis API');

    // Strict Clinical & Privacy Invariants
    assert.ok(screenContent.includes('NOT a Diagnostic Instrument'), 'Must state voice is not a diagnostic instrument');
    assert.ok(screenContent.includes('Zero Audio Retention'), 'Must guarantee zero audio retention');
    assert.ok(screenContent.includes('never shared with parents or guardians'), 'Must guarantee parental isolation');
    assert.ok(screenContent.includes('14416'), 'Must include Tele-MANAS crisis helpline');
    assert.ok(screenContent.includes('1800-599-0019'), 'Must include KIRAN crisis helpline');

    // Explicit Consent Modal
    assert.ok(screenContent.includes('showConsentModal'), 'Must support explicit privacy consent modal');
  });
});
