// ============================================================================
// Perokio API Client — the bridge between the frontend and the NestJS backend
// ============================================================================
// Handles:
//   - JWT auth (access token in memory, refresh token in localStorage for dev)
//   - Typed fetch wrappers for all 39 API routes
//   - Automatic token refresh on 401
//   - Error normalization
//   - Backend → frontend type adapters
// ============================================================================

import type {
  Brand, Creator, FactBundle, Video, ScriptLine, VerifiedSource,
  Asset, Role,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

// ============================================================================
// Token management (in-memory for access, localStorage for refresh in dev)
// ============================================================================

let accessToken: string | null = null
let currentUserId: string | null = null
let currentUserRole: Role | null = null
let currentUserEmail: string | null = null

export function getAccessToken() { return accessToken }
export function getCurrentUser() {
  return currentUserId ? { id: currentUserId, email: currentUserEmail, role: currentUserRole } : null
}

function setTokens(access: string, refresh: string, user: { id: string; email: string; role: Role }) {
  accessToken = access
  currentUserId = user.id
  currentUserEmail = user.email
  currentUserRole = user.role
  if (typeof window !== 'undefined') {
    localStorage.setItem('perokio_refresh_token', refresh)
    localStorage.setItem('perokio_user', JSON.stringify(user))
  }
}

function clearTokens() {
  accessToken = null
  currentUserId = null
  currentUserEmail = null
  currentUserRole = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('perokio_refresh_token')
    localStorage.removeItem('perokio_user')
  }
}

export function tryRestoreSession(): boolean {
  if (typeof window === 'undefined') return false
  const refresh = localStorage.getItem('perokio_refresh_token')
  const userStr = localStorage.getItem('perokio_user')
  if (!refresh || !userStr) return false
  try {
    const user = JSON.parse(userStr)
    currentUserId = user.id
    currentUserEmail = user.email
    currentUserRole = user.role
    // We'll get a fresh access token on the next API call via refresh
    return true
  } catch { return false }
}

// ============================================================================
// Core fetch wrapper with auth + auto-refresh
// ============================================================================

async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // Auto-refresh on 401
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiFetch<T>(path, options, true)
    }
    // Refresh failed — clear session
    clearTokens()
    throw new ApiError('Session expired', 401)
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(error.message || `Request failed: ${res.status}`, res.status, error)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message)
    this.name = 'ApiError'
  }
}

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  async signup(email: string, password: string, role: string = 'brand_owner') {
    const data = await apiFetch<{ accessToken: string; refreshToken: string; user: { id: string; email: string; role: Role } }>(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify({ email, password, role }) },
    )
    setTokens(data.accessToken, data.refreshToken, data.user)
    return data
  },

  async login(email: string, password: string) {
    const data = await apiFetch<{ accessToken: string; refreshToken: string; user: { id: string; email: string; role: Role } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    )
    setTokens(data.accessToken, data.refreshToken, data.user)
    return data
  },

  async me() {
    return apiFetch<{ id: string; email: string; role: Role }>('/auth/me')
  },

  logout() {
    clearTokens()
  },
}

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const refresh = localStorage.getItem('perokio_refresh_token')
  if (!refresh) return false

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    if (!res.ok) return false
    const data = await res.json()
    accessToken = data.accessToken
    currentUserId = data.user.id
    currentUserEmail = data.user.email
    currentUserRole = data.user.role
    return true
  } catch {
    return false
  }
}

// ============================================================================
// Adapter functions — backend Prisma models → frontend types
// ============================================================================

function adaptFact(b: any): FactBundle {
  // Find the latest script version (if returned by the API)
  const sv = b.scriptVersions?.[0]
  return {
    id: b.id,
    code: `F-${b.id.slice(-8).toUpperCase()}`,
    claim: b.rawClaim || b.topic || 'Verified fact',
    claimAr: b.rawClaim || b.topic || 'تحقق من الحقيقة',
    brandId: b.brandId,
    brandName: b.brand?.name || 'Unknown Brand',
    status: adaptFactStatus(b.status),
    tier: b.tier as 'Hot' | 'Standard' | 'Premium',
    cpmRate: Math.round(b.cpmBudget / 100), // cents → dollars per 1k views
    baseFee: Math.round(b.baseFee / 100), // cents → dollars
    budgetCap: b.cpmBudget * 10, // rough conversion
    maxCreators: b.maxCreators,
    claimedBy: [], // Not returned by default — would need separate API call
    createdAt: new Date(b.createdAt).toISOString().slice(0, 16).replace('T', ' '),
    publishedAt: undefined,
    assets: [], // Assets not returned by default
    sources: sv?.lines?.flatMap((l: any) => l.sources?.map((s: any) => adaptSource(s.source)) || []) || [],
    scriptLines: sv?.lines?.map((l: any, i: number) => adaptScriptLine(l, i)) || [],
    rating: 4.5, // Default — not in backend model
    totalViews: 0, // Not returned by default
    trendTag: b.topic || 'Tunisia',
    lang: b.language as 'ar' | 'derja' | 'fr' | 'en',
    topic: b.topic || 'General',
  }
}

