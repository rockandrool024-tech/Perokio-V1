'use client'

/**
 * C07 Profile Editor — edit your creator profile with live OG preview.
 *
 * Per master spec §4 (C07):
 *   - Edit: name, handle, avatar (emoji picker grid), bio (textarea),
 *     social links (3 inputs: TikTok / Instagram / YouTube)
 *   - Live OG card preview — ShareCardPreview type="creator" with the
 *     CREATORS[0] data, updated live as the user types (local state overrides
 *     the creator fields)
 *   - "Powered by Perokio" badge is always visible in the preview (it lives
 *     in ShareCardPreview's footer)
 *   - Save button → toast "Profile saved"
 *   - Cancel → setCreatorView('profile') (back to P03 public view)
 *   - 2-column on desktop — left: form, right: live OG preview (sticky)
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AnimatedCTA } from '@/components/perokio/shared/animated-cta'
import { ShareCardPreview } from '@/components/perokio/shared/share-card-preview'
import { usePerokioStore } from '@/store/perokio'
import { CREATORS } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { useReducedMotion } from '@/lib/perokio/use-reduced-motion'
import { easeEditorial } from '@/lib/perokio/motion'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Creator } from '@/lib/perokio/types'
import {
  ArrowLeft, Save, User, AtSign, Music, Instagram, Youtube,
  Sparkles, Check, Crown,
} from 'lucide-react'

// Avatar emoji grid — covers the demo creator + common alternatives.
const AVATAR_OPTIONS = [
  '👩🏽‍🦱', '🧔🏽', '👩🏻', '👨🏽', '👩🏽', '👨🏻', '👩🏾', '👨🏾',
  '👩🏼', '👨🏼', '🧕🏽', '👩‍🎤', '🧑‍🎨', '👨‍🎤', '👩‍🦰', '🧑‍🦱',
]

const SOCIAL_PLATFORMS = [
  { key: 'tiktok', label: 'TikTok', icon: Music, placeholder: '@amira.tn', color: 'text-teal' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@amira.bloom', color: 'text-orange' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: '@amiracreates', color: 'text-red' },
] as const

export function ProfileEditor() {
  const setCreatorView = usePerokioStore((s) => s.setCreatorView)
  const { toast } = useToast()
  const t = useT()
  const reduced = useReducedMotion()

  // Start from CREATORS[0] (Amira) — the demo creator. Local state lets the
  // user override fields; the OG preview reflects whatever they type.
  const baseCreator = CREATORS[0]
  const [name, setName] = useState(baseCreator.name)
  const [handle, setHandle] = useState(baseCreator.handle)
  const [avatar, setAvatar] = useState(baseCreator.avatar)
  const [bio, setBio] = useState(
    'Verified creator on Perokio. Local stories, global reach. Coffee, beauty, and Tunisian tech.',
  )
  const [socials, setSocials] = useState<Record<string, string>>({
    tiktok: '@amira.tn',
    instagram: '@amira.bloom',
    youtube: '@amiracreates',
  })

  // Merge local overrides into a Creator object for the OG preview.
  // Spread first so we keep id/level/rating/etc.; then override name/handle/avatar.
  const previewCreator: Creator = {
    ...baseCreator,
    name: name.trim() || baseCreator.name,
    handle: handle.trim() || baseCreator.handle,
    avatar,
  }

  const handleSave = () => {
    toast({
      title: `✓ ${t('Profile saved')}`,
      description: 'Your OG card is updated automatically.',
    })
  }

  const handleCancel = () => {
    setCreatorView('profile')
  }

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 text-xs text-muted-fg hover:text-lime transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('Profile')}
          </button>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-lime" />
            Edit profile
            <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">C07</Badge>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedCTA variant="ghost" onClick={handleCancel}>
            Cancel
          </AnimatedCTA>
          <AnimatedCTA variant="primary" successLabel="✓ Saved" onClick={handleSave}>
            <Save className="h-4 w-4" />
            {t('Save draft')}
          </AnimatedCTA>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* === Left: form === */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeEditorial}
          className="lg:col-span-3 space-y-5"
        >
          {/* Identity block */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-lime" />
              Identity
            </div>

            {/* Avatar picker */}
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATAR_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setAvatar(em)}
                    className={cn(
                      'h-10 rounded-lg flex items-center justify-center text-xl transition-all',
                      avatar === em
                        ? 'glass-lime border border-lime/40'
                        : 'glass hover:bg-white/[0.06] border border-transparent',
                    )}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-fg">
                Selected: <span className="font-mono text-lime" data-mono>{avatar}</span>
              </p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Display name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amira Ben Salah"
                className="glass border-white/10 bg-white/[0.02]"
              />
            </div>

            {/* Handle */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-handle" className="flex items-center gap-1.5">
                <AtSign className="h-3 w-3 text-muted-fg" />
                Handle
              </Label>
              <Input
                id="profile-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@amira.tn"
                className="glass border-white/10 bg-white/[0.02] font-mono"
                data-mono
              />
            </div>
          </div>

          {/* Bio block */}
          <div className="glass rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-teal" />
              Bio
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="One-sentence bio that shows up on your OG card and creator profile page."
              rows={3}
              maxLength={180}
              className="glass border-white/10 bg-white/[0.02] resize-none"
            />
            <div className="flex items-center justify-between text-[10px] text-muted-fg">
              <span>Shown on your public profile page (P03).</span>
              <span className="font-mono" data-mono>
                {bio.length}/180
              </span>
            </div>
          </div>

          {/* Social links block */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Music className="h-4 w-4 text-orange" />
              Social links
            </div>
            <div className="space-y-3">
              {SOCIAL_PLATFORMS.map((p) => {
                const Icon = p.icon
                return (
                  <div key={p.key} className="space-y-1.5">
                    <Label htmlFor={`social-${p.key}`} className="flex items-center gap-1.5">
                      <Icon className={cn('h-3 w-3', p.color)} />
                      {p.label}
                    </Label>
                    <Input
                      id={`social-${p.key}`}
                      value={socials[p.key]}
                      onChange={(e) => setSocials((s) => ({ ...s, [p.key]: e.target.value }))}
                      placeholder={p.placeholder}
                      className="glass border-white/10 bg-white/[0.02] font-mono"
                      data-mono
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* === Right: sticky live OG preview === */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest uppercase text-muted-fg">
                Live OG card preview
              </span>
              <Badge className="text-[10px] gap-1 bg-lime/15 text-lime border border-lime/25">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                </span>
                Live
              </Badge>
            </div>

            <motion.div
              // Re-mount the preview when key fields change so the entrance animation re-fires.
              key={`${name}-${handle}-${avatar}`}
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={easeEditorial}
            >
              <ShareCardPreview type="creator" creator={previewCreator} />
            </motion.div>

            {/* Meta row — what the OG route will export */}
            <div className="glass rounded-xl p-3 space-y-1.5 text-[10px] text-muted-fg">
              <div className="flex items-center justify-between">
                <span>OG dimensions</span>
                <span className="font-mono" data-mono>1200 × 630</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-generated route</span>
                <span className="font-mono text-lime" data-mono>/api/og/creator</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Powered by badge</span>
                <span className="flex items-center gap-1 text-lime">
                  <Check className="h-3 w-3" /> Always on
                </span>
              </div>
            </div>

            {/* Profile stats summary — non-editable read-only context */}
            <div className="glass rounded-xl p-3 space-y-2">
              <div className="text-[10px] tracking-widest uppercase text-muted-fg">
                Profile stats (read-only)
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="Level" value={baseCreator.level} icon={Crown} accent="lime" />
                <Stat label="Rating" value={`★ ${baseCreator.rating}`} icon={Sparkles} accent="lime" />
                <Stat label="Prints" value={String(baseCreator.completedVideos)} icon={Check} accent="orange" />
                <Stat label="Followers" value={formatCompactLocal(baseCreator.followers)} icon={User} accent="orange" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: typeof User
  accent: 'lime' | 'orange'
}) {
  const color = accent === 'lime' ? 'text-lime' : 'text-orange'
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-muted-fg">{label}</div>
        <div className={cn('font-mono font-bold text-sm truncate', color)} data-mono>
          {value}
        </div>
      </div>
    </div>
  )
}

// Tiny local compact formatter — avoids pulling a different import path.
function formatCompactLocal(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
