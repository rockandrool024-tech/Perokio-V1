// Perokio global state — role switching / active resources / UI state / language
//
// PHASE 1 INTEGRATION: This store now delegates to the real NestJS API
// when the user is authenticated (JWT present). The mock-data fallback
// remains for demo mode (when not logged in).
//
// The key insight: every business action checks `getAccessToken()`. If a
// token exists, the action calls the real API endpoint. If not, it falls
// back to the in-memory mock mutation (so the UI still works in demo mode).

import { create } from 'zustand'

import type { Role, FactBundle, Video } from '@/lib/perokio/types'
import type { Lang } from '@/lib/perokio/i18n'
import { FACTS, VIDEOS, CREATORS } from '@/lib/perokio/data'
import {
  getAccessToken, authApi, factsApi, scriptsApi, claimsApi,
  distributionApi, adminApi, ApiError,
} from '@/lib/perokio/api-client'

type BrandView = 'command' | 'machine' | 'script' | 'library' | 'review' | 'billing' | 'feed' | 'detail' | 'queue' | 'results' | 'next' | 'settings'
type CreatorView = 'wall' | 'factdetail' | 'claimconfirm' | 'claim' | 'lockconfirm' | 'prints' | 'profile' | 'profile-edit' | 'wallet' | 'notifications'
type AdminView = 'pipeline' | 'vetting' | 'qa' | 'trends' | 'monitor' | 'authoring' | 'quality' | 'leadmagnet'

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

  // Live data cache (fetched from API)
  liveFacts: FactBundle[]
  loadingFacts: boolean

  // Campaign Studio state — tracks the active campaign lifecycle
  campaignStudioOpen: boolean
  campaignPhase: 1 | 2 | 3  // 1=Link, 2=Edit, 3=Monitor
  activeCampaign: {
    id: string | null
    shortlink: string | null       // e.g., "pero.to/spicy-chicken"
    pageContent: {
      headline: string
      subhead: string
      ctaText: string
      socialProof: string
      heroImageR2Key: string | null
    } | null
    funnelData: {
      views: number
      clicks: number
      pageViews: number
      orders: number
      revenueCents: number
    } | null
  }

  // Actions
  setRole: (role: Role) => void
  setBrandView: (v: BrandView) => void
  setCreatorView: (v: CreatorView) => void
  setAdminView: (v: AdminView) => void
  setLang: (lang: Lang) => void
  setActiveFact: (id: string | null) => void
  setActiveVideo: (id: string | null) => void
  setActiveBrand: (id: string) => void

  // Campaign Studio actions
  openCampaignStudio: (phase?: 1 | 2 | 3) => void
  closeCampaignStudio: () => void
  setCampaignPhase: (phase: 1 | 2 | 3) => void
  setCampaignShortlink: (slug: string) => void
  saveCampaignPage: (content: { headline: string; subhead: string; ctaText: string; socialProof: string }) => void
  setCampaignFunnel: (data: { views: number; clicks: number; pageViews: number; orders: number; revenueCents: number }) => void
  hasActiveCampaign: () => boolean

  // Data fetching
  fetchFacts: (brandId?: string) => Promise<void>

  // Business operations — these delegate to the real API when authenticated
  claimFact: (factId: string, creatorId: string) => Promise<string | null>
  lockVideo: (factId: string, creatorId: string) => Promise<string | null>
  approveVideo: (videoId: string) => Promise<void>
  publishVideo: (videoId: string) => Promise<void>
  settleVideo: (videoId: string) => Promise<void>
  approveScriptLine: (factId: string, lineId: string, sourceId: string) => Promise<void>
  approveScript: (scriptVersionId: string) => Promise<{ success: boolean; hash?: string; error?: string }>
  rateVideo: (videoId: string, data: { brandSafety: boolean; scriptMatch: boolean; craft: number; hook: number }) => Promise<boolean>
}

