'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PENDING_CREATORS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { formatCompact } from '@/lib/perokio/live'
import { CheckCircle2, X, ExternalLink, Star, Users, Shield, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function CreatorVetting() {
  const { toast } = useToast()
  const t = useT()
  const [pending, setPending] = useState(PENDING_CREATORS)
  // Index of the currently-selected applicant (for keyboard navigation)
  const [currentIdx, setCurrentIdx] = useState(0)

  const handleApprove = (id: string) => {
    setPending((list) => list.filter((c) => c.id !== id))
    const c = PENDING_CREATORS.find((x) => x.id === id)
    // Clamp selection to bounds after removal (closure uses old length)
    setCurrentIdx((i) => Math.min(i, Math.max(pending.length - 2, 0)))
    toast({
      title: `✅ ${t('Creator approved')}`,
      description: `${c?.name} ${t('joined the creator pool — will appear on the Facts Wall.')}`,
    })
  }

  const handleReject = (id: string) => {
    setPending((list) => list.filter((c) => c.id !== id))
    setCurrentIdx((i) => Math.min(i, Math.max(pending.length - 2, 0)))
    toast({
      title: `❌ ${t('Rejected')}`,
      description: t('The applicant has been notified.'),
      variant: 'destructive',
    })
  }

  // Keyboard shortcuts: A=approve, R=reject, J=next, K=prev
  // Ignore when typing in inputs/textareas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (pending.length === 0) return

      const key = e.key.toLowerCase()
      if (key === 'j') {
        e.preventDefault()
        setCurrentIdx((i) => Math.min(i + 1, pending.length - 1))
      } else if (key === 'k') {
        e.preventDefault()
        setCurrentIdx((i) => Math.max(i - 1, 0))
      } else if (key === 'a') {
        e.preventDefault()
        const c = pending[currentIdx]
        if (c) handleApprove(c.id)
      } else if (key === 'r') {
        e.preventDefault()
        const c = pending[currentIdx]
        if (c) handleReject(c.id)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pending, currentIdx, t])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t('Creator Vetting')}
          <Badge variant="outline" className="text-[10px]">A02</Badge>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('Creator applications')} · {pending.length} {t('pending applications')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pending.map((c, idx) => (
          <Card
            key={c.id}
            className={cn(
              'hover:shadow-md transition-all',
              idx === currentIdx && 'ring-2 ring-primary/60 border-primary/40'
            )}
            onClick={() => setCurrentIdx(idx)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-chart-3/30 text-lg">
                    {c.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{c.name}</span>
                    <Badge variant="outline" className="text-[10px]">{c.handle}</Badge>
                    {c.status === 'reviewing' && (
                      <Badge variant="secondary" className="text-[10px]">{t('In review')}</Badge>
                    )}
                    {idx === currentIdx && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                        ⌨ {t('Selected')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.platform} · {formatCompact(c.followers)} {t('followers')} · {c.region}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('Applied')}: {c.appliedAt}
                  </div>
                </div>
              </div>

              {/* Sample */}
              <div className="mt-3 p-2.5 rounded-lg bg-muted/50 border border-border/60">
                <div className="flex items-center gap-2 text-xs">
                  <Star className="h-3.5 w-3.5 text-chart-2" />
                  <span className="text-muted-foreground">{t('Sample')}</span>
                  <a href="#" className="flex-1 text-end text-primary truncate hover:underline flex items-center justify-end gap-1">
                    {c.sampleUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Checks */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 rounded-md bg-muted/30">
                  <Shield className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                  <div className="font-semibold text-primary">{t('Pass')}</div>
                  <div className="text-[10px] text-muted-foreground">{t('Content policy')}</div>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/30">
                  <Users className="h-3.5 w-3.5 text-chart-2 mx-auto mb-1" />
                  <div className="font-semibold text-chart-2">{t('Real')}</div>
                  <div className="text-[10px] text-muted-foreground">{t('Audience quality')}</div>
                </div>
                <div className="text-center p-2 rounded-md bg-chart-3/10">
                  <Clock className="h-3.5 w-3.5 text-chart-3 mx-auto mb-1" />
                  <div className="font-semibold text-chart-3">{t('Check')}</div>
                  <div className="text-[10px] text-muted-foreground">{t('Posting cadence')}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2 pt-3 border-t border-border/60">
                <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleApprove(c.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('Approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 border-chart-3/40 text-chart-3 hover:bg-chart-3/5"
                  onClick={() => handleReject(c.id)}
                >
                  <X className="h-3.5 w-3.5" />
                  {t('Reject')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pending.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">{t('Queue cleared')}</h3>
            <p className="text-sm text-muted-foreground">{t('All creator applications are processed')} ✨</p>
          </CardContent>
        </Card>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="glass rounded-full px-4 py-1.5 shadow-lg border border-border/60 flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">⌨</span>
          <span className="font-mono font-bold text-primary" data-mono>A</span>
          <span className="text-muted-foreground">{t('Approve')}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-mono font-bold text-chart-3" data-mono>R</span>
          <span className="text-muted-foreground">{t('Reject')}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-mono font-bold text-foreground" data-mono>J</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono font-bold text-foreground" data-mono>K</span>
          <span className="text-muted-foreground">{t('Navigate')}</span>
        </div>
      </div>
    </div>
  )
}
