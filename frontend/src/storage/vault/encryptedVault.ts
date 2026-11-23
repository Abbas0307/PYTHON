/**
 * src/storage/vault/encryptedVault.ts
 * Web Crypto AES-256-GCM Encrypted Local Vault.
 * 
 * Implements the architecture specified in docs/privacy/LOCAL_VAULT_THREAT_MODEL.md:
 *   - Key Derivation: PBKDF2 (HMAC-SHA-256, 600,000 iterations default, 16-byte random salt)
 *   - Cipher: AES-256-GCM (128-bit authentication tag)
 *   - Nonce/IV: Fresh 96-bit (12-byte) random IV per write operation (zero nonce reuse)
 *   - Persistent Storage: IndexedDB (database: "mindora_vault_db", store: "vault_store")
 *   - In-Memory Non-Extractable Key (extractable = false)
 * 
 * MANDATORY PRIVACY & SECURITY BOUNDARIES:
 *   - Passphrase and plaintext records are NEVER written to IndexedDB, localStorage, or sessionStorage.
 *   - Any tampering or incorrect passphrase triggers immediate AES-GCM tag verification failure.
 *   - SECURITY DISCLAIMER: Browser-side encryption operates within the host OS and browser sandbox;
 *     it does NOT protect against active keyloggers, host malware, or cross-site scripting (XSS),
 *     and does not guarantee immediate garbage-collection memory zeroization in JavaScript runtimes.
 */

export interface VaultStorageRecord {
  id: string; // e.g. "trends_vault_v1"
  version: number; // 1
  kdf: 'PBKDF2_SHA256';
  iterations: number; // 600000 default (supports >= 10000 legacy records)
  saltHex: string; // 16 bytes (32 hex chars)
  ivHex: string; // 12 bytes (24 hex chars)
  ciphertextHex: string; // encrypted data + 16-byte tag
  updatedAt: string; // ISO date string
}

export interface EncryptedExportFile {
  magic: 'MINDORA_VAULT_V1';
  kdf: 'PBKDF2_SHA256';
  iterations: number;
  salt_hex: string;
  iv_hex: string;
  ciphertext_hex: string;
  exported_at: string;
  version: number;
}

const DB_NAME = 'mindora_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'vault_store';
const RECORD_ID = 'trends_vault_v1';

export const DEFAULT_PBKDF2_ITERATIONS = 600000;
export const MIN_PBKDF2_ITERATIONS = 10000;
export const MAX_PBKDF2_ITERATIONS = 5000000;
export const PBKDF2_ITERATIONS = DEFAULT_PBKDF2_ITERATIONS;

/**
 * Validates PBKDF2 iteration count.
 * Rejects missing, non-integer, negative, zero, below-minimum, or excessively high iteration counts.
 */
export function validateIterationCount(iterations: unknown): number {
  if (iterations === undefined || iterations === null) {
    throw new Error('Invalid vault record: missing iteration count.');
  }
  if (typeof iterations !== 'number' || !Number.isInteger(iterations) || isNaN(iterations)) {
    throw new Error(`Invalid vault record: iteration count must be a valid integer. Received: ${iterations}`);
  }
  if (iterations <= 0) {
    throw new Error(`Invalid vault record: iteration count must be greater than zero. Received: ${iterations}`);
  }
  if (iterations < MIN_PBKDF2_ITERATIONS) {
    throw new Error(
      `Unsupported iteration count (${iterations}): must be at least ${MIN_PBKDF2_ITERATIONS.toLocaleString()} iterations.`
    );
  }
  if (iterations > MAX_PBKDF2_ITERATIONS) {
    throw new Error(
      `Excessive iteration count (${iterations}): exceeds safe threshold of ${MAX_PBKDF2_ITERATIONS.toLocaleString()} iterations.`
    );
  }
  return iterations;
}

