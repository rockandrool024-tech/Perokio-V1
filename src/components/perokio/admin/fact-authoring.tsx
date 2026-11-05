'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BRANDS, SOURCES } from '@/lib/perokio/data'
import { useT } from '@/lib/perokio/i18n'
import { Plus, FileText, Link2, Trash2, Sparkles, ShieldCheck, AlertCircle, Save, Send, Wand2, X } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DraftLine {
  id: string
  text: string
  durationSec: number
  sourceId?: string
  isHook: boolean
}

interface DraftSource {
  id: string
  type: 'official' | 'news' | 'research' | 'brand_asset'
  label: string
  url: string
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  official: '🏛 Official',
  news: '📰 News',
  research: '📊 Research',
  brand_asset: '🏢 Brand asset',
}

export function FactAuthoring() {
  const { toast } = useToast()
  const t = useT()
  const [brandId, setBrandId] = useState(BRANDS[0].id)
  const [claim, setClaim] = useState('')
  const [claimAr, setClaimAr] = useState('')
  const [tier, setTier] = useState<'Hot' | 'Premium' | 'Standard'>('Standard')
  const [lang, setLang] = useState<'ar' | 'derja' | 'fr' | 'en'>('derja')
  const [topic, setTopic] = useState('')
  const [trendTag, setTrendTag] = useState('')
  const [baseFee, setBaseFee] = useState(8)
  const [cpmRate, setCpmRate] = useState(3)
  const [budgetCap, setBudgetCap] = useState(100)

  const [lines, setLines] = useState<DraftLine[]>([
    { id: 'l1', text: '', durationSec: 3, isHook: true },
    { id: 'l2', text: '', durationSec: 3, isHook: false },
    { id: 'l3', text: '', durationSec: 2, isHook: false },
  ])
  const [sources, setSources] = useState<DraftSource[]>(SOURCES.slice(0, 2).map((s) => ({ ...s })))

  const verifiedLines = lines.filter((l) => l.text && l.sourceId).length
  const totalLines = lines.filter((l) => l.text).length
  const allValid = totalLines > 0 && verifiedLines === totalLines && claim.length > 0

  const addLine = () => {
    setLines([...lines, { id: `l${Date.now()}`, text: '', durationSec: 3, isHook: false }])
  }

  const removeLine = (id: string) => {
    if (lines.length > 1) setLines(lines.filter((l) => l.id !== id))
  }

  const updateLine = (id: string, field: keyof DraftLine, value: string | number | boolean) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  const addSource = () => {
    setSources([...sources, { id: `s${Date.now()}`, type: 'news', label: '', url: '' }])
  }

  const updateSource = (id: string, field: keyof DraftSource, value: string) => {
    setSources(sources.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const removeSource = (id: string) => {
    setSources(sources.filter((s) => s.id !== id))
  }

  const handleAiGenerate = () => {
    toast({
      title: `🤖 ${t('AI script generating...')}`,
      description: t('Using Claude 3.5 Sonnet on the verified claim...'),
    })
    setTimeout(() => {
      setLines([
        { id: 'l1', text: `Is this real? ${claim.slice(0, 50)}...`, durationSec: 3, isHook: true, sourceId: sources[0]?.id },
        { id: 'l2', text: `Yes — verified by ${BRANDS.find((b) => b.id === brandId)?.name}.`, durationSec: 3, isHook: false, sourceId: sources[0]?.id },
        { id: 'l3', text: 'Tap to learn more →', durationSec: 2, isHook: false },
      ])
      toast({
        title: `✅ ${t('AI script generated')}`,
        description: t('2 lines auto-linked · 1 line needs manual locking'),
      })
    }, 1500)
  }

  const handleSubmit = () => {
    if (!allValid) {
      toast({
        title: `❌ ${t('Cannot submit')}`,
        description: t('Fill all fields and verify every line.'),
        variant: 'destructive',
      })
      return
    }
    toast({
      title: `✅ ${t('Fact Bundle submitted')}`,
      description: t('Queued for QA before publishing to the Wall.'),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('Fact Authoring')}
          <Badge variant="outline" className="text-[10px]">A06·A07</Badge>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('Author verified fact bundles · one fact = 10 creator videos')}</p>
      </div>

      {/* Step 1 — Verified Claim */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
            <ShieldCheck className="h-4 w-4 text-primary" /> {t('Verified Claim')}
          </CardTitle>
          <CardDescription className="text-xs">{t('The core of the bundle — must be based on real data.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs">{t('Brand')}</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger id="brand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.logo} {b.name} · {b.tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic" className="text-xs">{t('Topic')}</Label>
              <Input id="topic" placeholder="Coffee Origin / Sustainability..." value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="claim" className="text-xs">{t('Claim (English)')}</Label>
            <Textarea
              id="claim"
              placeholder="e.g., Dar Zaitouna’s arabica beans come from Cap Bon, grown above 600m on volcanic soil."
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="claimAr" className="text-xs">{t('Claim (Arabic / Derja)')}</Label>
            <Textarea
              id="claimAr"
              placeholder="حبوب البن العربية في دار الزيتونة..."
              value={claimAr}
              onChange={(e) => setClaimAr(e.target.value)}
              rows={2}
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Tier')}</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as typeof tier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hot">🔥 {t('Hot')}</SelectItem>
                  <SelectItem value="Premium">⭐ {t('Premium')}</SelectItem>
                  <SelectItem value="Standard">{t('Standard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Language')}</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{t('Arabic')}</SelectItem>
                  <SelectItem value="derja">{t('Tunisian Derja')}</SelectItem>
                  <SelectItem value="fr">{t('French')}</SelectItem>
                  <SelectItem value="en">{t('English')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trend" className="text-xs">{t('Trend tag')}</Label>
              <Input id="trend" placeholder="Slow Coffee" value={trendTag} onChange={(e) => setTrendTag(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="baseFee" className="text-xs">{t('Base Fee ($)')}</Label>
              <Input id="baseFee" type="number" value={baseFee} onChange={(e) => setBaseFee(+e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cpmRate" className="text-xs">{t('CPM Rate')} ($/1k)</Label>
              <Input id="cpmRate" type="number" value={cpmRate} onChange={(e) => setCpmRate(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budgetCap" className="text-xs">{t('Budget Cap')} ($)</Label>
              <Input id="budgetCap" type="number" value={budgetCap} onChange={(e) => setBudgetCap(+e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 — Sources */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
              <Link2 className="h-4 w-4 text-primary" /> {t('Verified Sources')}
            </CardTitle>
            <CardDescription className="text-xs">{t('Every script line must link to a source.')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addSource}>
            <Plus className="h-3.5 w-3.5" /> {t('Add source')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence>
            {sources.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-border/60 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{idx + 1}</Badge>
                  <Select value={s.type} onValueChange={(v) => updateSource(s.id, 'type', v)}>
                    <SelectTrigger className="h-7 w-auto text-xs gap-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="official">{t('Official')}</SelectItem>
                      <SelectItem value="news">{t('News')}</SelectItem>
                      <SelectItem value="research">{t('Research')}</SelectItem>
                      <SelectItem value="brand_asset">{t('Brand asset')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSource(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <Input
                  placeholder={t('Source name, e.g., Tunisian Ministry of Tourism — 2024 Q3 Report')}
                  value={s.label}
                  onChange={(e) => updateSource(s.id, 'label', e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder={t('URL, e.g., tourism.tn/report-q3-2024')}
                  value={s.url}
                  onChange={(e) => updateSource(s.id, 'url', e.target.value)}
                  className="text-xs font-mono"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Step 3 — Script */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
              <FileText className="h-4 w-4 text-primary" /> {t('Script')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('After AI generation, every line must link to a verified source — the B11 engine.')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAiGenerate} disabled={!claim}>
              <Wand2 className="h-3.5 w-3.5" /> {t('AI generate')}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addLine}>
              <Plus className="h-3.5 w-3.5" /> {t('Add line')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence>
            {lines.map((line, idx) => {
              const isVerified = !!line.sourceId && !!line.text
              const hasText = !!line.text
              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    'rounded-lg border-2 p-3 transition-all',
                    !hasText ? 'border-border/60 bg-muted/30' :
                    isVerified ? 'border-primary/30 bg-primary/5' :
                    'border-chart-3/40 bg-chart-3/5 border-dashed'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-md bg-primary/20 text-primary text-xs font-mono font-bold flex items-center justify-center">
                      L{idx + 1}
                    </span>
                    {line.isHook && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Sparkles className="h-3 w-3" /> {t('Hook')}
                      </Badge>
                    )}
                    <Input
                      type="number"
                      value={line.durationSec}
                      onChange={(e) => updateLine(line.id, 'durationSec', +e.target.value)}
                      className="h-7 w-16 ms-auto text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground">s</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLine(line.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder={`L${idx + 1}...`}
                    value={line.text}
                    onChange={(e) => updateLine(line.id, 'text', e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">{t('Link source:')}</span>
                    {hasText ? (
                      <Select
                        value={line.sourceId || ''}
                        onValueChange={(v) => updateLine(line.id, 'sourceId', v)}
                      >
                        <SelectTrigger className={cn(
                          'h-7 flex-1 text-xs',
                          !isVerified && 'border-chart-3/40 text-chart-3'
                        )}>
                          <SelectValue placeholder={`⚠ ${t('Pick a source (required)')}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {sources.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <span className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] me-1">{s.type}</Badge>
                                {s.label || '(untitled)'}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                    {isVerified && (
                      <Badge className="text-[10px] gap-1 shrink-0">
                        <ShieldCheck className="h-3 w-3" /> {t('Locked')}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Status bar */}
          <div className={cn(
            'rounded-lg p-3 border-2 transition-all',
            allValid
              ? 'border-primary/40 bg-primary/5'
              : 'border-chart-3/40 bg-chart-3/5 border-dashed'
          )}>
            <div className="flex items-center gap-2 mb-1">
              {allValid ? <ShieldCheck className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-chart-3" />}
              <span className="text-sm font-semibold">
                {allValid ? t('Ready to submit') : t('Incomplete')}
              </span>
              <span className="ms-auto text-xs font-mono">
                {verifiedLines}/{totalLines || 0} {t('line(s) verified')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {allValid
                ? t('All lines are linked — the AI cannot hallucinate. Safe to submit to QA.')
                : !claim
                ? t('Write the claim first (Step 1).')
                : totalLines === 0
                ? t('Generate with AI or add script lines.')
                : `${totalLines - verifiedLines} ${t('unverified line(s) — violates the no-hallucination promise.')}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-2">
          <Save className="h-4 w-4" /> {t('Save draft')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!allValid}
          className="gap-2"
          variant={allValid ? 'default' : 'outline'}
        >
          <Send className="h-4 w-4" />
          {t('Submit to QA')}
        </Button>
      </div>
    </div>
  )
}
