import { useState, useCallback, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import ArtTab from './components/ArtTab'
import ChartsTab from './components/ChartsTab'
import { LangProvider, useLang } from './context/LangContext'
import type { Lang } from './lib/i18n'
import { GeocodingResult, WeatherData, fetchYearWeather } from './lib/openmeteo'

type Tab = 'art' | 'charts'
const MAX_YEAR = new Date().getFullYear() - 1
const LANGS: Lang[] = ['en', 'es', 'lat']

function AppInner() {
  const { lang, setLang, t } = useLang()
  const [location, setLocation] = useState<GeocodingResult | null>(null)
  const [year, setYear] = useState(MAX_YEAR)
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('art')

  const syncUrl = useCallback((loc: GeocodingResult, yr: number) => {
    const p = new URLSearchParams({
      lat: String(loc.latitude),
      lng: String(loc.longitude),
      name: loc.name,
      country: loc.country,
      cc: loc.country_code,
      year: String(yr),
    })
    if (loc.admin1) p.set('admin1', loc.admin1)
    history.replaceState(null, '', `?${p.toString()}`)
  }, [])

  const load = useCallback(async (loc: GeocodingResult, yr: number) => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchYearWeather(loc.latitude, loc.longitude, yr))
      setTab('art')
      syncUrl(loc, yr)
    } catch {
      setError(t.errorMsg)
    } finally {
      setLoading(false)
    }
  }, [t.errorMsg, syncUrl])

  const handleSelect = useCallback((loc: GeocodingResult) => {
    setLocation(loc)
    load(loc, year)
  }, [year, load])

  const handleYear = useCallback((delta: number) => {
    const next = year + delta
    if (next < 1950 || next > MAX_YEAR) return
    setYear(next)
    if (location) load(location, next)
  }, [year, location, load])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const lat = parseFloat(p.get('lat') ?? '')
    const lng = parseFloat(p.get('lng') ?? '')
    const name = p.get('name')
    const country = p.get('country')
    const cc = p.get('cc')
    const yr = parseInt(p.get('year') ?? '', 10)
    if (!isNaN(lat) && !isNaN(lng) && name && country && cc) {
      const loc: GeocodingResult = {
        id: 0,
        latitude: lat,
        longitude: lng,
        name,
        country,
        country_code: cc,
        admin1: p.get('admin1') ?? undefined,
      }
      const resolvedYear = !isNaN(yr) && yr >= 1950 && yr <= MAX_YEAR ? yr : MAX_YEAR
      setLocation(loc)
      setYear(resolvedYear)
      load(loc, resolvedYear)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const locationLabel = location
    ? `${location.name}${location.admin1 ? `, ${location.admin1}` : ''} · ${location.country}`
    : null

  return (
    <div className="app">
      <header className="header">
        <div className="header-row">
          <h1 className="logo">stratum</h1>
          <div className="controls">
            <SearchBar onSelect={handleSelect} />
            <div className="year-picker">
              <button className="year-arrow" onClick={() => handleYear(-1)} disabled={year <= 1950} aria-label="Previous year">‹</button>
              <span className="year-val">{year}</span>
              <button className="year-arrow" onClick={() => handleYear(1)} disabled={year >= MAX_YEAR} aria-label="Next year">›</button>
            </div>
            <div className="lang-switcher">
              {LANGS.map(l => (
                <button
                  key={l}
                  className={`lang-btn ${lang === l ? 'active' : ''}`}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {locationLabel && (
          <div className="sub-row">
            <span className="location-label">{locationLabel}</span>
            <div className="tabs">
              <button className={`tab ${tab === 'art' ? 'active' : ''}`} onClick={() => setTab('art')}>
                {t.tabVisual}
              </button>
              <button className={`tab ${tab === 'charts' ? 'active' : ''}`} onClick={() => setTab('charts')}>
                {t.tabCharts}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="main">
        {!location && !loading && (
          <div className="empty">
            <div className="empty-glyph">◈</div>
            <p>{t.emptyState}</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loading-track"><div className="loading-fill" /></div>
            <p>{t.loadingState}</p>
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}

        {data && !loading && (
          tab === 'art'
            ? <ArtTab data={data} city={location!.name} country={location!.country} year={year} />
            : <ChartsTab data={data} />
        )}
      </main>

      <footer className="footer">
        <span>{t.footerData} <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a></span>
        <span>{t.footerBuilt} <a href="https://christianecg.com" target="_blank" rel="noopener noreferrer">christianecg.com</a></span>
        <span><a href="https://avelor.es" target="_blank" rel="noopener noreferrer">avelor.es</a></span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  )
}
