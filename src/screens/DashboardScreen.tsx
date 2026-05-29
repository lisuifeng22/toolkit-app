import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Colors, Layout } from '../constants/Colors';
import { Card } from '../components/Card';
import { loadNotes } from '../storage/notes';
import { loadTodos } from '../storage/todos';
import { loadCountdowns } from '../storage/countdowns';
import { loadBirthdays } from '../storage/birthdays';
import { loadAnniversaries } from '../storage/anniversaries';
import { getDaysRemaining, getDaysSince, formatDate } from '../utils/dates';
import { fetchWeatherByCoords, fetchWeatherByIP, getWeatherEmoji, WeatherData } from '../services/weather';
import * as Location from 'expo-location';
import { Note, Todo, Countdown, Birthday, Anniversary } from '../types';

type Props = {
  navigation: DrawerNavigationProp<any>;
};

export function DashboardScreen({ navigation }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    loadNotes().then(setNotes);
    loadTodos().then(setTodos);
    loadCountdowns().then(setCountdowns);
    loadBirthdays().then(setBirthdays);
    loadAnniversaries().then(setAnniversaries);
  }, []);

  const loadWeather = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const data = await fetchWeatherByCoords(loc.coords.latitude, loc.coords.longitude);
        setWeather(data);
        return;
      }
    } catch {}

    try {
      const data = await fetchWeatherByIP();
      setWeather(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    loadWeather();
  }, [loadData, loadWeather]));

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    loadWeather();
    setRefreshing(false);
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 周${['日','一','二','三','四','五','六'][today.getDay()]}`;
  const hour = today.getHours();
  const greeting = hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';

  const completedTodos = todos.filter(t => t.completed).length;
  const todoProgress = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;
  const earliestUncompleted = todos
    .filter(t => !t.completed)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 4);

  const nearestCountdown = countdowns
    .map(c => ({ ...c, days: getDaysRemaining(c.targetDate) }))
    .sort((a, b) => a.days - b.days)[0];

  const sortedBirthdays = birthdays
    .map(b => ({ ...b, days: getDaysRemaining(b.birthDate), display: formatDate(b.birthDate) }))
    .sort((a, b) => a.days - b.days);

  const sortedAnniversaries = anniversaries
    .map(a => ({ ...a, days: getDaysRemaining(a.date), since: getDaysSince(a.date) }))
    .sort((a, b) => a.days - b.days);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={Colors.primary}
        colors={[Colors.primary]}
      />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting} 👋</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      {/* Weather Card - 整行 */}
      <Card
        onPress={() => navigation.navigate('Weather')}
        style={styles.weatherCard}
        weather
      >
        <View style={styles.weatherRow}>
          <View>
            <Text style={styles.weatherLabel}>天气</Text>
            <Text style={styles.weatherTemp}>{weather ? `${weather.temp}°` : '--'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.weatherCity}>{weather ? weather.cityName : '定位中...'}</Text>
            <Text style={styles.weatherDesc}>
              {weather ? `${getWeatherEmoji(weather.icon)} ${weather.description}` : ''}
            </Text>
          </View>
        </View>
        {weather && (
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherText}>💧 {weather.humidity}%</Text>
            <Text style={styles.weatherText}>🌬 {weather.windSpeed} km/h</Text>
            <Text style={styles.weatherText}>🌡 {weather.tempMin}~{weather.tempMax}°</Text>
          </View>
        )}
      </Card>

      {/* 第一行：便签 + 待办 */}
      <View style={styles.row}>
        <Card
          onPress={() => navigation.navigate('Notes')}
          style={styles.halfCard}
        >
          <Text style={styles.cardTitle}>📝 便签</Text>
          <Text style={styles.preview} numberOfLines={2}>
            {notes.length > 0 ? notes[0].content : '暂无便签'}
          </Text>
          <Text style={styles.footer}>共 {notes.length} 条</Text>
        </Card>

        <Card
          onPress={() => navigation.navigate('Todos')}
          style={styles.halfCard}
        >
          <Text style={styles.cardTitle}>✅ 待办</Text>
          <Text style={styles.todoCount}>已完成 {completedTodos}/{todos.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${todoProgress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{todoProgress}%</Text>
          {earliestUncompleted.map(t => (
            <View key={t.id} style={styles.todoItem}>
              <Text style={styles.todoBullet}>·</Text>
              <Text style={styles.todoTitle} numberOfLines={1}>{t.title}</Text>
            </View>
          ))}
        </Card>
      </View>

      {/* 第二行：倒计时 + 生日 */}
      <View style={styles.row}>
        <Card
          onPress={() => navigation.navigate('Countdowns')}
          style={styles.halfCard}
        >
          <Text style={styles.cardTitle}>⏱ 倒计时</Text>
          {nearestCountdown ? (
            <>
              <Text style={styles.bigNumber}>{nearestCountdown.days}</Text>
              <Text style={styles.eventLabel}>距 {nearestCountdown.title}</Text>
            </>
          ) : (
            <Text style={styles.emptyText}>暂无倒计时</Text>
          )}
        </Card>

        <Card
          onPress={() => navigation.navigate('Birthdays')}
          style={styles.halfCard}
        >
          <Text style={styles.cardTitle}>🎂 生日</Text>
          {sortedBirthdays.length > 0 ? (
            <>
              <Text style={styles.bigNumber}>{sortedBirthdays[0].days}天</Text>
              <Text style={styles.eventLabel}>{sortedBirthdays[0].name} {sortedBirthdays[0].display}</Text>
            </>
          ) : (
            <Text style={styles.emptyText}>暂无生日</Text>
          )}
        </Card>
      </View>

      {/* 第三行：纪念日 + 密码本 */}
      <View style={styles.row}>
        <Card
          onPress={() => navigation.navigate('Anniversaries')}
          style={styles.halfCard}
        >
          <Text style={styles.cardTitle}>❤️ 纪念日</Text>
          {sortedAnniversaries.length > 0 ? (
            <>
              <Text style={styles.bigNumber}>{sortedAnniversaries[0].days}天</Text>
              <Text style={styles.eventLabel}>{sortedAnniversaries[0].title}</Text>
            </>
          ) : (
            <Text style={styles.emptyText}>暂无纪念日</Text>
          )}
        </Card>

        <Card
          onPress={() => navigation.navigate('Password')}
          style={styles.halfCard}
          color={Colors.primaryLighter}
        >
          <Text style={styles.cardTitle}>🔒 密码本</Text>
          <Text style={styles.bigNumber}>已锁定</Text>
          <Text style={styles.eventLabel}>点击验证</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Layout.spacing.md, paddingBottom: 40 },
  header: {
    marginBottom: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
  },
  greeting: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  date: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },

  // 天气卡片
  weatherCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherLabel: { fontSize: 12, color: Colors.textSecondary },
  weatherTemp: { fontSize: 32, fontWeight: '600', color: Colors.primary, marginVertical: 4 },
  weatherCity: { fontSize: 14, color: Colors.textPrimary },
  weatherDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  weatherInfo: {
    flexDirection: 'row', gap: 16, marginTop: Layout.spacing.sm,
    paddingTop: Layout.spacing.sm, borderTopWidth: 1,
    borderTopColor: 'rgba(124,58,237,0.15)',
  },
  weatherText: { fontSize: 12, color: Colors.textSecondary },

  row: { flexDirection: 'row', gap: Layout.spacing.md, marginBottom: Layout.spacing.md },

  halfCard: { flex: 1 },

  cardTitle: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary, marginBottom: Layout.spacing.sm },

  preview: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, flex: 1 },
  footer: { fontSize: 12, color: Colors.textPlaceholder, marginTop: Layout.spacing.xs },
  todoCount: { fontSize: 14, color: Colors.textSecondary },
  progressBar: {
    height: 8, backgroundColor: Colors.gray, borderRadius: 4,
    marginTop: Layout.spacing.sm, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressLabel: { fontSize: 12, color: Colors.textPlaceholder, marginTop: Layout.spacing.xs },
  bigNumber: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginVertical: 2 },
  eventLabel: { fontSize: 14, color: Colors.textSecondary },
  emptyText: { fontSize: 14, color: Colors.textPlaceholder, paddingVertical: 16 },
  todoItem: { flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacing.xs },
  todoBullet: { fontSize: 16, color: Colors.primary, marginRight: 4, lineHeight: 18 },
  todoTitle: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
});
