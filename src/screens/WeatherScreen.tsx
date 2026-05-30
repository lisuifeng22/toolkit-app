import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Colors, Layout } from '../constants/Colors';
import { fetchWeatherByCoords, fetchWeatherByCity, fetchWeatherByIP, getWeatherEmoji, WeatherData } from '../services/weather';
import { loadLocations, saveLocation, removeLocation } from '../storage/weather-locations';
import { getWeatherCache, setWeatherCache } from '../storage/weather-cache';

const POPULAR_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安', '厦门', '长沙'];

export function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadWeather = useCallback(async () => {
    setError('');

    // 1. 有缓存直接展示
    const cached = await getWeatherCache();
    if (cached) {
      setWeather(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // 2. 三路定位：GPS High → Balanced → IP 兜底
    const data = await (async (): Promise<WeatherData | null> => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let weather: WeatherData | null = null;

        if (status === 'granted') {
          // 并行发起 GPS 和网络定位
          const highPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
          const balancedPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);

          // 先等 5s 看 GPS High 结果
          const loc = await Promise.race([
            highPromise,
            new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
          ]);

          if (loc) {
            console.log('[定位] GPS 高精度 5s 内定位成功');
            weather = await fetchWeatherByCoords(loc.coords.latitude, loc.coords.longitude);
          } else {
            // GPS 超时，取网络定位（已经跑了 5s，应该已返回）
            const loc2 = await balancedPromise;
            if (loc2) {
              console.log('[定位] 5s 超时，使用网络定位');
              weather = await fetchWeatherByCoords(loc2.coords.latitude, loc2.coords.longitude);
            }
          }
        } else {
          console.warn('[定位] 权限被拒绝，跳过 GPS/网络定位');
        }

        // GPS/网络定位都没拿到，用 IP 兜底（零权限、零设置依赖）
        if (!weather) {
          console.log('[定位] 使用 IP 定位兜底');
          weather = await fetchWeatherByIP();
        }

        return weather;
      } catch (e) {
        console.error('[定位] 异常:', e);
        return null;
      }
    })();

    if (data) {
      setWeather(data);
      setWeatherCache(data);
    } else if (!cached) {
      setError('定位失败，请搜索城市');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadLocations().then(setSavedLocations);
    loadWeather();

    const msUntilHalfHour = () => {
      const now = new Date();
      const next = now.getMinutes() < 30
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 30, 0, 0)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
      return next.getTime() - now.getTime();
    };

    const timeout = setTimeout(() => {
      loadWeather();
      timerRef.current = setInterval(loadWeather, 30 * 60 * 1000);
    }, msUntilHalfHour());

    return () => {
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadWeather]);

  const searchCity = async (city: string) => {
    if (!city.trim()) return;
    setSearching(true);
    setError('');
    try {
      const data = await fetchWeatherByCity(city.trim());
      setWeather(data);
    } catch (e: any) {
      setError(e.message || '未找到该城市');
    }
    setSearching(false);
  };

  const handleToggleSave = async () => {
    if (!weather) return;
    const cityName = weather.cityName;
    if (savedLocations.includes(cityName)) {
      const list = await removeLocation(cityName);
      setSavedLocations(list);
    } else {
      const list = await saveLocation(cityName);
      setSavedLocations(list);
    }
  };

  const handleRemoveLocation = (city: string) => {
    Alert.alert('删除位置', `确定删除「${city}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        const list = await removeLocation(city);
        setSavedLocations(list);
      }},
    ]);
  };

  if (loading && !weather) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>正在获取天气...</Text>
      </View>
    );
  }

  const isSaved = weather ? savedLocations.includes(weather.cityName) : false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="搜索城市..."
          placeholderTextColor={Colors.textPlaceholder}
          onSubmitEditing={() => searchCity(searchText)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.refreshBtn} onPress={loadWeather} activeOpacity={0.85}>
          <Text style={styles.refreshBtnText}>⟳</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} onPress={() => searchCity(searchText)} disabled={searching} activeOpacity={0.85}>
          <Text style={styles.searchBtnText}>{searching ? '...' : '搜索'}</Text>
        </TouchableOpacity>
      </View>

      {savedLocations.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {savedLocations.map(city => (
            <TouchableOpacity
              key={city}
              style={[styles.chip, styles.savedChip]}
              onPress={() => searchCity(city)}
              onLongPress={() => handleRemoveLocation(city)}
              activeOpacity={0.85}
            >
              <Text style={styles.chipText}>★ {city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        <TouchableOpacity style={styles.chip} onPress={loadWeather} activeOpacity={0.85}>
          <Text style={styles.chipText}>📍 当前位置</Text>
        </TouchableOpacity>
        {POPULAR_CITIES.map(city => (
          <TouchableOpacity key={city} style={styles.chip} onPress={() => searchCity(city)} activeOpacity={0.85}>
            <Text style={styles.chipText}>{city}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {searching && (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Layout.spacing.md }} />
      )}

      {weather && (
        <>
          <View style={styles.currentCard}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleToggleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{isSaved ? '★ 已收藏' : '☆ 收藏'}</Text>
            </TouchableOpacity>

            <Text style={styles.emoji}>{getWeatherEmoji(weather.icon)}</Text>
            <Text style={styles.temp}>{weather.temp}°</Text>
            <Text style={styles.city}>{weather.cityName}</Text>
            <Text style={styles.desc}>{weather.description} · 体感 {weather.feelsLike}°</Text>
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>💧 湿度</Text>
                <Text style={styles.detailValue}>{weather.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>🌬 风速</Text>
                <Text style={styles.detailValue}>{weather.windSpeed} km/h</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>🌡 范围</Text>
                <Text style={styles.detailValue}>{weather.tempMin}~{weather.tempMax}°</Text>
              </View>
            </View>
          </View>

          <View style={styles.forecast}>
            <Text style={styles.sectionTitle}>未来预报</Text>
            {weather.forecast.map((day, i) => (
              <View key={i} style={styles.forecastRow}>
                <Text style={styles.forecastDay}>{day.day}</Text>
                <Text style={styles.forecastIcon}>{getWeatherEmoji(day.icon)}</Text>
                <Text style={styles.forecastDesc}>{day.description}</Text>
                <Text style={styles.forecastTemp}>{day.tempMin}° / {day.tempMax}°</Text>
              </View>
            ))}
          </View>

          <Text style={styles.note}>数据来自高德地图</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Layout.spacing.md, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Layout.spacing.md },
  loadingText: { fontSize: 14, color: Colors.textSecondary, marginTop: Layout.spacing.md },
  errorText: { fontSize: 14, color: Colors.danger, textAlign: 'center', marginBottom: Layout.spacing.sm },

  searchRow: { flexDirection: 'row', gap: Layout.spacing.sm, marginBottom: Layout.spacing.sm },
  searchInput: {
    flex: 1, height: 40, borderRadius: Layout.radius.base, backgroundColor: Colors.card,
    paddingHorizontal: Layout.spacing.md, fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchBtn: {
    height: 40, paddingHorizontal: Layout.spacing.lg, backgroundColor: Colors.primary,
    borderRadius: Layout.radius.base, alignItems: 'center', justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: Layout.radius.base, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtnText: { fontSize: 18, color: Colors.primary },

  chipsRow: { marginBottom: Layout.spacing.sm },
  chip: {
    paddingHorizontal: Layout.spacing.md, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.card, marginRight: Layout.spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  savedChip: { backgroundColor: Colors.primaryLighter, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary },

  currentCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Layout.radius.large, padding: Layout.spacing.xl,
    alignItems: 'center', marginBottom: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  saveBtn: {
    position: 'absolute', top: Layout.spacing.md, right: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md, paddingVertical: 4,
    borderRadius: Layout.radius.small, backgroundColor: 'rgba(255,255,255,0.7)',
  },
  saveBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  emoji: { fontSize: 48, marginBottom: Layout.spacing.sm },
  temp: { fontSize: 48, fontWeight: '700', color: Colors.primary },
  city: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginTop: Layout.spacing.xs },
  desc: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  details: {
    flexDirection: 'row', justifyContent: 'space-around',
    width: '100%', marginTop: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg, borderTopWidth: 1,
    borderTopColor: 'rgba(124,58,237,0.15)',
  },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },

  forecast: { backgroundColor: Colors.card, borderRadius: Layout.radius.large, padding: Layout.spacing.md, ...Layout.shadow.light },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: Layout.spacing.md },
  forecastRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  forecastDay: { fontSize: 14, color: Colors.textSecondary, width: 50 },
  forecastIcon: { fontSize: 18 },
  forecastDesc: { flex: 1, fontSize: 12, color: Colors.textSecondary, marginHorizontal: Layout.spacing.sm },
  forecastTemp: { fontSize: 14, color: Colors.textSecondary },
  note: { fontSize: 12, color: Colors.textPlaceholder, textAlign: 'center', marginTop: Layout.spacing.lg },
});
