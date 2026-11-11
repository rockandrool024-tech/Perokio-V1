// ============================================================================
// Perokio Live Data Store — fetches from the real NestJS backend
// ============================================================================
// This store mirrors the mock-data store's interface but calls the real API.
// The main store (perokio.ts) checks `useLiveDataStore.isLiveMode()` and
// delegates to this store when the user is authenticated.
// ============================================================================

import { create } from 'zustand'
import { factsApi, scriptsApi, claimsApi, adminApi, distributionApi, financeApi, harnessApi } from './api-client'
import type { FactBundle, Video } from './types'

interface LiveDataState {
  // Data cache
  facts: FactBundle[]
  activeFact: FactBundle | null
  activeVideo: Video | null
  scriptsInQa: any[]
  pipeline: any
  brandBalance: number  // cents
  creatorPending: number  // cents
  creatorWithdrawable: number  // cents

  // Loading states
  loadingFacts: boolean
  loadingScripts: boolean
  generating: boolean
  error: string | null

  // Mutation counter (same pattern as the mock store)
  liveTick: number

  // Actions
  fetchFacts: (brandId?: string) => Promise<void>
  fetchFact: (id: string) => Promise<void>
  fetchScriptsInQa: () => Promise<void>
  fetchPipeline: () => Promise<void>
  generateScript: (factId: string, configId: string) => Promise<any>
  verifyLine: (lineId: string, sourceId?: string) => Promise<void>
  approveScript: (scriptVersionId: string) => Promise<any>
  linkSourceToLine: (lineId: string, sourceId: string) => Promise<void>
  createSource: (data: { label: string; url: string; type: string }) => Promise<any>
  claimFact: (factId: string) => Promise<{ videoId: string; lockDeadline: string } | null>
  lockVideo: (videoId: string, r2Key: string, transcript?: string) => Promise<any>
  rateVideo: (videoId: string, data: { brandSafety: boolean; scriptMatch: boolean; craft: number; hook: number; notes?: string }) => Promise<any>
  publishVideo: (videoId: string) => Promise<any>
  settleVideo: (videoId: string) => Promise<any>
  ingestAnalytics: (videoId: string, views: number, clicks: number) => Promise<any>
  triggerTopUp: (brandId: string, amountCents: number) => Promise<any>
  getPipeline: () => Promise<any>
  clearError: () => void
}

export const useLiveDataStore = create<LiveDataState>((set, get) => ({
  facts: [],
  activeFact: null,
  activeVideo: null,
  scriptsInQa: [],
  pipeline: null,
  brandBalance: 0,
  creatorPending: 0,
  creatorWithdrawable: 0,

  loadingFacts: false,
  loadingScripts: false,
  generating: false,
  error: null,
  liveTick: 0,

  fetchFacts: async (brandId) => {
    set({ loadingFacts: true, error: null })
    try {
      const facts = await factsApi.list(brandId)
      set({ facts, loadingFacts: false, liveTick: get().liveTick + 1 })
    } catch (e: any) {
      set({ loadingFacts: false, error: e.message })
    }
  },

  fetchFact: async (id) => {
    try {
      const fact = await factsApi.get(id)
      set({ activeFact: fact, liveTick: get().liveTick + 1 })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchScriptsInQa: async () => {
    set({ loadingScripts: true, error: null })
    try {
      const scripts = await scriptsApi.listInQa()
      set({ scriptsInQa: scripts, loadingScripts: false, liveTick: get().liveTick + 1 })
    } catch (e: any) {
      set({ loadingScripts: false, error: e.message })
    }
  },

  fetchPipeline: async () => {
    try {
      const pipeline = await adminApi.getPipeline()
      set({ pipeline, liveTick: get().liveTick + 1 })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  generateScript: async (factId, configId) => {
    set({ generating: true, error: null })
    try {
      const result = await factsApi.generate(factId, configId)
      set({ generating: false, liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ generating: false, error: e.message })
      throw e
    }
  },

  verifyLine: async (lineId, sourceId) => {
    try {
      await scriptsApi.verifyLine(lineId, sourceId)
      set({ liveTick: get().liveTick + 1 })
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  approveScript: async (scriptVersionId) => {
    try {
      const result = await scriptsApi.approve(scriptVersionId)
      set({ liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  linkSourceToLine: async (lineId, sourceId) => {
    try {
      await scriptsApi.linkSource(lineId, sourceId)
      set({ liveTick: get().liveTick + 1 })
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  createSource: async (data) => {
    try {
      const source = await scriptsApi.createSource(data)
      set({ liveTick: get().liveTick + 1 })
      return source
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  claimFact: async (factId) => {
    try {
      const result = await claimsApi.claimFact(factId)
      set({ liveTick: get().liveTick + 1 })
      return {
        videoId: result.video.id,
        lockDeadline: result.lockDeadline,
      }
    } catch (e: any) {
      set({ error: e.message })
      return null
    }
  },

  lockVideo: async (videoId, r2Key, transcript) => {
    try {
      const result = await claimsApi.lockVideo(videoId, r2Key, transcript)
      set({ liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  rateVideo: async (videoId, data) => {
    try {
      const result = await adminApi.rateVideo(videoId, data)
      set({ liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  publishVideo: async (videoId) => {
    try {
      const result = await distributionApi.publish(videoId)
      set({ liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  settleVideo: async (videoId) => {
    try {
      const result = await distributionApi.settle(videoId)
      set({ liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  ingestAnalytics: async (videoId, views, clicks) => {
    try {
      const result = await distributionApi.ingestAnalytics(videoId, views, clicks)
      set({ liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  triggerTopUp: async (brandId, amountCents) => {
    try {
      const result = await financeApi.triggerStripeTopUp(brandId, amountCents)
      set({ liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  getPipeline: async () => {
    try {
      const result = await adminApi.getPipeline()
      set({ pipeline: result, liveTick: get().liveTick + 1 })
      return result
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  clearError: () => set({ error: null }),
}))
