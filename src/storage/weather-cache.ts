/**
 * 天气缓存模块
 *
 * 按城市 adcode + 来源分类缓存, 避免手动搜索被 GPS/IP 缓存覆盖
 * 自动定位 (gps/balanced/ip) 和手动搜索 (manual) 分别缓存
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherData, WeatherSource, getCacheKey } from '../services/weather';
import { loadJson, saveJson } from './index';

const TTL = 15 * 60 * 1000; // 15 分钟

interface WeatherCacheEntry {
  data: WeatherData;
  timestamp: number;
}

/** 获取指定城市+来源的天气缓存 */
export async function getWeatherCache(adcode: string, source: WeatherSource): Promise<WeatherData | null> {
  try {
    const cacheKey = `@toolkit_weather_${getCacheKey(adcode, source)}`;
    const entry = await loadJson<WeatherCacheEntry>(cacheKey);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/** 设置指定城市+来源的天气缓存 */
export async function setWeatherCache(data: WeatherData): Promise<void> {
  try {
    const cacheKey = `@toolkit_weather_${getCacheKey(data.cityAdcode, data.source)}`;
    const entry: WeatherCacheEntry = { data, timestamp: Date.now() };
    await saveJson(cacheKey, entry);
  } catch {}
}

/** 清除所有天气缓存 (保留 key 前缀以便扩展) */
export async function clearAllWeatherCaches(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const weatherKeys = keys.filter((k) => k.startsWith('@toolkit_weather_'));
    if (weatherKeys.length > 0) {
      await AsyncStorage.multiRemove(weatherKeys);
    }
  } catch {}
}
