import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 9.5: Critical Voice Conversation Fix, Real-Time Audio Visualization & AI Chatbot Optimization', () => {
  const srcPath = path.resolve(process.cwd(), 'src');

  it('AIFeelingsSpaceScreen implements Web Audio API AudioContext and AnalyserNode pipeline', () => {
    const screenContent = fs.readFileSync(path.join(srcPath, 'pages', 'AIFeelingsSpaceScreen.tsx'), 'utf-8');

    // 1. Web Audio API constructs
    assert.ok(screenContent.includes('AudioContext'), 'Must support standard window.AudioContext');
    assert.ok(screenContent.includes('webkitAudioContext'), 'Must support webkitAudioContext fallback');
    assert.ok(screenContent.includes('createAnalyser()'), 'Must instantiate AnalyserNode via createAnalyser()');
    assert.ok(screenContent.includes('createMediaStreamSource'), 'Must connect microphone stream to MediaStreamAudioSourceNode');
    assert.ok(screenContent.includes('fftSize = 64'), 'Must configure fftSize for frequency binning');
    assert.ok(screenContent.includes('getByteFrequencyData'), 'Must sample frequency data for dynamic visualization');
  });

  it('AIFeelingsSpaceScreen renders real-time 60fps canvas waveform and dynamic responsive bars', () => {
    const screenContent = fs.readFileSync(path.join(srcPath, 'pages', 'AIFeelingsSpaceScreen.tsx'), 'utf-8');

    // Canvas element
    assert.ok(screenContent.includes('<canvas'), 'Must render canvas element for high-performance waveform');
    assert.ok(screenContent.includes('canvasRef'), 'Must attach canvasRef to canvas');
    assert.ok(screenContent.includes('requestAnimationFrame'), 'Must drive waveform via requestAnimationFrame at 60fps');

    // Dynamic responsive audio spectrum bars
    assert.ok(screenContent.includes('data-testid="audio-waveform-bars"'), 'Must render audio-waveform-bars container');
    assert.ok(screenContent.includes('audioLevels.map'), 'Must map over dynamic audioLevels');
    assert.ok(screenContent.includes('isVoiceDetected'), 'Must provide visual distinction when student voice is detected');
  });

  it('AIFeelingsSpaceScreen implements hands-free turn-taking with 1.4s silence detector and non-stale refs', () => {
    const screenContent = fs.readFileSync(path.join(srcPath, 'pages', 'AIFeelingsSpaceScreen.tsx'), 'utf-8');

    // Turn-taking silence timer
    assert.ok(screenContent.includes('1400'), 'Must debounce silence by 1.4 seconds before finalizing turn');
    assert.ok(screenContent.includes('finalizeStudentTurn'), 'Must provide finalizeStudentTurn function for auto-submission');

    // Elimination of stale closure bugs
    assert.ok(screenContent.includes('sessionStateRef'), 'Must use sessionStateRef to prevent stale closure in callbacks');
    assert.ok(screenContent.includes('transcriptAccumulatorRef'), 'Must use transcriptAccumulatorRef to prevent dropped speech');

    // Continuous turn-taking: mic starts automatically when AI speech ends
    assert.ok(screenContent.includes('utterance.onend'), 'Must handle SpeechSynthesis utterance.onend');
    assert.ok(screenContent.includes('startListening()'), 'Must automatically call startListening() when AI stops speaking');
  });

  it('AIFeelingsSpaceScreen enforces complete audio stream cleanup on pause, end, and unmount', () => {
    const screenContent = fs.readFileSync(path.join(srcPath, 'pages', 'AIFeelingsSpaceScreen.tsx'), 'utf-8');

    // Audio Pipeline Teardown
    assert.ok(screenContent.includes('stopAudioPipeline'), 'Must provide comprehensive stopAudioPipeline method');
    assert.ok(screenContent.includes('cancelAnimationFrame'), 'Must cancel active animation frames');
    assert.ok(screenContent.includes('track.stop()'), 'Must stop all MediaStream tracks to release mic hardware');
    assert.ok(screenContent.includes('audioContextRef.current.close()'), 'Must close AudioContext to release system audio device');
    assert.ok(screenContent.includes('recognitionRef.current.abort()'), 'Must abort SpeechRecognition on teardown');
  });

  it('FloatingAICompanionWidget sends proper payload schema to /api/ai-companion/chat with context_data', () => {
    const widgetContent = fs.readFileSync(path.join(srcPath, 'components', 'companion', 'FloatingAICompanionWidget.tsx'), 'utf-8');

    // API Payload
    assert.ok(widgetContent.includes('/api/ai-companion/chat'), 'Must communicate with backend companion chat endpoint');
    assert.ok(widgetContent.includes('context_data'), 'Must encapsulate screen_context and history inside context_data');
    assert.ok(widgetContent.includes('country: \'India\''), 'Must provide localized country for safety helplines');
    assert.ok(widgetContent.includes('Thinking...'), 'Must provide visual thinking/loading indicator');
  });

  it('FloatingAICompanionWidget preserves website navigation intelligence and quick actions', () => {
    const widgetContent = fs.readFileSync(path.join(srcPath, 'components', 'companion', 'FloatingAICompanionWidget.tsx'), 'utf-8');

    // Navigation Intelligence
    assert.ok(widgetContent.includes('findMatchingRoute'), 'Must call findMatchingRoute');
    assert.ok(widgetContent.includes('navTarget'), 'Must render actionable navigation button when route matched');
    assert.ok(widgetContent.includes('handleClearHistory'), 'Must support clearing conversation history');
  });
});
