// Perokio global state — role switching / active resources / UI state / language

import { create } from 'zustand'

import type { Role, FactBundle, Video } from '@/lib/perokio/types'
import type { Lang } from '@/lib/perokio/i18n'
import { FACTS, VIDEOS, CREATORS } from '@/lib/perokio/data'

type BrandView = 'command' | 'machine' | 'script' | 'library' | 'review' | 'billing' | 'feed' | 'detail'
type CreatorView = 'wall' | 'claim' | 'wallet' | 'profile'
type AdminView = 'pipeline' | 'vetting' | 'qa' | 'trends' | 'monitor' | 'authoring'

interface PerokioState {
  // Role & navigation
  role: Role
  brandView: BrandView
  creatorView: CreatorView
  adminView: AdminView

  // Language (EN source / AR rtl)
  lang: Lang

  // Active resources
  activeFactId: string | null
  activeVideoId: string | null
  activeBrandId: string

  // Mutation counter — bumps on every in-place data mutation so subscribed views re-render
  walletTick: number

  // Actions
  setRole: (role: Role) => void
  setBrandView: (v: BrandView) => void
  setCreatorView: (v: CreatorView) => void
  setAdminView: (v: AdminView) => void
  setLang: (lang: Lang) => void
  setActiveFact: (id: string | null) => void
  setActiveVideo: (id: string | null) => void
  setActiveBrand: (id: string) => void

  // Business operations
  claimFact: (factId: string, creatorId: string) => void
  lockVideo: (factId: string, creatorId: string) => string | null  // returns new/existing videoId
  approveVideo: (videoId: string) => void
  publishVideo: (videoId: string) => void
  settleVideo: (videoId: string) => void
  approveScriptLine: (factId: string, lineId: string, sourceId: string) => void
}

export const usePerokioStore = create<PerokioState>((set) => ({
  role: 'brand',
  brandView: 'command',
  creatorView: 'wall',
  adminView: 'pipeline',
  lang: 'en',
  activeFactId: null,
  activeVideoId: null,
  activeBrandId: 'br_zitouna',
  walletTick: 0,

  setRole: (role) => set({ role }),
  setBrandView: (brandView) => set({ brandView }),
  setCreatorView: (creatorView) => set({ creatorView }),
  setAdminView: (adminView) => set({ adminView }),
  setLang: (lang) => set({ lang }),
  setActiveFact: (activeFactId) => set({ activeFactId }),
  setActiveVideo: (activeVideoId) => set({ activeVideoId }),
  setActiveBrand: (activeBrandId) =>
    set((s) => ({
      activeBrandId,
      // Reset the active fact when switching brands so Script Review falls back
      // to the first fact of the newly selected brand.
      activeFactId: null,
      walletTick: s.walletTick + 1,
    })),

  claimFact: (factId, creatorId) => {
    const fact = FACTS.find((f) => f.id === factId)
    if (!fact) return
    if (fact.claimedBy.includes(creatorId)) return
    if (fact.claimedBy.length >= fact.maxCreators) return
    fact.claimedBy.push(creatorId)
    fact.status = 'claimed'
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },

  // E2E: Creator locks the video → either updates an existing video or creates a new one
  // Sets stage='locked_pending', reviewDeadline=12, marks fact.status='locked'
  lockVideo: (factId, creatorId) => {
    const fact = FACTS.find((f) => f.id === factId)
    if (!fact) return null
    const creator = CREATORS.find((c) => c.id === creatorId)
    if (!creator) return null

    let video = VIDEOS.find((v) => v.factId === factId && v.creatorId === creatorId)
    if (!video) {
      const newId = `vid_${Date.now()}`
      video = {
        id: newId,
        factId: fact.id,
        factCode: fact.code,
        factClaim: fact.claim,
        brandName: fact.brandName,
        creatorId: creator.id,
        creatorName: creator.name,
        creatorAvatar: creator.avatar,
        stage: 'locked_pending',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        lockedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        durationSec: fact.scriptLines.reduce((s, l) => s + l.durationSec, 0),
        thumbnail: fact.assets[0]?.thumb ?? '🎬',
        platform: creator.platform,
        views: 0,
        viewCap: 10000,
        earningsBase: fact.baseFee,
        earningsCpm: 0,
        reviewDeadline: 12,
        approved: false,
      }
      VIDEOS.push(video)
    } else {
      video.stage = 'locked_pending'
      video.reviewDeadline = 12
      video.lockedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
    fact.status = 'locked'
    set((s) => ({ walletTick: s.walletTick + 1 }))
    return video.id
  },

  approveVideo: (videoId) => {
    const v = VIDEOS.find((x) => x.id === videoId)
    if (!v) return
    v.stage = 'approved_queued'
    v.approved = true
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },

  publishVideo: (videoId) => {
    const v = VIDEOS.find((x) => x.id === videoId)
    if (!v) return
    v.stage = 'published'
    v.publishedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    // E2E: mark the underlying fact as PRINTED when its video gets published
    const fact = FACTS.find((f) => f.id === v.factId)
    if (fact && ['approved', 'locked'].includes(fact.status)) {
      fact.status = 'printed'
    }
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },

  settleVideo: (videoId) => {
    const v = VIDEOS.find((x) => x.id === videoId)
    if (!v) return
    v.stage = 'settled'
    v.views = v.viewCap
    v.earningsCpm = (v.viewCap / 1000) * 3
    // E2E: mark the underlying fact as PAID once the video settles
    const fact = FACTS.find((f) => f.id === v.factId)
    if (fact && fact.status === 'printed') {
      fact.status = 'paid'
    }
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },

  approveScriptLine: (factId, lineId, sourceId) => {
    const fact = FACTS.find((f) => f.id === factId)
    if (!fact) return
    const line = fact.scriptLines.find((l) => l.id === lineId)
    if (!line) return
    line.sourceId = sourceId
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },
}))

// Derived selectors — subscribe to walletTick so in-place mutations re-render.
export function useActiveFact(): FactBundle | null {
  const id = usePerokioStore((s) => s.activeFactId)
  usePerokioStore((s) => s.walletTick)
  return FACTS.find((f) => f.id === id) || null
}

export function useActiveVideo(): Video | null {
  const id = usePerokioStore((s) => s.activeVideoId)
  usePerokioStore((s) => s.walletTick)
  return VIDEOS.find((v) => v.id === id) || null
}
