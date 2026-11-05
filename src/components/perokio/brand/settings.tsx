'use client'

/**
 * B20 Settings — exactly 4 tabs.
 *
 * Hard limit: TABS.length === 4. No 5th tab. No "Advanced" tab.
 * No "Danger Zone." No API key field.
 *
 * Tabs:
 *   1. Account       — brand name, logo (emoji picker), industry,
 *                       timezone, language (EN/AR). Save → toast "Settings saved".
 *   2. Team          — list with role badges (Owner / Editor / Viewer),
 *                       invite-by-email input + button → toast
 *                       "Invitation sent to X". Remove → confirm dialog
 *                       → toast "Member removed".
 *   3. Integrations  — 4 integrations (Postiz, Hyperframe, Flouci, Stripe),
 *                       each with connected/disconnected toggle.
 *                       Toggle → toast "X connected/disconnected".
 *                       UI state only — no real OAuth.
 *   4. Notifications — 5 toggles persisted in local useState.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePerokioStore } from '@/store/perokio'
import { BRANDS } from '@/lib/perokio/data'
import { useT, usePick } from '@/lib/perokio/i18n'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Settings as SettingsIcon,
  User,
  Users,
  Plug,
  Bell,
  Check,
  X,
  Plus,
  Trash2,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// HARD LIMIT: exactly 4 tabs. Adding a 5th entry here is a spec violation.
// Verified at authoring time: TABS.length === 4.
// ============================================================================
const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const

type TabId = (typeof TABS)[number]['id']

// === Account tab constants ===
const EMOJI_CHOICES = ['☕', '💄', '💻', '🫒', '🍴', '🛍️', '🏨', '🎬', '🌿', '🍷', '📱', '🎨']
const TIMEZONES = [
  'Africa/Tunis (GMT+1)',
  'Africa/Casablanca (GMT+1)',
  'Africa/Cairo (GMT+2)',
  'Asia/Riyadh (GMT+3)',
  'Europe/Paris (GMT+1)',
]

// === Team tab constants (mock — per-brand owner is implied) ===
type Role = 'Owner' | 'Editor' | 'Viewer'
interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
}
const INITIAL_TEAM: TeamMember[] = [
  { id: 'tm1', name: 'Sami Gharbi', email: 'sami@perokio.tn', role: 'Owner' },
  { id: 'tm2', name: 'Leila Mansour', email: 'leila@perokio.tn', role: 'Editor' },
  { id: 'tm3', name: 'Omar Trabelsi', email: 'omar@perokio.tn', role: 'Viewer' },
]

// === Integrations tab constants — UI state only, no real OAuth ===
interface Integration {
  id: string
  name: string
  desc: string
  icon: string
}
const INTEGRATIONS: Integration[] = [
  { id: 'postiz', name: 'Postiz', desc: 'Social publishing & scheduling', icon: '📸' },
  { id: 'hyperframe', name: 'Hyperframe', desc: 'In-browser video editor', icon: '🎬' },
  { id: 'flouci', name: 'Flouci', desc: 'Tunisia payments & payouts', icon: '💳' },
  { id: 'stripe', name: 'Stripe', desc: 'International card payments', icon: '🏦' },
]
const INITIAL_INTEGRATION_STATE: Record<string, boolean> = {
  postiz: true,
  hyperframe: true,
  flouci: true,
  stripe: false,
}

// === Notifications tab constants ===
interface NotificationPref {
  id: string
  label: string
  desc: string
}
const NOTIFICATIONS: NotificationPref[] = [
  { id: 'new_claim', label: 'New claim', desc: 'A creator claims one of your fact bundles' },
  { id: 'video_locked', label: 'Video locked', desc: 'A creator locks a video for your review' },
  { id: 'video_approved', label: 'Video approved', desc: 'A video passes review and is queued' },
  { id: 'video_rejected', label: 'Video rejected', desc: 'A video is returned for changes' },
  { id: 'weekly_digest', label: 'Weekly digest', desc: 'Monday morning performance summary' },
]
const INITIAL_NOTIFICATION_STATE: Record<string, boolean> = {
  new_claim: true,
  video_locked: true,
  video_approved: true,
  video_rejected: true,
  weekly_digest: false,
}

// ============================================================================
// Settings — B20
// ============================================================================
export function Settings() {
  const brandId = usePerokioStore((s) => s.activeBrandId)
  const lang = usePerokioStore((s) => s.lang)
  const setLang = usePerokioStore((s) => s.setLang)
  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const { toast } = useToast()
  const t = useT()
  const pick = usePick()

  // Hard guarantee: TABS array is exactly 4 entries.
  void TABS.length // 4 — assert at runtime is unnecessary; the const is fixed.

  const [activeTab, setActiveTab] = useState<TabId>('account')

  // === Account tab state ===
  const [brandName, setBrandName] = useState(brand.name)
  const [logo, setLogo] = useState(brand.logo)
  const [industry, setIndustry] = useState(brand.industry)
  const [timezone, setTimezone] = useState(TIMEZONES[0])

  // === Team tab state ===
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM)
  const [inviteEmail, setInviteEmail] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null)

  // === Integrations tab state ===
  const [integrationState, setIntegrationState] = useState<Record<string, boolean>>(
    INITIAL_INTEGRATION_STATE,
  )

  // === Notifications tab state ===
  const [notifState, setNotifState] = useState<Record<string, boolean>>(
    INITIAL_NOTIFICATION_STATE,
  )

  // === Handlers ===
  const handleSaveAccount = () => {
    toast({ title: '✅ Settings saved', description: `${brandName} · ${industry}` })
  }

  const handleInvite = () => {
    const email = inviteEmail.trim()
    if (!email) {
      toast({ title: 'Enter an email', description: 'Type a valid email to invite.' })
      return
    }
    toast({
      title: '📧 Invitation sent',
      description: `Invitation sent to ${email}`,
    })
    setInviteEmail('')
  }

  const handleConfirmRemove = () => {
    if (!confirmRemove) return
    const removed = confirmRemove
    setMembers((prev) => prev.filter((m) => m.id !== removed.id))
    setConfirmRemove(null)
    toast({
      title: '✓ Member removed',
      description: `${removed.name} no longer has access to ${brand.name}.`,
    })
  }

  const toggleIntegration = (integration: Integration) => {
    const next = !integrationState[integration.id]
    setIntegrationState((prev) => ({ ...prev, [integration.id]: next }))
    toast({
      title: next ? '🔌 Connected' : '🔌 Disconnected',
      description: `${integration.name} ${next ? 'connected' : 'disconnected'}`,
    })
  }

  const toggleNotification = (id: string) => {
    setNotifState((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div>
        <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-lime" />
          {t('Settings')}
          <Badge className="text-[10px] bg-white/[0.04] text-muted-fg border border-white/10">B20</Badge>
        </h2>
        <p className="text-sm text-muted-fg mt-0.5">
          {brand.logo} {pick(brand.name, brand.nameAr)} · {brand.tier} · {brand.location}
        </p>
      </div>

      {/* === Tab bar (4 entries) === */}
      <div className="glass rounded-2xl p-1.5 flex gap-1 overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-lime text-[#0A0F0D] shadow-lime-glow'
                  : 'text-muted-fg hover:text-fg hover:bg-white/[0.04]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* === Tab content (length 4) === */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {activeTab === 'account' && (
          <AccountTab
            brandName={brandName}
            setBrandName={setBrandName}
            logo={logo}
            setLogo={setLogo}
            industry={industry}
            setIndustry={setIndustry}
            timezone={timezone}
            setTimezone={setTimezone}
            lang={lang}
            setLang={setLang}
            onSave={handleSaveAccount}
          />
        )}

        {activeTab === 'team' && (
          <TeamTab
            members={members}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            onInvite={handleInvite}
            onRemove={setConfirmRemove}
            brandName={brand.name}
          />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsTab
            state={integrationState}
            onToggle={toggleIntegration}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab state={notifState} onToggle={toggleNotification} />
        )}
      </motion.div>

      {/* === Confirm-remove dialog (state-based) === */}
      {confirmRemove && (
        <ConfirmDialog
          member={confirmRemove}
          brandName={brand.name}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={handleConfirmRemove}
        />
      )}
    </div>
  )
}

