'use client'

import { usePerokioStore } from '@/store/perokio'
import { SidebarItem } from '@/components/perokio/shared/sidebar-item'
import { CREATORS, FACTS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { LayoutGrid, Film, Wallet, User } from 'lucide-react'
import { ClaimEdit } from './claim-edit'
import { FactsWall } from './facts-wall'
import { WalletView } from './wallet'
import { CreatorProfile } from './profile'

export function CreatorApp() {
  const view = usePerokioStore((s) => s.creatorView)
  const setView = usePerokioStore((s) => s.setCreatorView)
  usePerokioStore((s) => s.walletTick)
  const creator = CREATORS[0]
  const claimedCount = FACTS.filter((f) => f.claimedBy.includes(creator.id)).length
  const t = useT()

  return (
    <>
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border backdrop-blur-xl">
        {/* Profile mini */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 p-2">
            <div
              className="h-11 w-11 rounded-full flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(216,239,112,0.25), rgba(237,122,66,0.20))',
                border: '1px solid rgba(216,239,112,0.3)',
              }}
            >
              {creator.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{creator.name}</div>
              <div className="text-[10px] text-muted-fg">
                {creator.handle} · <span className="text-lime">{creator.level}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 px-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold font-mono text-fg" data-mono>
                {creator.streak}
              </div>
              <div className="text-[9px] text-muted-fg">{t('streak')}</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-fg" data-mono>
                ★ {creator.rating}
              </div>
              <div className="text-[9px] text-muted-fg">{t('rating')}</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-lime" data-mono>
                ${creator.pendingPayout}
              </div>
              <div className="text-[9px] text-muted-fg">{t('pending')}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
          <SidebarItem icon={LayoutGrid} label={t('Facts Wall')} code="C01" active={view === 'wall'} onClick={() => setView('wall')} />
          <SidebarItem icon={Film} label={t('Edit Studio')} code="C04" active={view === 'claim'} badge={claimedCount} onClick={() => setView('claim')} />
          <SidebarItem icon={Wallet} label={t('Wallet')} code="WL01" active={view === 'wallet'} onClick={() => setView('wallet')} />
          <SidebarItem icon={User} label={t('Profile')} code="P03" active={view === 'profile'} onClick={() => setView('profile')} />
        </nav>

        {/* Streak banner */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl p-3 glass-orange">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🔥</span>
              <span className="text-xs font-semibold text-orange">
                {creator.streak} {t('day streak')}
              </span>
            </div>
            <div className="text-[10px] text-muted-fg leading-snug">
              {14 - (creator.streak % 14 || 14)} {t('days to unlock a +$25 reward')}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4 lg:p-6 max-w-6xl mx-auto pb-24">
          {view === 'wall' && <FactsWall />}
          {view === 'claim' && <ClaimEdit />}
          {view === 'wallet' && <WalletView />}
          {view === 'profile' && <CreatorProfile />}
        </div>
      </div>
    </>
  )
}
