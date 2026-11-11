'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Calendar, ArrowLeft, Clock } from 'lucide-react'
import { useT } from '@/lib/perokio/i18n'
import { springSnappy } from '@/lib/perokio/motion'

// ============================================================================
// ApprovalModal — full-screen B12 success modal
// ============================================================================
// When the brand clicks "Approve," this modal opens:
//   "Video Approved. Auto-publishing in 1 hour via Postiz.
//    [View Schedule] [Back to Dashboard]"
// ============================================================================

interface ApprovalModalProps {
  open: boolean
  onClose: () => void
  onViewSchedule: () => void
  onBackToDashboard: () => void
  videoThumbnail?: string
  factCode?: string
  platform?: string
}

export function ApprovalModal({
  open, onClose, onViewSchedule, onBackToDashboard,
  videoThumbnail = '🎬', factCode = 'F-XXXX', platform = 'tiktok',
}: ApprovalModalProps) {
  const t = useT()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={springSnappy}
            className="glass-strong rounded-2xl p-6 max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header icon */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springSnappy, delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className="h-16 w-16 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-lime" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-serif text-2xl font-semibold mb-1"
            >
              {t('Video Approved')}
            </motion.h3>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-fg mb-5"
            >
              {t('Auto-publishing in 1 hour via Postiz.')}.
            </motion.p>

            {/* Video thumbnail */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="mx-auto mb-5 h-24 w-24 rounded-2xl glass flex items-center justify-center text-5xl"
            >
              {videoThumbnail}
            </motion.div>

            {/* Meta row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mb-5"
            >
              <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10 font-mono" data-mono>
                {factCode}
              </Badge>
              <Badge className="text-[10px] bg-lime/10 text-lime border border-lime/20 capitalize">
                {platform}
              </Badge>
              <Badge className="text-[10px] bg-orange/10 text-orange border border-orange/25 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {t('in 1 hour')}
              </Badge>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <Button
                onClick={onViewSchedule}
                className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 flex-1"
              >
                <Calendar className="h-4 w-4" />
                {t('View Schedule')}
              </Button>
              <Button
                variant="outline"
                onClick={onBackToDashboard}
                className="gap-2 glass border-white/10 hover:bg-white/5 flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('Back to Dashboard')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
