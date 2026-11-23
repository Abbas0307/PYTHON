/**
 * src/contracts/privacyInventoryContract.ts
 * Mindora 2.0 — Phase 5.12: Central Privacy & Data Inventory Contracts.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - Complete Transparency: Clear mapping of what Mindora stores and where.
 *   - True Storage Accountability: Explicitly documents encryption, location, and persistence.
 *   - Controlled Erasure: Destructive actions require explicit confirmation.
 *   - Cryptographic Protection: The encrypted vault cannot be silently wiped or downgraded.
 */

export type StorageLocationType =
  | 'localStorage'
  | 'sessionStorage'
  | 'indexedDB'
  | 'volatile_memory'
  | 'local_companion';

export type PersistenceType =
  | 'persistent'
  | 'temporary'
  | 'ephemeral';

export interface DataCategoryInventory {
  id: string;
  title: string;
  shortLabel: string;
  dataStoredDescription: string;
  storageLocation: StorageLocationType;
  storageLocationLabel: string;
  persistence: PersistenceType;
  persistenceLabel: string;
  isEncrypted: boolean;
  encryptionMethod?: string;
  deletionProcedure: string;
  isReversible: boolean;
  itemCount: number;
  clearActionLabel?: string;
  clearSupported: boolean;
  sourceFeature: string;
}

export interface PrivacyDeletionResult {
  success: boolean;
  category: string;
  itemsDeleted: number;
  message: string;
  timestamp: string;
}

export type DeletionTarget =
  | 'preferences'
  | 'timeline'
  | 'planner'
  | 'trends_vault'
  | 'all_eligible';
