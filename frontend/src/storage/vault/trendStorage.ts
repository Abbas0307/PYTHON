/**
 * src/storage/vault/trendStorage.ts
 * Trend Storage Manager (Dual Mode: In-Memory Transient vs. Encrypted Local Vault).
 * 
 * Invariants:
 *   - Defaults to 'in-memory' (zero persistence on disk).
 *   - Persistent mode is strictly opt-in and requires student-chosen passphrase.
 *   - Plaintext is never written to disk or browser storage engines.
 *   - Purge permanently drops all IndexedDB databases and clears memory.
 */

import type {
  WeeklyCheckIn
} from '../../contracts/trendsContract.ts';
import {
  validateWeeklyCheckInInput
} from '../../contracts/trendsContract.ts';
import type {
  VaultStorageRecord
} from './encryptedVault.ts';
import {
  encryptVaultPayload,
  decryptVaultPayload,
  persistEncryptedRecord,
  retrieveEncryptedRecord,
  deleteEncryptedVault,
  hasEncryptedVaultRecord,
  formatEncryptedExport,
  DEFAULT_PBKDF2_ITERATIONS
} from './encryptedVault.ts';

export type StorageMode = 'in-memory' | 'encrypted-vault';

export interface StorageStatus {
  mode: StorageMode;
  isVaultLocked: boolean;
  hasPersistentRecord: boolean;
  recordCount: number;
}

// Volatile in-memory state
let inMemoryCheckIns: WeeklyCheckIn[] = [];
let activeStorageMode: StorageMode = 'in-memory';
let cachedPassphrase: string | null = null;
let cachedIterations: number | null = null;

