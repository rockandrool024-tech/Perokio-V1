'use client'

/**
 * ShareModal — reusable share dialog with live OG card preview.
 *
 * §2 (Cycle 8): The "Cashtag" Share Mechanics.
 *
 * Displays:
 *   - The live ShareCardPreview (1200×630 OG card)
 *   - A copyable link input (mock URL: perokio.com/creator/handle or perokio.com/wall/factId)
 *   - Social share buttons: X (Twitter), WhatsApp, Copy Link
 *
 * Used on P03 (Creator Profile) and P04 (Public Fact Page).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShareCardPreview } from '@/components/perokio/shared/share-card-preview'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { springSnappy } from '@/lib/perokio/motion'
import { cn } from '@/lib/utils'
import { X, Copy, Check, Twitter, MessageCircle, Link2 } from 'lucide-react'
import type { Creator, FactBundle } from '@/lib/perokio/types'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Type of share: creator profile or fact page */
  type: 'creator' | 'fact'
  /** For type='creator' */
  creator?: Creator
  /** For type='fact' */
  fact?: FactBundle
  /** The mock share URL */
  shareUrl: string
}

export function ShareModal({
  open,
  onOpenChange,
  type,
  creator,
  fact,
  shareUrl,
}: ShareModalProps) {
  const reduced = useReducedMotion()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    // Mock clipboard copy (navigator.clipboard may not work in all contexts)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSocialShare = (platform: 'twitter' | 'whatsapp') => {
    // Mock social share — in production this would open the platform's share dialog
    const text = type === 'creator'
      ? `Check out ${creator?.name} on Perokio`
      : `"${fact?.claim?.slice(0, 60)}..." — verified on Perokio`
    const url = platform === 'twitter'
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
      : `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`
    // In a real app: window.open(url, '_blank')
    // For demo: just show the copied state
    handleCopy()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
            transition={springSnappy}
            className="glass-strong rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 id="share-title" className="font-serif text-lg font-semibold">
                {type === 'creator' ? 'Share Profile' : 'Share Fact'}
              </h3>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-fg hover:text-fg transition-colors p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live OG card preview */}
            <div className="mb-4">
              <ShareCardPreview
                type={type}
                creator={creator}
                fact={fact}
              />
            </div>

            {/* Copyable link */}
            <div className="mb-4">
              <label className="text-xs text-muted-fg uppercase tracking-wider mb-2 block">
                Share link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2.5 rounded-lg glass border border-white/10 bg-white/[0.02] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lime/40"
                  data-mono
                />
                <button
                  onClick={handleCopy}
                  className={cn(
                    'shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-all border',
                    copied
                      ? 'bg-lime/15 text-lime border-lime/30'
                      : 'glass border-white/10 text-muted-fg hover:text-fg hover:bg-white/[0.05]',
                  )}
                  aria-label="Copy link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {copied && (
                <p className="text-[10px] text-lime mt-1.5">✓ Link copied to clipboard</p>
              )}
            </div>

            {/* Social share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSocialShare('twitter')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl glass border border-white/10 hover:bg-white/[0.05] transition-colors"
              >
                <Twitter className="h-5 w-5 text-muted-fg" />
                <span className="text-[10px] text-muted-fg">X / Twitter</span>
              </button>
              <button
                onClick={() => handleSocialShare('whatsapp')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl glass border border-white/10 hover:bg-white/[0.05] transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-muted-fg" />
                <span className="text-[10px] text-muted-fg">WhatsApp</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl glass border border-white/10 hover:bg-white/[0.05] transition-colors"
              >
                <Link2 className="h-5 w-5 text-muted-fg" />
                <span className="text-[10px] text-muted-fg">Copy Link</span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] text-center">
              <p className="text-[10px] text-muted-fg">
                {type === 'creator'
                  ? 'Every share recruits new creators to Perokio.'
                  : 'Every share grows the fact\'s reach and the brand\'s FOMO.'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
