'use client'

import { usePerokioStore } from '@/store/perokio'
import { SidebarItem } from '@/components/perokio/shared/sidebar-item'
import { SCRIPT_QA, FACTS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { Building2, Users, ShieldCheck, TrendingUp, Activity, Sparkles } from 'lucide-react'
import { BrandPipeline } from './brand-pipeline'
import { CreatorVetting } from './creator-vetting'
import { ScriptQA } from './script-qa'
import { TrendInput } from './trend-input'
import { WallMonitor } from './wall-monitor'
import { FactAuthoring } from './fact-authoring'
import { CommandPalette } from './command-palette'
import { QualityDashboard } from './quality-dashboard'

export function AdminApp() {
  const view = usePerokioStore((s) => s.adminView)
  const setView = usePerokioStore((s) => s.setAdminView)
  usePerokioStore((s) => s.walletTick)
  const t = useT()
  const qaPending = SCRIPT_QA.filter((q) => q.status === 'pending' || q.status === 'in_review').length
  const liveFacts = FACTS.filter((f) => ['live', 'claimed', 'locked', 'in_edit'].includes(f.status)).length
  const lockedLines = FACTS.reduce((s, f) => s + f.scriptLines.filter((l) => l.sourceId).length, 0)

  return (
    <>
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border backdrop-blur-xl">
        {/* Studio header */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 p-2">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(229,72,77,0.22), rgba(182,166,255,0.18))',
                border: '1px solid rgba(229,72,77,0.3)',
              }}
            >
              🎬
            </div>
            <div>
              <div className="text-sm font-bold">Perokio Studio</div>
              <div className="text-[10px] text-muted-fg">{t('Studio Console')}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
          <SidebarItem icon={Building2} label={t('Brand Pipeline')} code="A01" active={view === 'pipeline'} onClick={() => setView('pipeline')} />
          <SidebarItem icon={Users} label={t('Creator Vetting')} code="A02" active={view === 'vetting'} badge={4} onClick={() => setView('vetting')} />
          <SidebarItem icon={ShieldCheck} label={t('Script QA')} code="A03" active={view === 'qa'} badge={qaPending} onClick={() => setView('qa')} />
          <SidebarItem icon={TrendingUp} label={t('Trend Input')} code="A04" active={view === 'trends'} onClick={() => setView('trends')} />
          <SidebarItem icon={Activity} label={t('Wall Monitor')} code="A05" active={view === 'monitor'} badge={liveFacts} onClick={() => setView('monitor')} />
          <SidebarItem icon={ShieldCheck} label="Quality Dashboard" code="A06" active={view === 'quality'} onClick={() => setView('quality')} />
          <SidebarItem icon={Sparkles} label={t('Fact Authoring')} code="A07" active={view === 'authoring'} onClick={() => setView('authoring')} />
        </nav>

        {/* Footer status */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl p-2.5 glass">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
              </span>
              <span className="text-xs font-semibold text-lime">{t('B11 Moat Active')}</span>
            </div>
            <div className="text-[10px] text-muted-fg leading-snug">
              <span className="font-mono text-fg" data-mono>{lockedLines}</span> {t('lines locked · 0 risk')}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto pb-24">
          {view === 'pipeline' && <BrandPipeline />}
          {view === 'vetting' && <CreatorVetting />}
          {view === 'qa' && <ScriptQA />}
          {view === 'trends' && <TrendInput />}
          {view === 'monitor' && <WallMonitor />}
          {view === 'quality' && <QualityDashboard />}
          {view === 'authoring' && <FactAuthoring />}
        </div>
      </div>

      {/* §2: Global Cmd+K command palette — mounted at Admin root */}
      <CommandPalette />
    </>
  )
}
