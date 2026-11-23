"""
local_companion/crypto_vault.py
Production-grade Authenticated Encryption at Rest (AES-256-GCM) for Mindora 2.0.

Features:
- Authenticated AES-256-GCM encryption with 12-byte random IV/nonce.
- Cryptographic key derivation via PBKDF2HMAC-SHA256 (100,000 iterations).
- Bound Associated Data (AAD) preventing ciphertext relocation attacks across fields or users.
- Armored serialization: 'enc:v1:<iv_b64>:<ciphertext_tag_b64>'.
- Tamper detection: Authenticated tag verification defeats tampering and bit-flipping attacks.
"""

import os
import base64
import hashlib
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.exceptions import InvalidTag

from .config import CONFIG

# Static application salt for server-side key derivation (separated from secret key)
KDF_SALT = b"mindora_2_0_server_encryption_kdf_salt_2026"

class FieldCryptoVault:
    def __init__(self, master_secret: Optional[str] = None):
        secret = master_secret or CONFIG.secret_key
        if not secret:
            raise ValueError("MINDORA_SECRET_KEY or master_secret is required for FieldCryptoVault.")
        
        # Derive 256-bit AES key via PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=KDF_SALT,
            iterations=100000
        )
        self._key = kdf.derive(secret.encode("utf-8"))
        self._aesgcm = AESGCM(self._key)
        self.key_version = "v1"

    def encrypt_field(self, plaintext: str, associated_data: Optional[str] = None) -> str:
        """
        Encrypt a plaintext string using AES-256-GCM.
        Returns armored format: 'enc:v1:<nonce_b64>:<ciphertext_tag_b64>'
        """
        if not plaintext:
            return ""
        
        # 96-bit (12-byte) unique initialization vector / nonce
        nonce = os.urandom(12)
        aad_bytes = associated_data.encode("utf-8") if associated_data else None
        
        # AES-GCM appends 16-byte authentication tag to ciphertext
        ciphertext = self._aesgcm.encrypt(nonce, plaintext.encode("utf-8"), aad_bytes)
        
        nonce_b64 = base64.urlsafe_b64encode(nonce).decode("ascii")
        ct_b64 = base64.urlsafe_b64encode(ciphertext).decode("ascii")
        
        return f"enc:{self.key_version}:{nonce_b64}:{ct_b64}"

    def decrypt_field(self, armored_text: str, associated_data: Optional[str] = None) -> str:
        """
        Decrypt an armored ciphertext string.
        Verifies authentication tag against associated data.
        """
        if not armored_text:
            return ""
        
        # Check if armored format
        if not armored_text.startswith("enc:"):
            # Unencrypted legacy data
            return armored_text
        
        parts = armored_text.split(":")
        if len(parts) != 4 or parts[1] != self.key_version:
            raise ValueError(f"Unsupported ciphertext envelope format or key version: {armored_text[:20]}")
        
        try:
            nonce = base64.urlsafe_b64decode(parts[2].encode("ascii"))
            ciphertext = base64.urlsafe_b64decode(parts[3].encode("ascii"))
            aad_bytes = associated_data.encode("utf-8") if associated_data else None
            
            decrypted_bytes = self._aesgcm.decrypt(nonce, ciphertext, aad_bytes)
            return decrypted_bytes.decode("utf-8")
        except InvalidTag:
            raise ValueError("Decryption failed: Ciphertext has been tampered with, corrupted, or key/AAD mismatch.")
        except Exception as exc:
            raise ValueError(f"Decryption error: {str(exc)}")

CRYPTO_VAULT = FieldCryptoVault()
