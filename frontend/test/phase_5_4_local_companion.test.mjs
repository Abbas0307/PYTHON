import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Phase 5.4: Local AI Companion Architectural Safeguards & Offline Invariants', async (t) => {
  await t.test('Invariant 1: Local AI companion component exists and defaults to disabled (opt-in only)', () => {
    const compPath = path.resolve(__dirname, '../src/components/companion/LocalResourceCompanion.tsx');
    assert.ok(fs.existsSync(compPath), 'LocalResourceCompanion.tsx must exist');
    const content = fs.readFileSync(compPath, 'utf8');

    // Verify default state is false
    assert.match(content, /useState<boolean>\(false\)/, 'Companion must default to disabled (false)');
    // Verify optional badge
    assert.match(content, /Optional · Local Qwen/, 'Companion must be labeled as Optional');
  });

  await t.test('Invariant 2: Companion payload excludes all student assessment parameters', () => {
    const compPath = path.resolve(__dirname, '../src/components/companion/LocalResourceCompanion.tsx');
    const content = fs.readFileSync(compPath, 'utf8');

    // Must only send query and country
    assert.match(content, /query:\s*textToSend/, 'Request body must pass query');
    assert.match(content, /country:\s*selectedCountry/, 'Request body must pass country');
    assert.doesNotMatch(content, /phqResponses/, 'Must NEVER transmit phqResponses');
    assert.doesNotMatch(content, /studentProfile/, 'Must NEVER transmit studentProfile');
    assert.doesNotMatch(content, /cgpa/, 'Must NEVER transmit cgpa');
    assert.doesNotMatch(content, /academicPressure/, 'Must NEVER transmit academicPressure');
  });

  await t.test('Invariant 3: Clear explanation rendered when companion service is unavailable', () => {
    const compPath = path.resolve(__dirname, '../src/components/companion/LocalResourceCompanion.tsx');
    const content = fs.readFileSync(compPath, 'utf8');

    assert.match(content, /Service offline/, 'Must render clear offline message');
    assert.match(content, /All verified directory cards remain 100% available offline/, 'Must reassure offline availability');
  });

  await t.test('Invariant 4: SupportResourcesScreen embeds companion above resource grid', () => {
    const screenPath = path.resolve(__dirname, '../src/pages/SupportResourcesScreen.tsx');
    const content = fs.readFileSync(screenPath, 'utf8');

    assert.match(content, /LocalResourceCompanion/, 'SupportResourcesScreen must import LocalResourceCompanion');
    assert.match(content, /<LocalResourceCompanion selectedCountry=/, 'SupportResourcesScreen must render LocalResourceCompanion');
  });
});
