import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 8: Real-World Analyzer, Ambient Music & Stress-Relief Mini Games UI Verification', () => {
  const srcPath = path.resolve(process.cwd(), 'src');
  const publicPath = path.resolve(process.cwd(), 'public');

  it('NavigationScreen type strictly registers mini_games and ambient_music', () => {
    const sessionManagerContent = fs.readFileSync(path.join(srcPath, 'storage', 'sessionStorage.ts'), 'utf-8');
    assert.ok(sessionManagerContent.includes("'mini_games'"), "Expected NavigationScreen to include 'mini_games'");
    assert.ok(sessionManagerContent.includes("'ambient_music'"), "Expected NavigationScreen to include 'ambient_music'");
  });

  it('Sidebar registers Mindora Mini Games and Ambient Music with dedicated icons', () => {
    const sidebarContent = fs.readFileSync(path.join(srcPath, 'components', 'common', 'Sidebar.tsx'), 'utf-8');
    
    // Group D includes Mini Games
    assert.ok(sidebarContent.includes("'mini_games'"), "Sidebar must route to 'mini_games'");
    assert.ok(sidebarContent.includes('Mindora Mini Games'), "Sidebar must display 'Mindora Mini Games'");
    
    // Group C includes Ambient Music
    assert.ok(sidebarContent.includes("'ambient_music'"), "Sidebar must route to 'ambient_music'");
    assert.ok(sidebarContent.includes('Ambient Music'), "Sidebar must display 'Ambient Music'");

    // ML Lab includes Real-World 163-Record Data Analyzer
    assert.ok(sidebarContent.includes('Real-World 163-Record Data Analyzer'), "Sidebar must label 163-Record Data Analyzer");
  });

  it('MiniGamesScreen enforces strict 5-minute session limit, modal prompt, and non-diagnostic disclaimer', () => {
    const gamesScreen = fs.readFileSync(path.join(srcPath, 'pages', 'MiniGamesScreen.tsx'), 'utf-8');

    // Strict 5-minute wall-clock elapsed time
    assert.ok(gamesScreen.includes('FIVE_MINUTES_SECONDS = 300'), 'Must define 300 seconds limit');
    assert.ok(gamesScreen.includes('Date.now()'), 'Must use Date.now() for wall-clock verification');
    assert.ok(gamesScreen.includes('sessionStorage'), 'Must synchronize timer with sessionStorage');

    // Modal popup prompt text
    assert.ok(
      gamesScreen.includes('Your five-minute play session is complete. Would you like to continue or stop?'),
      'Must contain the exact 5-minute completion prompt'
    );
    assert.ok(gamesScreen.includes('CONTINUE'), 'Must have Continue button');
    assert.ok(gamesScreen.includes('STOP'), 'Must have Stop button');

    // Non-diagnostic disclaimer
    assert.ok(
      gamesScreen.includes('Non-Diagnostic Disclaimer'),
      'Must contain non-diagnostic wellness tool disclaimer'
    );
    assert.ok(
      gamesScreen.includes('They do not diagnose, treat, or cure'),
      'Must disclaim cognitive diagnosis'
    );
  });

  it('SnakeGame and BlockGame implement touch, audio chimes, and session pause controls', () => {
    const snakeContent = fs.readFileSync(path.join(srcPath, 'components', 'games', 'SnakeGame.tsx'), 'utf-8');
    const blockContent = fs.readFileSync(path.join(srcPath, 'components', 'games', 'BlockGame.tsx'), 'utf-8');

    // Snake game checks
    assert.ok(snakeContent.includes('GRID_SIZE = 20'), 'Snake must use 20x20 grid');
    assert.ok(snakeContent.includes('AudioContext'), 'Snake must use Web Audio API chimes');
    assert.ok(snakeContent.includes('isSessionActive'), 'Snake must check isSessionActive');
    assert.ok(snakeContent.includes('ArrowUp') || snakeContent.includes('ArrowDown'), 'Snake must handle keyboard arrows');

    // Block game checks
    assert.ok(blockContent.includes('BOARD_SIZE = 10'), 'Block puzzle must use 10x10 board');
    assert.ok(blockContent.includes('AudioContext'), 'Block game must use Web Audio API chimes');
    assert.ok(blockContent.includes('isSessionActive'), 'Block puzzle must check isSessionActive');
  });

  it('MusicPlayerContext provides continuous playback across navigation with 6 audio categories', () => {
    const musicContext = fs.readFileSync(path.join(srcPath, 'context', 'MusicPlayerContext.tsx'), 'utf-8');

    const expectedTracks = [
      'peaceful_instrumental',
      'soft_piano',
      'nature_sounds',
      'rain_ambience',
      'ocean_waves',
      'gentle_meditation'
    ];

    for (const track of expectedTracks) {
      assert.ok(musicContext.includes(track), `MusicContext must include track '${track}'`);
    }

    assert.ok(musicContext.includes('HTMLAudioElement'), 'Must use HTMLAudioElement for global playback');
    assert.ok(musicContext.includes('mindora:logout'), 'Must listen to logout event to stop playback');
    assert.ok(musicContext.includes('fade'), 'Must provide audio fading logic');
    assert.ok(musicContext.includes('isAutoplayBlocked'), 'Must detect browser autoplay restrictions');
  });

  it('CompactMusicPlayer provides animated wave bars, volume slider, and unblock button', () => {
    const compactPlayer = fs.readFileSync(path.join(srcPath, 'components', 'music', 'CompactMusicPlayer.tsx'), 'utf-8');

    assert.ok(compactPlayer.includes('isAutoplayBlocked'), 'Must handle autoplay blocked state');
    assert.ok(compactPlayer.includes('Enable peaceful music'), 'Must show Enable peaceful music button');
    assert.ok(compactPlayer.includes('animate-bounce'), 'Must display animated sound wave bars');
    assert.ok(compactPlayer.includes('toggleMute'), 'Must provide mute toggle');
  });

  it('RealWorldDatasetScreen displays the mandatory governance notice and 5 analysis tabs', () => {
    const analyzerScreen = fs.readFileSync(path.join(srcPath, 'pages', 'RealWorldDatasetScreen.tsx'), 'utf-8');

    // Governance banner
    assert.ok(
      analyzerScreen.includes('163-RECORD MANUALLY COLLECTED STUDENT DATASET — PROVENANCE AND CONSENT UNVERIFIED. RESEARCH USE ONLY.'),
      'Must display exact mandatory governance notice'
    );
    assert.ok(analyzerScreen.includes('STRICT RESEARCH ISOLATION'), 'Must display research isolation badge');

    // 5 Analysis Tabs
    assert.ok(analyzerScreen.includes('1. Dataset Overview & Distributions'), 'Must have Tab 1');
    assert.ok(analyzerScreen.includes('2. Exploratory Bivariate Associations'), 'Must have Tab 2');
    assert.ok(analyzerScreen.includes('3. Target Variable Handling'), 'Must have Tab 3');
    assert.ok(analyzerScreen.includes('4. Research Model Laboratory'), 'Must have Tab 4');
    assert.ok(analyzerScreen.includes('5. Reports & Exports'), 'Must have Tab 5');

    // Non-causal disclosures & Chi-Square checks
    assert.ok(analyzerScreen.includes("Cramér's V"), "Must compute Cramér's V effect size");
    assert.ok(analyzerScreen.includes('Non-Causal Disclosure'), 'Must provide non-causal disclosure');
    assert.ok(analyzerScreen.includes('CompactMusicPlayer'), 'Must embed CompactMusicPlayer');
  });

  it('Audio assets are present in public/audio and properly documented in LICENSE.md', () => {
    const audioDir = path.join(publicPath, 'audio');
    assert.ok(fs.existsSync(audioDir), 'public/audio directory must exist');

    const expectedAudioFiles = [
      'peaceful_instrumental.wav',
      'soft_piano.wav',
      'nature_sounds.wav',
      'rain_ambience.wav',
      'ocean_waves.wav',
      'gentle_meditation.wav',
      'LICENSE.md'
    ];

    for (const f of expectedAudioFiles) {
      assert.ok(fs.existsSync(path.join(audioDir, f)), `Expected audio asset '${f}' to exist`);
    }

    const licenseContent = fs.readFileSync(path.join(audioDir, 'LICENSE.md'), 'utf-8');
    assert.ok(licenseContent.includes('MINDORA 2.0 — AMBIENT AUDIO ASSETS LICENSE DOCUMENTATION'), 'LICENSE.md must have valid header');
    assert.ok(licenseContent.includes('royalty-free'), 'LICENSE.md must state royalty-free status');
  });
});
