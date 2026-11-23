import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 8.5 — Motorcycle-Style Analog Stress Meter Gauge Verification', () => {
  const srcPath = path.resolve(process.cwd(), 'src');

  it('MotorcycleStressGauge component file exists and exports MotorcycleStressGauge', () => {
    const gaugePath = path.join(srcPath, 'components', 'dashboard', 'MotorcycleStressGauge.tsx');
    assert.ok(fs.existsSync(gaugePath), 'MotorcycleStressGauge.tsx must exist');
    const content = fs.readFileSync(gaugePath, 'utf-8');
    assert.ok(content.includes('export const MotorcycleStressGauge'), 'Must export MotorcycleStressGauge component');
  });

  it('Dial geometry conforms to 240-degree circular motorcycle speedometer layout', () => {
    const content = fs.readFileSync(path.join(srcPath, 'components', 'dashboard', 'MotorcycleStressGauge.tsx'), 'utf-8');

    // Sweep geometry: -120° to +120° (240° total)
    assert.ok(content.includes('START_ANGLE = -120'), 'Must define START_ANGLE at -120 degrees');
    assert.ok(content.includes('SWEEP_ANGLE = 240'), 'Must define SWEEP_ANGLE at 240 degrees');
    
    // Scale strictly 0 to 100
    assert.ok(content.includes('Math.max(0, Math.min(100, val))'), 'Must clamp values strictly between 0 and 100');
    assert.ok(content.includes('START_ANGLE + (clamped / 100) * SWEEP_ANGLE'), 'Must calculate clockwise rotation from 0 to 100');
  });

  it('Speedometer dial contains major numerical labels 0, 20, 40, 60, 80, 100 and radial ticks', () => {
    const content = fs.readFileSync(path.join(srcPath, 'components', 'dashboard', 'MotorcycleStressGauge.tsx'), 'utf-8');

    // Major numerical values
    assert.ok(content.includes('[0, 20, 40, 60, 80, 100]'), 'Must display major labels 0, 20, 40, 60, 80, 100');
    
    // Radial tick marks (major and minor)
    assert.ok(content.includes('ticks'), 'Must compute radial ticks');
    assert.ok(content.includes('isMajor'), 'Must differentiate major and minor tick marks');
    assert.ok(content.includes('TOTAL_STEPS = 50'), 'Must generate high-density radial speedometer ticks');
  });

  it('Displays STRESS LEVEL label and digital readout inside the gauge', () => {
    const content = fs.readFileSync(path.join(srcPath, 'components', 'dashboard', 'MotorcycleStressGauge.tsx'), 'utf-8');

    assert.ok(content.includes('STRESS LEVEL'), 'Must include prominent STRESS LEVEL label');
    assert.ok(content.includes('displayValue'), 'Must render digital readout');
    assert.ok(content.includes("displayValue = isUnassessed ? '--' : Math.round(activeValue)"), 'Must use -- for unassessed state instead of fake zero');
  });

  it('Strictly prohibits rolling odometer digits and maintains analog speedometer needle', () => {
    const content = fs.readFileSync(path.join(srcPath, 'components', 'dashboard', 'MotorcycleStressGauge.tsx'), 'utf-8');

    // No odometer or rolling digit libraries
    assert.ok(!content.includes('odometer'), 'Must NOT use odometer mechanism');
    assert.ok(!content.includes('flip-counter'), 'Must NOT use flip counter digits');
    assert.ok(!content.includes('rolling-digit'), 'Must NOT use rolling digit mechanism');

    // Real rotating needle
    assert.ok(content.includes('id="motorcycle-needle"'), 'Must render rotating motorcycle needle');
    assert.ok(content.includes('needleBodyGrad'), 'Must use sports needle styling');
    assert.ok(content.includes('prefersReducedMotion'), 'Must respect prefers-reduced-motion accessibility preference');
  });

  it('Includes QA speedometer verification controls tray with required test matrix and transitions', () => {
    const content = fs.readFileSync(path.join(srcPath, 'components', 'dashboard', 'MotorcycleStressGauge.tsx'), 'utf-8');

    // Test matrix values
    const testMatrix = [0, 10, 25, 40, 60, 74, 75, 90, 100];
    for (const val of testMatrix) {
      assert.ok(content.includes(String(val)), `Testing tray must support test score ${val}`);
    }

    // Required transition sequences
    assert.ok(content.includes('74 → 75'), 'Must include 74 -> 75 transition test');
    assert.ok(content.includes('75 → 90'), 'Must include 75 -> 90 transition test');
    assert.ok(content.includes('90 → 40'), 'Must include 90 -> 40 transition test');
  });

  it('Integrated into DashboardScreen.tsx replacing previous vitality indicator', () => {
    const dashboardContent = fs.readFileSync(path.join(srcPath, 'pages', 'DashboardScreen.tsx'), 'utf-8');

    assert.ok(dashboardContent.includes("import { MotorcycleStressGauge } from '../components/dashboard/MotorcycleStressGauge'"), 'DashboardScreen must import MotorcycleStressGauge');
    assert.ok(dashboardContent.includes('<MotorcycleStressGauge'), 'DashboardScreen must render MotorcycleStressGauge');
    assert.ok(dashboardContent.includes("navigateTo('assessment')"), 'DashboardScreen must provide assessment navigation callback');
  });

  it('Integrated into WellbeingScreen.tsx as the primary hero element', () => {
    const wellbeingContent = fs.readFileSync(path.join(srcPath, 'pages', 'WellbeingScreen.tsx'), 'utf-8');

    assert.ok(wellbeingContent.includes("import { MotorcycleStressGauge } from '../components/dashboard/MotorcycleStressGauge'"), 'WellbeingScreen must import MotorcycleStressGauge');
    assert.ok(wellbeingContent.includes('<MotorcycleStressGauge'), 'WellbeingScreen must render MotorcycleStressGauge');
    assert.ok(wellbeingContent.includes("onNavigate('assessment')"), 'WellbeingScreen must provide assessment navigation callback');
    assert.ok(wellbeingContent.includes('Primary Stress Speedometer'), 'WellbeingScreen must label gauge as Primary Stress Speedometer');
  });
});
