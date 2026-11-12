'use client'

import { useState, useRef } from 'react'
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
  FileText, Sparkles, X, Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { springSoft, springSnappy, easeEditorial } from '@/lib/perokio/motion'

// ============================================================================
// B11 Script Review — Premium "Vault" Experience
// ============================================================================
// The script verification feels like a high-security vault:
//   - Source chips: pill-shaped lime badges with 🔒 SRC-01
//   - The Gate: Approve button is physically locked when lines are unverified
//     (opacity-50, cursor-not-allowed, tooltip: "N lines unverified. B11 Gate locked.")
//   - The Receipt: On approval, confetti burst + SHA-256 Certificate modal
// ============================================================================

export function ScriptReview() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  const setActiveFact = usePerokioStore((s) => s.setActiveFact)
  const approveScriptLine = usePerokioStore((s) => s.approveScriptLine)
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()
  const [showCertificate, setShowCertificate] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [receiptHash, setReceiptHash] = useState('')
  const [hoveringGate, setHoveringGate] = useState(false)

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
  const unverifiedCount = totalLines - verifiedLines
  const totalDuration = fact.scriptLines.reduce((s, l) => s + l.durationSec, 0)

  const handlePublish = () => {
    if (!allVerified) {
      toast({
        title: `⛔ ${t('B11 Gate locked')}`,
        description: `${unverifiedCount} ${t('lines unverified. Publishing is physically blocked.')}`,
        variant: 'destructive',
      })
      return
    }

    // Generate a fake SHA-256 receipt hash
    const hash = generateMockHash(fact.id, verifiedLines)
    setReceiptHash(hash)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1500)
    setTimeout(() => setShowCertificate(true), 600)

    toast({
      title: `✅ ${t('Script approved')}`,
      description: `${fact.code} ${t('published to the Facts Wall.')}`,
    })
  }

  return (
    <div className="space-y-6">
      {/* === Hero — The Vault === */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeEditorial}
        className="relative overflow-hidden rounded-2xl glass-premium p-6 lg:p-8"
      >
        {/* Ambient gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: allVerified
              ? 'radial-gradient(ellipse 600px 400px at 90% -10%, rgba(216,239,112,0.10), transparent 60%), radial-gradient(ellipse 600px 400px at -10% 110%, rgba(216,239,112,0.05), transparent 60%)'
              : 'radial-gradient(ellipse 600px 400px at -10% 110%, rgba(229,72,77,0.08), transparent 60%)',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Shield icon — breathing if unverified, solid if verified */}
            <motion.div
              animate={allVerified ? { rotate: [0, -3, 3, 0] } : {}}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative"
            >
              <Shield className={cn('h-14 w-14', allVerified ? 'text-lime' : 'text-red')} strokeWidth={1.5} />
              <span className={cn(
                'absolute -top-1 -end-1 h-3 w-3 rounded-full',
                allVerified ? 'bg-lime animate-pulse-glow' : 'bg-red animate-pulse-glow-red',
              )} />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'text-[10px] uppercase tracking-[0.2em] font-bold',
                  allVerified ? 'text-lime' : 'text-red',
                )}>{t('The Moat')}</span>
                <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B11 · Script Review</Badge>
              </div>
              <h2 className="text-2xl font-serif font-semibold">{t('Line-level fact locking engine')}</h2>
              <p className="text-sm text-muted-fg max-w-xl mt-1">
                {t('Every line must link to a verified source. Unverified lines physically block publishing.')}
              </p>
            </div>
          </div>

          {/* Verified/total counter — premium style */}
          <div className="flex flex-col items-end gap-1.5">
            <div
              className={cn(
                'px-5 py-3 rounded-2xl border-2 font-mono font-bold text-3xl tabular-nums transition-all',
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
                : `${unverifiedCount} ${t('unverified · B11 Gate locked')}`}
            </span>
          </div>
        </div>
      </motion.div>

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
        {/* === Script lines — the vault === */}
        <div className="lg:col-span-2 glass-premium rounded-2xl p-5">
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
              const sourceTag = source ? `SRC-${String(idx + 1).padStart(2, '0')}` : null

              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08, ...springSoft }}
                  whileHover={isVerified ? { x: 2 } : {}}
                  className={cn(
                    'relative rounded-xl p-4 transition-all',
                    isVerified ? 'glass-lime' : 'glass-red border-dashed',
                  )}
                  style={!isVerified ? { borderStyle: 'dashed' } : undefined}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div
                      className={cn(
                        'h-10 w-10 shrink-0 rounded-xl flex items-center justify-center',
                        isVerified ? 'bg-lime/15 text-lime' : 'bg-red/15 text-red',
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

                        {/* === PREMIUM SOURCE CHIP === */}
                        {isVerified ? (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={springSnappy}
                            className="source-chip ms-auto"
                            title={`${source?.label}\n${source?.url}`}
                          >
                            <Lock className="h-2.5 w-2.5" />
                            {sourceTag}
                          </motion.div>
                        ) : (
                          <span
                            className="text-[10px] font-mono ml-auto px-2 py-0.5 rounded bg-red/10 text-red"
                            data-mono
                          >
                            UNVERIFIED
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{line.text}</p>

                      {/* === Source link / dropdown === */}
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {isVerified ? (
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-lime/10 border border-lime/25 group">
                            <ShieldCheck className="h-3.5 w-3.5 text-lime" />
                            <span className="text-xs font-medium">{source?.label}</span>
                            {sourceTag && (
                              <span className="text-[10px] font-mono text-lime" data-mono>
                                · {sourceTag}
                              </span>
                            )}
                            <ExternalLink className="h-3 w-3 text-muted-fg group-hover:text-lime transition-colors" />
                          </div>
                        ) : (
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
                            <SelectTrigger className="h-7 w-auto text-xs gap-1 border-red/40 bg-red/5 hover:bg-red/10 transition-colors">
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
                {fact.sources.map((s, idx) => {
                  const usedIn = fact.scriptLines.filter((l) => l.sourceId === s.id).length
                  return (
                    <div key={s.id} className="rounded-lg glass p-2.5 hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">{s.type}</Badge>
                        <span className="source-chip">
                          <Lock className="h-2.5 w-2.5" />
                          SRC-{String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="text-xs font-medium leading-snug mb-1.5">{s.label}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-fg font-mono truncate" data-mono>{s.url}</span>
                        <Badge className="text-[10px] ms-2 shrink-0 bg-lime/10 text-lime border border-lime/20">
                          {usedIn} {t('line(s)')}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* === THE GATE — premium locked/unlocked button === */}
          <div className="glass rounded-2xl p-5 relative overflow-visible">
            <span className="font-serif text-base font-semibold">{t('Publish control')}</span>
            <div className="mt-3 space-y-3">
              {/* Status indicator */}
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
                    {allVerified ? t('Ready to publish') : t('B11 Gate locked')}
                  </span>
                </div>
                <p className="text-xs text-muted-fg">
                  {allVerified
                    ? t('All lines are linked — the AI physically cannot hallucinate.')
                    : `${unverifiedCount} ${t('unverified line(s). AI could hallucinate — legal & brand risk.')}`}
                </p>
              </div>

              {/* === The Gate button — physically locked when unverified === */}
              <div className="relative">
                <motion.button
                  whileHover={allVerified ? { scale: 1.01 } : {}}
                  whileTap={allVerified ? { scale: 0.99 } : {}}
                  transition={springSnappy}
                  onClick={handlePublish}
                  onMouseEnter={() => setHoveringGate(true)}
                  onMouseLeave={() => setHoveringGate(false)}
                  className={cn(
                    'w-full gap-2 h-12 rounded-xl font-semibold text-sm transition-all relative',
                    allVerified
                      ? 'bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime'
                      : 'gate-locked bg-white/[0.04] text-muted-fg border border-white/10',
                  )}
                >
                  {allVerified ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 inline-block" />
                      {t('Approve & publish to Wall')}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 inline-block" />
                      {t('Locked — finish verification')}
                    </>
                  )}
                </motion.button>

                {/* Tooltip on hover when locked */}
                {!allVerified && hoveringGate && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springSnappy}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg glass-strong text-xs text-red whitespace-nowrap shadow-lg"
                  >
                    {unverifiedCount} {t('lines unverified. B11 Gate locked.')}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 glass-strong" />
                  </motion.div>
                )}

                {/* Confetti burst */}
                {showConfetti && <ConfettiBurst />}
              </div>

              {!allVerified && (
                <div className="flex items-start gap-2 text-xs text-muted-fg">
                  <AlertTriangle className="h-3.5 w-3.5 text-red shrink-0 mt-0.5" />
                  <span>{t('Unlocking requires linking every line to a verified source. This is Perokio\'s core promise.')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.06] text-xs text-muted-fg space-y-1">
                <Row label={t('Base Fee')} value={`$${fact.baseFee}`} />
                <Row label={t('CPM Rate')} value={`$${fact.cpmRate}/1k`} />
                <Row label={t('Budget Cap')} value={`$${fact.budgetCap}`} />
                <Row label={t('Max creators')} value={String(fact.maxCreators)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === SHA-256 Certificate Modal === */}
      <AnimatePresence>
        {showCertificate && (
          <CertificateModal
            hash={receiptHash}
            factCode={fact.code}
            verifiedLines={verifiedLines}
            totalLines={totalLines}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// CertificateModal — the SHA-256 receipt
// ============================================================================

function CertificateModal({
  hash, factCode, verifiedLines, totalLines, onClose,
}: {
  hash: string
  factCode: string
  verifiedLines: number
  totalLines: number
  onClose: () => void
}) {
  const { toast } = useToast()
  const t = useT()

  const copyHash = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash).catch(() => {})
    }
    toast({ title: `🔗 ${t('Hash copied')}`, description: t('SHA-256 verification receipt') })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={springSnappy}
        className="certificate-border rounded-2xl p-6 max-w-md w-full text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 end-3 p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <X className="h-4 w-4 text-muted-fg" />
        </button>

        {/* Certificate icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springSnappy, delay: 0.1 }}
          className="mx-auto mb-4 h-16 w-16 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center success-ring-glow"
        >
          <ShieldCheck className="h-8 w-8 text-lime" />
        </motion.div>

        <h3 className="font-serif text-xl font-semibold mb-1">{t('Verification Receipt')}</h3>
        <p className="text-sm text-muted-fg mb-4">
          {t('B11 Moat Engine · Script approved')}
        </p>

        {/* Fact code + verified count */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10 font-mono" data-mono>
            {factCode}
          </Badge>
          <Badge className="text-[10px] bg-lime/10 text-lime border border-lime/25">
            {verifiedLines}/{totalLines} {t('verified')}
          </Badge>
        </div>

        {/* SHA-256 hash */}
        <div className="glass rounded-xl p-3 mb-4">
          <div className="text-[10px] text-muted-fg uppercase tracking-wider mb-1.5">SHA-256 Receipt</div>
          <div className="font-mono text-[10px] text-lime break-all leading-relaxed" data-mono>
            {hash}
          </div>
        </div>

        <p className="text-[11px] text-muted-fg leading-relaxed mb-5">
          {t('This receipt proves the script was 100% source-verified at approval time.')}
          {t(' Any modification invalidates it.')}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={copyHash}
            className="gap-2 glass border-lime/25 text-lime hover:bg-lime/10 flex-1"
          >
            <Copy className="h-3.5 w-3.5" />
            {t('Copy hash')}
          </Button>
          <Button
            onClick={onClose}
            className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 flex-1"
          >
            <CheckCircle2 className="h-4 w-4" />
            {t('Done')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// ConfettiBurst — subtle 1.5s lime particle burst
// ============================================================================

function ConfettiBurst() {
  const colors = ['#D8EF70', '#6FD3C7', '#D8EF70', '#D8EF70']
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2
        const distance = 60 + Math.random() * 40
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance - 20
        const color = colors[i % colors.length]
        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x, y, scale: 0.3 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="confetti-particle"
            style={{ background: color, boxShadow: `0 0 4px ${color}80` }}
          />
        )
      })}
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function generateMockHash(factId: string, verifiedLines: number): string {
  // Generate a 64-char hex string (SHA-256 length)
  const input = `${factId}-${verifiedLines}-${Date.now()}`
  let hash = ''
  for (let i = 0; i < 64; i++) {
    hash += ((input.charCodeAt(i % input.length) * (i + 1)) % 16).toString(16)
  }
  return hash
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
