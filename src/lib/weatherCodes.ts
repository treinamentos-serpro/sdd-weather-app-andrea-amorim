interface WeatherCondition {
  label: string;
  icon: string;
}

const weatherConditions: Partial<Record<number, WeatherCondition>> = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Predominantemente limpo', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Nevoeiro', icon: '🌫️' },
  48: { label: 'Nevoeiro com geada', icon: '🌫️' },
  51: { label: 'Garoa leve', icon: '🌦️' },
  53: { label: 'Garoa moderada', icon: '🌦️' },
  55: { label: 'Garoa intensa', icon: '🌦️' },
  56: { label: 'Garoa congelante leve', icon: '🌨️' },
  57: { label: 'Garoa congelante intensa', icon: '🌨️' },
  61: { label: 'Chuva leve', icon: '🌧️' },
  63: { label: 'Chuva moderada', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '🌧️' },
  66: { label: 'Chuva congelante leve', icon: '🌨️' },
  67: { label: 'Chuva congelante forte', icon: '🌨️' },
  71: { label: 'Neve leve', icon: '❄️' },
  73: { label: 'Neve moderada', icon: '❄️' },
  75: { label: 'Neve intensa', icon: '❄️' },
  77: { label: 'Grãos de neve', icon: '❄️' },
  80: { label: 'Pancadas de chuva leves', icon: '🌦️' },
  81: { label: 'Pancadas de chuva moderadas', icon: '🌧️' },
  82: { label: 'Pancadas de chuva fortes', icon: '🌧️' },
  85: { label: 'Pancadas de neve leves', icon: '🌨️' },
  86: { label: 'Pancadas de neve fortes', icon: '🌨️' },
  95: { label: 'Tempestade', icon: '⛈️' },
  96: { label: 'Tempestade com granizo leve', icon: '⛈️' },
  99: { label: 'Tempestade com granizo forte', icon: '⛈️' },
};

export function getWeatherCondition(
  code: number | null | undefined,
  isDay: boolean | null = null,
): WeatherCondition {
  if (typeof code !== 'number' || !Number.isFinite(code)) {
    return { label: '—', icon: '❔' };
  }
  const condition = weatherConditions[code];
  if (!condition) return { label: 'Condição desconhecida', icon: '❔' };
  if (isDay === false && (code === 0 || code === 1)) {
    return { ...condition, icon: '🌙' };
  }
  return condition;
}
