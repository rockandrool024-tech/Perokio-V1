// Pure formatters — usable on both server and client.
// The live-views hook (usePerokioLiveViews) lives in live.ts which is 'use client'.

// 把秒数格式化为 HH:MM:SS
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// 货币格式化
export function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

export function formatTND(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatCompact(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}
