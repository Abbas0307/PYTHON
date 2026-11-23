/**
 * src/engines/privacyInventoryEngine.ts
 * Mindora 2.0 — Phase 5.12: Central Privacy & Data Inventory Engine.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - Honest Storage Disclosure: Accurately reflects where student data resides.
 *   - Controlled Erasure: Destructive actions strictly affect intended targets.
 *   - Vault Protection: Does not silently delete or downgrade the 600k PBKDF2 vault.
 *   - Verified Network Transparency: Accurately explains client-side execution.
 */

import type {
  DataCategoryInventory,
  PrivacyDeletionResult
} from '../contracts/privacyInventoryContract.ts';
import { personalizationStorage } from '../storage/personalizationStorage.ts';
import { trendStorage } from '../storage/vault/trendStorage.ts';
import { plannerStorage } from '../storage/vault/plannerStorage.ts';
import { wellnessStore } from './wellnessEngine.ts';

/**
 * Returns current data category inventories across all Mindora 2.0 subsystems.
 */
export async function getPrivacyInventory(): Promise<DataCategoryInventory[]> {
  // 1. Personalization state count
  const pState = personalizationStorage.getState();
  const goalsCount = pState.goals.length;

  // 2. Trend vault status
  const trendStatus = await trendStorage.getStatus();
  const trendCount = trendStorage.getCheckIns().length;

  // 3. Planner items
  const plannerHistory = plannerStorage.getCompletedHistory().length;

  // 4. Daily check-in history
  const checkInCount = personalizationStorage.getCheckInHistory().length;

  // 5. Wellness completed sessions
  const wellnessCount = wellnessStore.getCompletedSessions().length;

  const categories: DataCategoryInventory[] = [
    {
      id: 'preferences',
      title: 'A. Personalization & Layout Preferences',
      shortLabel: 'Preferences',
      dataStoredDescription: 'Dashboard section order, text scaling, contrast theme, and student-selected wellbeing focus goals.',
      storageLocation: 'localStorage',
      storageLocationLabel: 'Browser Local Storage (mindora_personalization_prefs)',
      persistence: 'persistent',
      persistenceLabel: 'Persistent across browser restarts on this device',
      isEncrypted: false,
      encryptionMethod: 'Plaintext JSON (Non-sensitive UI preferences only)',
      deletionProcedure: 'Purges localStorage key and resets dashboard layout, goals, and sensory settings to initial defaults.',
      isReversible: false,
      itemCount: goalsCount,
      clearActionLabel: 'Reset Preferences',
      clearSupported: true,
      sourceFeature: 'Dashboard & Accessibility Settings'
    },
    {
      id: 'trends_vault',
      title: 'B. Weekly Wellbeing Trends',
      shortLabel: 'Trends Vault',
      dataStoredDescription: 'Longitudinal self-reported routine ratings (sleep, academic pressure, study satisfaction, energy, routine balance).',
      storageLocation: trendStatus.mode === 'encrypted-vault' ? 'indexedDB' : 'volatile_memory',
      storageLocationLabel: trendStatus.mode === 'encrypted-vault'
        ? 'Encrypted Browser IndexedDB (MindoraEncryptedVaultDB)'
        : 'In-Memory Volatile Session (No disk storage)',
      persistence: trendStatus.mode === 'encrypted-vault' ? 'persistent' : 'temporary',
      persistenceLabel: trendStatus.mode === 'encrypted-vault'
        ? 'Persistent encrypted container unlocked via passphrase'
        : 'Temporary session memory (vanishes on tab close)',
      isEncrypted: trendStatus.mode === 'encrypted-vault',
      encryptionMethod: trendStatus.mode === 'encrypted-vault'
        ? 'AES-256-GCM with 600,000 PBKDF2 iterations & 96-bit random IV'
        : 'None (Held purely in client RAM)',
      deletionProcedure: 'Permanently deletes IndexedDB database records and drops encryption keys from memory.',
      isReversible: false,
      itemCount: trendCount,
      clearActionLabel: 'Delete Encrypted Vault',
      clearSupported: true,
      sourceFeature: 'Weekly Wellbeing Trends'
    },
    {
      id: 'planner',
      title: 'C. Smart Action Planner',
      shortLabel: 'Action Planner',
      dataStoredDescription: 'Today’s recommended and customized micro-steps, preferred daily count, and completed action history.',
      storageLocation: 'volatile_memory',
      storageLocationLabel: 'Client-Side Runtime Memory (Volatile Store)',
      persistence: 'temporary',
      persistenceLabel: 'Temporary session memory (can be exported as portable JSON)',
      isEncrypted: false,
      encryptionMethod: 'In-Memory State Only',
      deletionProcedure: 'Wipes current daily task checklist and purges completed action history.',
      isReversible: false,
      itemCount: plannerHistory,
      clearActionLabel: 'Clear Planner Data',
      clearSupported: true,
      sourceFeature: 'Smart Action Planner'
    },
    {
      id: 'daily_checkin',
      title: 'D. Daily Student Check-Ins',
      shortLabel: 'Daily Check-In',
      dataStoredDescription: 'Self-reported day pace (1–5), energy level, study breaks taken, tomorrow’s focus, and optional private reflection notes.',
      storageLocation: 'volatile_memory',
      storageLocationLabel: 'Ephemeral Component & Session Memory',
      persistence: 'ephemeral',
      persistenceLabel: 'Ephemeral (Private reflection notes vanish immediately on tab/window close)',
      isEncrypted: false,
      encryptionMethod: 'Volatile In-Memory Only (Zero disk persistence)',
      deletionProcedure: 'Private reflection notes automatically vanish upon closing the window or resetting session memory.',
      isReversible: false,
      itemCount: checkInCount,
      clearActionLabel: 'Purge Daily Reflections',
      clearSupported: true,
      sourceFeature: 'Daily Student Check-In'
    },
    {
      id: 'wellness_studio',
      title: 'E. Interactive Wellness Studio',
      shortLabel: 'Wellness Studio',
      dataStoredDescription: 'Completed breathing exercises, 5-4-3-2-1 grounding walks, Pomodoro focus sprints, and PMR sessions.',
      storageLocation: 'volatile_memory',
      storageLocationLabel: 'Volatile In-Memory Session Store',
      persistence: 'temporary',
      persistenceLabel: 'Temporary session memory (cleared on page reload)',
      isEncrypted: false,
      encryptionMethod: 'Volatile In-Memory Only',
      deletionProcedure: 'Clears completed session counters and restores interactive exercises to starting state.',
      isReversible: false,
      itemCount: wellnessCount,
      clearActionLabel: 'Clear Wellness History',
      clearSupported: true,
      sourceFeature: 'Mindora Wellness Studio'
    },
    {
      id: 'network_ai',
      title: 'F. Network, PWA & Local AI Companion',
      shortLabel: 'Network & AI',
      dataStoredDescription: 'Static offline application shell cache (HTML/JS/CSS). Zero student assessment or clinical data is ever cached.',
      storageLocation: 'local_companion',
      storageLocationLabel: 'Local PWA Service Worker Cache & Local Loopback (127.0.0.1:8000)',
      persistence: 'persistent',
      persistenceLabel: 'App shell cached offline; optional local companion runs purely on student localhost',
      isEncrypted: false,
      encryptionMethod: 'Standard HTTP Localhost (Loopback only, zero remote transmission)',
      deletionProcedure: 'Service worker unregistration and browser cache clear via browser settings.',
      isReversible: false,
      itemCount: 1,
      clearActionLabel: 'Inspect Network Architecture',
      clearSupported: false,
      sourceFeature: 'PWA Application Shell & Local Companion'
    }
  ];

  return categories;
}

