'use client'

/**
 * CommandPalette — global Cmd+K palette for the Studio/Admin context.
 *
 * Per Cycle 1 audit (Linear Pattern A): "Cmd+K is global, even inside text fields."
 * Per §2: context-scoped commands — Save draft, Submit to QA, Add source,
 * Generate script with AI, Insert trend tag.
 *
 * Implementation: uses cmdk (already installed) via the shadcn Command component.
 * Mounted at the AdminApp root. Listens for Cmd+K / Ctrl+K globally.
 * Commands are scoped to the current admin view (e.g., authoring commands
 * only appear when A07 is active).
 */

import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { usePerokioStore } from '@/store/perokio'
import { useToast } from '@/hooks/use-toast'
import {
  Save, Send, Plus, Sparkles, Tag, FileText, Building2, Users,
  ShieldCheck, TrendingUp, Activity, Eye, LayoutDashboard,
  Film, Wallet, Bell, type LucideIcon,
} from 'lucide-react'

interface CommandDef {
  label: string
  shortcut?: string
  icon: LucideIcon
  action: () => void
  group: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const adminView = usePerokioStore((s) => s.adminView)
  const setAdminView = usePerokioStore((s) => s.setAdminView)
  const { toast } = useToast()

  // === Global Cmd+K / Ctrl+K listener ===
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      // Escape closes
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // === Build context-scoped commands ===
  const commands: CommandDef[] = []

  // Navigation commands (always available)
  commands.push(
    { label: 'Go to Brand Pipeline', icon: Building2, action: () => setAdminView('pipeline'), group: 'Navigate' },
    { label: 'Go to Creator Vetting', icon: Users, action: () => setAdminView('vetting'), group: 'Navigate' },
    { label: 'Go to Script QA', icon: ShieldCheck, action: () => setAdminView('qa'), group: 'Navigate' },
    { label: 'Go to Trend Input', icon: TrendingUp, action: () => setAdminView('trends'), group: 'Navigate' },
    { label: 'Go to Wall Monitor', icon: Activity, action: () => setAdminView('monitor'), group: 'Navigate' },
    { label: 'Go to Fact Authoring', icon: Sparkles, action: () => setAdminView('authoring'), group: 'Navigate' },
  )

  // Context-scoped commands (only when A07 is active)
  if (adminView === 'authoring') {
    commands.push(
      {
        label: 'Save draft',
        shortcut: '⌘S',
        icon: Save,
        action: () => {
          toast({ title: 'Draft saved', description: 'Your fact bundle draft has been saved.' })
          setOpen(false)
        },
        group: 'Authoring',
      },
      {
        label: 'Submit to QA',
        icon: Send,
        action: () => {
          toast({ title: 'Submitted to QA', description: 'Queued for review before publishing to the Wall.' })
          setOpen(false)
        },
        group: 'Authoring',
      },
      {
        label: 'Add source',
        icon: Plus,
        action: () => {
          toast({ title: 'Add source', description: 'Source form opened — add a verified source.' })
          setOpen(false)
        },
        group: 'Authoring',
      },
      {
        label: 'Generate script with AI',
        icon: Sparkles,
        action: () => {
          toast({ title: 'AI script generating...', description: 'Using Claude 3.5 Sonnet on the verified claim...' })
          setOpen(false)
        },
        group: 'Authoring',
      },
      {
        label: 'Insert trend tag',
        icon: Tag,
        action: () => {
          toast({ title: 'Insert trend tag', description: 'Pick from the trend radar to pre-fill.' })
          setOpen(false)
        },
        group: 'Authoring',
      },
    )
  }

  // Context-scoped commands (when A03 QA is active)
  if (adminView === 'qa') {
    commands.push(
      {
        label: 'Approve current script',
        icon: ShieldCheck,
        action: () => {
          toast({ title: '✓ Script QA approved', description: 'Published to the Facts Wall.' })
          setOpen(false)
        },
        group: 'QA',
      },
    )
  }

  // Group commands by their group property
  const groups = commands.reduce<Record<string, CommandDef[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groups).map(([groupName, cmds]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {cmds.map((cmd) => {
              const Icon = cmd.icon
              return (
                <CommandItem
                  key={cmd.label}
                  onSelect={() => cmd.action()}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4 text-muted-fg" />
                  <span>{cmd.label}</span>
                  {cmd.shortcut && (
                    <span className="ms-auto text-[10px] font-mono text-muted-fg" data-mono>
                      {cmd.shortcut}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => { toast({ title: 'Keyboard shortcuts', description: 'Cmd+K: palette · /: insert · A: approve · R: reject · J/K: navigate' }); setOpen(false) }} className="gap-2">
            <span className="text-muted-fg">⌨️</span>
            <span>Show keyboard shortcuts</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
