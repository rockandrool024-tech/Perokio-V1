'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SCRIPT_QA, FACTS } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { ShieldCheck, CheckCircle2, Eye, ChevronRight, AlertTriangle, Flag } from 'lucide-react'
import { usePerokioStore } from '@/store/perokio'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<string, string> = {
  approved: '✓ Approved',
  in_review: 'In review',
  pending: 'Pending',
  rejected: 'Rejected',
}

export function ScriptQA() {
  const setRole = usePerokioStore((s) => s.setRole)
  const setBrandView = usePerokioStore((s) => s.setBrandView)
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()

  const handleApprove = (id: string) => {
    toast({
      title: `✅ ${t('Script QA approved')}`,
      description: t('Published to the Facts Wall.'),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t('Script QA')}
          <Badge variant="outline" className="text-[10px]">A03</Badge>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('Studio script review — every line needs a source')}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">{SCRIPT_QA.filter((q) => q.status === 'approved').length}</div>
              <div className="text-xs text-muted-foreground">{t('Approved')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <div className="text-xl font-bold">{SCRIPT_QA.filter((q) => q.status === 'in_review' || q.status === 'pending').length}</div>
              <div className="text-xs text-muted-foreground">{t('Pending review')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
              <Flag className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <div className="text-xl font-bold">{SCRIPT_QA.reduce((s, q) => s + (q.linesTotal - q.linesVerified), 0)}</div>
              <div className="text-xs text-muted-foreground">{t('Unverified lines')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('Review queue')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SCRIPT_QA.map((q, idx) => {
            const fact = FACTS.find((f) => f.code === q.factCode)
            const completion = (q.linesVerified / q.linesTotal) * 100
            const hasFlags = q.flags.length > 0
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="rounded-xl border border-border/60 p-4 hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs font-mono text-muted-foreground">{q.factCode}</span>
                    {fact && (
                      <span className="text-sm font-medium line-clamp-1">{pick(fact.claim, fact.claimAr)}</span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] shrink-0',
                      q.status === 'approved' && 'border-primary/40 text-primary',
                      q.status === 'in_review' && 'border-chart-2/40 text-chart-2',
                      q.status === 'pending' && 'border-muted-foreground/40 text-muted-foreground',
                      q.status === 'rejected' && 'border-chart-3/40 text-chart-3'
                    )}
                  >
                    {t(STATUS_LABELS[q.status])}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t('Brand')}</div>
                    <div className="text-sm font-medium">{q.brandName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t('Submitted by')}</div>
                    <div className="text-sm">{q.submittedBy} · {q.submittedAt}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t('Verified lines')}</div>
                    <div className={cn(
                      'text-sm font-mono font-semibold',
                      q.linesVerified === q.linesTotal ? 'text-primary' : 'text-chart-3'
                    )}>
                      {q.linesVerified}/{q.linesTotal}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <Progress value={completion} className={cn('h-1.5', completion === 100 ? 'text-primary' : 'text-chart-3')} />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('Completion')}</span>
                    <span className={cn('font-mono', completion === 100 ? 'text-primary' : 'text-chart-3')}>
                      {completion.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {hasFlags && (
                  <div className="rounded-lg bg-chart-3/5 border border-chart-3/20 p-2.5 mb-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-chart-3" />
                      <span className="text-xs font-semibold text-chart-3">{t('Flags')} · {q.flags.length}</span>
                    </div>
                    <ul className="text-xs text-foreground/80 space-y-0.5">
                      {q.flags.map((flag, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="text-chart-3">•</span> {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      if (fact) {
                        // Cross-link to B11 Script Review: set fact, switch to brand role, open Script view
                        usePerokioStore.getState().setActiveFact(fact.id)
                        setRole('brand')
                        setBrandView('script')
                      }
                    }}
                  >
                    {t('Review Script')} <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex-1" />
                  {q.status !== 'approved' && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={completion < 100}
                      onClick={() => handleApprove(q.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('Approve & publish')}
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
