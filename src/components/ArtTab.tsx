import { useRef, useMemo, useState } from 'react'
import { WeatherData } from '../lib/openmeteo'
import { tempToRgb, getPaletteScaleStops, PALETTE_LABELS, type Palette } from '../lib/colorScale'
import { useLang } from '../context/LangContext'

interface Props {
  data: WeatherData
  city: string
  country: string
  year: number
}

const H_ART      = 460
const H_CAP      = 154
const H          = H_ART + H_CAP
const BASE_W     = 4
const MIN_STRIPE = 2.2
const MAX_STRIPE = 6.8
const PAD        = 20

interface DayArt {
  i: number
  x: number
  w: number
  topColor: string
  botColor: string
  sunAlpha: number
  precipLines: { x: number; dx: number; len: number; alpha: number }[]
}

interface MonthMark  { month: number; x: number }
interface ExtremeDay { x: number; w: number; val: number }

function lcg(seed: number) {
  let s = seed
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }
}

function buildArt(data: WeatherData, palette: Palette) {
  const valid = [
    ...data.temperature_2m_max.filter((v): v is number => v !== null),
    ...data.temperature_2m_min.filter((v): v is number => v !== null),
  ]
  const minTemp   = Math.min(...valid)
  const maxTemp   = Math.max(...valid)
  const maxPrecip = Math.max(
    1,
    ...data.precipitation_sum.filter((v): v is number => v !== null && v > 0),
  )

  // Variable stripe widths (proportional to daily temp range)
  const ranges = data.time.map((_, i) => {
    const hi = data.temperature_2m_max[i]
    const lo = data.temperature_2m_min[i]
    return hi != null && lo != null ? Math.max(0, hi - lo) : 0
  })
  const maxRange  = Math.max(1, ...ranges)
  const rawWidths = ranges.map(r =>
    r === 0 ? BASE_W : MIN_STRIPE + (r / maxRange) * (MAX_STRIPE - MIN_STRIPE),
  )
  const rawTotal  = rawWidths.reduce((a, b) => a + b, 0)
  const wScale    = (data.time.length * BASE_W) / rawTotal
  const dayWidths = rawWidths.map(w => w * wScale)

  let cumX = 0
  const dayXs = dayWidths.map(w => { const x = cumX; cumX += w; return x })
  const W = cumX

  const days: DayArt[]    = []
  const marks: MonthMark[] = []
  let prevMonth = -1
  let hot:  ExtremeDay = { x: 0, w: BASE_W, val: -Infinity }
  let cold: ExtremeDay = { x: 0, w: BASE_W, val:  Infinity }
  let rain: ExtremeDay = { x: 0, w: BASE_W, val:  0 }

  data.time.forEach((date, i) => {
    const month  = parseInt(date.split('-')[1]!) - 1
    const x      = dayXs[i]!
    const w      = dayWidths[i]!

    if (month !== prevMonth) { marks.push({ month, x }); prevMonth = month }

    const tMax   = data.temperature_2m_max[i]
    const tMin   = data.temperature_2m_min[i]
    const tMean  = data.temperature_2m_mean[i]
    const precip = data.precipitation_sum[i] ?? 0
    const sun    = data.sunshine_duration[i] ?? 0

    if (tMax !== null && tMax > hot.val)  hot  = { x, w, val: tMax }
    if (tMin !== null && tMin < cold.val) cold = { x, w, val: tMin }
    if (precip > rain.val)                rain = { x, w, val: precip }

    if (tMean === null) {
      days.push({ i, x, w, topColor: '#07070d', botColor: '#07070d', sunAlpha: 0, precipLines: [] })
      return
    }

    const [rt, gt, bt] = tempToRgb(tMax ?? tMean, minTemp, maxTemp, palette)
    const [rb, gb, bb] = tempToRgb(tMin ?? tMean, minTemp, maxTemp, palette)
    const sunAlpha = sun / 3600 > 8 ? Math.min((sun / 3600 - 8) / 8, 1) * 0.14 : 0

    const precipLines: DayArt['precipLines'] = []
    if (precip > 0.5) {
      const intensity = Math.min(precip / maxPrecip, 1)
      const count  = Math.max(1, Math.floor(intensity * 11))
      const maxLen = H_ART * (0.22 + intensity * 0.58)
      const rand   = lcg(i * 7919 + 31337)
      for (let j = 0; j < count; j++) {
        precipLines.push({
          x:     rand() * w,
          dx:    (rand() - 0.5) * 1.8,
          len:   maxLen * (0.45 + rand() * 0.55),
          alpha: 0.11 + intensity * 0.34,
        })
      }
    }

    days.push({ i, x, w,
      topColor: `rgb(${rt},${gt},${bt})`,
      botColor: `rgb(${rb},${gb},${bb})`,
      sunAlpha, precipLines,
    })
  })

  return { W, days, marks, hot, cold, rain, minTemp, maxTemp }
}