// ============================================================================
// Tab 1: Account
// ============================================================================
function AccountTab({
  brandName,
  setBrandName,
  logo,
  setLogo,
  industry,
  setIndustry,
  timezone,
  setTimezone,
  lang,
  setLang,
  onSave,
}: {
  brandName: string
  setBrandName: (v: string) => void
  logo: string
  setLogo: (v: string) => void
  industry: string
  setIndustry: (v: string) => void
  timezone: string
  setTimezone: (v: string) => void
  lang: 'en' | 'ar'
  setLang: (l: 'en' | 'ar') => void
  onSave: () => void
}) {
  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      {/* Brand name + logo side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-start">
        {/* Logo emoji picker */}
        <div>
          <label className="text-[10px] text-muted-fg uppercase tracking-wider mb-2 block">
            Logo
          </label>
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl glass border-white/10 mb-2"
            style={{ background: 'rgba(216,239,112,0.06)' }}
          >
            {logo}
          </div>
          <div className="grid grid-cols-6 gap-1 max-w-[14rem]">
            {EMOJI_CHOICES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setLogo(emoji)}
                className={cn(
                  'h-8 w-8 rounded-lg text-lg flex items-center justify-center transition-all',
                  emoji === logo
                    ? 'bg-lime/20 border border-lime/40'
                    : 'hover:bg-white/[0.06] border border-transparent',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Brand name + industry */}
        <div className="space-y-4 flex-1">
          <Field label="Brand name">
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-lime/40 focus:ring-2 focus:ring-lime/15 transition-all"
              placeholder="Your brand name"
            />
          </Field>
          <Field label="Industry">
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-lime/40 focus:ring-2 focus:ring-lime/15 transition-all"
              placeholder="e.g., Café & Hospitality"
            />
          </Field>
        </div>
      </div>

      {/* Timezone + Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Timezone">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-lime/40 focus:ring-2 focus:ring-lime/15 transition-all appearance-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz} className="bg-[#0A0F0D]">
                {tz}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Language">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                lang === 'en'
                  ? 'bg-lime text-[#0A0F0D] border-lime shadow-lime-glow'
                  : 'bg-white/[0.04] text-muted-fg border-white/10 hover:text-fg',
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                lang === 'ar'
                  ? 'bg-lime text-[#0A0F0D] border-lime shadow-lime-glow'
                  : 'bg-white/[0.04] text-muted-fg border-white/10 hover:text-fg',
              )}
            >
              AR
            </button>
          </div>
        </Field>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2 border-t border-white/[0.06]">
        <Button onClick={onSave} className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 font-semibold">
          <Save className="h-4 w-4" />
          Save changes
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Tab 2: Team
// ============================================================================
function TeamTab({
  members,
  inviteEmail,
  setInviteEmail,
  onInvite,
  onRemove,
  brandName,
}: {
  members: TeamMember[]
  inviteEmail: string
  setInviteEmail: (v: string) => void
  onInvite: () => void
  onRemove: (m: TeamMember) => void
  brandName: string
}) {
  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      {/* Member list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-lime" />
            Team members
          </h3>
          <Badge variant="secondary" className="text-[10px]">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Badge>
        </div>

        <div className="space-y-1.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-semibold shrink-0">
                {m.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{m.name}</div>
                <div className="text-xs text-muted-fg font-mono truncate" data-mono>
                  {m.email}
                </div>
              </div>
              <RoleBadge role={m.role} />
              {m.role !== 'Owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(m)}
                  className="text-muted-fg hover:text-red hover:bg-red/10 h-8 w-8 p-0"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite by email */}
      <div className="pt-4 border-t border-white/[0.06]">
        <label className="text-[10px] text-muted-fg uppercase tracking-wider mb-2 block">
          Invite by email
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInvite()
            }}
            placeholder="teammate@example.com"
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-lime/40 focus:ring-2 focus:ring-lime/15 transition-all font-mono"
            data-mono
          />
          <Button onClick={onInvite} className="gap-2 bg-lime text-[#0A0F0D] hover:bg-lime/90 font-semibold shrink-0">
            <Plus className="h-4 w-4" />
            Invite
          </Button>
        </div>
        <p className="text-[10px] text-muted-fg mt-2">
          New members join {brandName} as <span className="text-muted-fg font-medium">Editor</span> by default.
        </p>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    Owner: 'bg-lime/15 text-lime border border-lime/25',
    Editor: 'bg-orange/15 text-orange border border-orange/25',
    Viewer: 'bg-white/[0.06] text-muted-fg border border-white/10',
  }
  return (
    <Badge className={cn('text-[10px]', styles[role])}>{role}</Badge>
  )
}

