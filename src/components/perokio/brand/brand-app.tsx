'use client'

import { usePerokioStore } from '@/store/perokio'
import { SidebarItem } from '@/components/perokio/shared/sidebar-item'
import { BRANDS, VIDEOS, FACTS } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { LayoutDashboard, Film, ShieldCheck, FileText, Eye, Receipt, ChevronDown, Activity, BarChart3, Calendar, Sparkles, Settings as SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { CommandCenter } from './command-center'
import { ContentMachine } from './content-machine'
import { ScriptReview } from './script-review'
import { FactLibrary } from './fact-library'
import { VideoReview } from './video-review'
import { Billing } from './billing'
import { ClaimFeed } from './claim-feed'
import { VideoReviewDetail } from './video-review-detail'
import { PostingQueue } from './posting-queue'
import { Results } from './results'
import { NextCycle } from './next-cycle'
import { Settings } from './settings'

export function BrandSidebar() {
  const view = usePerokioStore((s) => s.brandView)
  const setView = usePerokioStore((s) => s.setBrandView)
  const activeBrandId = usePerokioStore((s) => s.activeBrandId)
  const setActiveBrand = usePerokioStore((s) => s.setActiveBrand)
  usePerokioStore((s) => s.walletTick)
  const [open, setOpen] = useState(false)
  const t = useT()
  const pick = usePick()

  const brand = BRANDS.find((b) => b.id === activeBrandId) || BRANDS[0]
  const pendingReview = VIDEOS.filter((v) => v.brandName === brand.name && v.stage === 'locked_pending').length
  const activeFacts = FACTS.filter((f) => f.brandId === brand.id && f.status !== 'paid').length

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border backdrop-blur-xl">
      {/* Brand picker */}
      <div className="p-3 border-b border-sidebar-border">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors"
        >
          <span
            className="text-2xl h-10 w-10 flex items-center justify-center rounded-lg"
            style={{ background: `${brand.accent}22`, border: `1px solid ${brand.accent}40` }}
          >
            {brand.logo}
          </span>
          <div className="flex-1 text-start min-w-0">
            <div className="text-sm font-semibold truncate">{pick(brand.name, brand.nameAr)}</div>
            <div className="text-[10px] text-muted-fg">
              {brand.tier} · {brand.location}
            </div>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 text-muted-fg transition-transform', open && 'rotate-180')}
          />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-1 space-y-0.5"
            >
              {BRANDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBrand(b.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors',
                    b.id === activeBrandId
                      ? 'bg-lime/10 text-lime border border-lime/20'
                      : 'hover:bg-white/[0.04] text-muted-fg hover:text-fg',
                  )}
                >
                  <span className="text-lg">{b.logo}</span>
                  <span className="flex-1 text-start truncate">{pick(b.name, b.nameAr)}</span>
                  <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">
                    {b.tier}
                  </Badge>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
        <SidebarItem icon={LayoutDashboard} label={t('Command Center')} code="B08" active={view === 'command'} onClick={() => setView('command')} />
        <SidebarItem icon={Film} label={t('Content Machine')} code="B09" active={view === 'machine'} badge={activeFacts} onClick={() => setView('machine')} />
        <SidebarItem icon={ShieldCheck} label={t('Script Review · Moat')} code="B11" active={view === 'script'} onClick={() => setView('script')} />
        <SidebarItem icon={FileText} label={t('Fact Library')} code="B10" active={view === 'library'} onClick={() => setView('library')} />
        <SidebarItem icon={Activity} label="Claim Feed" code="B13" active={view === 'feed'} onClick={() => setView('feed')} />
        <SidebarItem icon={Eye} label={t('Video Review')} code="B12" active={view === 'review'} badge={pendingReview || undefined} onClick={() => setView('review')} />
        <SidebarItem icon={BarChart3} label="Video Detail" code="B14" active={view === 'detail'} onClick={() => setView('detail')} />
        <SidebarItem icon={Calendar} label="Posting Queue" code="B15" active={view === 'queue'} onClick={() => setView('queue')} />
        <SidebarItem icon={BarChart3} label="Results" code="B17" active={view === 'results'} onClick={() => setView('results')} />
        <SidebarItem icon={Sparkles} label="Next Cycle" code="B18" active={view === 'next'} onClick={() => setView('next')} />
        <SidebarItem icon={Receipt} label={t('Billing')} code="B19" active={view === 'billing'} onClick={() => setView('billing')} />
        <SidebarItem icon={SettingsIcon} label={t('Settings')} code="B20" active={view === 'settings'} onClick={() => setView('settings')} />
      </nav>

      {/* Moat status footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-xl p-3 glass-lime">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
            </span>
            <span className="text-xs font-semibold text-lime">{t('Moat Engine Active')}</span>
          </div>
          <div className="text-[10px] text-muted-fg leading-snug">
            {t('All script lines locked · 0 unverified · 0 legal risk')}
          </div>
        </div>
      </div>
    </aside>
  )
}

export function BrandApp() {
  const view = usePerokioStore((s) => s.brandView)
  const brandId = usePerokioStore((s) => s.activeBrandId)
  return (
    <>
      <BrandSidebar />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto pb-24">
          {view === 'command' && <CommandCenter />}
          {view === 'machine' && <ContentMachine />}
          {view === 'script' && <ScriptReview />}
          {view === 'library' && <FactLibrary />}
          {view === 'feed' && <ClaimFeed key={`feed-${brandId}`} />}
          {view === 'review' && <VideoReview />}
          {view === 'detail' && <VideoReviewDetail />}
          {view === 'queue' && <PostingQueue key={`queue-${brandId}`} />}
          {view === 'results' && <Results />}
          {view === 'next' && <NextCycle />}
          {view === 'billing' && <Billing />}
          {view === 'settings' && <Settings key={`settings-${brandId}`} />}
        </div>
      </div>
    </>
  )
}
