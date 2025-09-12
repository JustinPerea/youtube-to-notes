import { ApiKeySecurityManager } from '@/lib/security/api-key-security';

function log(title: string, details?: any) {
  console.log(`\n=== ${title} ===`);
  if (details !== undefined) console.log(details);
}

async function main() {
  const secret = process.env.API_ENCRYPTION_KEY || 'test-secret-for-local-validation';
  const wrongSecret = 'wrong-secret-value';

  log('Using secret', secret.length >= 32 ? `${secret.slice(0, 6)}…` : secret);

  const mgr = new ApiKeySecurityManager(secret);

  // 1) Generate a key and ensure encrypt/decrypt roundtrip works
  const apiKey = mgr.generateApiKey('local-test-key', ['read', 'write']);
  log('Generated API key', { id: apiKey.id, name: apiKey.name, permissions: apiKey.permissions });

  const encrypted = apiKey.encryptedKey;
  const parts = encrypted.split(':');
  if (parts.length !== 3) throw new Error('Encrypted format invalid (expected iv:tag:ciphertext)');

  const [ivHex, tagHex, cipherHex] = parts;
  log('Encrypted parts length', { iv: ivHex.length, tag: tagHex.length, ciphertext: cipherHex.length });

  // Call private decrypt method via any-cast (ok in a local helper script)
  const decrypted = (mgr as any).decryptKey(encrypted);
  if (decrypted !== apiKey.key) {
    throw new Error('Decrypted plaintext does not match original');
  }
  log('Roundtrip decrypt success');

  // 2) Ensure decryption fails with wrong secret
  let wrongDecryptionFailed = false;
  try {
    const otherMgr = new ApiKeySecurityManager(wrongSecret);
    (otherMgr as any).decryptKey(encrypted);
  } catch {
    wrongDecryptionFailed = true;
  }
  if (!wrongDecryptionFailed) throw new Error('Decryption with wrong secret should fail');
  log('Wrong-secret decrypt correctly failed');

  // 3) Export/import cycle preserves encrypted data
  const exported = mgr.exportKeys();
  const restoredMgr = new ApiKeySecurityManager(secret);
  restoredMgr.importKeys(exported);
  const restored = restoredMgr.getActiveKeys().find(k => k.id === apiKey.id);
  if (!restored) throw new Error('Restored key not found after import');
  if (restored.encryptedKey !== encrypted) throw new Error('Encrypted key changed across export/import');
  // Decrypt using restored manager
  const restoredPlain = (restoredMgr as any).decryptKey(restored.encryptedKey);
  if (restoredPlain !== apiKey.key) throw new Error('Restored plaintext mismatch');
  log('Export/import roundtrip success');

  console.log('\nAll crypto tests passed ✅');
}

main().catch((err) => {
  console.error('Crypto test failed ❌', err);
  process.exit(1);
});

