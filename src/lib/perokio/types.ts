// Perokio 数据层 - 类型定义
// 对应 Core File §2 Personas / §3 Core Loop / §4 44 Screens / §5 Economics

export type Role = 'brand' | 'creator' | 'admin'

// ============== Brand ==============
export interface Brand {
  id: string
  name: string
  nameAr: string
  tier: 'Pilot' | 'Pro' | 'Enterprise'
  logo: string // emoji 或 url
  accent: string
  walletBalance: number // USD
  walletSpent: number
  monthlyBudget: number
  subscription: number
  cpmCap: number
  videoCredits: number
  videoCreditsUsed: number
  activeFacts: number
  totalVideos: number
  totalViews: number
  avgCpm: number
  industry: string
  location: string
}

// ============== Creator ==============
export type CreatorLevel = 'Rookie' | 'Rising' | 'Pro' | 'Elite'

export interface Creator {
  id: string
  name: string
  handle: string
  avatar: string
  level: CreatorLevel
  rating: number
  rank: string // 如 "Top 3% in Tunisia"
  reliabilityScore: number // 0-100
  streak: number
  totalEarned: number
  pendingPayout: number
  completedVideos: number
  followers: number
  platform: 'tiktok' | 'instagram' | 'youtube'
  location: string
}

// ============== Fact Bundle ==============
// 一个 Fact Bundle = Verified Claim + Script Template + Assets
export type FactStatus =
  | 'draft'
  | 'funded' // 品牌已设置预算
  | 'live' // 已上墙
  | 'claimed' // 已被创作者认领
  | 'in_edit' // 创作者编辑中
  | 'locked' // 创作者锁定，等品牌审核
  | 'approved' // 品牌通过
  | 'printed' // 已发布到社媒
  | 'paid' // 已结算

export type FactTier = 'Hot' | 'Standard' | 'Premium'

export interface VerifiedSource {
  id: string
  type: 'official' | 'news' | 'research' | 'brand_asset'
  label: string
  url: string
  verifiedAt: string
  verifiedBy: string
}

export interface ScriptLine {
  id: string
  text: string
  sourceId?: string // 关联 verifiedSources id - 未关联 = 未验证
  durationSec: number
  isHook: boolean
}

export interface FactBundle {
  id: string
  code: string // 如 F-2024-0421-01
  claim: string // 验证后的事实主张
  claimAr: string
  brandId: string
  brandName: string
  status: FactStatus
  tier: FactTier
  cpmRate: number // $3 / 1000 views
  baseFee: number // $2-$80
  budgetCap: number // $100
  maxCreators: number // 默认 10
  claimedBy: string[] // creator ids
  createdAt: string
  publishedAt?: string
  assets: Asset[]
  sources: VerifiedSource[]
  scriptLines: ScriptLine[]
  rating: number
  totalViews: number
  trendTag: string
  lang: 'ar' | 'derja' | 'fr' | 'en'
  topic: string
}

export interface Asset {
  id: string
  type: 'broll' | 'image' | 'audio' | 'transition'
  label: string
  thumb: string
  durationSec?: number
}

// ============== Video ==============
export type VideoStage =
  | 'drafting'
  | 'editing'
  | 'locked_pending'
  | 'approved_queued'
  | 'published'
  | 'counting'
  | 'settled'

export interface Video {
  id: string
  factId: string
  factCode: string
  factClaim: string
  brandName: string
  creatorId: string
  creatorName: string
  creatorAvatar: string
  stage: VideoStage
  createdAt: string
  lockedAt?: string
  publishedAt?: string
  durationSec: number
  thumbnail: string
  platform: 'tiktok' | 'instagram' | 'youtube'
  views: number
  viewCap: number
  earningsBase: number
  earningsCpm: number
  hoursToPublish?: number // countdown
  hoursToLock?: number // countdown
  reviewDeadline?: number // brand 12h review window
  approved: boolean
}

// ============== Transactions ==============
export interface Transaction {
  id: string
  type: 'brand_topup' | 'subscription' | 'creator_payout' | 'extra_video' | 'refund'
  amount: number
  currency: 'USD' | 'TND'
  party: string
  factCode?: string
  createdAt: string
  status: 'pending' | 'completed' | 'failed'
  method?: 'stripe' | 'flouci'
}

// ============== Trend ==============
export interface Trend {
  id: string
  keyword: string
  platform: string
  velocity: number
  volume: number
  ageHours: number
  region: string
  category: string
}

// ============== Pipeline (Admin) ==============
export interface PipelineBrand {
  id: string
  name: string
  industry: string
  stage: 'lead' | 'demo' | 'pilot' | 'active' | 'churned'
  owner: string
  mrr: number
  createdAt: string
  nextStep: string
}

export interface PendingCreator {
  id: string
  name: string
  handle: string
  followers: number
  platform: string
  appliedAt: string
  sampleUrl: string
  region: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
}

export interface ScriptQAItem {
  id: string
  factCode: string
  brandName: string
  linesTotal: number
  linesVerified: number
  submittedBy: string
  submittedAt: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  flags: string[]
}
