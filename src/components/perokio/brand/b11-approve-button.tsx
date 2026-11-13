'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePerokioStore } from '@/store/perokio'
import { useToast } from '@/hooks/use-toast'
import { useT } from '@/lib/perokio/i18n'
import { springSnappy, easeEditorial } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, Lock, AlertTriangle, ShieldCheck, Copy, X,
} from 'lucide-react'

// ============================================================================
// B11_ApproveButton — the gated approval button with SHA-256 stamp
// ============================================================================
// The B11 Gate is the core moat. This button:
//   - Is physically locked (opacity-50, cursor-not-allowed) when lines are unverified
//   - Shows a tooltip on hover: "N sources missing. B11 Gate locked."
//   - When all lines are verified + clicked → triggers the SHA-256 rubber stamp
//   - After the stamp, shows the VerificationReceipt hash in a certificate modal
// ============================================================================

interface B11ApproveButtonProps {
  scriptVersionId: string
  verifiedLines: number
  totalLines: number
  onApprove?: () => void
}

export function B11ApproveButton({
  scriptVersionId, verifiedLines, totalLines, onApprove,
}: B11ApproveButtonProps) {
  const t = useT()
  const { toast } = useToast()
  const approveScript = usePerokioStore((s) => s.approveScript)
  const [hovering, setHovering] = useState(false)
  const [showStamp, setShowStamp] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [receiptHash, setReceiptHash] = useState('')
  const [approving, setApproving] = useState(false)

  const allVerified = verifiedLines === totalLines
  const unverifiedCount = totalLines - verifiedLines

  const handleApprove = async () => {
    if (!allVerified) {
      toast({
        title: `⛔ B11 Gate locked`,
        description: `${unverifiedCount} lines unverified. Publishing is physically blocked.`,
        variant: 'destructive',
      })
      return
    }

    setApproving(true)

    // Call the real API (or mock fallback)
    const result = await approveScript(scriptVersionId)

    if (result.success) {
      setReceiptHash(result.hash || '')
      // Trigger the stamp animation
      setShowStamp(true)
      setTimeout(() => setShowStamp(false), 1500)
      // Then show the certificate
      setTimeout(() => setShowCertificate(true), 800)
      onApprove?.()
    } else {
      toast({
        title: `⛔ B11 Gate blocked approval`,
        description: result.error || 'Unknown error',
        variant: 'destructive',
      })
    }

    setApproving(false)
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
          disabled={approving}
          className={cn(
            'w-full gap-2 h-12 rounded-xl font-semibold text-sm transition-all relative',
            allVerified
              ? 'bg-lime text-[#0A0F0D] hover:bg-lime/90 glow-lime'
              : 'opacity-50 cursor-not-allowed bg-white/[0.04] text-muted-fg border border-white/10',
          )}
        >
          {approving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <CheckCircle2 className="h-4 w-4" />
            </motion.div>
          ) : allVerified ? (
            <CheckCircle2 className="h-4 w-4 inline-block" />
          ) : (
            <Lock className="h-4 w-4 inline-block" />
          )}

          {allVerified
            ? t('Approve & Launch')
            : t('Locked — finish verification')}

          {/* Confetti + stamp */}
          {showStamp && <StampAnimation />}
        </motion.button>

        {/* Tooltip on hover when locked */}
        {!allVerified && hovering && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl glass-strong text-xs whitespace-nowrap shadow-lg flex items-center gap-2"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-red" />
            <span className="text-red font-medium">
              {unverifiedCount} {unverifiedCount === 1 ? 'source' : 'sources'} missing. B11 Gate locked.
            </span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 glass-strong" />
          </motion.div>
        )}
      </div>

      {/* === Certificate Modal === */}
      <AnimatePresence>
        {showCertificate && (
          <CertificateModal
            hash={receiptHash}
            verifiedLines={verifiedLines}
            totalLines={totalLines}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================================
// StampAnimation — SHA-256 rubber stamp
// ============================================================================

function StampAnimation() {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      <motion.div
        initial={{ scale: 2, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: -12, opacity: 1 }}
        exit={{ scale: 1.4, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 14 }}
      >
        <svg viewBox="0 0 200 200" width="160" height="160">
          <circle cx="100" cy="100" r="86" fill="none" stroke="#D8EF70" strokeWidth="3" strokeDasharray="4 3" opacity="0.9" />
          <circle cx="100" cy="100" r="74" fill="none" stroke="#D8EF70" strokeWidth="2" opacity="0.7" />
          <defs>
            <path id="stamp-top" d="M 30 100 A 70 70 0 0 1 170 100" fill="none" />
            <path id="stamp-bot" d="M 30 100 A 70 70 0 0 0 170 100" fill="none" />
          </defs>
          <text fill="#D8EF70" fontSize="14" fontWeight="bold" letterSpacing="2" fontFamily="monospace">
            <textPath href="#stamp-top" startOffset="50%" textAnchor="middle">
              VERIFIED · B11 MOAT
            </textPath>
          </text>
          <text fill="#D8EF70" fontSize="11" letterSpacing="3" fontFamily="monospace" opacity="0.85">
            <textPath href="#stamp-bot" startOffset="50%" textAnchor="middle">
              PEROKIO STUDIO
            </textPath>
          </text>
          <path d="M 82 100 L 95 113 L 122 86" fill="none" stroke="#D8EF70" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  )
}

// ============================================================================
// CertificateModal — SHA-256 receipt
// ============================================================================

function CertificateModal({
  hash, verifiedLines, totalLines, onClose,
}: {
  hash: string
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
    toast({ title: `🔗 Hash copied`, description: 'SHA-256 verification receipt' })
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

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springSnappy, delay: 0.1 }}
          className="mx-auto mb-4 h-16 w-16 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center success-ring-glow"
        >
          <ShieldCheck className="h-8 w-8 text-lime" />
        </motion.div>

        <h3 className="font-serif text-xl font-semibold mb-1">{t('Verification Receipt')}</h3>
        <p className="text-sm text-muted-fg mb-4">B11 Moat Engine · Script approved</p>

        <div className="flex items-center justify-center gap-3 mb-5">
          <Badge className="text-[10px] bg-lime/10 text-lime border border-lime/25">
            {verifiedLines}/{totalLines} verified
          </Badge>
        </div>

        {/* SHA-256 hash */}
        <div className="glass rounded-xl p-3 mb-4">
          <div className="text-[10px] text-muted-fg uppercase tracking-wider mb-1.5">SHA-256 Receipt</div>
          <div className="font-mono text-[10px] text-lime break-all leading-relaxed" data-mono>
            {hash || 'Generating…'}
          </div>
        </div>

        <p className="text-[11px] text-muted-fg leading-relaxed mb-5">
          This receipt proves the script was 100% source-verified at approval time.
          Any modification invalidates it.
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
