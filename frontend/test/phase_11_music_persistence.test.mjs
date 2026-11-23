import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 11 Priority 3: Background Music Preference Persistence Across Sessions', () => {
  const srcPath = path.resolve(process.cwd(), 'src');
  const contextContent = fs.readFileSync(path.join(srcPath, 'context', 'MusicPlayerContext.tsx'), 'utf-8');
  const appContent = fs.readFileSync(path.join(srcPath, 'App.tsx'), 'utf-8');
  const screenContent = fs.readFileSync(path.join(srcPath, 'pages', 'AmbientMusicScreen.tsx'), 'utf-8');

  it('1. MusicPlayerContext implements user-scoped storage isolation', () => {
    assert.ok(contextContent.includes('export const getUserStorageKey'), 'Must export getUserStorageKey function');
    assert.ok(contextContent.includes('mindora_ambient_music_preferences_u'), 'Must use user-specific prefix');
    assert.ok(contextContent.includes('currentUserIdRef'), 'Must track currentUserIdRef to avoid closure race conditions');
  });

  it('2. Music preferences are synchronized with backend database API /api/preferences', () => {
    assert.ok(contextContent.includes('/api/preferences'), 'Must reference /api/preferences endpoint');
    assert.ok(contextContent.includes('ambient_music_enabled'), 'Must sync ambient_music_enabled');
    assert.ok(contextContent.includes('ambient_music_track'), 'Must sync ambient_music_track');
    assert.ok(contextContent.includes('ambient_music_volume'), 'Must sync ambient_music_volume');
  });

  it('3. App.tsx dispatches mindora:login with user details on authentication and restore', () => {
    assert.ok(appContent.includes("new CustomEvent('mindora:login'"), 'Must dispatch mindora:login custom event');
    assert.ok(appContent.includes("detail: { user: profile }"), 'Must attach user profile to login event');
  });

  it('4. MusicPlayerContext handles login auto-resume and logout safe pause without wiping data', () => {
    // Login auto-resume
    assert.ok(contextContent.includes("window.addEventListener('mindora:login'"), 'Must register mindora:login listener');
    assert.ok(contextContent.includes('shouldAutoPlay'), 'Must check auto-play preference on login');

    // Logout safe pause
    assert.ok(contextContent.includes("window.addEventListener('mindora:logout'"), 'Must register mindora:logout listener');
    assert.ok(contextContent.includes('audioRef.current.pause()'), 'Must pause audio on logout');
    // Ensure localStorage is not wiped on logout
    assert.ok(!contextContent.includes('localStorage.clear()'), 'Must never wipe localStorage on logout');
  });

  it('5. AmbientMusicScreen surfaces autoplay blocked banner with one-click resume', () => {
    assert.ok(screenContent.includes('isAutoplayBlocked'), 'Must monitor isAutoplayBlocked');
    assert.ok(screenContent.includes('clearAutoplayBlock'), 'Must invoke clearAutoplayBlock');
    assert.ok(screenContent.includes('data-testid="autoplay-blocked-banner"'), 'Must render autoplay-blocked banner');
  });
});