export default function ArtTab({ data, city, country, year }: Props) {
  const { t } = useLang()
  const svgRef = useRef<SVGSVGElement>(null)
  const [palette, setPalette] = useState<Palette>('scientific')

  const { W, days, marks, hot, cold, rain, minTemp, maxTemp } =
    useMemo(() => buildArt(data, palette), [data, palette])

  const pfx = useMemo(
    () => `a${city.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}${year}`,
    [city, year],
  )

  const dateRange = useMemo(() => {
    const first = data.time[0] ?? ''
    const last  = data.time[data.time.length - 1] ?? ''
    const mS = t.monthsLong[parseInt(first.split('-')[1] ?? '1') - 1] ?? ''
    const mE = t.monthsLong[parseInt(last.split('-')[1]  ?? '12') - 1] ?? ''
    return mS === mE ? `${mS} ${year}` : `${mS} – ${mE} ${year}`
  }, [data, year, t])

  const scaleStops = useMemo(() => getPaletteScaleStops(palette), [palette])

  const gid     = (i: number) => `${pfx}g${i}`
  const idClip  = `${pfx}clip`
  const idVig   = `${pfx}vig`
  const idGrain = `${pfx}grain`
  const idScale = `${pfx}scale`
  const idBlur  = `${pfx}blur`
  const idSky   = `${pfx}sky`

  const scaleX = W - PAD - 200
  const scaleW = 200

  const downloadSVG = () => {
    const el = svgRef.current
    if (!el) return
    const blob = new Blob([new XMLSerializer().serializeToString(el)], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {
      download: `stratum-${city.toLowerCase().replace(/\s+/g, '-')}-${year}.svg`,
      href: url,
    }).click()
    URL.revokeObjectURL(url)
  }

  // Clone SVG with explicit dimensions and animation frozen at final state
  const frozenSvgUrl = () => {
    const el = svgRef.current
    if (!el) return null
    const clone = el.cloneNode(true) as SVGSVGElement
    // Explicit px dimensions so the browser knows intrinsic size when loaded as <img>
    clone.setAttribute('width', String(W))
    clone.setAttribute('height', String(H))
    const animate = clone.querySelector('animate[attributeName="width"]')
    if (animate) {
      const clipRect = animate.parentElement
      if (clipRect) clipRect.setAttribute('width', String(W))
      animate.remove()
    }
    return URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }),
    )
  }

  const downloadPNG = () => {
    const url = frozenSvgUrl()
    if (!url) return
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = W * 2; c.height = H * 2
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0, W * 2, H * 2)
      URL.revokeObjectURL(url)
      Object.assign(document.createElement('a'), {
        download: `stratum-${city.toLowerCase().replace(/\s+/g, '-')}-${year}.png`,
        href: c.toDataURL('image/png'),
      }).click()
    }
    img.src = url
  }

  const downloadPDF = () => {
    const url = frozenSvgUrl()
    if (!url) return
    const img = new Image()
    img.onload = () => {
      // Defer to next tick so browser doesn't freeze mid-interaction
      setTimeout(async () => {
        const c = document.createElement('canvas')
        c.width = W * 2; c.height = H * 2
        const ctx = c.getContext('2d')!
        // Fill canvas with SVG background color so PDF has no white bleed
        ctx.fillStyle = '#07070d'
        ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0, W * 2, H * 2)
        URL.revokeObjectURL(url)

        const { jsPDF } = await import('jspdf')
        const pageW = 297, pageH = 210, margin = 10
        const maxW  = pageW - margin * 2
        const maxH  = pageH - margin * 2
        const ratio = W / H
        let imgW = maxW
        let imgH = imgW / ratio
        if (imgH > maxH) { imgH = maxH; imgW = imgH * ratio }
        const x = (pageW - imgW) / 2
        const y = (pageH - imgH) / 2

        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
        // Fill PDF page with matching dark background
        pdf.setFillColor(7, 7, 13)
        pdf.rect(0, 0, pageW, pageH, 'F')
        pdf.addImage(c.toDataURL('image/png'), 'PNG', x, y, imgW, imgH)
        pdf.save(`stratum-${city.toLowerCase().replace(/\s+/g, '-')}-${year}.pdf`)
      }, 0)
    }
    img.src = url
  }

  return (
    <div className="art-tab">

      {/* Palette selector */}
      <div className="palette-selector">
        <span className="palette-label">{t.paletteLabel}</span>
        {(Object.keys(PALETTE_LABELS) as Palette[]).map(p => (
          <button
            key={p}
            className={`palette-btn ${palette === p ? 'active' : ''}`}
            onClick={() => setPalette(p)}
          >
            {PALETTE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="canvas-wrap">
        <svg
          ref={svgRef}
          key={`${pfx}-${palette}`}
          viewBox={`0 0 ${W} ${H}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '6px' }}
        >
          <defs>
            {/* Per-day temperature gradients */}
            {days.map(d => (
              <linearGradient key={d.i} id={gid(d.i)} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={d.topColor} />
                <stop offset="100%" stopColor={d.botColor} />
              </linearGradient>
            ))}

            {/* Dynamic color scale gradient */}
            <linearGradient id={idScale} x1="0" y1="0" x2="1" y2="0">
              {scaleStops.map(s => (
                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>

            {/* Vignette */}
            <radialGradient id={idVig} cx="50%" cy="50%" r="70%">
              <stop offset="45%"  stopColor="#07070d" stopOpacity={0} />
              <stop offset="100%" stopColor="#07070d" stopOpacity={0.72} />
            </radialGradient>

            {/* Film grain */}
            <filter id={idGrain} x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.66" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>

            {/* Horizontal blur (acuarela) */}
            <filter id={idBlur} x="-4%" width="108%" y="0%" height="100%">
              <feGaussianBlur stdDeviation="2.2 0" />
            </filter>

            {/* Sky gradient overlay */}
            <linearGradient id={idSky} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(70,110,195,0.18)" />
              <stop offset="100%" stopColor="rgba(70,110,195,0)" />
            </linearGradient>

            {/* Reveal animation clip */}
            <clipPath id={idClip}>
              <rect x={0} y={0} height={H} width={0}>
                <animate
                  attributeName="width"
                  from={0} to={W}
                  dur="2.4s" fill="freeze"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.22 0.1 0.25 1"
                />
              </rect>
            </clipPath>
          </defs>

          {/* ── Stripes background ── */}
          <rect x={0} y={0} width={W} height={H_ART} fill="#07070d" />

          {/* ── Weather stripes (animated reveal) ── */}
          <g clipPath={`url(#${idClip})`}>

            {/* Temperature bands with horizontal blur */}
            <g filter={`url(#${idBlur})`}>
              {days.map(d => (
                <rect key={d.i}
                  x={d.x} y={0} width={d.w} height={H_ART}
                  fill={`url(#${gid(d.i)})`}
                />
              ))}
              {/* Sunshine tints */}
              {days.filter(d => d.sunAlpha > 0).map(d => (
                <rect key={`s${d.i}`}
                  x={d.x} y={0} width={d.w} height={H_ART}
                  fill={`rgba(255,220,140,${d.sunAlpha})`}
                />
              ))}
            </g>

            {/* Sky zone overlay (top 38%) */}
            <rect x={0} y={0} width={W} height={H_ART * 0.38}
              fill={`url(#${idSky})`} />

            {/* Precipitation streaks */}
            {days.flatMap(d =>
              d.precipLines.map((ln, j) => (
                <line key={`${d.i}-${j}`}
                  x1={d.x + ln.x}          y1={0}
                  x2={d.x + ln.x + ln.dx}   y2={ln.len}
                  stroke={`rgba(130,200,255,${ln.alpha})`}
                  strokeWidth={0.85} strokeLinecap="round"
                />
              ))
            )}

            {/* Vignette */}
            <rect x={0} y={0} width={W} height={H_ART} fill={`url(#${idVig})`} />

            {/* Film grain */}
            <rect x={0} y={0} width={W} height={H_ART}
              filter={`url(#${idGrain})`} opacity={0.055} />

            {/* Month separators */}
            {marks.slice(1).map(({ month, x }) => (
              <line key={month}
                x1={x} y1={0} x2={x} y2={H_ART - 26}
                stroke="rgba(255,255,255,0.07)" strokeWidth={1}
              />
            ))}

            {/* Month labels */}
            {marks.map(({ month, x }) => (
              <text key={month}
                x={x + 4} y={H_ART - 10}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={600} fontSize={10}
                fill="white" fillOpacity={0.22} letterSpacing={0.3}
                style={{ userSelect: 'none' }}
              >{t.monthsShort[month]}</text>
            ))}

            {/* Extreme day annotations */}
            {/* Hottest */}
            <line x1={hot.x + hot.w / 2} y1={7} x2={hot.x + hot.w / 2} y2={24}
              stroke="rgba(255,185,100,0.72)" strokeWidth={1} strokeLinecap="round" />
            <text x={hot.x + hot.w / 2} y={5} textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif" fontWeight={700} fontSize={7.5}
              fill="rgba(255,185,100,0.65)" style={{ userSelect: 'none' }}
            >{hot.val.toFixed(0)}°</text>

            {/* Coldest */}
            <line x1={cold.x + cold.w / 2} y1={30} x2={cold.x + cold.w / 2} y2={47}
              stroke="rgba(140,200,255,0.72)" strokeWidth={1} strokeLinecap="round" />
            <text x={cold.x + cold.w / 2} y={28} textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif" fontWeight={700} fontSize={7.5}
              fill="rgba(140,200,255,0.65)" style={{ userSelect: 'none' }}
            >{cold.val.toFixed(0)}°</text>

            {/* Rainiest */}
            <line x1={rain.x + rain.w / 2} y1={53} x2={rain.x + rain.w / 2} y2={70}
              stroke="rgba(130,200,255,0.60)" strokeWidth={1} strokeLinecap="round" />
            <text x={rain.x + rain.w / 2} y={51} textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif" fontWeight={700} fontSize={7.5}
              fill="rgba(130,200,255,0.55)" style={{ userSelect: 'none' }}
            >{rain.val.toFixed(0)}mm</text>
          </g>

          {/* ── Caption panel ── */}
          <rect x={0} y={H_ART} width={W} height={H_CAP} fill="#08080f" />
          <line x1={0} y1={H_ART} x2={W} y2={H_ART} stroke="#1c1c2e" strokeWidth={1} />

          {/* City name — editorial large */}
          <text x={PAD} y={H_ART + 46}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={200} fontSize={30}
            fill="#dcdcf0" letterSpacing={-0.5}
            style={{ userSelect: 'none' }}
          >{city}</text>

          {/* Country · date range */}
          <text x={PAD} y={H_ART + 68}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={500} fontSize={9}
            fill="#44445e" letterSpacing={1.5}
            style={{ userSelect: 'none' }}
          >{`${country} · ${dateRange}`.toUpperCase()}</text>

          {/* Description lines */}
          <text fontFamily="Inter, system-ui, sans-serif"
            fontWeight={300} fontSize={10} fill="#4a4a64"
            style={{ userSelect: 'none' }}
          >
            <tspan x={PAD} y={H_ART + 87}>{t.descLines[0]}</tspan>
            <tspan x={PAD} dy={14}>{t.descLines[1]}</tspan>
            <tspan x={PAD} dy={14}>{t.descLines[2]}</tspan>
          </text>

          {/* Temp range footnote */}
          <text x={PAD} y={H - 13}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={400} fontSize={8.5}
            fill="#33334a" letterSpacing={0.3}
            style={{ userSelect: 'none' }}
          >{minTemp.toFixed(1)}° — {maxTemp.toFixed(1)}°C</text>

          {/* ── Right column: color scale ── */}
          <rect x={scaleX} y={H_ART + 26} width={scaleW} height={7} rx={3}
            fill={`url(#${idScale})`} />

          <text x={scaleX}              y={H_ART + 43} textAnchor="start"
            fontFamily="Inter, system-ui, sans-serif" fontWeight={400} fontSize={9.5}
            fill="#52526e" style={{ userSelect: 'none' }}>{t.cold}</text>
          <text x={scaleX + scaleW / 2} y={H_ART + 43} textAnchor="middle"
            fontFamily="Inter, system-ui, sans-serif" fontWeight={400} fontSize={9.5}
            fill="#52526e" style={{ userSelect: 'none' }}>{t.mild}</text>
          <text x={scaleX + scaleW}     y={H_ART + 43} textAnchor="end"
            fontFamily="Inter, system-ui, sans-serif" fontWeight={400} fontSize={9.5}
            fill="#52526e" style={{ userSelect: 'none' }}>{t.hot}</text>

          {/* Rain swatch */}
          <rect x={scaleX} y={H_ART + 58} width={40} height={7} rx={3}
            fill="rgba(130,200,255,0.55)" />
          <text x={scaleX + 46} y={H_ART + 65}
            fontFamily="Inter, system-ui, sans-serif" fontWeight={400} fontSize={9.5}
            fill="#52526e" style={{ userSelect: 'none' }}>{t.rain}</text>

          {/* Sunshine swatch */}
          <rect x={scaleX} y={H_ART + 74} width={40} height={7} rx={3}
            fill="rgba(255,220,140,0.50)" />
          <text x={scaleX + 46} y={H_ART + 81}
            fontFamily="Inter, system-ui, sans-serif" fontWeight={400} fontSize={9.5}
            fill="#52526e" style={{ userSelect: 'none' }}>{t.sunshine}</text>

          {/* Stripe width note */}
          <text x={scaleX} y={H_ART + 94}
            fontFamily="Inter, system-ui, sans-serif" fontWeight={300} fontSize={8.5}
            fill="#33334a" style={{ userSelect: 'none' }}>
            {t.stripeWidthNote}
          </text>

          {/* STRATUM branding */}
          <text x={W - PAD} y={H - 12} textAnchor="end"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={500} fontSize={9}
            fill="#2a2a42" letterSpacing={1.8}
            style={{ userSelect: 'none' }}
          >STRATUM</text>
        </svg>
      </div>

      {/* Download row */}
      <div className="art-actions">
        <button className="btn-download" onClick={downloadSVG}>
          <DownloadIcon /> SVG
        </button>
        <button className="btn-download" onClick={downloadPNG}>
          <DownloadIcon /> PNG 2×
        </button>
        <button className="btn-download" onClick={downloadPDF}>
          <DownloadIcon /> PDF
        </button>
      </div>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
      <path d="M8 2v8M5 7l3 3 3-3M2 12h12"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}