export const trendStorage = {
  /**
   * Initializes and detects storage state.
   */
  async getStatus(): Promise<StorageStatus> {
    const hasRecord = await hasEncryptedVaultRecord();
    return {
      mode: activeStorageMode,
      isVaultLocked: activeStorageMode === 'encrypted-vault' && cachedPassphrase === null,
      hasPersistentRecord: hasRecord,
      recordCount: inMemoryCheckIns.length
    };
  },

  /**
   * Returns current active check-ins.
   */
  getCheckIns(): WeeklyCheckIn[] {
    return [...inMemoryCheckIns];
  },

  /**
   * Directly sets the in-memory check-ins (useful for preview mode or initial hydration).
   */
  setInMemoryCheckIns(checkIns: WeeklyCheckIn[]): void {
    inMemoryCheckIns = [...checkIns];
  },

  /**
   * Adds or updates a weekly check-in.
   * If a check-in for the same week already exists, it is replaced with the updated ratings.
   */
  async saveCheckIn(rawCheckIn: any): Promise<WeeklyCheckIn> {
    const validation = validateWeeklyCheckInInput(rawCheckIn);
    if (!validation.isValid || !validation.sanitized) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const checkIn = validation.sanitized;
    const existingIndex = inMemoryCheckIns.findIndex((c) => c.weekIdentifier === checkIn.weekIdentifier);

    if (existingIndex >= 0) {
      // Update existing record for the week
      inMemoryCheckIns[existingIndex] = checkIn;
    } else {
      // Append new weekly check-in
      inMemoryCheckIns.push(checkIn);
    }

    // If encrypted vault mode is active, persist encrypted blob
    if (activeStorageMode === 'encrypted-vault') {
      if (!cachedPassphrase) {
        throw new Error('Encrypted vault is locked. Please unlock the vault before saving.');
      }
      await this.persistToVault(cachedPassphrase);
    }

    return checkIn;
  },

  /**
   * Deletes a check-in by its ID.
   */
  async deleteCheckIn(id: string): Promise<boolean> {
    const initialLen = inMemoryCheckIns.length;
    inMemoryCheckIns = inMemoryCheckIns.filter((c) => c.id !== id);
    const removed = inMemoryCheckIns.length < initialLen;

    if (removed && activeStorageMode === 'encrypted-vault' && cachedPassphrase) {
      await this.persistToVault(cachedPassphrase);
    }

    return removed;
  },

  /**
   * Permanently clears all trend records from memory and completely wipes the encrypted IndexedDB vault.
   */
  async clearAllData(): Promise<void> {
    inMemoryCheckIns = [];
    cachedPassphrase = null;
    cachedIterations = null;
    activeStorageMode = 'in-memory';
    await deleteEncryptedVault();
  },

  /**
   * Activates the Encrypted Local Vault with a user passphrase.
   * Encrypts any current in-memory check-ins and saves to IndexedDB.
   */
  async enableEncryptedVault(passphrase: string): Promise<void> {
    if (!passphrase || passphrase.length < 6) {
      throw new Error('Passphrase must be at least 6 characters long.');
    }

    cachedPassphrase = passphrase;
    cachedIterations = DEFAULT_PBKDF2_ITERATIONS;
    activeStorageMode = 'encrypted-vault';
    await this.persistToVault(passphrase);
  },

  /**
   * Switches to In-Memory Session mode.
   * Retains current records in memory, but deletes the persistent IndexedDB vault.
   */
  async disableEncryptedVault(): Promise<void> {
    cachedPassphrase = null;
    cachedIterations = null;
    activeStorageMode = 'in-memory';
    await deleteEncryptedVault();
  },

  /**
   * Unlocks an existing Encrypted Local Vault from IndexedDB using the provided passphrase.
   */
  async unlockVault(passphrase: string): Promise<WeeklyCheckIn[]> {
    const record = await retrieveEncryptedRecord();
    if (!record) {
      throw new Error('No encrypted vault found in local storage.');
    }

    const decryptedJson = await decryptVaultPayload(record, passphrase);
    const parsed = JSON.parse(decryptedJson);

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid vault content structure: expected an array of check-ins.');
    }

    // Validate each record
    const validCheckIns: WeeklyCheckIn[] = [];
    for (const item of parsed) {
      const v = validateWeeklyCheckInInput(item);
      if (v.isValid && v.sanitized) {
        validCheckIns.push(v.sanitized);
      }
    }

    inMemoryCheckIns = validCheckIns;
    cachedPassphrase = passphrase;
    cachedIterations = record.iterations;
    activeStorageMode = 'encrypted-vault';

    return inMemoryCheckIns;
  },

  /**
   * Locks the encrypted vault, clearing decrypted records and passphrase from active memory.
   */
  lockVault(): void {
    inMemoryCheckIns = [];
    cachedPassphrase = null;
    cachedIterations = null;
  },

  /**
   * Internal helper: encrypts in-memory check-ins and writes to IndexedDB.
   * Preserves existing vault's iteration count or uses default 600,000 for new vaults.
   */
  async persistToVault(passphrase: string): Promise<VaultStorageRecord> {
    const plaintextJson = JSON.stringify(inMemoryCheckIns);
    const iterations = cachedIterations ?? DEFAULT_PBKDF2_ITERATIONS;
    const encryptedRecord = await encryptVaultPayload(plaintextJson, passphrase, iterations);
    await persistEncryptedRecord(encryptedRecord);
    return encryptedRecord;
  },

  /**
   * Exports data in either JSON or authenticated .enc container format.
   */
  async exportData(format: 'json' | 'enc'): Promise<{ filename: string; content: string; mimeType: string }> {
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const jsonContent = JSON.stringify(inMemoryCheckIns, null, 2);
      return {
        filename: `mindora_wellbeing_trends_${dateStr}.json`,
        content: jsonContent,
        mimeType: 'application/json'
      };
    } else {
      let record: VaultStorageRecord | null = null;
      if (activeStorageMode === 'encrypted-vault' && cachedPassphrase) {
        record = await this.persistToVault(cachedPassphrase);
      } else {
        throw new Error('Encrypted export requires an active unlocked vault.');
      }

      const encFile = formatEncryptedExport(record);
      return {
        filename: `mindora_vault_backup_${dateStr}.enc`,
        content: JSON.stringify(encFile, null, 2),
        mimeType: 'application/json'
      };
    }
  }
};
