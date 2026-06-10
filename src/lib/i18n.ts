export type Lang = 'en' | 'es' | 'lat'

export interface Translations {
  // UI chrome
  searchPlaceholder: string
  tabVisual: string
  tabCharts: string
  emptyState: string
  loadingState: string
  errorMsg: string
  // Footer
  footerData: string
  footerBuilt: string
  // Caption inside SVG
  descLines: [string, string, string]
  cold: string
  mild: string
  hot: string
  rain: string
  sunshine: string
  paletteLabel: string
  stripeWidthNote: string
  // Chart labels
  chartTemp: string
  chartTempSub: string
  chartPrecip: string
  chartPrecipSub: string
  chartWind: string
  chartWindSub: string
  tooltipAvg: string
  tooltipRange: string
  // Date
  monthsLong: string[]
  monthsShort: string[]
}

const en: Translations = {
  searchPlaceholder: 'Search any city…',
  tabVisual: 'Visual',
  tabCharts: 'Charts',
  emptyState: 'Search for any city to generate its climate portrait',
  loadingState: 'Fetching climate data…',
  errorMsg: 'Could not fetch weather data. Try again.',
  footerData: 'Weather data by',
  footerBuilt: 'Built by',
  descLines: [
    'Each stripe represents one day. The vertical gradient encodes the temperature',
    'range — top edge is the daily high, bottom is the low. Blue streaks show',
    'precipitation intensity; a golden tint marks hours of direct sunshine.',
  ],
  cold: 'Cold',
  mild: 'Mild',
  hot: 'Hot',
  rain: 'Rain',
  sunshine: 'Sunshine',
  paletteLabel: 'Palette',
  stripeWidthNote: 'Stripe width ∝ daily temperature range',
  chartTemp: 'Temperature',
  chartTempSub: 'daily min / max range  ·  °C',
  chartPrecip: 'Precipitation',
  chartPrecipSub: 'monthly total  ·  mm',
  chartWind: 'Wind',
  chartWindSub: 'daily max  ·  km/h',
  tooltipAvg: 'avg',
  tooltipRange: 'Range',
  monthsLong:  ['January','February','March','April','May','June','July','August','September','October','November','December'],
  monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
}

const es: Translations = {
  searchPlaceholder: 'Buscar ciudad…',
  tabVisual: 'Visual',
  tabCharts: 'Gráficas',
  emptyState: 'Busca cualquier ciudad para generar su retrato climático',
  loadingState: 'Cargando datos climáticos…',
  errorMsg: 'No se pudieron obtener los datos. Inténtalo de nuevo.',
  footerData: 'Datos climáticos por',
  footerBuilt: 'Creado por',
  descLines: [
    'Cada franja representa un día. El gradiente vertical codifica el rango de',
    'temperatura — borde superior: máximo diario, inferior: mínimo. Las líneas',
    'azules muestran lluvia; un tinte dorado indica horas de sol directo.',
  ],
  cold: 'Frío',
  mild: 'Templado',
  hot: 'Calor',
  rain: 'Lluvia',
  sunshine: 'Sol',
  paletteLabel: 'Paleta',
  stripeWidthNote: 'Ancho de franja ∝ rango térmico diario',
  chartTemp: 'Temperatura',
  chartTempSub: 'rango diario min / max  ·  °C',
  chartPrecip: 'Precipitación',
  chartPrecipSub: 'total mensual  ·  mm',
  chartWind: 'Viento',
  chartWindSub: 'máximo diario  ·  km/h',
  tooltipAvg: 'prom',
  tooltipRange: 'Rango',
  monthsLong:  ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthsShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
}

const lat: Translations = {
  searchPlaceholder: 'Urbem quaere…',
  tabVisual: 'Visuale',
  tabCharts: 'Tabulae',
  emptyState: 'Urbem quaere ad imaginem climatis generandam',
  loadingState: 'Data climatis petuntur…',
  errorMsg: 'Data climatis obtineri non potuerunt. Iterum tempta.',
  footerData: 'Data per',
  footerBuilt: 'Factum ab',
  descLines: [
    'Quaeque linea unum diem repraesentat. Gradus coloris ambitum temperaturae',
    'indicat — margo summus maximum diei, imus minimum. Lineae caeruleae',
    'pluviam ostendunt; tinctura aurea horas solis directi notat.',
  ],
  cold: 'Frigidum',
  mild: 'Temperatum',
  hot: 'Calidum',
  rain: 'Pluvia',
  sunshine: 'Sol',
  paletteLabel: 'Chroma',
  stripeWidthNote: 'Latitudo lineae ∝ ambitus temperaturae diurnae',
  chartTemp: 'Temperatura',
  chartTempSub: 'ambitus diurnus  ·  °C',
  chartPrecip: 'Pluvia',
  chartPrecipSub: 'summa mensilis  ·  mm',
  chartWind: 'Ventus',
  chartWindSub: 'maximum diurnum  ·  km/h',
  tooltipAvg: 'med.',
  tooltipRange: 'Ambitus',
  monthsLong:  ['Ianuarius','Februarius','Martius','Aprilis','Maius','Iunius','Iulius','Augustus','September','October','November','December'],
  monthsShort: ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'],
}

export const translations: Record<Lang, Translations> = { en, es, lat }
