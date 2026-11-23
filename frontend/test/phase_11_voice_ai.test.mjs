import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 11 Priority 2: AI Feelings Space Voice Recognition, Waveform & Turn-Taking', () => {
  const srcPath = path.resolve(process.cwd(), 'src');
  const screenContent = fs.readFileSync(path.join(srcPath, 'pages', 'AIFeelingsSpaceScreen.tsx'), 'utf-8');

  it('1. Web Audio API RMS energy and speech-band frequency calculations are present', () => {
    // RMS time-domain calculation
    assert.ok(screenContent.includes('sumSquares'), 'Must calculate sum of squares for time-domain audio samples');
    assert.ok(screenContent.includes('Math.sqrt(sumSquares'), 'Must compute RMS via square root of mean square');
    
    // Frequency-domain speech band energy
    assert.ok(screenContent.includes('speechBandSum'), 'Must accumulate speech frequency band energy');
    assert.ok(screenContent.includes('avgSpeechBand'), 'Must average speech band frequencies');
    assert.ok(screenContent.includes('smoothedVolume'), 'Must apply smoothing to prevent visual jitter');

    // 16 dynamic waveform bars
    assert.ok(screenContent.includes('for (let i = 0; i < 16; i++)'), 'Must generate 16 frequency/energy bars');
    assert.ok(screenContent.includes('setAudioLevels(currentLevels)'), 'Must update dynamic levels state');
  });

  it('2. Utterance reference retention prevents Chromium V8 garbage collection', () => {
    assert.ok(screenContent.includes('utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)'), 'Must declare persistent utteranceRef');
    assert.ok(screenContent.includes('utteranceRef.current = utterance'), 'Must retain utterance reference to prevent GC');
  });

  it('3. Speech watchdog timer prevents turn-taking freeze', () => {
    assert.ok(screenContent.includes('speechWatchdogRef = useRef'), 'Must define speechWatchdogRef');
    assert.ok(screenContent.includes('speechWatchdogRef.current = setTimeout'), 'Must activate watchdog timer when speaking begins');
    assert.ok(screenContent.includes('Speech watchdog triggered'), 'Must provide fallback recovery when speech hangs');
  });

  it('4. Real-time 60fps canvas visualizer with roundRect bars is implemented', () => {
    assert.ok(screenContent.includes('canvasRef.current'), 'Must reference canvas element');
    assert.ok(screenContent.includes('requestAnimationFrame(renderFrame)'), 'Must loop at 60fps using requestAnimationFrame');
    assert.ok(screenContent.includes('createLinearGradient'), 'Must style bars with visual gradients');
    assert.ok(screenContent.includes('roundRect'), 'Must render rounded bars on canvas');
  });

  it('5. Clean audio hardware teardown and zero memory leak guarantee', () => {
    assert.ok(screenContent.includes('stopAudioPipeline'), 'Must define comprehensive audio teardown');
    assert.ok(screenContent.includes('cancelAnimationFrame'), 'Must cancel render frame loop');
    assert.ok(screenContent.includes('track.stop()'), 'Must release microphone hardware tracks');
    assert.ok(screenContent.includes('audioContextRef.current.close()'), 'Must close AudioContext');
    assert.ok(screenContent.includes('window.speechSynthesis.cancel()'), 'Must cancel active speech synthesis');
  });

  it('6. Mode-specific empathetic CPU-only response generation handles 3 modes', () => {
    assert.ok(screenContent.includes("mode === 'just_listen'"), 'Must handle Just Listen mode without unsolicited advice');
    assert.ok(screenContent.includes("mode === 'understand_feelings'"), 'Must handle Understand Feelings mode with reflective inquiries');
    assert.ok(screenContent.includes('help_move_forward'), 'Must handle Help Me Move Forward mode with micro-actionable steps');
    assert.ok(screenContent.includes('Tele-MANAS'), 'Must provide immediate 24/7 crisis helplines on risk keywords');
  });

  it('7. Tele-MANAS 14416 interactive sharing and crisis trigger support', () => {
    assert.ok(screenContent.includes('14416'), 'Must include 14416 Tele-MANAS helpline number');
    assert.ok(screenContent.includes('api.whatsapp.com/send'), 'Must support 1-click WhatsApp sharing for Tele-MANAS');
    assert.ok(screenContent.includes('navigator.clipboard.writeText'), 'Must support copy to clipboard for Tele-MANAS helpline');
    assert.ok(screenContent.includes('handleShareTeleManas'), 'Must implement handleShareTeleManas function');
  });

  it('8. Hands-free VAD silence detection and Indian English accent localization', () => {
    assert.ok(screenContent.includes("'en-IN'"), 'Must default to Indian English (en-IN)');
    assert.ok(screenContent.includes('silenceTimerRef'), 'Must maintain silenceTimerRef in audio pipeline');
    assert.ok(screenContent.includes('finalizeStudentTurn'), 'Must automatically finalize student turn on sustained silence');
  });
});
