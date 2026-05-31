import AsyncStorage from '@react-native-async-storage/async-storage';

/** 所有 AsyncStorage Key 集中定义 */
export const KEYS = {
  NOTES: '@toolkit_notes',
  TODOS: '@toolkit_todos',
  PASSWORDS: '@toolkit_passwords',
  PASSWORDS_ENCRYPTED: '@toolkit_passwords_encrypted',
  COUNTDOWNS: '@toolkit_countdowns',
  BIRTHDAYS: '@toolkit_birthdays',
  ANNIVERSARIES: '@toolkit_anniversaries',
  PIN_HASH: '@toolkit_pin_hash',
  WEATHER_CACHE: '@toolkit_weather_cache',
  WEATHER_LOCATIONS: '@toolkit_weather_locations',
  WEATHER_CACHE_PREFIX: '@toolkit_weather_cache_',
  STORAGE_VERSION: '@toolkit_storage_version',
} as const;

/** 当前存储架构版本 (用于数据迁移判定) */
export const STORAGE_VERSION = 2;

/** 通用加载数组数据 (带 JSON.parse 容错) */
export async function loadData<T>(key: string): Promise<T[]> {
  try {
    const json = await AsyncStorage.getItem(key);
    if (!json) return [];
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      console.warn(`[storage] Key "${key}" 不是数组, 将重置`);
      return [];
    }
    return parsed;
  } catch (e) {
    console.error(`[storage] 读取 "${key}" 失败:`, e);
    return [];
  }
}

/** 通用保存数组数据 */
export async function saveData<T>(key: string, data: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[storage] 保存 "${key}" 失败:`, e);
  }
}

/** 通用保存任意 JSON 数据 */
export async function saveJson(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[storage] 保存 "${key}" 失败:`, e);
  }
}

/** 通用加载任意 JSON 数据 (带容错) */
export async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(key);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error(`[storage] 读取 "${key}" 失败:`, e);
    return null;
  }
}

/** 获取存储版本号 */
export async function getStorageVersion(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STORAGE_VERSION);
    return raw ? parseInt(raw, 10) : 1;
  } catch {
    return 1;
  }
}

/** 设置存储版本号 */
export async function setStorageVersion(version: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.STORAGE_VERSION, version.toString());
  } catch {}
}

/**
 * 数据迁移入口
 * 检测当前存储版本, 按需执行迁移
 */
export async function runMigrations(): Promise<void> {
  const currentVersion = await getStorageVersion();

  if (currentVersion < 2) {
    try {
      // v1 → v2: 密码本加密改造, 旧数据迁移由密码模块自行处理
      await setStorageVersion(2);
      console.log('[migration] 已升级到 v2');
    } catch (e) {
      console.error('[migration] 升级到 v2 失败:', e);
    }
  }

  // 后续版本迁移在此追加:
  // if (currentVersion < 3) { ... }
}

/** 清除指定 key 的数据 */
export async function clearKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error(`[storage] 清除 "${key}" 失败:`, e);
  }
}