/** Check if we're in live mode (user authenticated with a real JWT) */
function isLiveMode(): boolean {
  return !!getAccessToken()
}

export const usePerokioStore = create<PerokioState>((set, get) => ({
  role: 'brand',
  brandView: 'command',
  creatorView: 'wall',
  adminView: 'pipeline',
  lang: 'en',
  activeFactId: null,
  activeVideoId: null,
  activeBrandId: 'br_zitouna',
  walletTick: 0,
  liveFacts: [],
  loadingFacts: false,

  // Campaign Studio initial state — no active campaign
  campaignStudioOpen: false,
  campaignPhase: 1,
  activeCampaign: {
    id: null,
    shortlink: null,
    pageContent: null,
    funnelData: null,
  },

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
      activeFactId: null,
      walletTick: s.walletTick + 1,
    })),

  // ============================================================================
  // Campaign Studio actions — the Link & Page Lifecycle
  // ============================================================================

  openCampaignStudio: (phase = 1) => {
    set((s) => ({
      campaignStudioOpen: true,
      campaignPhase: phase,
      // If opening at Phase 1 (Create), reset the active campaign
      // If opening at Phase 3 (Monitor), keep the existing campaign
      activeCampaign: phase === 1
        ? { id: null, shortlink: null, pageContent: null, funnelData: null }
        : s.activeCampaign,
    }))
  },

  closeCampaignStudio: () => set({ campaignStudioOpen: false }),

  setCampaignPhase: (phase) => set({ campaignPhase: phase }),

  setCampaignShortlink: (slug) => {
    set((s) => ({
      activeCampaign: {
        ...s.activeCampaign,
        shortlink: `pero.to/${slug}`,
        id: s.activeCampaign.id || `camp_${Date.now()}`,
      },
      walletTick: s.walletTick + 1,
    }))
  },

  saveCampaignPage: (content) => {
    set((s) => ({
      activeCampaign: {
        ...s.activeCampaign,
        pageContent: {
          ...content,
          heroImageR2Key: s.activeCampaign.pageContent?.heroImageR2Key || null,
        },
        id: s.activeCampaign.id || `camp_${Date.now()}`,
      },
      walletTick: s.walletTick + 1,
    }))
  },

  setCampaignFunnel: (data) => {
    set((s) => ({
      activeCampaign: {
        ...s.activeCampaign,
        funnelData: data,
      },
      walletTick: s.walletTick + 1,
    }))
  },

  hasActiveCampaign: () => {
    return get().activeCampaign.id !== null
  },

  // ============================================================================
  // fetchFacts — fetches from GET /api/facts (live) or uses mock data (demo)
  // ============================================================================

  fetchFacts: async (brandId) => {
    if (!isLiveMode()) {
      // Demo mode — use mock data, no API call
      set((s) => ({ walletTick: s.walletTick + 1 }))
      return
    }

    set({ loadingFacts: true })
    try {
      const facts = await factsApi.list(brandId)
      set({ liveFacts: facts, loadingFacts: false, walletTick: get().walletTick + 1 })
    } catch (e) {
      console.error('[fetchFacts] API error:', e)
      set({ loadingFacts: false })
    }
  },

  // ============================================================================
  // claimFact — POST /api/facts/:factId/claim (creates Claim + Video + 24h BullMQ timer)
  // ============================================================================

  claimFact: async (factId, creatorId) => {
    if (isLiveMode()) {
      try {
        const result = await claimsApi.claimFact(factId)
        // The API creates a Claim + Video + pushes a BullMQ lock-expiry job (24h)
        set((s) => ({ walletTick: s.walletTick + 1 }))
        return result.video.id
      } catch (e) {
        console.error('[claimFact] API error:', e)
        return null
      }
    }

    // Demo mode fallback (mock mutation)
    const fact = FACTS.find((f) => f.id === factId)
    if (!fact) return null
    if (fact.claimedBy.includes(creatorId)) return null
    if (fact.claimedBy.length >= fact.maxCreators) return null
    fact.claimedBy.push(creatorId)
    fact.status = 'claimed'
    set((s) => ({ walletTick: s.walletTick + 1 }))
    return null
  },

  // ============================================================================
  // lockVideo — POST /api/videos/:videoId/lock (conditional SQL + 12h review timer)
  // ============================================================================

  lockVideo: async (factId, creatorId) => {
    if (isLiveMode()) {
      // In live mode, we need the videoId from the claim
      // The claim endpoint already created the video
      try {
        // Find the video for this fact + creator (from the claim result)
        // For V1, we use a mock r2Key (the MP4 upload is mocked)
        const r2Key = `r2://videos/${factId}_${Date.now()}.mp4`
        const transcript = 'Transcript placeholder — matches the verified script'

        // We need the videoId. In a real flow, the claim endpoint returns it.
        // For now, we'll call lock with a videoId from the claim.
        // The UI component should pass the videoId from the claim result.
        // This is a fallback that creates a mock video if needed.
        const mockVideoId = `vid_${Date.now()}`
        const result = await claimsApi.lockVideo(mockVideoId, r2Key, transcript)
        set((s) => ({ walletTick: s.walletTick + 1 }))
        return mockVideoId
      } catch (e) {
        console.error('[lockVideo] API error:', e)
        return null
      }
    }

    // Demo mode fallback (mock mutation)
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
        clicks: 0,
        shortlink: '',
        successScore: 0,
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

  // ============================================================================
  // approveVideo — POST /admin/videos/:id/rate (brandSafety + scriptMatch gates)
  // In the backend, "approving" a video = rating it with both gates = true
  // ============================================================================

  approveVideo: async (videoId) => {
    if (isLiveMode()) {
      try {
        // Rate with both gates passing + default scores
        await adminApi.rateVideo(videoId, {
          brandSafety: true,
          scriptMatch: true,
          craft: 4,
          hook: 5,
          notes: 'Auto-approved from B12 Video Review',
        })
        set((s) => ({ walletTick: s.walletTick + 1 }))
        return
      } catch (e) {
        console.error('[approveVideo] API error:', e)
        return
      }
    }

    // Demo mode fallback
    const v = VIDEOS.find((x) => x.id === videoId)
    if (!v) return
    v.stage = 'approved_queued'
    v.approved = true
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },

  // ============================================================================
  // publishVideo — POST /distribution/publish/:videoId (Postiz mock + 24h settle timer)
  // ============================================================================

  publishVideo: async (videoId) => {
    if (isLiveMode()) {
      try {
        await distributionApi.publish(videoId)
        set((s) => ({ walletTick: s.walletTick + 1 }))
        return
      } catch (e) {
        console.error('[publishVideo] API error:', e)
        return
      }
    }

    // Demo mode fallback
    const v = VIDEOS.find((x) => x.id === videoId)
    if (!v) return
    v.stage = 'published'
    v.publishedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const fact = FACTS.find((f) => f.id === v.factId)
    if (fact && ['approved', 'locked'].includes(fact.status)) {
      fact.status = 'printed'
    }
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },

  // ============================================================================
  // settleVideo — POST /distribution/videos/:videoId/settle (24h view window + ledger)
  // ============================================================================

  settleVideo: async (videoId) => {
    if (isLiveMode()) {
      try {
        await distributionApi.settle(videoId)
        set((s) => ({ walletTick: s.walletTick + 1 }))
        return
      } catch (e) {
        console.error('[settleVideo] API error:', e)
        return
      }
    }

    // Demo mode fallback
    const v = VIDEOS.find((x) => x.id === videoId)
    if (!v) return
    v.stage = 'settled'
    v.views = v.viewCap
    v.earningsCpm = (v.viewCap / 1000) * 3
    const fact = FACTS.find((f) => f.id === v.factId)
    if (fact && fact.status === 'printed') {
      fact.status = 'paid'
    }
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },

  // ============================================================================
  // approveScriptLine — POST /admin/lines/:lineId/verify (human verifies a line)
  // ============================================================================

  approveScriptLine: async (factId, lineId, sourceId) => {
    if (isLiveMode()) {
      try {
        await scriptsApi.verifyLine(lineId, sourceId)
        set((s) => ({ walletTick: s.walletTick + 1 }))
        return
      } catch (e) {
        console.error('[approveScriptLine] API error:', e)
        return
      }
    }

    // Demo mode fallback
    const fact = FACTS.find((f) => f.id === factId)
    if (!fact) return
    const line = fact.scriptLines.find((l) => l.id === lineId)
    if (!line) return
    line.sourceId = sourceId
    set((s) => ({ walletTick: s.walletTick + 1 }))
  },

  // ============================================================================
  // approveScript — POST /scripts/:scriptVersionId/approve (THE B11 GATE)
  //
  // This is the critical action. The backend physically blocks approval if ANY
  // ScriptLine has verified = false. Returns 400 B11_VERIFICATION_FAILED.
  // On success, returns a VerificationReceipt with a SHA-256 hash.
  // ============================================================================

  approveScript: async (scriptVersionId) => {
    if (isLiveMode()) {
      try {
        const result = await scriptsApi.approve(scriptVersionId)
        set((s) => ({ walletTick: s.walletTick + 1 }))
        return { success: true, hash: result.hash }
      } catch (e: any) {
        // The B11 gate blocked the approval
        if (e instanceof ApiError && e.status === 400) {
          const detail = e.details
          return {
            success: false,
            error: detail?.message || 'B11_VERIFICATION_FAILED',
          }
        }
        return { success: false, error: e.message || 'Unknown error' }
      }
    }

    // Demo mode fallback — mock the gate check
    const fact = FACTS.find((f) =>
      f.scriptLines.some((l) => l.id === scriptVersionId)
    )
    const allVerified = fact?.scriptLines.every((l) => l.sourceId) ?? false
    if (!allVerified) {
      return { success: false, error: 'B11_VERIFICATION_FAILED' }
    }
    // Mock hash
    const hash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    set((s) => ({ walletTick: s.walletTick + 1 }))
    return { success: true, hash }
  },

  // ============================================================================
  // rateVideo — POST /admin/videos/:id/rate (pass/fail gates + weighted score)
  // ============================================================================

  rateVideo: async (videoId, data) => {
    if (isLiveMode()) {
      try {
        await adminApi.rateVideo(videoId, {
          ...data,
          notes: undefined,
        })
        set((s) => ({ walletTick: s.walletTick + 1 }))
        return true
      } catch (e) {
        console.error('[rateVideo] API error:', e)
        return false
      }
    }
    return true
  },
}))

// ============================================================================
// Derived selectors
// ============================================================================
// In live mode, these read from liveFacts (fetched from the API).
// In demo mode, they read from the mock FACTS/VIDEOS arrays.

export function useActiveFact(): FactBundle | null {
  const id = usePerokioStore((s) => s.activeFactId)
  usePerokioStore((s) => s.walletTick)
  const liveFacts = usePerokioStore((s) => s.liveFacts)

  // Try live data first, then fall back to mock
  const liveFact = liveFacts.find((f) => f.id === id)
  if (liveFact) return liveFact

  return FACTS.find((f) => f.id === id) || null
}

export function useActiveVideo(): Video | null {
  const id = usePerokioStore((s) => s.activeVideoId)
  usePerokioStore((s) => s.walletTick)
  return VIDEOS.find((v) => v.id === id) || null
}

/** Get the list of facts — live (from API) or mock (from data.ts) */
export function useFacts(): FactBundle[] {
  const liveFacts = usePerokioStore((s) => s.liveFacts)
  usePerokioStore((s) => s.walletTick)

  if (liveFacts.length > 0) return liveFacts
  return FACTS
}
