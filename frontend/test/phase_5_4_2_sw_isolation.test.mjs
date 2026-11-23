import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Phase 5.4.2: Development Service Worker Isolation Tests

test('SW Isolation 1: main.tsx registers service worker strictly in production mode', () => {
  const mainPath = path.resolve('src/main.tsx');
  assert.ok(fs.existsSync(mainPath), 'main.tsx must exist');
  const mainContent = fs.readFileSync(mainPath, 'utf8');

  // Must check import.meta.env.PROD
  assert.ok(
    mainContent.includes('import.meta.env.PROD'),
    'main.tsx must check import.meta.env.PROD before registration'
  );

  // Must not allow development registration via loose MODE check
  assert.ok(
    !mainContent.includes("import.meta.env.MODE !== 'test'"),
    'main.tsx must not use loose MODE !== test check'
  );
});

test('SW Isolation 2: main.tsx implements safe unregistration and cache purge for development', () => {
  const mainPath = path.resolve('src/main.tsx');
  const mainContent = fs.readFileSync(mainPath, 'utf8');

  // Must unregister existing registrations in development
  assert.ok(
    mainContent.includes('navigator.serviceWorker.getRegistrations()'),
    'main.tsx must query active registrations in dev'
  );
  assert.ok(
    mainContent.includes('registration.unregister()'),
    'main.tsx must unregister development service workers'
  );

  // Must clean up stale app shell caches in dev
  assert.ok(
    mainContent.includes('caches.delete(key)'),
    'main.tsx must purge stale caches in development'
  );
});

test('SW Isolation 3: Production Service Worker preserves safe offline caching policy in sw.js', () => {
  const swPath = path.resolve('public/sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');

  assert.ok(swContent.includes("CACHE_NAME = 'mindora-app-shell-v2'"));
  assert.ok(swContent.includes("request.method !== 'GET'"));
  assert.ok(swContent.includes('STATIC_APP_SHELL_ASSETS'));
  assert.ok(!swContent.includes('phq9'));
  assert.ok(!swContent.includes('localStorage'));
});
