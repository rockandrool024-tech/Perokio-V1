'use client'

import { useEffect, useState } from 'react'

// Re-export the pure formatters so existing imports from '@/lib/perokio/live' still work.
// New server-side code should import from '@/lib/perokio/format' instead.
export { formatDuration, formatUSD, formatTND, formatNumber, formatCompact } from './format'

// 全平台实时播放数 - 模拟 Tunisia Pilot 阶段
// 每 3-5 秒随机增长，用于 brand 端 command center
export function usePerokioLiveViews(initial = 184200) {
  const [views, setViews] = useState(initial)

  useEffect(() => {
    const tick = () => {
      const increment = Math.floor(Math.random() * 47) + 1
      setViews((v) => v + increment)
    }
    const timer = setInterval(tick, 3000 + Math.random() * 2000)
    return () => clearInterval(timer)
  }, [])

  return views
}