/**
 * Handles individual or combined safe data deletions.
 */
export async function executePrivacyDeletion(target: string): Promise<PrivacyDeletionResult> {
  const now = new Date().toISOString();

  if (target === 'preferences') {
    personalizationStorage.resetAllPersonalization();
    return {
      success: true,
      category: 'preferences',
      itemsDeleted: 1,
      message: 'Personalization preferences and saved goals have been reset to default values.',
      timestamp: now
    };
  }

  if (target === 'planner') {
    const count = plannerStorage.getCompletedHistory().length;
    plannerStorage.clearAllData();
    return {
      success: true,
      category: 'planner',
      itemsDeleted: count,
      message: `Cleared ${count} Smart Action Planner records from active memory.`,
      timestamp: now
    };
  }

  if (target === 'wellness_studio' || target === 'wellness') {
    const count = wellnessStore.getCompletedSessions().length;
    wellnessStore.clearSessionHistory();
    return {
      success: true,
      category: 'wellness_studio',
      itemsDeleted: count,
      message: `Cleared ${count} Wellness Studio session records.`,
      timestamp: now
    };
  }

  if (target === 'trends_vault') {
    const count = trendStorage.getCheckIns().length;
    await trendStorage.clearAllData();
    return {
      success: true,
      category: 'trends_vault',
      itemsDeleted: count,
      message: 'Weekly Trends encrypted IndexedDB vault completely wiped and memory cleared.',
      timestamp: now
    };
  }

  if (target === 'all_eligible') {
    // Purges preferences, planner, wellness, and in-memory check-ins without silently destroying Trends vault
    personalizationStorage.resetAllPersonalization();
    plannerStorage.clearAllData();
    wellnessStore.clearSessionHistory();
    return {
      success: true,
      category: 'all_eligible',
      itemsDeleted: 3,
      message: 'All eligible personal preferences, planner records, and wellness sessions have been wiped.',
      timestamp: now
    };
  }

  return {
    success: false,
    category: target,
    itemsDeleted: 0,
    message: `Unknown deletion target: ${target}`,
    timestamp: now
  };
}