// Hex conversion utilities
function buf2hex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hex2buf(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hexadecimal string: length must be even');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derives a non-extractable 256-bit AES-GCM CryptoKey from a passphrase and salt.
 * Accepts parameterized iterations (defaulting to DEFAULT_PBKDF2_ITERATIONS = 600,000).
 */
export async function deriveVaultKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  validateIterationCount(iterations);

  const enc = new TextEncoder();
  const passphraseKeyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    passphraseKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable: key bytes cannot be read via JavaScript inspection
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext JSON string using AES-256-GCM with fresh salt and fresh 96-bit IV.
 * Defaults to 600,000 iterations for new vaults.
 */
export async function encryptVaultPayload(
  plaintext: string,
  passphrase: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<VaultStorageRecord> {
  if (!passphrase || passphrase.length < 6) {
    throw new Error('Passphrase must be at least 6 characters long.');
  }

  validateIterationCount(iterations);

  // Generate fresh 16-byte random salt
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  // Generate fresh 12-byte (96-bit) random IV per AES-GCM specification
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // Derive key with specified iterations (defaults to 600,000)
  const key = await deriveVaultKey(passphrase, salt, iterations);

  // Encrypt plaintext
  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(plaintext);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128 // 128-bit authentication tag
    },
    key,
    plaintextBytes
  );

  return {
    id: RECORD_ID,
    version: 1,
    kdf: 'PBKDF2_SHA256',
    iterations,
    saltHex: buf2hex(salt),
    ivHex: buf2hex(iv),
    ciphertextHex: buf2hex(ciphertextBuffer),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Decrypts a vault storage record with the provided passphrase.
 * Reads and validates the iteration count stored in the record before invoking Web Crypto.
 * Fails immediately if the passphrase is wrong, iterations are invalid, or ciphertext has been altered.
 */
export async function decryptVaultPayload(
  record: VaultStorageRecord,
  passphrase: string
): Promise<string> {
  if (!passphrase) {
    throw new Error('Passphrase is required to unlock the encrypted vault.');
  }
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid vault record: payload must be an object.');
  }

  // Validate iteration count stored in the record before calling Web Crypto
  validateIterationCount(record.iterations);

  // Validate structural field types and lengths
  if (!record.saltHex || typeof record.saltHex !== 'string' || record.saltHex.length !== 32) {
    throw new Error('Invalid vault record: saltHex must be a 32-character hex string (16 bytes).');
  }
  if (!record.ivHex || typeof record.ivHex !== 'string' || record.ivHex.length !== 24) {
    throw new Error('Invalid vault record: ivHex must be a 24-character hex string (12 bytes).');
  }
  if (!record.ciphertextHex || typeof record.ciphertextHex !== 'string' || record.ciphertextHex.length === 0) {
    throw new Error('Invalid vault record: ciphertextHex must be a non-empty hex string.');
  }

  const salt = hex2buf(record.saltHex);
  const iv = hex2buf(record.ivHex);
  const ciphertext = hex2buf(record.ciphertextHex);

  // Derive key using the exact stored iteration count (backward compatible with 100,000 iterations)
  const key = await deriveVaultKey(passphrase, salt, record.iterations);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('Incorrect passphrase or corrupted encrypted record. Decryption failed.');
  }
}

/**
 * IndexedDB Connection Helper.
 */
function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

/**
 * Saves the encrypted record into IndexedDB.
 * Plaintext is NEVER stored.
 */
export async function persistEncryptedRecord(record: VaultStorageRecord): Promise<void> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to save encrypted vault record.'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Retrieves the encrypted record from IndexedDB.
 */
export async function retrieveEncryptedRecord(): Promise<VaultStorageRecord | null> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(RECORD_ID);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error || new Error('Failed to read encrypted vault record.'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Checks if an encrypted vault record currently exists in IndexedDB.
 */
export async function hasEncryptedVaultRecord(): Promise<boolean> {
  try {
    const record = await retrieveEncryptedRecord();
    return record !== null;
  } catch {
    return false;
  }
}

/**
 * Permanently deletes the encrypted vault from IndexedDB.
 * Handles onblocked, onerror, and onsuccess accurately to avoid hanging promises.
 */
export async function deleteEncryptedVault(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      resolve();
      return;
    }

    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onblocked = () => {
      reject(
        new Error(
          'Database deletion blocked: another tab or connection is keeping the database open. Please close other Mindora tabs and try again.'
        )
      );
    };

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to delete encrypted vault database.'));
  });
}

/**
 * Packages an encrypted record into a portable .enc container for export.
 */
export function formatEncryptedExport(record: VaultStorageRecord): EncryptedExportFile {
  return {
    magic: 'MINDORA_VAULT_V1',
    kdf: 'PBKDF2_SHA256',
    iterations: record.iterations,
    salt_hex: record.saltHex,
    iv_hex: record.ivHex,
    ciphertext_hex: record.ciphertextHex,
    exported_at: new Date().toISOString(),
    version: record.version
  };
}

/**
 * Parses and verifies an imported .enc container.
 */
export function parseEncryptedImport(importData: any): VaultStorageRecord {
  if (!importData || typeof importData !== 'object') {
    throw new Error('Invalid export container: payload must be a JSON object.');
  }
  if (importData.magic !== 'MINDORA_VAULT_V1') {
    throw new Error('Invalid vault container: unrecognized magic header.');
  }
  if (!importData.salt_hex || !importData.iv_hex || !importData.ciphertext_hex) {
    throw new Error('Incomplete vault container: missing cryptographic fields.');
  }

  const iterations = importData.iterations ?? DEFAULT_PBKDF2_ITERATIONS;
  validateIterationCount(iterations);

  return {
    id: RECORD_ID,
    version: importData.version || 1,
    kdf: 'PBKDF2_SHA256',
    iterations,
    saltHex: importData.salt_hex,
    ivHex: importData.iv_hex,
    ciphertextHex: importData.ciphertext_hex,
    updatedAt: importData.exported_at || new Date().toISOString()
  };
}
