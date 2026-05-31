import { AMAP_KEY } from './gaode-config';

const API = 'https://restapi.amap.com/v3';

export type WeatherSource = 'gps' | 'balanced' | 'ip' | 'manual';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  cityName: string;
  cityAdcode: string;
  tempMin: number;
  tempMax: number;
  forecast: ForecastDay[];
  source: WeatherSource;
}

export interface ForecastDay {
  day: string;
  icon: string;
  tempMin: number;
  tempMax: number;
  description: string;
}

/** 高德 API 错误码 → 用户可理解的提示 */
const AMAP_ERROR_MESSAGES: Record<string, string> = {
  '10001': 'Key 无效, 请检查高德 API Key 配置',
  '10003': 'Key 已过期或配额不足',
  '20000': '请求参数缺失, 请检查城市信息',
  '20001': '缺少 Key 参数',
  '20002': 'Key 被锁定',
  '20003': '请求 IP 不在白名单',
  '20011': '已超出 QPS 限制, 请稍后重试',
  '20012': '已超出调用配额, 请稍后重试',
  '20013': '已超出日调用量限制',
  '22000': '城市编码无效',
  '30000': '服务不可用, 请稍后重试',
  '32000': '服务响应超时',
  '32001': '服务处理异常',
};

function getAmapErrorMessage(info: string, infocode?: string): string {
  if (infocode && AMAP_ERROR_MESSAGES[infocode]) {
    return AMAP_ERROR_MESSAGES[infocode];
  }
  // 常见非 code 错误
  if (!info) return '未知错误';
  if (info.includes('QPS')) return '请求过于频繁, 请稍后重试';
  if (info.includes('INVALID_USER_KEY')) return 'API Key 无效, 请检查配置';
  if (info.includes('DAILY_QUERY_OVER_LIMIT')) return '今日调用次数已用尽, 请明日再试';
  if (info.includes('ACCESS_TOO_FREQUENT')) return '请求过于频繁, 请稍后重试';
  if (info.includes('INVALID_PARAMS')) return '请求参数错误';
  return info;
}

const WEATHER_EMOJI: Record<string, string> = {
  晴: '☀️',
  多云: '⛅',
  阴: '☁️',
  小雨: '🌦️',
  中雨: '🌧️',
  大雨: '🌧️',
  暴雨: '🌧️',
  大暴雨: '🌧️',
  阵雨: '🌦️',
  雷阵雨: '⛈️',
  雷阵雨伴有冰雹: '⛈️',
  小雪: '🌨️',
  中雪: '❄️',
  大雪: '❄️',
  暴雪: '❄️',
  雾: '🌫️',
  霾: '🌫️',
  浮尘: '🌫️',
  扬沙: '🌫️',
  冻雨: '🌧️',
  强沙尘暴: '🌫️',
};

export function getWeatherEmoji(weather: string): string {
  return WEATHER_EMOJI[weather] || '⛅';
}

/** 定位来源对应的中文标签 */
export function getSourceLabel(source: WeatherSource): string {
  switch (source) {
    case 'gps':
      return 'GPS 定位';
    case 'balanced':
      return '低精度定位';
    case 'ip':
      return 'IP 定位城市';
    case 'manual':
      return '手动搜索城市';
  }
}

/** 定位来源对应的提示文本 */
export function getSourceHint(source: WeatherSource): string | null {
  switch (source) {
    case 'ip':
      return '已使用 IP 定位结果, 可能不够精确';
    case 'balanced':
      return '定位精度较低, 仅供参考';
    default:
      return null;
  }
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
  if (data.status !== '1') {
    throw new Error(getAmapErrorMessage(data.info, data.infocode));
  }
  if (!data.regeocode?.addressComponent?.adcode) {
    throw new Error('逆地理编码失败: 未获取到城市编码');
  }
  return data.regeocode.addressComponent.adcode;
}

async function getAdcodeByCity(city: string): Promise<string> {
  const url = `${API}/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(city)}&city=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1' || !data.geocodes?.length) {
    const msg = getAmapErrorMessage(data.info, data.infocode);
    throw new Error(data.geocodes?.length === 0 ? `城市「${city}」不存在` : msg);
  }
  return data.geocodes[0].adcode;
}

async function fetchWeatherByAdcode(adcode: string): Promise<WeatherData> {
  const [baseData, allData] = await Promise.all([
    fetch(`${API}/weather/weatherInfo?key=${AMAP_KEY}&city=${adcode}&extensions=base`).then((r) => r.json()),
    fetch(`${API}/weather/weatherInfo?key=${AMAP_KEY}&city=${adcode}&extensions=all`).then((r) => r.json()),
  ]);

  if (baseData.status !== '1') throw new Error(getAmapErrorMessage(baseData.info, baseData.infocode));
  if (baseData.info === 'OK' && !baseData.lives?.length) throw new Error('天气数据为空, 请稍后重试');
  if (allData.status !== '1') throw new Error(getAmapErrorMessage(allData.info, allData.infocode));

  const live = baseData.lives?.[0];
  const forecast = allData.forecasts?.[0];
  if (!live || !forecast) throw new Error('天气数据为空');

  const casts = forecast.casts || [];

  return {
    temp: parseInt(live.temperature) || 0,
    feelsLike: parseInt(live.temperature) || 0,
    humidity: parseInt(live.humidity) || 0,
    windSpeed: windPowerToSpeed(live.windpower),
    description: live.weather || '未知',
    icon: getWeatherEmoji(live.weather || ''),
    cityName: live.city || '未知',
    cityAdcode: adcode,
    tempMin: casts[0] ? parseInt(casts[0].nighttemp) : parseInt(live.temperature) || 0,
    tempMax: casts[0] ? parseInt(casts[0].daytemp) : parseInt(live.temperature) || 0,
    forecast: casts.slice(0, 5).map((c: { date: string; dayweather: string; nighttemp: string; daytemp: string }) => ({
      day: getDayName(c.date),
      icon: getWeatherEmoji(c.dayweather),
      tempMin: parseInt(c.nighttemp) || 0,
      tempMax: parseInt(c.daytemp) || 0,
      description: c.dayweather || '未知',
    })),
    source: 'manual',
  };
}

export async function fetchWeatherByCoords(
  lat: number,
  lon: number,
  source: 'gps' | 'balanced' = 'gps',
): Promise<WeatherData> {
  const adcode = await getAdcodeByCoords(lat, lon);
  const data = await fetchWeatherByAdcode(adcode);
  data.source = source;
  return data;
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const data = await fetchWeatherByCityRaw(city);
  data.source = 'manual';
  return data;
}

async function fetchWeatherByCityRaw(city: string): Promise<WeatherData> {
  const adcode = await getAdcodeByCity(city);
  return fetchWeatherByAdcode(adcode);
}

/** 高德 IP 定位 → adcode → 天气数据（不需要权限） */
export async function fetchWeatherByIP(): Promise<WeatherData> {
  const url = `https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1') throw new Error(getAmapErrorMessage(data.info, data.infocode));
  if (!data.adcode) throw new Error('IP 定位未获取到城市信息');
  const weather = await fetchWeatherByAdcode(data.adcode);
  weather.source = 'ip';
  return weather;
}

export type WeatherCacheKey = string;

/** 根据城市名或 adcode 生成缓存 key */
export function getCacheKey(cityAdcode: string, source: WeatherSource): string {
  return `${cityAdcode}_${source}`;
}
