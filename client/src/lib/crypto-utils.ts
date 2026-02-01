const STORAGE_KEY = 'mudscape_ai_key';
const ENCRYPTED_STORAGE_KEY = 'mudscape_ai_key_encrypted';
const SALT_KEY = 'mudscape_ai_key_salt';

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(apiKey: string, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(apiKey)
  );
  
  const encryptedData = {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
  
  localStorage.setItem(ENCRYPTED_STORAGE_KEY, JSON.stringify(encryptedData));
  localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
  localStorage.removeItem(STORAGE_KEY);
}

export async function decryptApiKey(password: string): Promise<string | null> {
  const encryptedJson = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
  const saltJson = localStorage.getItem(SALT_KEY);
  
  if (!encryptedJson || !saltJson) {
    return null;
  }
  
  try {
    const { iv, data } = JSON.parse(encryptedJson);
    const salt = new Uint8Array(JSON.parse(saltJson));
    const key = await deriveKey(password, salt);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    return null;
  }
}

export function storeApiKeyLocal(apiKey: string): void {
  localStorage.setItem(STORAGE_KEY, apiKey);
  localStorage.removeItem(ENCRYPTED_STORAGE_KEY);
  localStorage.removeItem(SALT_KEY);
}

export function getApiKeyLocal(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function hasEncryptedKey(): boolean {
  return localStorage.getItem(ENCRYPTED_STORAGE_KEY) !== null;
}

export function hasLocalKey(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ENCRYPTED_STORAGE_KEY);
  localStorage.removeItem(SALT_KEY);
}

export type StorageMode = 'none' | 'local' | 'encrypted';

export function getStorageMode(): StorageMode {
  if (hasEncryptedKey()) return 'encrypted';
  if (hasLocalKey()) return 'local';
  return 'none';
}
