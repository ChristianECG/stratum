interface Stop { t: number; r: number; g: number; b: number }

export type Palette = 'scientific' | 'monochrome' | 'aurora' | 'neon' | 'ocean'

const SCIENTIFIC: Stop[] = [
  { t: 0,    r: 4,   g: 12,  b: 40  },
  { t: 0.14, r: 10,  g: 60,  b: 160 },
  { t: 0.28, r: 0,   g: 155, b: 200 },
  { t: 0.42, r: 20,  g: 170, b: 110 },
  { t: 0.56, r: 230, g: 210, b: 40  },
  { t: 0.72, r: 240, g: 110, b: 20  },
  { t: 0.86, r: 210, g: 35,  b: 20  },
  { t: 1,    r: 110, g: 0,   b: 25  },
]

const MONOCHROME: Stop[] = [
  { t: 0,    r: 8,   g: 10,  b: 18  },
  { t: 0.33, r: 55,  g: 57,  b: 72  },
  { t: 0.66, r: 155, g: 155, b: 162 },
  { t: 1,    r: 238, g: 235, b: 228 },
]


// Noche / Aurora: medianoche índigo → verde aurora → cian → magenta → rosa vívido
const AURORA: Stop[] = [
  { t: 0,    r: 8,   g: 4,   b: 30  },
  { t: 0.18, r: 28,  g: 10,  b: 72  },
  { t: 0.38, r: 0,   g: 130, b: 120 },
  { t: 0.55, r: 0,   g: 195, b: 175 },
  { t: 0.70, r: 170, g: 35,  b: 155 },
  { t: 0.86, r: 238, g: 55,  b: 155 },
  { t: 1,    r: 255, g: 115, b: 175 },
]

// Neón: casi negro → azul eléctrico → cian → lima → naranja → magenta
const NEON: Stop[] = [
  { t: 0,    r: 5,   g: 5,   b: 15  },
  { t: 0.18, r: 0,   g: 55,  b: 215 },
  { t: 0.38, r: 0,   g: 215, b: 195 },
  { t: 0.55, r: 185, g: 235, b: 0   },
  { t: 0.72, r: 255, g: 130, b: 0   },
  { t: 0.87, r: 255, g: 25,  b: 75  },
  { t: 1,    r: 250, g: 0,   b: 155 },
]

// Oceánico: océano profundo → azul marino → teal tropical → espuma → arena cálida
const OCEAN: Stop[] = [
  { t: 0,    r: 2,   g: 8,   b: 22  },
  { t: 0.2,  r: 0,   g: 28,  b: 80  },
  { t: 0.42, r: 0,   g: 88,  b: 128 },
  { t: 0.60, r: 0,   g: 162, b: 168 },
  { t: 0.76, r: 55,  g: 198, b: 158 },
  { t: 0.90, r: 198, g: 172, b: 78  },
  { t: 1,    r: 218, g: 125, b: 48  },
]

const ALL_PALETTES: Record<Palette, Stop[]> = {
  scientific: SCIENTIFIC,
  monochrome: MONOCHROME,
  aurora:     AURORA,
  neon:       NEON,
  ocean:      OCEAN,
}

export const PALETTE_LABELS: Record<Palette, string> = {
  scientific: 'Scientific',
  monochrome: 'Mono',
  aurora:     'Aurora',
  neon:       'Neon',
  ocean:      'Ocean',
}

export interface ScaleStop { offset: string; color: string }

export function getPaletteScaleStops(palette: Palette): ScaleStop[] {
  return ALL_PALETTES[palette].map(s => ({
    offset: `${(s.t * 100).toFixed(0)}%`,
    color: `rgb(${s.r},${s.g},${s.b})`,
  }))
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function stopsToRgb(stops: Stop[], t: number): [number, number, number] {
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1]!
    const curr = stops[i]!
    if (t <= curr.t) {
      const lt = (t - prev.t) / (curr.t - prev.t)
      return [
        Math.round(lerp(prev.r, curr.r, lt)),
        Math.round(lerp(prev.g, curr.g, lt)),
        Math.round(lerp(prev.b, curr.b, lt)),
      ]
    }
  }
  const last = stops[stops.length - 1]!
  return [last.r, last.g, last.b]
}

export function tempToRgb(
  temp: number,
  minTemp: number,
  maxTemp: number,
  palette: Palette = 'scientific',
): [number, number, number] {
  const range = maxTemp - minTemp || 1
  const t = Math.max(0, Math.min(1, (temp - minTemp) / range))
  return stopsToRgb(ALL_PALETTES[palette], t)
}