// ============================================================================
// Tab 3: Integrations
// ============================================================================
function IntegrationsTab({
  state,
  onToggle,
}: {
  state: Record<string, boolean>
  onToggle: (i: Integration) => void
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
          <Plug className="h-4 w-4 text-lime" />
          Integrations
        </h3>
        <Badge variant="secondary" className="text-[10px]">
          {Object.values(state).filter(Boolean).length}/{INTEGRATIONS.length} connected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {INTEGRATIONS.map((integration) => {
          const isConnected = !!state[integration.id]
          return (
            <div
              key={integration.id}
              className={cn(
                'rounded-xl p-4 border transition-all',
                isConnected
                  ? 'glass-lime'
                  : 'glass border-white/10',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-xl shrink-0">
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{integration.name}</span>
                    {isConnected && (
                      <Badge className="bg-lime/15 text-lime border border-lime/25 text-[10px] gap-0.5">
                        <Check className="h-2.5 w-2.5" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-fg mt-0.5">{integration.desc}</p>
                </div>
                <ToggleSwitch
                  checked={isConnected}
                  onChange={() => onToggle(integration)}
                  label={isConnected ? 'Disconnect' : 'Connect'}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-muted-fg mt-3">
        UI state only — no real OAuth. Toggling updates the toast and local state.
      </p>
    </div>
  )
}

// ============================================================================
// Tab 4: Notifications
// ============================================================================
function NotificationsTab({
  state,
  onToggle,
}: {
  state: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-lime" />
          Notification preferences
        </h3>
        <Badge variant="secondary" className="text-[10px]">
          {Object.values(state).filter(Boolean).length}/{NOTIFICATIONS.length} on
        </Badge>
      </div>

      <div className="space-y-1">
        {NOTIFICATIONS.map((n) => {
          const enabled = !!state[n.id]
          return (
            <div
              key={n.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs text-muted-fg mt-0.5">{n.desc}</div>
              </div>
              <ToggleSwitch
                checked={enabled}
                onChange={() => onToggle(n.id)}
                label={enabled ? 'On' : 'Off'}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Shared sub-components
// ============================================================================
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-muted-fg uppercase tracking-wider mb-2 block">
        {label}
      </label>
      {children}
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
        checked
          ? 'bg-lime border-lime'
          : 'bg-white/[0.06] border-white/10',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-[#0A0F0D] transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

function ConfirmDialog({
  member,
  brandName,
  onCancel,
  onConfirm,
}: {
  member: TeamMember
  brandName: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="glass-strong rounded-2xl p-5 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-red/15 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-semibold">Remove team member?</h3>
            <p className="text-sm text-muted-fg mt-1">
              <span className="font-medium text-fg">{member.name}</span> will lose
              access to <span className="font-medium text-fg">{brandName}</span>. This
              action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-3 border-t border-white/[0.06]">
          <Button variant="outline" onClick={onCancel} className="gap-2 glass border-white/10">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="gap-2 bg-red text-white hover:bg-red/90"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
