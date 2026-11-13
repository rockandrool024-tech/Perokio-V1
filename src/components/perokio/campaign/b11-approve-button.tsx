'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/perokio/i18n'
import { springSnappy } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { Lock, CheckCircle2, ShieldCheck, X, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// B11_ApproveButton — The gated approval button with SHA-256 stamp
// ============================================================================
// UX Rule: Physically disabled (opacity-50, cursor-not-allowed) until all
// lines are verified. Hovering shows a tooltip: "N sources missing. B11
// Gate locked." When clicked, triggers the SHA-256 rubber stamp animation.
// ============================================================================

interface B11ApproveButtonProps {
  allVerified: boolean
  unverifiedCount: number
  onApprove: () => Promise<{ success: boolean; hash?: string; error?: string }>
  className?: string
}

export function B11ApproveButton({
  allVerified, unverifiedCount, onApprove, className,
}: B11ApproveButtonProps) {
  const t = useT()
  const { toast } = useToast()
  const [hovering, setHovering] = useState(false)
  const [approving, setApproving] = useState(false)
  const [showStamp, setShowStamp] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [receiptHash, setReceiptHash] = useState('')

  const handleApprove = async () => {
    if (!allVerified || approving) return

    setApproving(true)

    try {
      const result = await onApprove()

      if (result.success && result.hash) {
        setReceiptHash(result.hash)
        // Trigger SHA-256 rubber stamp animation
        setShowStamp(true)
        setTimeout(() => setShowStamp(false), 1500)
        // Then show the certificate modal
        setTimeout(() => setShowCertificate(true), 600)

        toast({
          title: `✅ ${t('Script Approved')}`,
          description: t('B11 Gate passed. VerificationReceipt created.'),
        })
      } else if (!result.success) {
        toast({
          title: `⛔ ${t('B11 Gate locked')}`,
          description: result.error || t('Cannot approve — lines unverified.'),
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      toast({
        title: `⛔ ${t('Approval failed')}`,
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setApproving(false)
    }
  }

  return (
    <>
      <div className="relative">
        <motion.button
          whileHover={allVerified ? { scale: 1.01 } : {}}
          whileTap={allVerified ? { scale: 0.99 } : {}}
          transition={springSnappy}
          onClick={handleApprove}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          disabled={!allVerified || approving}
          className={cn(
            'w-full gap-2 h-12 rounded-xl font-semibold text-sm transition-all relative',
            allVerified && !approving
              ? 'bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime'
              : allVerified && approving
                ? 'bg-lime/80 text-[#0A0F0D]'
                : 'gate-locked bg-white/[0.04] text-muted-fg border border-white/10',
            className,
          )}
        >
          {approving ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              >
                <CheckCircle2 className="h-4 w-4" />
              </motion.div>
              {t('Approving...')}
            </span>
          ) : allVerified ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('Approve & Launch')}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              {t('Locked — finish verification')}
            </span>
          )}
        </motion.button>

        {/* === Tooltip on hover when locked === */}
        {!allVerified && hovering && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg glass-strong text-xs text-red whitespace-nowrap shadow-lg"
          >
            {unverifiedCount} {unverifiedCount === 1 ? 'source' : 'sources'} missing. {t('B11 Gate locked.')}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 glass-strong" />
          </motion.div>
        )}

        {/* === SHA-256 rubber stamp animation === */}
        <AnimatePresence>
          {showStamp && <RubberStamp />}
        </AnimatePresence>
      </div>

      {/* === Certificate modal === */}
      <AnimatePresence>
        {showCertificate && (
          <CertificateModal
            hash={receiptHash}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================================
// RubberStamp — the SHA-256 rubber stamp micro-interaction
// ============================================================================

function RubberStamp() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.6, rotate: -25 }}
      animate={{ opacity: 1, scale: 1, rotate: -12 }}
      exit={{ opacity: 0, scale: 1.4, rotate: -25 }}
      transition={{ type: 'spring', stiffness: 280, damping: 14 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
    >
      <div className="relative">
        <svg viewBox="0 0 200 200" width="160" height="160">
          {/* Outer ring */}
          <circle cx="100" cy="100" r="86" fill="none" stroke="#D8EF70" strokeWidth="3" strokeDasharray="4 3" opacity="0.9" />
          {/* Inner circle */}
          <circle cx="100" cy="100" r="74" fill="none" stroke="#D8EF70" strokeWidth="2" opacity="0.7" />
          {/* Curved text — top arc */}
          <defs>
            <path id="topArc" d="M 30 100 A 70 70 0 0 1 170 100" fill="none" />
            <path id="botArc" d="M 30 100 A 70 70 0 0 0 170 100" fill="none" />
          </defs>
          <text fill="#D8EF70" fontSize="14" fontWeight="bold" letterSpacing="2" fontFamily="monospace">
            <textPath href="#topArc" startOffset="50%" textAnchor="middle">
              VERIFIED BY PEROKIO STUDIO
            </textPath>
          </text>
          <text fill="#D8EF70" fontSize="11" letterSpacing="3" fontFamily="monospace" opacity="0.85">
            <textPath href="#botArc" startOffset="50%" textAnchor="middle">
              MOAT ENGINE · B11
            </textPath>
          </text>
          {/* Check icon */}
          <path d="M 82 100 L 95 113 L 122 86" fill="none" stroke="#D8EF70" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </motion.div>
  )
}

// ============================================================================
// CertificateModal — the SHA-256 receipt display
// ============================================================================

function CertificateModal({ hash, onClose }: { hash: string; onClose: () => void }) {
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
        <button onClick={onClose} className="absolute top-3 end-3 p-1 rounded-lg hover:bg-white/[0.05] transition-colors">
          <X className="h-4 w-4 text-muted-fg" />
        </button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springSnappy, delay: 0.1 }}
          className="mx-auto mb-4 h-16 w-16 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center success-ring-glow"
        >
          <ShieldCheck className="h-8 w-8 text-lime" />
        </motion.div>

        <h3 className="font-serif text-xl font-semibold mb-1">{t('Verification Receipt')}</h3>
        <p className="text-sm text-muted-fg mb-4">{t('B11 Moat Engine · Script approved')}</p>

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
          <Button variant="outline" onClick={copyHash} className="gap-2 glass border-lime/25 text-lime hover:bg-lime/10 flex-1">
            <Copy className="h-3.5 w-3.5" />
            {t('Copy hash')}
          </Button>
          <Button onClick={onClose} className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 flex-1">
            <CheckCircle2 className="h-4 w-4" />
            {t('Done')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
