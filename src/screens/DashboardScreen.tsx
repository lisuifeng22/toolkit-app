import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { colors, spacing, fontSize } from '../theme';
import { Card } from '../components/Card';
import { loadNotes } from '../storage/notes';
import { loadTodos } from '../storage/todos';
import { loadCountdowns } from '../storage/countdowns';
import { loadBirthdays } from '../storage/birthdays';
import { loadAnniversaries } from '../storage/anniversaries';
import { getDaysRemaining, getDaysSince, formatDate } from '../utils/dates';
import { fetchWeatherByCoords, getWeatherEmoji, WeatherData } from '../services/weather';
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
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const data = await fetchWeatherByCoords(loc.coords.latitude, loc.coords.longitude);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      </View>

      {/* Weather Card */}
      <Card
        onPress={() => navigation.navigate('Weather')}
        style={styles.weatherCard}
        color={colors.secondaryLight}
      >
        <View style={styles.weatherRow}>
          <View>
            <Text style={styles.cardLabel}>☀️ 天气</Text>
            <Text style={styles.weatherTemp}>{weather ? `${weather.temp}°` : '--'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.weatherCity}>{weather ? weather.cityName : '定位中...'}</Text>
            <Text style={styles.weatherDesc}>{weather ? `${getWeatherEmoji(weather.icon)} ${weather.description}` : ''}</Text>
          </View>
        </View>
      </Card>

      {/* First Row */}
      <View style={styles.row}>
        {/* Notes Card */}
        <Card
          onPress={() => navigation.navigate('Notes')}
          style={styles.halfCard}
        >
          <Text style={[styles.cardLabel, { color: colors.success }]}>📝 便签</Text>
          <Text style={styles.preview} numberOfLines={2}>
            {notes.length > 0 ? notes[0].content : '暂无便签'}
          </Text>
          <Text style={styles.footer}>共 {notes.length} 条</Text>
        </Card>

        {/* Todos Card */}
        <Card
          onPress={() => navigation.navigate('Todos')}
          style={styles.halfCard}
        >
          <Text style={[styles.cardLabel, { color: colors.info }]}>✅ 待办</Text>
          <Text style={styles.todoCount}>已完成 {completedTodos}/{todos.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${todoProgress}%` }]} />
          </View>
          <Text style={styles.footer}>{todoProgress}%</Text>
        </Card>
      </View>

      {/* Second Row */}
      <View style={styles.row}>
        {/* Countdown Card */}
        <Card
          onPress={() => navigation.navigate('Countdowns')}
          style={styles.halfCard}
        >
          <Text style={[styles.cardLabel, { color: colors.success }]}>⏱ 倒计时</Text>
          {nearestCountdown ? (
            <>
              <Text style={styles.bigNumber}>{nearestCountdown.days}</Text>
              <Text style={styles.eventLabel}>距 {nearestCountdown.title}</Text>
            </>
          ) : (
            <Text style={styles.emptyHint}>暂无倒计时</Text>
          )}
        </Card>

        {/* Birthday Card */}
        <Card
          onPress={() => navigation.navigate('Birthdays')}
          style={styles.halfCard}
        >
          <Text style={[styles.cardLabel, { color: colors.warning }]}>🎂 生日</Text>
          {sortedBirthdays.length > 0 ? (
            <>
              <Text style={styles.bigNumber}>{sortedBirthdays[0].days}天</Text>
              <Text style={styles.eventLabel}>{sortedBirthdays[0].name} {sortedBirthdays[0].display}</Text>
            </>
          ) : (
            <Text style={styles.emptyHint}>暂无生日</Text>
          )}
        </Card>
      </View>

      {/* Bottom Row */}
      <View style={styles.row}>
        {/* Anniversary Card */}
        <Card
          onPress={() => navigation.navigate('Anniversaries')}
          style={styles.partCard}
        >
          <Text style={[styles.cardLabelSm, { color: colors.purple }]}>❤️ 纪念日</Text>
          {sortedAnniversaries.length > 0 ? (
            <>
              <Text style={styles.numberMd}>{sortedAnniversaries[0].days}天</Text>
              <Text style={styles.eventLabelSm}>{sortedAnniversaries[0].title}</Text>
            </>
          ) : (
            <Text style={styles.emptyHint}>暂无纪念日</Text>
          )}
        </Card>

        {/* Password Card */}
        <View style={{ flex: 1 }}>
          <Card
            onPress={() => navigation.navigate('Password')}
            color={colors.purpleLight}
          >
          <Text style={[styles.cardLabelSm, { color: colors.purple, textAlign: 'center' }]}>🔒 密码本</Text>
          <Text style={styles.lockedText}>已锁定</Text>
          <Text style={styles.footer}>点击验证</Text>
        </Card>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xl,
  },
  greeting: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  date: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },

  weatherCard: { marginBottom: spacing.md, minHeight: 100, justifyContent: 'center' },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherTemp: { fontSize: fontSize.xxxl, fontWeight: '700', color: colors.primary, marginTop: 4 },
  weatherCity: { fontSize: fontSize.sm, color: colors.textSecondary },
  weatherDesc: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },

  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },

  halfCard: { flex: 1, aspectRatio: 1, justifyContent: 'center' },
  partCard: { flex: 1, aspectRatio: 1, justifyContent: 'center' },

  cardLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  cardLabelSm: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.xs },
  preview: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18, flex: 1 },
  footer: { fontSize: fontSize.xs, color: colors.textDisabled, marginTop: spacing.xs },
  todoCount: { fontSize: fontSize.sm, color: colors.textSecondary },
  progressBar: {
    height: 5, backgroundColor: colors.border, borderRadius: 3,
    marginTop: spacing.sm, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.info, borderRadius: 3 },
  bigNumber: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginVertical: 2 },
  numberMd: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginVertical: 2 },
  eventLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  eventLabelSm: { fontSize: fontSize.xs, color: colors.textTertiary },
  emptyHint: { fontSize: fontSize.sm, color: colors.textDisabled, marginTop: spacing.sm },
  lockedText: { fontSize: fontSize.sm, color: colors.textTertiary, textAlign: 'center' },
});
