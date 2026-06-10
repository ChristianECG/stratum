export interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  country_code: string
  admin1?: string
}

export interface WeatherData {
  time: string[]
  temperature_2m_max: (number | null)[]
  temperature_2m_min: (number | null)[]
  temperature_2m_mean: (number | null)[]
  precipitation_sum: (number | null)[]
  wind_speed_10m_max: (number | null)[]
  sunshine_duration: (number | null)[]
}

export async function searchCity(query: string, lang = 'en'): Promise<GeocodingResult[]> {
  if (!query.trim()) return []
  // Open-Meteo geocoding supports ISO 639-1 codes; Latin falls back to English
  const apiLang = lang === 'lat' ? 'en' : lang
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=${apiLang}&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.results as GeocodingResult[]) ?? []
}

export async function fetchYearWeather(
  lat: number,
  lng: number,
  year: number,
): Promise<WeatherData> {
  const today = new Date()
  const endDate =
    year < today.getFullYear()
      ? `${year}-12-31`
      : today.toISOString().split('T')[0]

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    start_date: `${year}-01-01`,
    end_date: endDate,
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'precipitation_sum',
      'wind_speed_10m_max',
      'sunshine_duration',
    ].join(','),
    timezone: 'auto',
  })

  const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.daily as WeatherData
}
