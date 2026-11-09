'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePerokioStore, useActiveFact } from '@/store/perokio'
import { FACTS } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ShieldCheck, Lock, Link2, ExternalLink, CheckCircle2, AlertTriangle,
  FileText, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function ScriptReview() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const approveScriptLine = usePerokioStore((s) => s.approveScriptLine)
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()
  // §4 Phase 4 §12: stamp overlay state — shown for 1.5s before the toast
  const [showStamp, setShowStamp] = useState(false)

  const brandFacts = FACTS.filter((f) => f.brandId === brandId)
  const fact = useActiveFact() || brandFacts[0] || FACTS[0]

  if (!fact) {
    return (
      <div className="glass rounded-2xl border-dashed border-white/10 p-12 text-center text-muted-fg">
        {t('No matching fact bundles')}
      </div>
    )
  }

  const verifiedLines = fact.scriptLines.filter((l) => l.sourceId).length
  const totalLines = fact.scriptLines.length
  const allVerified = verifiedLines === totalLines
  const totalDuration = fact.scriptLines.reduce((s, l) => s + l.durationSec, 0)

  const handlePublish = () => {
    if (!allVerified) {
      toast({
        title: `⛔ ${t('Publish blocked')}`,
        description: `${totalLines - verifiedLines} ${t('unverified line(s). AI could hallucinate — legal & brand risk.')}`,
        variant: 'destructive',
      })
      return
    }
    // §4 Phase 4 §12: rubber-stamp animation first, THEN the success toast
    setShowStamp(true)
    setTimeout(() => {
      setShowStamp(false)
      toast({
        title: `✅ ${t('Script approved')}`,
        description: `${fact.code} ${t('published to the Facts Wall, waiting for creators to claim it.')}`,
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* === Hero — The Moat === */}
      <div className="relative overflow-hidden rounded-2xl glass p-6 lg:p-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 600px 400px at 90% -10%, rgba(216,239,112,0.12), transparent 60%), radial-gradient(ellipse 600px 400px at -10% 110%, rgba(229,72,77,0.08), transparent 60%)',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative"
            >
              <Shield className="h-14 w-14 text-lime" strokeWidth={1.5} />
              <span className="absolute -top-1 -end-1 h-3 w-3 rounded-full bg-lime animate-ping" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-lime font-bold">{t('The Moat')}</span>
                <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B11 · Script Review</Badge>
              </div>
              <h2 className="text-2xl font-serif font-semibold">{t('Line-level fact locking engine')}</h2>
              <p className="text-sm text-muted-fg max-w-xl mt-1">
                {t('Every line must link to a verified source. Unverified lines physically block publishing — the region’s only legally defensible content engine.')}
              </p>
            </div>
          </div>

          {/* Verified/total counter */}
          <div className="flex flex-col items-end gap-2">
            <div
              className={cn(
                'px-5 py-3 rounded-2xl border-2 font-mono font-bold text-3xl tabular-nums',
                allVerified
                  ? 'border-lime/40 bg-lime/10 text-lime glow-lime'
                  : 'border-red/40 bg-red/10 text-red glow-red',
              )}
              data-mono
            >
              {verifiedLines}/{totalLines}
            </div>
            <span className="text-xs text-muted-fg">
              {allVerified
                ? t('All verified · publishable')
                : `${totalLines - verifiedLines} ${t('unverified · blocked')}`}
            </span>
          </div>
        </div>
      </div>

      {/* === Fact picker === */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-lime" />
          <span className="font-serif text-base font-semibold">{t('Current script')}</span>
        </div>
        <Select value={fact.id} onValueChange={(v) => setActiveFact(v)}>
          <SelectTrigger className="w-full glass border-white/10 bg-white/[0.02]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/10">
            {brandFacts.map((f) => {
              const v = f.scriptLines.filter((l) => l.sourceId).length
              return (
                <SelectItem key={f.id} value={f.id}>
                  <span className="font-mono text-xs me-2" data-mono>{f.code}</span>
                  {pick(f.claim, f.claimAr).slice(0, 40)}... <span className="font-mono text-muted-fg" data-mono>{v}/{f.scriptLines.length}</span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Meta label={t('Brand')} value={fact.brandName} />
          <Meta label={t('Fact tier')} value={t(fact.tier)} />
          <Meta label={t('Script duration')} value={`${totalDuration}s`} mono />
          <Meta label={t('Sources')} value={String(fact.sources.length)} mono />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === Script lines === */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 font-serif text-base font-semibold">
              <Sparkles className="h-4 w-4 text-teal" /> {t('AI-generated script · line-level locking')}
            </span>
            <span className="text-xs text-muted-fg hidden md:inline">{t('Link a source to each unverified line')}</span>
          </div>

          <div className="space-y-3">
            {fact.scriptLines.map((line, idx) => {
              const source = fact.sources.find((s) => s.id === line.sourceId)
              const isVerified = !!line.sourceId
              // Source tag style: "Fact #TUN-0412"
              const sourceTag = source ? `Fact #${source.id.split('_').pop()?.slice(0, 4).toUpperCase() ?? 'TUN'}` : null

              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={cn(
                    'relative rounded-xl p-4 transition-all',
                    isVerified
                      ? 'glass-lime'
                      : 'glass-red border-dashed',
                  )}
                  style={!isVerified ? { borderStyle: 'dashed' } : undefined}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon — green 🔒 verified / red ⚠️ unverified */}
                    <div
                      className={cn(
                        'h-10 w-10 shrink-0 rounded-xl flex items-center justify-center',
                        isVerified
                          ? 'bg-lime/15 text-lime'
                          : 'bg-red/15 text-red',
                      )}
                    >
                      {isVerified ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 animate-pulse-glow-red rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-muted-fg" data-mono>L{idx + 1}</span>
                        {line.isHook && (
                          <Badge className="text-[10px] gap-1 bg-orange/15 text-orange border border-orange/25">
                            <Sparkles className="h-3 w-3" /> {t('Hook')}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-fg font-mono" data-mono>{line.durationSec}s</span>
                        <span
                          className={cn(
                            'text-[10px] font-mono ml-auto px-2 py-0.5 rounded',
                            isVerified ? 'bg-lime/10 text-lime' : 'bg-red/10 text-red',
                          )}
                          data-mono
                        >
                          {isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{line.text}</p>

                      {/* === Source tag === */}
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {isVerified ? (
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-lime/10 border border-lime/25">
                            <ShieldCheck className="h-3.5 w-3.5 text-lime" />
                            <span className="text-xs font-medium">{source?.label}</span>
                            {sourceTag && (
                              <span className="text-[10px] font-mono text-lime" data-mono>
                                · {sourceTag}
                              </span>
                            )}
                            <ExternalLink className="h-3 w-3 text-muted-fg" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red/10 border border-red/25">
                              <AlertTriangle className="h-3.5 w-3.5 text-red" />
                              <span className="text-xs font-medium text-red">{t('Unverified')}</span>
                            </div>
                            <Select
                              value=""
                              onValueChange={(v) => {
                                approveScriptLine(fact.id, line.id, v)
                                toast({
                                  title: `🔒 ${t('Line locked')}`,
                                  description: `L${idx + 1} → ${fact.sources.find((s) => s.id === v)?.label}`,
                                })
                              }}
                            >
                              <SelectTrigger className="h-7 w-auto text-xs gap-1 border-red/40 bg-red/5">
                                <Link2 className="h-3 w-3 text-red" />
                                <SelectValue placeholder={t('Link source')} />
                              </SelectTrigger>
                              <SelectContent className="glass-strong border-white/10">
                                {fact.sources.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    <span className="flex items-center gap-2">
                                      <Badge className="text-[10px] me-1 bg-white/[0.04] text-muted-fg border border-white/10">
                                        {s.type}
                                      </Badge>
                                      {s.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* === Right rail === */}
        <div className="space-y-6">
          {/* Verified sources library */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-lime" />
              <span className="font-serif text-base font-semibold">{t('Verified sources library')}</span>
            </div>
            <p className="text-xs text-muted-fg mb-3">{t('Sources linked to this Fact Bundle')}</p>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {fact.sources.map((s) => {
                  const usedIn = fact.scriptLines.filter((l) => l.sourceId === s.id).length
                  return (
                    <div key={s.id} className="rounded-lg glass p-2.5 hover:bg-white/[0.05]">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">{s.type}</Badge>
                        <span className="text-[10px] text-muted-fg font-mono" data-mono>{s.verifiedAt}</span>
                      </div>
                      <div className="text-xs font-medium leading-snug mb-1.5">{s.label}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-fg font-mono truncate" data-mono>{s.url}</span>
                        <Badge className="text-[10px] ms-2 shrink-0 bg-lime/10 text-lime border border-lime/20">
                          {usedIn} {t('line(s) used')}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Publish control */}
          <div className="glass rounded-2xl p-5 relative overflow-visible">
            <span className="font-serif text-base font-semibold">{t('Publish control')}</span>
            <div className="mt-3 space-y-3">
              <div
                className={cn(
                  'rounded-xl p-3 transition-all border-2',
                  allVerified ? 'glass-lime' : 'glass-red border-dashed',
                )}
                style={!allVerified ? { borderStyle: 'dashed' } : undefined}
              >
                <div className="flex items-center gap-2 mb-2">
                  {allVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-lime" />
                  ) : (
                    <Lock className="h-4 w-4 text-red" />
                  )}
                  <span className="text-sm font-semibold">
                    {allVerified ? t('Ready to publish') : t('Publish locked')}
                  </span>
                </div>
                <p className="text-xs text-muted-fg">
                  {allVerified
                    ? t('All lines are linked — the AI physically cannot hallucinate.')
                    : `${totalLines - verifiedLines} ${t('unverified line(s). AI could hallucinate — legal & brand risk.')}`}
                </p>
              </div>

              {/* The disabled button — physically blocked when ANY line is unverified */}
              <Button
                onClick={handlePublish}
                disabled={!allVerified}
                className={cn(
                  'w-full gap-2 transition-all',
                  allVerified
                    ? 'bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime'
                    : 'bg-white/[0.04] text-muted-fg border border-white/10 cursor-not-allowed',
                )}
              >
                {allVerified ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {allVerified ? t('Approve & publish to Wall') : t('Locked — finish verification')}
              </Button>

              {!allVerified && (
                <div className="flex items-start gap-2 text-xs text-muted-fg">
                  <AlertTriangle className="h-3.5 w-3.5 text-red shrink-0 mt-0.5" />
                  <span>{t('Unlocking requires linking every line to a verified source. This is Perokio’s core promise.')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.06] text-xs text-muted-fg space-y-1">
                <Row label={t('Base Fee')} value={`$${fact.baseFee}`} />
                <Row label={t('CPM Rate')} value={`$${fact.cpmRate}/1k`} />
                <Row label={t('Budget Cap')} value={`$${fact.budgetCap}`} />
                <Row label={t('Max creators')} value={String(fact.maxCreators)} />
              </div>
            </div>

            {/* §4 Phase 4 §12: rubber-stamp overlay — scales in with spring + slight rotation */}
            <AnimatePresence>
              {showStamp && (
                <motion.div
                  initial={{ opacity: 0, scale: 1.6, rotate: -25 }}
                  animate={{ opacity: 1, scale: 1, rotate: -12 }}
                  exit={{ opacity: 0, scale: 1.4, rotate: -25 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 14 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                >
                  <div className="relative">
                    <svg viewBox="0 0 200 200" width="180" height="180">
                      {/* Outer ring */}
                      <circle
                        cx="100"
                        cy="100"
                        r="86"
                        fill="none"
                        stroke="#D8EF70"
                        strokeWidth="3"
                        strokeDasharray="4 3"
                        opacity="0.9"
                      />
                      {/* Inner circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="74"
                        fill="none"
                        stroke="#D8EF70"
                        strokeWidth="2"
                        opacity="0.7"
                      />
                      {/* Curved text — "Verified by Perokio Studio" — top arc */}
                      <defs>
                        <path
                          id="topArc"
                          d="M 30 100 A 70 70 0 0 1 170 100"
                          fill="none"
                        />
                        <path
                          id="botArc"
                          d="M 30 100 A 70 70 0 0 0 170 100"
                          fill="none"
                        />
                      </defs>
                      <text
                        fill="#D8EF70"
                        fontSize="14"
                        fontWeight="bold"
                        letterSpacing="2"
                        fontFamily="monospace"
                      >
                        <textPath href="#topArc" startOffset="50%" textAnchor="middle">
                          VERIFIED BY PEROKIO STUDIO
                        </textPath>
                      </text>
                      <text
                        fill="#D8EF70"
                        fontSize="11"
                        letterSpacing="3"
                        fontFamily="monospace"
                        opacity="0.85"
                      >
                        <textPath href="#botArc" startOffset="50%" textAnchor="middle">
                          MOAT ENGINE · B11
                        </textPath>
                      </text>
                      {/* Center check icon */}
                      <path
                        d="M 82 100 L 95 113 L 122 86"
                        fill="none"
                        stroke="#D8EF70"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-muted-fg">{label}</div>
      <div className={cn('font-medium text-fg', mono && 'font-mono')} data-mono={mono ? '' : undefined}>
        {value}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-mono text-fg" data-mono>{value}</span>
    </div>
  )
}
