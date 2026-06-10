import { useState, useRef, useEffect } from 'react'
import { searchCity, GeocodingResult } from '../lib/openmeteo'
import { useLang } from '../context/LangContext'

interface Props {
  onSelect: (loc: GeocodingResult) => void
}

export default function SearchBar({ onSelect }: Props) {
  const { lang, t } = useLang()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); setOpen(false); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      const res = await searchCity(query, lang)
      setResults(res)
      setOpen(res.length > 0)
      setActiveIdx(-1)
      setSearching(false)
    }, 280)
  }, [query, lang])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (loc: GeocodingResult) => {
    setQuery(`${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}, ${loc.country}`)
    setOpen(false)
    setActiveIdx(-1)
    onSelect(loc)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = activeIdx >= 0 ? results[activeIdx] : results[0]
      if (target) select(target)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  return (
    <div className="search-wrap" ref={containerRef}>
      <div className="search-field">
        <svg className="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className="search-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-activedescendant={activeIdx >= 0 ? `search-opt-${activeIdx}` : undefined}
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {searching && <span className="search-spinner" aria-hidden="true" />}
      </div>
      {open && (
        <ul className="search-dropdown" role="listbox">
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`search-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`search-option${i === activeIdx ? ' active' : ''}`}
              onMouseDown={() => select(r)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="option-name">
                {r.name}{r.admin1 ? `, ${r.admin1}` : ''}
              </span>
              <span className="option-country">{r.country_code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
