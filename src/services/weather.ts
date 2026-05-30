import { AMAP_KEY } from './gaode-config';

const API = 'https://restapi.amap.com/v3';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  cityName: string;
  tempMin: number;
  tempMax: number;
  forecast: ForecastDay[];
}

export interface ForecastDay {
  day: string;
  icon: string;
  tempMin: number;
  tempMax: number;
  description: string;
}

const WEATHER_EMOJI: Record<string, string> = {
  '晴': '☀️', '多云': '⛅', '阴': '☁️',
  '小雨': '🌦️', '中雨': '🌧️', '大雨': '🌧️', '暴雨': '🌧️', '大暴雨': '🌧️',
  '阵雨': '🌦️', '雷阵雨': '⛈️', '雷阵雨伴有冰雹': '⛈️',
  '小雪': '🌨️', '中雪': '❄️', '大雪': '❄️', '暴雪': '❄️',
  '雾': '🌫️', '霾': '🌫️', '浮尘': '🌫️', '扬沙': '🌫️',
  '冻雨': '🌧️', '强沙尘暴': '🌫️',
};

export function getWeatherEmoji(weather: string): string {
  return WEATHER_EMOJI[weather] || '⛅';
}

function windPowerToSpeed(level: string): number {
  const p = parseInt(level);
  if (isNaN(p)) return 0;
  const speeds = [0, 1, 5, 10, 18, 28, 38, 50, 62, 75, 88, 102, 117];
  return speeds[Math.min(p, speeds.length - 1)];
}

function getDayName(dateStr: string): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date(dateStr).getDay()];
}

async function getAdcodeByCoords(lat: number, lon: number): Promise<string> {
  const url = `${API}/geocode/regeo?key=${AMAP_KEY}&location=${lon},${lat}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1') throw new Error(data.info || '逆地理编码失败');
  return data.regeocode.addressComponent.adcode;
}

async function getAdcodeByCity(city: string): Promise<string> {
  const url = `${API}/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(city)}&city=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1' || !data.geocodes?.length) throw new Error('未找到该城市');
  return data.geocodes[0].adcode;
}

async function fetchWeatherByAdcode(adcode: string): Promise<WeatherData> {
  // 需要分别请求 base（实时）和 all（预报）
  const [baseData, allData] = await Promise.all([
    fetch(`${API}/weather/weatherInfo?key=${AMAP_KEY}&city=${adcode}&extensions=base`).then(r => r.json()),
    fetch(`${API}/weather/weatherInfo?key=${AMAP_KEY}&city=${adcode}&extensions=all`).then(r => r.json()),
  ]);

  if (baseData.status !== '1') throw new Error(baseData.info || '获取实时天气失败');
  if (allData.status !== '1') throw new Error(allData.info || '获取预报天气失败');

  const live = baseData.lives?.[0];
  const forecast = allData.forecasts?.[0];
  if (!live || !forecast) throw new Error('天气数据为空');

  const casts = forecast.casts || [];

  return {
    temp: parseInt(live.temperature),
    feelsLike: parseInt(live.temperature),
    humidity: parseInt(live.humidity),
    windSpeed: windPowerToSpeed(live.windpower),
    description: live.weather,
    icon: getWeatherEmoji(live.weather),
    cityName: live.city,
    tempMin: casts[0] ? parseInt(casts[0].nighttemp) : parseInt(live.temperature),
    tempMax: casts[0] ? parseInt(casts[0].daytemp) : parseInt(live.temperature),
    forecast: casts.slice(0, 5).map((c: any) => ({
      day: getDayName(c.date),
      icon: getWeatherEmoji(c.dayweather),
      tempMin: parseInt(c.nighttemp),
      tempMax: parseInt(c.daytemp),
      description: c.dayweather,
    })),
  };
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const adcode = await getAdcodeByCoords(lat, lon);
  return fetchWeatherByAdcode(adcode);
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const adcode = await getAdcodeByCity(city);
  return fetchWeatherByAdcode(adcode);
}

/** 高德 IP 定位 → adcode → 天气数据（不需要任何权限和系统设置） */
export async function fetchWeatherByIP(): Promise<WeatherData> {
  const url = `https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1') throw new Error(data.info || 'IP 定位失败');
  if (!data.adcode) throw new Error('IP 定位未获取到城市信息');
  return fetchWeatherByAdcode(data.adcode);
}