function adaptFactStatus(status: string): FactBundle['status'] {
  const map: Record<string, FactBundle['status']> = {
    draft: 'draft', funded: 'funded', live: 'live', claimed: 'claimed',
    in_edit: 'in_edit', locked: 'locked', approved: 'approved',
    printed: 'printed', paid: 'paid',
  }
  return map[status] || 'draft'
}

function adaptScriptLine(l: any, index: number): ScriptLine {
  return {
    id: l.id,
    text: l.text,
    sourceId: l.sources?.[0]?.sourceId, // First linked source
    durationSec: l.durationSec,
    isHook: l.isHook,
  }
}

function adaptSource(s: any): VerifiedSource {
  return {
    id: s.id,
    type: s.type as 'official' | 'news' | 'research' | 'brand_asset',
    label: s.label,
    url: s.url,
    verifiedAt: new Date(s.verifiedAt).toISOString().slice(0, 10),
    verifiedBy: s.verifiedBy,
  }
}

function adaptVideo(v: any): Video {
  return {
    id: v.id,
    factId: v.claim?.factId || '',
    factCode: `F-${(v.claim?.factId || '').slice(-8).toUpperCase()}`,
    factClaim: v.claim?.fact?.rawClaim || v.claim?.fact?.topic || '',
    brandName: v.claim?.fact?.brand?.name || '',
    creatorId: v.claim?.creatorId || '',
    creatorName: '', // Not in backend model — would need creator lookup
    creatorAvatar: '🎬',
    stage: adaptVideoStage(v.stage),
    createdAt: new Date(v.createdAt).toISOString().slice(0, 16).replace('T', ' '),
    lockedAt: v.lockedAt ? new Date(v.lockedAt).toISOString().slice(0, 16).replace('T', ' ') : undefined,
    publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString().slice(0, 16).replace('T', ' ') : undefined,
    durationSec: v.durationSec || 20,
    thumbnail: '🎬',
    platform: (v.platform || 'tiktok') as 'tiktok' | 'instagram' | 'youtube',
    views: 0, // From ViewSnapshot — not in video model
    viewCap: 10000,
    clicks: 0,
    shortlink: '',
    successScore: 0,
    earningsBase: v.claim?.fact?.baseFee ? Math.round(v.claim.fact.baseFee / 100) : 0,
    earningsCpm: 0,
    hoursToPublish: 0,
    reviewDeadline: v.reviewDeadline ? Math.ceil((new Date(v.reviewDeadline).getTime() - Date.now()) / (60 * 60 * 1000)) : undefined,
    approved: v.stage === 'approved_queued' || v.stage === 'published' || v.stage === 'settled',
  }
}

function adaptVideoStage(stage: string): Video['stage'] {
  const map: Record<string, Video['stage']> = {
    editing: 'editing',
    locked_pending: 'locked_pending',
    approved_queued: 'approved_queued',
    publishing: 'approved_queued',
    published: 'published',
    counting: 'published',
    settled: 'settled',
    publish_failed: 'drafting',
    held_factual_deviation: 'locked_pending',
  }
  return map[stage] || 'editing'
}

// ============================================================================
// Facts API
// ============================================================================

