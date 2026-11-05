// Perokio mock-data.ts — SINGLE SOURCE OF TRUTH for canonical display stats.
// All numbers shown in the UI must come from here (or from data.ts entity fields).
// No hardcoded "+12% this week" strings in JSX. Amendment #1.
//
// This file exports:
//   - CREATOR_DISPLAY_STATS: per-creator growth deltas, reward thresholds, streak cycles
//   - BRAND_DISPLAY_STATS: per-brand ROI, industry comparisons, momentum signals
//   - MARQUEE_ACTIVITY: live creator activity feed items
//   - EARNINGS_CURVE / VIEWS_CURVE: chart data series
//
// The entity data (Brand, Creator, FactBundle, Video, Transaction) lives in
// ./data.ts. This file holds ONLY the derived display stats that were previously
// hardcoded in JSX.

import { CREATORS, BRANDS } from './data'

// ============================================================================
// CREATOR DISPLAY STATS
// ============================================================================

export interface CreatorDisplayStats {
  creatorId: string
  // Growth deltas (shown as KPI subtitle on Wallet)
  monthlyGrowthPct: number       // "+12% this month" → 12
  monthlyNewVideos: number       // "+8 this month" → 8
  // Reward thresholds (Wallet rewards section)
  videosRewardThreshold: number // "Complete 5 videos" → 5
  videosRewardAmount: number    // "+$20" → 20
  videosRewardProgress: number  // 0-100
  videosRewardCurrent: number   // "3 / 5" → 3
  viewsRewardThreshold: number  // "Reach 100k total views" → 100000
  viewsRewardAmount: number     // "+$50" → 50
  viewsRewardProgress: number
  viewsRewardCurrent: number
  eliteRewardThreshold: number  // Reliability score to unlock Elite → 100
  eliteRewardProgress: number
  eliteRewardLabel: string      // "Unlocks $80 Base"
  // Streak cycle (Wallet + sidebar banner)
  streakCycleDays: number       // 14-day cycle
  streakRewardAmount: number    // "+$25" → 25
}

export const CREATOR_DISPLAY_STATS: Record<string, CreatorDisplayStats> = {
  cr_amira: {
    creatorId: 'cr_amira',
    monthlyGrowthPct: 12,
    monthlyNewVideos: 8,
    videosRewardThreshold: 5,
    videosRewardAmount: 20,
    videosRewardProgress: 60,
    videosRewardCurrent: 3,
    viewsRewardThreshold: 100000,
    viewsRewardAmount: 50,
    viewsRewardProgress: 84,
    viewsRewardCurrent: 84200,
    eliteRewardThreshold: 100,
    eliteRewardProgress: 96,
    eliteRewardLabel: 'Unlocks $80 Base',
    streakCycleDays: 14,
    streakRewardAmount: 25,
  },
  cr_yassine: {
    creatorId: 'cr_yassine',
    monthlyGrowthPct: 18,
    monthlyNewVideos: 12,
    videosRewardThreshold: 5,
    videosRewardAmount: 20,
    videosRewardProgress: 100,
    videosRewardCurrent: 5,
    viewsRewardThreshold: 100000,
    viewsRewardAmount: 50,
    viewsRewardProgress: 100,
    viewsRewardCurrent: 156000,
    eliteRewardThreshold: 100,
    eliteRewardProgress: 99,
    eliteRewardLabel: 'Elite unlocked',
    streakCycleDays: 28,
    streakRewardAmount: 25,
  },
  cr_lina: {
    creatorId: 'cr_lina',
    monthlyGrowthPct: 8,
    monthlyNewVideos: 4,
    videosRewardThreshold: 5,
    videosRewardAmount: 20,
    videosRewardProgress: 40,
    videosRewardCurrent: 2,
    viewsRewardThreshold: 100000,
    viewsRewardAmount: 50,
    viewsRewardProgress: 32,
    viewsRewardCurrent: 32100,
    eliteRewardThreshold: 100,
    eliteRewardProgress: 88,
    eliteRewardLabel: 'Unlocks $80 Base',
    streakCycleDays: 14,
    streakRewardAmount: 25,
  },
  cr_omar: {
    creatorId: 'cr_omar',
    monthlyGrowthPct: 14,
    monthlyNewVideos: 6,
    videosRewardThreshold: 5,
    videosRewardAmount: 20,
    videosRewardProgress: 80,
    videosRewardCurrent: 4,
    viewsRewardThreshold: 100000,
    viewsRewardAmount: 50,
    viewsRewardProgress: 68,
    viewsRewardCurrent: 68400,
    eliteRewardThreshold: 100,
    eliteRewardProgress: 92,
    eliteRewardLabel: 'Unlocks $80 Base',
    streakCycleDays: 14,
    streakRewardAmount: 25,
  },
  cr_sara: {
    creatorId: 'cr_sara',
    monthlyGrowthPct: 4,
    monthlyNewVideos: 2,
    videosRewardThreshold: 5,
    videosRewardAmount: 20,
    videosRewardProgress: 20,
    videosRewardCurrent: 1,
    viewsRewardThreshold: 100000,
    viewsRewardAmount: 50,
    viewsRewardProgress: 13,
    viewsRewardCurrent: 12800,
    eliteRewardThreshold: 100,
    eliteRewardProgress: 81,
    eliteRewardLabel: 'Unlocks $80 Base',
    streakCycleDays: 14,
    streakRewardAmount: 25,
  },
}

