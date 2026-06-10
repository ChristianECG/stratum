/**
 * Generates public/og/stratum.png from a programmatic SVG.
 * Simulates a northern-hemisphere temperate year (Madrid-ish climate).
 * Run: pnpm gen-og
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public', 'og')

// ── Palette (same as colorScale.ts "scientific") ──────────────────────────────
const STOPS = [
  { t: 0,    r: 4,   g: 12,  b: 40  },
  { t: 0.14, r: 10,  g: 60,  b: 160 },
  { t: 0.28, r: 0,   g: 155, b: 200 },
  { t: 0.42, r: 20,  g: 170, b: 110 },
  { t: 0.56, r: 230, g: 210, b: 40  },
  { t: 0.72, r: 240, g: 110, b: 20  },
  { t: 0.86, r: 210, g: 35,  b: 20  },
  { t: 1,    r: 110, g: 0,   b: 25  },
]

function lerp(a, b, t) { return a + (b - a) * t }

function tempToRgb(t) {
  t = Math.max(0, Math.min(1, t))
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i].t) {
      const p = STOPS[i - 1], c = STOPS[i]
      const lt = (t - p.t) / (c.t - p.t)
      return [Math.round(lerp(p.r, c.r, lt)), Math.round(lerp(p.g, c.g, lt)), Math.round(lerp(p.b, c.b, lt))]
    }
  }
  const last = STOPS.at(-1)
  return [last.r, last.g, last.b]
}

// ── Simulated year (northern hemisphere, ~Madrid climate) ────────────────────
const DAYS = 365

function seeded(s) {
  let v = s
  return () => { v = (Math.imul(v, 1664525) + 1013904223) | 0; return (v >>> 0) / 0xffffffff }
}

const days = Array.from({ length: DAYS }, (_, i) => {
  const phase = (i / DAYS) * Math.PI * 2 - Math.PI / 2
  const rand = seeded(i * 7919 + 31337)
  const base = 13 + 16 * Math.sin(phase)
  const noise = (rand() - 0.5) * 5 + (rand() - 0.5) * 3
  const tMean = base + noise
  const range = 7 + 5 * Math.abs(Math.sin(phase)) + rand() * 3
  const precip = rand() < (0.15 + 0.1 * Math.cos(phase + Math.PI)) ? rand() * 35 : 0
  return { tMax: tMean + range / 2, tMin: tMean - range / 2, precip }
})

const allT = days.flatMap(d => [d.tMax, d.tMin])
const minT = Math.min(...allT)
const maxT = Math.max(...allT)
const maxP = Math.max(1, ...days.map(d => d.precip))
const tRange = maxT - minT || 1

// ── Layout ────────────────────────────────────────────────────────────────────
const W = 1200, H = 630
const H_ART = 452, H_CAP = H - H_ART
const PAD = 32
const stripeW = W / DAYS

// ── Build defs & stripe elements ─────────────────────────────────────────────
const gradDefs = days.map((d, i) => {
  const [rt, gt, bt] = tempToRgb((d.tMax - minT) / tRange)
  const [rb, gb, bb] = tempToRgb((d.tMin - minT) / tRange)
  return `<linearGradient id="g${i}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="rgb(${rt},${gt},${bt})"/>` +
    `<stop offset="100%" stop-color="rgb(${rb},${gb},${bb})"/>` +
    `</linearGradient>`
}).join('\n    ')

const stripeRects = days.map((_, i) => {
  const x = (i * stripeW).toFixed(2)
  const w = (stripeW + 0.6).toFixed(2)
  return `<rect x="${x}" y="0" width="${w}" height="${H_ART}" fill="url(#g${i})"/>`
}).join('\n      ')

// Precipitation streaks
const precipLines = days.flatMap((d, i) => {
  if (d.precip < 1) return []
  const intensity = Math.min(d.precip / maxP, 1)
  const count = Math.max(1, Math.floor(intensity * 8))
  const maxLen = H_ART * (0.25 + intensity * 0.55)
  const rand = seeded(i * 7919 + 31337)
  return Array.from({ length: count }, () => {
    const bx = i * stripeW
    const x1 = (bx + rand() * stripeW).toFixed(2)
    const dx = ((rand() - 0.5) * 2).toFixed(2)
    const y2 = (maxLen * (0.45 + rand() * 0.55)).toFixed(1)
    const alpha = (0.12 + intensity * 0.32).toFixed(2)
    return `<line x1="${x1}" y1="0" x2="${parseFloat(x1) + parseFloat(dx)}" y2="${y2}" stroke="rgba(130,200,255,${alpha})" stroke-width="0.8" stroke-linecap="round"/>`
  })
}).join('\n      ')

// Month markers
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const MONTH_STARTS = [0,31,59,90,120,151,181,212,243,273,304,334]

const monthLines = MONTH_STARTS.slice(1).map(d => {
  const x = (d * stripeW).toFixed(1)
  return `<line x1="${x}" y1="0" x2="${x}" y2="${H_ART - 32}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`
}).join('\n      ')

const monthLabels = MONTH_STARTS.map((d, m) => {
  const x = (d * stripeW + 5).toFixed(1)
  return `<text x="${x}" y="${H_ART - 11}" font-family="Inter,system-ui,sans-serif" font-size="10.5" font-weight="600" fill="rgba(255,255,255,0.22)" letter-spacing="0.4">${MONTHS_SHORT[m]}</text>`
}).join('\n      ')

// Color scale stops string
const scaleStops = STOPS.map(s =>
  `<stop offset="${(s.t * 100).toFixed(0)}%" stop-color="rgb(${s.r},${s.g},${s.b})"/>`
).join('')

const scaleX = W - PAD - 210

// ── Assemble SVG ─────────────────────────────────────────────────────────────
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradDefs}
    <linearGradient id="scaleGrad" x1="0" y1="0" x2="1" y2="0">${scaleStops}</linearGradient>
    <radialGradient id="vig" cx="50%" cy="50%" r="70%">
      <stop offset="45%" stop-color="#07070d" stop-opacity="0"/>
      <stop offset="100%" stop-color="#07070d" stop-opacity="0.78"/>
    </radialGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(70,110,195,0.20)"/>
      <stop offset="100%" stop-color="rgba(70,110,195,0)"/>
    </linearGradient>
    <filter id="blur" x="-3%" width="106%" y="0%" height="100%">
      <feGaussianBlur stdDeviation="2.3 0"/>
    </filter>
    <filter id="grain" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.66" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <!-- Base -->
  <rect width="${W}" height="${H}" fill="#07070d"/>

  <!-- Stripes (blurred) -->
  <g filter="url(#blur)">
    ${stripeRects}
  </g>

  <!-- Sky overlay -->
  <rect x="0" y="0" width="${W}" height="${(H_ART * 0.38).toFixed(0)}" fill="url(#sky)"/>

  <!-- Precipitation -->
  ${precipLines}

  <!-- Vignette -->
  <rect x="0" y="0" width="${W}" height="${H_ART}" fill="url(#vig)"/>

  <!-- Film grain -->
  <rect x="0" y="0" width="${W}" height="${H_ART}" filter="url(#grain)" opacity="0.05"/>

  <!-- Month separators -->
  ${monthLines}

  <!-- Month labels -->
  ${monthLabels}

  <!-- Caption panel -->
  <rect x="0" y="${H_ART}" width="${W}" height="${H_CAP}" fill="#08080f"/>
  <line x1="0" y1="${H_ART}" x2="${W}" y2="${H_ART}" stroke="#1c1c2e" stroke-width="1"/>

  <!-- App name -->
  <text x="${PAD}" y="${H_ART + 54}"
    font-family="Inter,system-ui,sans-serif" font-size="42" font-weight="200"
    fill="#dcdcf0" letter-spacing="-0.5">stratum</text>

  <!-- Tagline -->
  <text x="${PAD}" y="${H_ART + 78}"
    font-family="Inter,system-ui,sans-serif" font-size="10.5" font-weight="500"
    fill="#44445e" letter-spacing="2.2">CLIMATE AS ART · OPEN-METEO DATA</text>

  <!-- Description -->
  <text x="${PAD}" y="${H_ART + 102}"
    font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="300"
    fill="#4a4a64">Each stripe is one day — color encodes temperature, blue streaks are rain, golden tint is sunshine.</text>

  <!-- Color scale bar -->
  <rect x="${scaleX}" y="${H_ART + 30}" width="210" height="8" rx="4" fill="url(#scaleGrad)"/>
  <text x="${scaleX}" y="${H_ART + 50}"
    font-family="Inter,system-ui,sans-serif" font-size="10" fill="#52526e">Cold</text>
  <text x="${scaleX + 105}" y="${H_ART + 50}" text-anchor="middle"
    font-family="Inter,system-ui,sans-serif" font-size="10" fill="#52526e">Mild</text>
  <text x="${scaleX + 210}" y="${H_ART + 50}" text-anchor="end"
    font-family="Inter,system-ui,sans-serif" font-size="10" fill="#52526e">Hot</text>

  <!-- URL -->
  <text x="${W - PAD}" y="${H - 14}" text-anchor="end"
    font-family="Inter,system-ui,sans-serif" font-size="10.5" font-weight="500"
    fill="#2a2a42" letter-spacing="1.4">STRATUM.CHRISTIANECG.COM</text>
</svg>`

// ── Write & rasterize ─────────────────────────────────────────────────────────
mkdirSync(outDir, { recursive: true })

const resvg = new Resvg(svg, {
  font: { loadSystemFonts: false },
  fitTo: { mode: 'width', value: W },
})
const png = resvg.render().asPng()
writeFileSync(join(outDir, 'stratum.png'), png)
console.log(`✓ public/og/stratum.png  (${W}×${H})`)
