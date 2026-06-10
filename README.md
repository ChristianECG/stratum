# Stratum — Climate as Art

Turn a full year of weather data into a generative stripe poster. Search any city, pick a year (1950–present), and get a visual art print you can download as SVG, PNG or PDF.

**Live → [stratum.christianecg.com](https://stratum.christianecg.com)**

## What it shows

Each vertical stripe is one day. The color gradient encodes the temperature range (top = daily high, bottom = low). Blue streaks indicate precipitation intensity; a golden tint marks hours of direct sunshine. Stripe width scales with the daily temperature swing.

The **Charts** tab shows daily temperature bands, monthly precipitation bars, and daily max wind speed.

## Stack

- React 18 + TypeScript + Vite
- [Apache ECharts](https://echarts.apache.org/) for the data charts
- [Open-Meteo](https://open-meteo.com/) — free, no API key required
- SVG rendered entirely in-browser; no server needed

## Local development

```bash
pnpm install
pnpm dev
```

## Deploy

Pushes to `main` automatically deploy to GitHub Pages via the included workflow (`.github/workflows/deploy.yml`). Enable GitHub Pages in repo **Settings → Pages → Source: GitHub Actions** before the first push.

## License

MIT
