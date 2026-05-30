import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherData } from '../services/weather';

const KEY = '@toolkit_weather_cache';
const TTL = 15 * 60 * 1000; // 15 minutes

interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

export async function getWeatherCache(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const cache: WeatherCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > TTL) return null;
    return cache.data;
  } catch {
    return null;
  }
}

export async function setWeatherCache(data: WeatherData): Promise<void> {
  try {
    const cache: WeatherCache = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
}
