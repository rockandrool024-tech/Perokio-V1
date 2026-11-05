'use client'

/**
 * useLiveViews — single source of truth for a video's live view count.
 *
 * §1 BLOCKING PATCH (Cycle 5d):
 *   Both WL01 (Wallet) and B17 (Results) must render identical numbers
 *   for the same video at every tick. This hook replaces the independent
 *   liveDollars/liveViews state that was in wallet.tsx.
 *
 * Implementation:
 *   - One Zustand store holds a map of videoId → liveViews
 *   - The store itself manages the ticking interval (not the component)
 *   - When any component calls useLiveViews(videoId), the store starts
 *     ticking that video if it hasn't already
 *   - Both WL01 and B17 call useLiveViews(videoId) → same selector → same number
 *
 * The "snapshot vs live" distinction no longer exists in the codebase.
 */

import { create } from 'zustand'
import { useEffect } from 'react'
import { VIDEOS, CPM_RATE } from '@/lib/perokio/data'

// ============================================================================
// Zustand store — map of videoId → live view count
// The store manages its own ticking timers, independent of component lifecycle.
// ============================================================================
interface LiveViewsState {
  viewsByVideo: Record<string, number>
  activeVideoIds: Set<string>
  tick: (videoId: string) => void
  register: (videoId: string) => void
  unregister: (videoId: string) => void
}

// Initialize from the mock data's static view counts
const initialState: Record<string, number> = {}
for (const v of VIDEOS) {
  initialState[v.id] = v.views
}

// Module-level timer map — the store manages ticking, not components.
const timers: Record<string, ReturnType<typeof setTimeout>> = {}

const useLiveViewsStore = create<LiveViewsState>((set, get) => ({
  viewsByVideo: initialState,
  activeVideoIds: new Set(),

  tick: (videoId) =>
    set((state) => {
      const current = state.viewsByVideo[videoId] ?? 0
      const video = VIDEOS.find((v) => v.id === videoId)
      if (!video) return state
      if (current >= video.viewCap) return state
      const increment = Math.floor(Math.random() * 37) + 3
      const next = Math.min(video.viewCap, current + increment)
      return {
        viewsByVideo: {
          ...state.viewsByVideo,
          [videoId]: next,
        },
      }
    }),

  register: (videoId) => {
    const state = get()
    if (state.activeVideoIds.has(videoId)) return // already ticking

    // Add to active set
    set((s) => ({ activeVideoIds: new Set(s.activeVideoIds).add(videoId) }))

    // Start ticking this video
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 2000 // 3-5s
      timers[videoId] = setTimeout(() => {
        get().tick(videoId)
        scheduleNext()
      }, delay)
    }
    scheduleNext()
  },

  unregister: (videoId) => {
    const state = get()
    const newActive = new Set(state.activeVideoIds)
    newActive.delete(videoId)
    set({ activeVideoIds: newActive })

    // Clear the timer
    if (timers[videoId]) {
      clearTimeout(timers[videoId])
      delete timers[videoId]
    }
  },
}))

// ============================================================================
// useLiveViews — the hook both WL01 and B17 consume
// ============================================================================
export function useLiveViews(videoId: string | null | undefined): number {
  const views = useLiveViewsStore((s) => (videoId ? s.viewsByVideo[videoId] ?? 0 : 0))

  useEffect(() => {
    if (!videoId) return
    useLiveViewsStore.getState().register(videoId)
    return () => useLiveViewsStore.getState().unregister(videoId)
  }, [videoId])

  return views
}

// ============================================================================
// useLiveEarnings — derived hook: earningsBase + (liveViews / 1000) * CPM_RATE
// Both WL01 and B17 call this with the same videoId → identical number.
// ============================================================================
export function useLiveEarnings(videoId: string | null | undefined): {
  views: number
  cpmEarned: number
  totalEarned: number
  baseFee: number
  viewCap: number
  progress: number // 0-1
} {
  const views = useLiveViews(videoId)
  const video = VIDEOS.find((v) => v.id === videoId)

  if (!video) {
    return { views: 0, cpmEarned: 0, totalEarned: 0, baseFee: 0, viewCap: 0, progress: 0 }
  }

  const baseFee = video.earningsBase
  const cpmEarned = (views / 1000) * CPM_RATE
  const totalEarned = baseFee + cpmEarned
  const progress = video.viewCap > 0 ? views / video.viewCap : 0

  return { views, cpmEarned, totalEarned, baseFee, viewCap: video.viewCap, progress }
}
