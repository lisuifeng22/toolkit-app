/**
 * 密码本存储模块
 *
 * 所有密码数据经过 AES-256-GCM 加密后写入 AsyncStorage
 * 加密密钥由 PIN 通过 PBKDF2 派生
 * 敏感密钥材料保存在 expo-secure-store
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Password } from '../types';
import { encryptData, decryptData } from './crypto';
import { KEYS } from './index';

// 是否已执行旧数据迁移标记
const MIGRATED_FLAG = '@toolkit_passwords_migrated_v2';

/** 检测旧版明文数据是否存在 */
export async function hasLegacyData(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PASSWORDS);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/** 是否已完成迁移 */
export async function isMigrated(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(MIGRATED_FLAG)) === 'true';
  } catch {
    return false;
  }
}

/** 执行旧数据迁移: 读取旧明文 → 加密写入 → 删除旧数据 */
export async function migrateLegacyData(pin: string): Promise<{ migrated: number }> {
  const raw = await AsyncStorage.getItem(KEYS.PASSWORDS);
  if (!raw) throw new Error('未找到旧版密码数据');

  let items: Password[];
  try {
    items = JSON.parse(raw);
    if (!Array.isArray(items)) throw new Error('数据格式错误');
  } catch (e) {
    throw new Error('旧版数据解析失败, 无法迁移: ' + (e as Error).message);
  }

  const json = JSON.stringify(items);
  const encrypted = await encryptData(pin, json);
  await AsyncStorage.setItem(KEYS.PASSWORDS_ENCRYPTED, encrypted);
  await AsyncStorage.removeItem(KEYS.PASSWORDS);
  await AsyncStorage.setItem(MIGRATED_FLAG, 'true');

  return { migrated: items.length };
}

/** 加载加密的密码数据 */
export async function loadPasswords(pin: string): Promise<Password[]> {
  if (!pin) return [];

  try {
    const encrypted = await AsyncStorage.getItem(KEYS.PASSWORDS_ENCRYPTED);
    if (!encrypted) return [];

    const json = await decryptData(pin, encrypted);
    return JSON.parse(json);
  } catch {
    // 解密失败(如 PIN 错误或数据损坏)
    return [];
  }
}

/** 保存密码数据(加密) */
export async function savePasswords(pin: string, items: Password[]): Promise<void> {
  try {
    const json = JSON.stringify(items);
    const encrypted = await encryptData(pin, json);
    await AsyncStorage.setItem(KEYS.PASSWORDS_ENCRYPTED, encrypted);
  } catch (e) {
    console.error('保存密码失败:', e);
    throw new Error('保存密码失败');
  }
}

/** 添加密码 */
export async function addPassword(pin: string, item: Password): Promise<Password[]> {
  const items = await loadPasswords(pin);
  items.unshift(item);
  await savePasswords(pin, items);
  return items;
}

/** 更新密码 */
export async function updatePassword(pin: string, id: string, updates: Partial<Password>): Promise<void> {
  const items = await loadPasswords(pin);
  const idx = items.findIndex((p) => p.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    await savePasswords(pin, items);
  }
}

/** 删除密码 */
export async function deletePassword(pin: string, id: string): Promise<Password[]> {
  const items = await loadPasswords(pin);
  const filtered = items.filter((p) => p.id !== id);
  await savePasswords(pin, filtered);
  return filtered;
}

/** 检查密码库是否非空 */
export async function hasStoredPasswords(): Promise<boolean> {
  try {
    const encrypted = await AsyncStorage.getItem(KEYS.PASSWORDS_ENCRYPTED);
    if (!encrypted) return false;
    return encrypted.length > 0;
  } catch {
    return false;
  }
}