/** Get a creator's display stats, falling back to Amira's (the demo user). */
export function getCreatorStats(creatorId: string): CreatorDisplayStats {
  return CREATOR_DISPLAY_STATS[creatorId] ?? CREATOR_DISPLAY_STATS.cr_amira
}

// ============================================================================
// BRAND DISPLAY STATS
// ============================================================================

export interface BrandDisplayStats {
  brandId: string
  // ROI shown on Command Center KPI
  weeklyRoi: number              // "3.4×" → 3.4
  weeklyRoiDelta: number        // "+0.6 vs last week" → 0.6
  // Industry benchmark
  industryAvgCpm: number        // "$4.2" → 4.2
  industryLabel: string         // "Below industry $4.2"
  // Live momentum (Brand FOMO loop)
  creatorsPrintingNow: number   // "X creators are printing your facts right now"
  claimsLastHour: number        // "Y creators claimed this fact in the last hour"
  lastTickDelta: number         // "+47 in the last 3s"
}

export const BRAND_DISPLAY_STATS: Record<string, BrandDisplayStats> = {
  br_zitouna: {
    brandId: 'br_zitouna',
    weeklyRoi: 3.4,
    weeklyRoiDelta: 0.6,
    industryAvgCpm: 4.2,
    industryLabel: 'Below industry $4.2',
    creatorsPrintingNow: 2,
    claimsLastHour: 1,
    lastTickDelta: 47,
  },
  br_bloom: {
    brandId: 'br_bloom',
    weeklyRoi: 4.1,
    weeklyRoiDelta: 0.9,
    industryAvgCpm: 4.2,
    industryLabel: 'Below industry $4.2',
    creatorsPrintingNow: 4,
    claimsLastHour: 3,
    lastTickDelta: 62,
  },
  br_techhub: {
    brandId: 'br_techhub',
    weeklyRoi: 4.8,
    weeklyRoiDelta: 1.2,
    industryAvgCpm: 4.2,
    industryLabel: 'Below industry $4.2',
    creatorsPrintingNow: 6,
    claimsLastHour: 2,
    lastTickDelta: 89,
  },
  br_olive: {
    brandId: 'br_olive',
    weeklyRoi: 2.9,
    weeklyRoiDelta: 0.4,
    industryAvgCpm: 4.2,
    industryLabel: 'Below industry $4.2',
    creatorsPrintingNow: 1,
    claimsLastHour: 0,
    lastTickDelta: 18,
  },
}

export function getBrandStats(brandId: string): BrandDisplayStats {
  return BRAND_DISPLAY_STATS[brandId] ?? BRAND_DISPLAY_STATS.br_zitouna
}

// ============================================================================
// MARQUEE ACTIVITY (B08 scrolling ticker)
// ============================================================================

export interface MarqueeItem {
  handle: string
  action: string
  fact: string
}

export const MARQUEE_ACTIVITY: MarqueeItem[] = [
  { handle: '@sarra_v', action: 'locked a video', fact: 'F-2024-1101-01' },
  { handle: '@yassine.creates', action: 'claimed', fact: 'F-2024-1028-03' },
  { handle: '@omar.films', action: 'hit 10k views', fact: 'F-2024-1101-02' },
  { handle: '@lina.daily', action: 'submitted for review', fact: 'F-2024-1101-01' },
  { handle: '@amira.tn', action: 'locked a video', fact: 'F-2024-1103-06' },
  { handle: '@sara.bloom', action: 'received CPM payout', fact: 'F-2024-1025-05' },
  { handle: '@khalil.arts', action: 'joined the creator pool', fact: '' },
  { handle: '@maram.daily', action: 'claimed', fact: 'F-2024-1104-04' },
]

// ============================================================================
// CHART DATA SERIES
// ============================================================================

// 24h views curve (B08 Command Center chart)
export const VIEWS_CURVE_24H = [
  { t: '00:00', v: 182400 },
  { t: '04:00', v: 183100 },
  { t: '08:00', v: 184800 },
  { t: '12:00', v: 188200 },
  { t: '16:00', v: 192400 },
  { t: '20:00', v: 196800 },
  { t: 'Now', v: 184200 },
]

// 5-day earnings curve (WL01 Wallet chart)
export const EARNINGS_CURVE_5D = [
  { d: '11/01', e: 32 },
  { d: '11/02', e: 48 },
  { d: '11/03', e: 28 },
  { d: '11/04', e: 96 },
  { d: '11/05', e: 64 },
]

// 6-month spend trend (B13 Billing chart)
export const SPEND_CURVE_6M = [
  { m: 'Jun', s: 320 },
  { m: 'Jul', s: 580 },
  { m: 'Aug', s: 720 },
  { m: 'Sep', s: 940 },
  { m: 'Oct', s: 1180 },
  { m: 'Nov', s: 580 },
]

// ============================================================================
// CANONICAL CREATOR & BRAND (the demo user / demo brand)
// ============================================================================

/** The canonical demo creator — Amira. Single source of truth for her numbers. */
export const DEMO_CREATOR = CREATORS.find((c) => c.id === 'cr_amira') ?? CREATORS[0]
export const DEMO_BRAND = BRANDS.find((b) => b.id === 'br_zitouna') ?? BRANDS[0]
