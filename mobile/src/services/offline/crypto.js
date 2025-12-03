import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const OFFLINE_KEY = 'workix_offline_cipher';
const DEFAULT_KEY_LENGTH = 32;

async function ensureKey() {
  let key = await SecureStore.getItemAsync(OFFLINE_KEY);

  if (!key) {
    key = CryptoJS.lib.WordArray.random(DEFAULT_KEY_LENGTH).toString();
    await SecureStore.setItemAsync(OFFLINE_KEY, key);
  }

  return key;
}

export async function encryptPayload(data) {
  const key = await ensureKey();
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(serialized, key).toString();
}

export async function decryptPayload(ciphertext) {
  const key = await ensureKey();
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const decoded = bytes.toString(CryptoJS.enc.Utf8);
  if (!decoded) {
    throw new Error('Failed to decrypt payload');
  }

  try {
    return JSON.parse(decoded);
  } catch (error) {
    return decoded;
  }
}
