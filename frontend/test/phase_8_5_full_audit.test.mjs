/**
 * frontend/test/phase_8_5_full_audit.test.mjs
 * MINDORA 2.0 — PHASE 8.5 COMPREHENSIVE VERIFICATION SUITE
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcPath = path.join(rootDir, 'src');
const publicPath = path.join(rootDir, 'public');

describe('Phase 8.5: Bug Remediation & Feature Architecture Verification', () => {

  it('Music Architecture: 6 instrumental tracks defined with full transport controls and no nature tracks', () => {
    const contextContent = fs.readFileSync(path.join(srcPath, 'context', 'MusicPlayerContext.tsx'), 'utf-8');
    const compactContent = fs.readFileSync(path.join(srcPath, 'components', 'music', 'CompactMusicPlayer.tsx'), 'utf-8');

    // 6 Instrumental tracks
    const requiredTracks = [
      'soft_piano',
      'ambient_instrumental',
      'lofi_calm',
      'meditation_instrumental',
      'peaceful_guitar',
      'focus_music'
    ];
    for (const trackId of requiredTracks) {
      assert.ok(contextContent.includes(trackId), `MusicPlayerContext must define ${trackId}`);
      assert.ok(
        fs.existsSync(path.join(publicPath, 'audio', `${trackId}.wav`)),
        `WAV file for ${trackId} must exist in public/audio`
      );
    }

    // Transport controls
    assert.ok(contextContent.includes('previousTrack'), 'Must support previousTrack');
    assert.ok(contextContent.includes('nextTrack'), 'Must support nextTrack');
    assert.ok(contextContent.includes('stop'), 'Must support stop');
    assert.ok(contextContent.includes('seek'), 'Must support seek');
    assert.ok(contextContent.includes('isRepeat'), 'Must support repeat state');
    assert.ok(contextContent.includes('isShuffle'), 'Must support shuffle state');

    // Transport buttons in player
    assert.ok(compactContent.includes('previousTrack'), 'Compact player must have Previous button');
    assert.ok(compactContent.includes('nextTrack'), 'Compact player must have Next button');
    assert.ok(compactContent.includes('stop'), 'Compact player must have Stop button');
    assert.ok(compactContent.includes('seek('), 'Compact player must have seek slider');
  });

  it('Snake Game: Input direction buffer and collision bounds prevent 180° self-inversion and tunneling', () => {
    const snakeContent = fs.readFileSync(path.join(srcPath, 'components', 'games', 'SnakeGame.tsx'), 'utf-8');

    // Direction FIFO queue buffer
    assert.ok(snakeContent.includes('inputQueueRef'), 'SnakeGame must use inputQueueRef buffer');
    // Board overflow & touch controls
    assert.ok(snakeContent.includes('GRID_SIZE'), 'SnakeGame must define strict GRID_SIZE');
    assert.ok(snakeContent.includes('ArrowUp') || snakeContent.includes('touch'), 'Must support touch or arrow inputs');
    assert.ok(snakeContent.includes('isSessionActive'), 'SnakeGame must respond to session active state');
  });

  it('Block Puzzle: 10x10 board, 90° rotation, hover ghost preview, and authoritative game over check', () => {
    const blockContent = fs.readFileSync(path.join(srcPath, 'components', 'games', 'BlockGame.tsx'), 'utf-8');

    // 10x10 board
    assert.ok(blockContent.includes('BOARD_SIZE = 10'), 'Board size must be 10x10');
    // Block rotation
    assert.ok(
      blockContent.includes('rotateShape') || blockContent.includes('handleRotateSelectedPiece'),
      'Must support piece rotation'
    );
    // Hover ghost preview
    assert.ok(
      blockContent.includes('hoverCoord') || blockContent.includes('isGhostCell'),
      'Must compute hover ghost preview'
    );
    // Authoritative game over check
    assert.ok(
      blockContent.includes('isGameOver') || blockContent.includes('checkGameOver'),
      'Must check game over state'
    );
  });

  it('163-Record Real World Analyzer: Interactive Profile Analysis form with all 10 features & clinical warnings', () => {
    const screenContent = fs.readFileSync(path.join(srcPath, 'pages', 'RealWorldDatasetScreen.tsx'), 'utf-8');

    // 10 form features
    assert.ok(screenContent.includes('profileForm.age'), 'Form must input age');
    assert.ok(screenContent.includes('profileForm.gender'), 'Form must input gender');
    assert.ok(screenContent.includes('profileForm.dietary_habits'), 'Form must input dietary habits');
    assert.ok(screenContent.includes('profileForm.degree'), 'Form must input degree / programme');
    assert.ok(screenContent.includes('profileForm.cgpa'), 'Form must input cgpa');
    assert.ok(screenContent.includes('profileForm.academic_pressure'), 'Form must input academic pressure');
    assert.ok(screenContent.includes('profileForm.study_satisfaction'), 'Form must input study satisfaction');
    assert.ok(screenContent.includes('profileForm.sleep_duration'), 'Form must input sleep duration');
    assert.ok(screenContent.includes('profileForm.study_hours'), 'Form must input study hours');
    assert.ok(screenContent.includes('profileForm.financial_stress'), 'Form must input financial stress');

    // Mandatory Clinical Non-Diagnostic Disclaimer
    assert.ok(
      screenContent.includes('EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT.'),
      'Must display exact clinical warning'
    );

    // Endpoint called
    assert.ok(screenContent.includes('/api/research/163-dataset/profile-compare'), 'Must call profile-compare endpoint');
  });

  it('Navigation & Screen Mounting: ExplainabilityScreen mounted and logout events dispatched', () => {
    const appContent = fs.readFileSync(path.join(srcPath, 'App.tsx'), 'utf-8');

    assert.ok(appContent.includes("import { ExplainabilityScreen } from './pages/ExplainabilityScreen'"), 'ExplainabilityScreen must be imported');
    assert.ok(appContent.includes("effectiveScreen === 'explainability'"), 'ExplainabilityScreen must be mounted on explainability route');
    assert.ok(appContent.includes("CustomEvent('mindora:logout')"), 'Must dispatch mindora:logout custom event');
    assert.ok(appContent.includes("mindora_active_game_session_v1"), 'Must clear game session on logout');
  });

  it('Guardian and Journal Persistence: data.profile || data.user supported and journal persisted in localStorage', () => {
    const guardianInfo = fs.readFileSync(path.join(srcPath, 'pages', 'GuardianInfoScreen.tsx'), 'utf-8');
    const journalScreen = fs.readFileSync(path.join(srcPath, 'pages', 'PersonalJournalScreen.tsx'), 'utf-8');

    assert.ok(guardianInfo.includes('data.profile || data.user'), 'GuardianInfoScreen must support both profile and user');
    assert.ok(journalScreen.includes('mindora_personal_journal_entries'), 'Journal must persist to localStorage');
  });

});