export const factsApi = {
  async list(brandId?: string): Promise<FactBundle[]> {
    const query = brandId ? `?brandId=${brandId}` : ''
    const data = await apiFetch<any[]>(`/facts${query}`)
    return data.map(adaptFact)
  },

  async get(id: string): Promise<FactBundle> {
    const data = await apiFetch<any>(`/facts/${id}`)
    return adaptFact(data)
  },

  async create(data: {
    brandId: string
    tier: string
    language: string
    topic?: string
    cpmBudget: number // cents
    baseFee: number // cents
    maxClaims?: number
    rawClaim?: string
    verifiedSources?: any[]
  }): Promise<FactBundle> {
    const result = await apiFetch<any>('/facts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return adaptFact(result)
  },

  async generate(factId: string, configId: string): Promise<any> {
    return apiFetch(`/facts/${factId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ configId }),
    })
  },
}

// ============================================================================
// Scripts API (B11 Moat)
// ============================================================================

export const scriptsApi = {
  async listInQa(): Promise<any[]> {
    return apiFetch<any[]>('/admin/scripts')
  },

  async addLine(scriptVersionId: string, data: { text: string; isHook?: boolean; durationSec?: number }): Promise<any> {
    return apiFetch(`/scripts/${scriptVersionId}/lines`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateLine(lineId: string, data: { text?: string; durationSec?: number }): Promise<any> {
    return apiFetch(`/scripts/lines/${lineId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async linkSource(lineId: string, sourceId: string): Promise<any> {
    return apiFetch(`/scripts/lines/${lineId}/sources/${sourceId}`, {
      method: 'POST',
    })
  },

  async unlinkSource(lineId: string, sourceId: string): Promise<any> {
    return apiFetch(`/scripts/lines/${lineId}/sources/${sourceId}`, {
      method: 'DELETE',
    })
  },

  async createSource(data: { label: string; url: string; type: string }): Promise<VerifiedSource> {
    const result = await apiFetch<any>('/scripts/sources', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return adaptSource(result)
  },

  async listSources(): Promise<VerifiedSource[]> {
    const data = await apiFetch<any[]>('/scripts/sources')
    return data.map(adaptSource)
  },

  async approve(scriptVersionId: string): Promise<{ approved: boolean; receiptId: string; hash: string; verifiedLines: number }> {
    return apiFetch(`/scripts/${scriptVersionId}/approve`, { method: 'POST' })
  },

  async verifyLine(lineId: string, sourceId?: string): Promise<any> {
    return apiFetch(`/admin/lines/${lineId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ sourceId }),
    })
  },
}

// ============================================================================
// Claims API (B3 Lifecycle)
// ============================================================================

export const claimsApi = {
  async claimFact(factId: string): Promise<{ claim: any; video: any; lockDeadline: string }> {
    return apiFetch(`/facts/${factId}/claim`, { method: 'POST' })
  },

  async lockVideo(videoId: string, r2Key: string, transcript?: string): Promise<any> {
    return apiFetch(`/videos/${videoId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ r2Key, transcript }),
    })
  },
}

// ============================================================================
// Admin API (B5)
// ============================================================================

export const adminApi = {
  async submitTranscript(videoId: string, transcript: string): Promise<any> {
    return apiFetch(`/admin/videos/${videoId}/transcript`, {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    })
  },

  async overrideDeviation(videoId: string, reason?: string): Promise<any> {
    return apiFetch(`/admin/videos/${videoId}/override-deviation`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  async rateVideo(videoId: string, data: {
    brandSafety: boolean
    scriptMatch: boolean
    craft: number
    hook: number
    notes?: string
  }): Promise<any> {
    return apiFetch(`/admin/videos/${videoId}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getPipeline(): Promise<any> {
    return apiFetch('/admin/pipeline')
  },
}

// ============================================================================
// Distribution API (B6)
// ============================================================================

export const distributionApi = {
  async publish(videoId: string): Promise<any> {
    return apiFetch(`/distribution/publish/${videoId}`, { method: 'POST' })
  },

  async ingestAnalytics(videoId: string, views: number, clicks: number): Promise<any> {
    return apiFetch(`/analytics/ingest/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ views, clicks }),
    })
  },

  async settle(videoId: string): Promise<any> {
    return apiFetch(`/distribution/videos/${videoId}/settle`, { method: 'POST' })
  },

  async dismissAnomaly(videoId: string): Promise<any> {
    return apiFetch(`/admin/videos/${videoId}/dismiss-anomaly`, { method: 'POST' })
  },
}

// ============================================================================
// Finance API (B7)
// ============================================================================

export const financeApi = {
  async triggerStripeTopUp(brandId: string, amountCents: number): Promise<any> {
    // Mock: simulate a Stripe webhook
    return apiFetch('/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-event-id': `evt_${Date.now()}`,
        'idempotency-key': `stripe_${brandId}_${amountCents}_${Date.now()}`,
      },
      body: JSON.stringify({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_${Date.now()}`,
            amount: amountCents,
            metadata: { brandId },
          },
        },
      }),
    })
  },

  async listPayouts(): Promise<any> {
    return apiFetch('/finance/payouts')
  },

  async approvePayout(creatorId: string, amountCents?: number): Promise<any> {
    return apiFetch(`/finance/payouts/${creatorId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ amountCents }),
    })
  },
}

// ============================================================================
// Harness API (B4)
// ============================================================================

export const harnessApi = {
  async createConfig(data: { name: string; modelMap?: any; budgetCap?: number }): Promise<any> {
    return apiFetch('/harness/configs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listConfigs(): Promise<any[]> {
    return apiFetch('/harness/configs')
  },

  async runEval(configId: string): Promise<any> {
    return apiFetch(`/harness/${configId}/eval`, { method: 'POST' })
  },

  async activate(configId: string): Promise<any> {
    return apiFetch(`/harness/${configId}/activate`, { method: 'POST' })
  },
}
