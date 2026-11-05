'use client'

import { create } from 'zustand'
import { TRENDS } from '@/lib/perokio/data'

// ============================================================================
// B01-B07 Brand Onboarding Wizard — single shared store
//
// Per Cycle 1 design rationale:
//   "One question per screen. Not a wizard with 7 fields.
//    Each step: one decision, one 'why' sentence, one progress bar at top.
//    Whitespace dominates. Single typeface accent.
//    No celebration animations until B07."
//
// The wizard is a 7-step linear flow with a shared layout shell.
// Each step commits its answer to this store before navigating next.
// ============================================================================

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface TrendTemplate {
  keyword: string
  platform: string
  velocity: number
  volume: number
  category: string
  suggestedClaim: string
  suggestedBaseFee: number
}

// Pre-built trend templates the brand can pick from in B05
export const TREND_TEMPLATES: TrendTemplate[] = [
  {
    keyword: '#tunisiancoffee',
    platform: 'TikTok',
    velocity: 284,
    volume: 142000,
    category: 'Food & Beverage',
    suggestedClaim: "Tunisia's arabica beans are grown above 600m in Cap Bon — the smoothest in the Arab world.",
    suggestedBaseFee: 8,
  },
  {
    keyword: '#menabeauty',
    platform: 'Instagram',
    velocity: 412,
    volume: 890000,
    category: 'Beauty',
    suggestedClaim: 'The MENA beauty market hits $46B in 2024, growing 11% yearly.',
    suggestedBaseFee: 25,
  },
  {
    keyword: '#oliveoil2024',
    platform: 'TikTok',
    velocity: 198,
    volume: 67000,
    category: 'Agriculture',
    suggestedClaim: "Tunisia's olive oil exports jumped 32% in 2024 — overtaking Morocco and Greece.",
    suggestedBaseFee: 10,
  },
  {
    keyword: '#techTunisia',
    platform: 'YouTube',
    velocity: 142,
    volume: 32000,
    category: 'Tech',
    suggestedClaim: 'Tunis Tech Hub is North Africa\'s largest coworking space at 12,000 m².',
    suggestedBaseFee: 30,
  },
  {
    keyword: '#gamingMENA',
    platform: 'TikTok',
    velocity: 380,
    volume: 220000,
    category: 'Gaming',
    suggestedClaim: "Tunisia's gaming revenue is projected at $82M in 2024.",
    suggestedBaseFee: 15,
  },
]

export interface BrandOnboardingState {
  // Navigation
  step: WizardStep
  setStep: (s: WizardStep) => void
  next: () => void
  back: () => void

  // B01 Welcome — accepted
  welcomed: boolean

  // B02 Brand identity
  brandName: string
  brandLogo: string  // emoji
  brandLocation: string

  // B03 Industry & audience
  industry: string
  audienceRegion: string

  // B04 Budget & tier
  tier: 'Pilot' | 'Pro' | 'Enterprise'
  monthlyBudget: number

  // B05 First fact (from trend templates)
  selectedTrend: TrendTemplate | null
  customClaim: string  // overrides the trend's suggestedClaim if non-empty
  baseFee: number

  // B06 Wallet top-up
  topUpAmount: number
  paymentMethod: 'stripe' | 'flouci'

  // B07 First claim invitation — brand picks which creator(s) to invite
  invitedCreators: string[]  // creator handles

  // Mutators
  set: <K extends keyof BrandOnboardingState>(key: K, value: BrandOnboardingState[K]) => void
  toggleInvitedCreator: (handle: string) => void
  reset: () => void
}

const INDUSTRIES = [
  { id: 'cafe', label: 'Café & Hospitality', emoji: '☕' },
  { id: 'beauty', label: 'Beauty & Cosmetics', emoji: '💄' },
  { id: 'tech', label: 'Tech & Coworking', emoji: '💻' },
  { id: 'food', label: 'Organic Food', emoji: '🫒' },
  { id: 'travel', label: 'Travel & Tourism', emoji: '🏖️' },
  { id: 'fashion', label: 'Fashion & Apparel', emoji: '👕' },
  { id: 'auto', label: 'Automotive', emoji: '🚗' },
  { id: 'finance', label: 'Finance & Banking', emoji: '💳' },
]

const TIERS = [
  {
    id: 'Pilot' as const,
    price: 400,
    credits: 10,
    description: 'Test with 1 active fact · 10 creator slots',
  },
  {
    id: 'Pro' as const,
    price: 800,
    credits: 30,
    description: 'Up to 3 active facts · 30 creator slots · priority review',
  },
  {
    id: 'Enterprise' as const,
    price: 1500,
    credits: 50,
    description: 'Unlimited facts · 50+ creator slots · dedicated Studio liaison',
  },
]

const REGIONS = ['Tunis', 'Sousse', 'Sfax', 'Ariana', 'MENA-wide', 'Saudi Arabia', 'UAE', 'Egypt']

const LOGOS = ['☕', '💄', '💻', '🫒', '🏖️', '👕', '🚗', '💳', '🎬', '🎮', '🛍️', '📱']

export const brandOnboardingStore = create<BrandOnboardingState>((set, get) => ({
  step: 1,
  welcomed: false,
  brandName: '',
  brandLogo: '☕',
  brandLocation: 'Tunis',
  industry: '',
  audienceRegion: 'Tunis',
  tier: 'Pilot',
  monthlyBudget: 400,
  selectedTrend: null,
  customClaim: '',
  baseFee: 8,
  topUpAmount: 500,
  paymentMethod: 'stripe',
  invitedCreators: [],

  setStep: (step) => set({ step }),
  next: () => {
    const s = get().step
    if (s < 7) set({ step: (s + 1) as WizardStep })
  },
  back: () => {
    const s = get().step
    if (s > 1) set({ step: (s - 1) as WizardStep })
  },

  set: (key, value) => set({ [key]: value } as Partial<BrandOnboardingState>),

  toggleInvitedCreator: (handle) => {
    const list = get().invitedCreators
    if (list.includes(handle)) {
      set({ invitedCreators: list.filter((h) => h !== handle) })
    } else {
      set({ invitedCreators: [...list, handle] })
    }
  },

  reset: () =>
    set({
      step: 1,
      welcomed: false,
      brandName: '',
      brandLogo: '☕',
      brandLocation: 'Tunis',
      industry: '',
      audienceRegion: 'Tunis',
      tier: 'Pilot',
      monthlyBudget: 400,
      selectedTrend: null,
      customClaim: '',
      baseFee: 8,
      topUpAmount: 500,
      paymentMethod: 'stripe',
      invitedCreators: [],
    }),
}))

export { INDUSTRIES, TIERS, REGIONS, LOGOS }
