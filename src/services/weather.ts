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

const CITY_MAP: Record<string, string> = {
  '北京': 'Beijing', '上海': 'Shanghai', '广州': 'Guangzhou', '深圳': 'Shenzhen',
  '杭州': 'Hangzhou', '成都': 'Chengdu', '武汉': 'Wuhan', '南京': 'Nanjing',
  '重庆': 'Chongqing', '西安': "Xi'an", '厦门': 'Xiamen', '长沙': 'Changsha',
  '天津': 'Tianjin', '苏州': 'Suzhou', '青岛': 'Qingdao', '大连': 'Dalian',
  '昆明': 'Kunming', '三亚': 'Sanya', '拉萨': 'Lhasa', '香港': 'Hong Kong',
  '台北': 'Taipei',
  '浦东': 'Pudong',
};

// 反向映射：拼音/英文 → 中文（用于 API 返回的城市名转中文）
const REVERSE_CITY_MAP: Record<string, string> = {
  ...Object.fromEntries(Object.entries(CITY_MAP).map(([cn, en]) => [en, cn])),
  'Pootung': '浦东',
};

function normalizeCity(city: string): string {
  return CITY_MAP[city.trim()] || city.trim();
}

function getDayName(dateStr: string): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date(dateStr).getDay()];
}

function wmoToEmoji(code: number): string {
  // WMO 天气代码 → emoji
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '❄️';
  if (code <= 99) return '⛈️';
  return '⛅';
}

export function getWeatherEmoji(iconCode: string): string {
  return iconCode || '⛅';
}

function parseWeatherResponse(data: any): WeatherData {
  const current = data.current_condition?.[0];
  if (!current) throw new Error('无法解析天气数据');

  const rawCityName = data.nearest_area?.[0]?.areaName?.[0]?.value || '未知';
  const cityName = REVERSE_CITY_MAP[rawCityName] || rawCityName;

  const forecast: ForecastDay[] = (data.weather || []).slice(0, 5).map((day: any) => ({
    day: getDayName(day.date),
    icon: wmoToEmoji(parseInt(day.hourly?.[0]?.weatherCode || '0')).toString(),
    tempMin: parseInt(day.mintempC),
    tempMax: parseInt(day.maxtempC),
    description: day.hourly?.[0]?.lang_zh?.[0]?.value || day.hourly?.[0]?.weatherDesc?.[0]?.value || '',
  }));

  return {
    temp: parseInt(current.temp_C),
    feelsLike: parseInt(current.FeelsLikeC),
    humidity: parseInt(current.humidity),
    windSpeed: Math.round(parseInt(current.windspeedKmph) / 3.6 * 10) / 10,
    description: current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '',
    icon: wmoToEmoji(parseInt(current.weatherCode || '0')).toString(),
    cityName,
    tempMin: parseInt(data.weather?.[0]?.mintempC || current.temp_C),
    tempMax: parseInt(data.weather?.[0]?.maxtempC || current.temp_C),
    forecast,
  };
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://wttr.in/${lat},${lon}?format=j1&lang=zh`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('获取天气失败');
  return parseWeatherResponse(await res.json());
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const url = `https://wttr.in/${encodeURIComponent(normalizeCity(city))}?format=j1&lang=zh`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('未找到该城市');
  return parseWeatherResponse(await res.json());
}
