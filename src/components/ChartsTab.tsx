import { useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { WeatherData } from '../lib/openmeteo'
import { useLang } from '../context/LangContext'

interface Props {
  data: WeatherData
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthlyPrecip(data: WeatherData): number[] {
  const totals = Array<number>(12).fill(0)
  data.time.forEach((date, i) => {
    const m = parseInt(date.split('-')[1]!) - 1
    totals[m] = (totals[m] ?? 0) + (data.precipitation_sum[i] ?? 0)
  })
  return totals.map(v => Math.round(v * 10) / 10)
}

const TITLE_STYLE = {
  color: '#ddddf0' as const,
  fontSize: 13,
  fontWeight: 400 as const,
  fontFamily: 'Inter, system-ui',
}

const BASE: EChartsOption = {
  backgroundColor: 'transparent',
  grid: { top: 48, right: 16, bottom: 36, left: 8, containLabel: true },
  tooltip: {
    backgroundColor: '#10101a',
    borderColor: '#1e1e2e',
    borderWidth: 1,
    textStyle: { color: '#ddddf0', fontSize: 12, fontFamily: 'Inter, system-ui' },
  },
}

function makeDailyXAxis(dates: string[]): EChartsOption['xAxis'] {
  return {
    type: 'category',
    data: dates,
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#1e1e2e' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#5a5a80',
      fontSize: 10,
      interval: (_index: number, value: string) =>
        value.endsWith('-01') || value.endsWith('-02'),
      formatter: (value: string) => {
        if (value.endsWith('-01') || value.endsWith('-02')) {
          return MONTHS[parseInt(value.split('-')[1]!) - 1] ?? ''
        }
        return ''
      },
    },
  }
}

function makeYAxis(formatter: string): EChartsOption['yAxis'] {
  return {
    type: 'value',
    axisLabel: { color: '#5a5a80', fontSize: 10, formatter },
    splitLine: { lineStyle: { color: '#181828', type: 'dashed' } },
    axisLine: { show: false },
    axisTick: { show: false },
  }
}

function EChart({ option, height }: { option: EChartsOption; height: string }) {
  const divRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!divRef.current) return
    chartRef.current = echarts.init(divRef.current)
    return () => { chartRef.current?.dispose() }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true })
  }, [option])

  useEffect(() => {
    const handler = () => chartRef.current?.resize()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return <div ref={divRef} style={{ height }} />
}

export default function ChartsTab({ data }: Props) {
  const { t } = useLang()
  const precip = monthlyPrecip(data)

  const tempOption: EChartsOption = {
    ...BASE,
    title: {
      text: t.chartTemp,
      subtext: t.chartTempSub,
      textStyle: TITLE_STYLE,
      subtextStyle: { color: '#5a5a80', fontSize: 11 },
      top: 6,
    },
    xAxis: makeDailyXAxis(data.time),
    yAxis: makeYAxis('{value}°'),
    series: [
      {
        name: 'min',
        type: 'line',
        data: data.temperature_2m_min,
        lineStyle: { opacity: 0 },
        stack: 'band',
        symbol: 'none',
        silent: true,
      },
      {
        name: 'range',
        type: 'line',
        data: data.temperature_2m_min.map((min, i) => {
          const max = data.temperature_2m_max[i]
          if (min === null || max === null) return null
          return Math.round((max - min) * 10) / 10
        }),
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 120, 60, 0.5)' },
            { offset: 1, color: 'rgba(60, 130, 220, 0.35)' },
          ]),
        },
        stack: 'band',
        symbol: 'none',
        silent: true,
      },
      {
        name: 'mean',
        type: 'line',
        data: data.temperature_2m_mean,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: 'rgba(255,255,255,0.65)', width: 1.2 },
        z: 10,
      },
    ],
    tooltip: {
      ...BASE.tooltip,
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params]
        const first = arr[0] as { dataIndex?: number } | undefined
        const idx = first?.dataIndex ?? 0
        const date = data.time[idx]
        const max = data.temperature_2m_max[idx]
        const min = data.temperature_2m_min[idx]
        const mean = data.temperature_2m_mean[idx]
        return `<div style="line-height:1.7;font-family:Inter,system-ui">
          <div style="color:#5a5a80;font-size:10px;margin-bottom:2px">${date}</div>
          <div>↑ ${max?.toFixed(1) ?? '—'}°  ↓ ${min?.toFixed(1) ?? '—'}°</div>
          <div style="color:#888">${t.tooltipAvg} ${mean?.toFixed(1) ?? '—'}°</div>
        </div>`
      },
    },
  }

  const precipOption: EChartsOption = {
    ...BASE,
    title: {
      text: t.chartPrecip,
      subtext: t.chartPrecipSub,
      textStyle: TITLE_STYLE,
      subtextStyle: { color: '#5a5a80', fontSize: 11 },
      top: 6,
    },
    xAxis: {
      type: 'category',
      data: MONTHS,
      axisLine: { lineStyle: { color: '#1e1e2e' } },
      axisTick: { show: false },
      axisLabel: { color: '#5a5a80', fontSize: 10 },
    },
    yAxis: makeYAxis('{value}mm'),
    series: [
      {
        type: 'bar',
        data: precip,
        barMaxWidth: 28,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(100, 190, 255, 0.85)' },
            { offset: 1, color: 'rgba(40, 100, 200, 0.35)' },
          ]),
          borderRadius: [3, 3, 0, 0],
        },
      },
    ],
    tooltip: {
      ...BASE.tooltip,
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params]
        const p = arr[0] as { axisValueLabel?: string; name?: string; value?: unknown } | undefined
        return `<div style="font-family:Inter,system-ui">
          <div style="color:#5a5a80;font-size:10px">${p?.axisValueLabel ?? p?.name ?? ''}</div>
          <div>${p?.value} mm</div>
        </div>`
      },
    },
  }

  const windOption: EChartsOption = {
    ...BASE,
    title: {
      text: t.chartWind,
      subtext: t.chartWindSub,
      textStyle: TITLE_STYLE,
      subtextStyle: { color: '#5a5a80', fontSize: 11 },
      top: 6,
    },
    xAxis: makeDailyXAxis(data.time),
    yAxis: makeYAxis('{value}'),
    series: [
      {
        type: 'line',
        data: data.wind_speed_10m_max,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: 'rgba(160, 180, 210, 0.6)', width: 1 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(140, 170, 210, 0.3)' },
            { offset: 1, color: 'rgba(140, 170, 210, 0.03)' },
          ]),
        },
      },
    ],
    tooltip: {
      ...BASE.tooltip,
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params]
        const p = arr[0] as { dataIndex?: number; value?: unknown } | undefined
        const idx = p?.dataIndex ?? 0
        return `<div style="font-family:Inter,system-ui">
          <div style="color:#5a5a80;font-size:10px">${data.time[idx]}</div>
          <div>${p?.value ?? '—'} km/h</div>
        </div>`
      },
    },
  }

  return (
    <div className="charts-tab">
      <div className="chart-card chart-tall">
        <EChart option={tempOption} height="300px" />
      </div>
      <div className="charts-row">
        <div className="chart-card">
          <EChart option={precipOption} height="230px" />
        </div>
        <div className="chart-card">
          <EChart option={windOption} height="230px" />
        </div>
      </div>
    </div>
  )
}
