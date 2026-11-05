#!/usr/bin/env node
// Checks that every t('...') string used in components has an Arabic translation in i18n.ts.
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const I18N = 'src/lib/perokio/i18n.ts'
const ROOTS = ['src/components/perokio', 'src/app']

// 1. Collect all t('...') literals (single quotes, no escapes in our usage)
const used = new Set()
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else if (/\.(tsx?|ts)$/.test(name)) {
      const src = readFileSync(p, 'utf8')
      const re = /\bt\('([^']+)'\)/g
      let m
      while ((m = re.exec(src))) used.add(m[1])
    }
  }
}
ROOTS.forEach((r) => walk(r))

// 2. Collect AR dictionary keys from i18n.ts
const i18nSrc = readFileSync(I18N, 'utf8')
const arDictMatch = i18nSrc.match(/export const AR: Record<string, string> = \{([\s\S]*?)\n\}/)
if (!arDictMatch) {
  console.error('Could not parse AR dictionary')
  process.exit(1)
}
const keys = new Set()
const keyRe = /'((?:[^'\\]|\\.)*)'\s*:/g
let km
while ((km = keyRe.exec(arDictMatch[1]))) keys.add(km[1])

// 3. Diff
const missing = [...used].filter((u) => !keys.has(u)).sort()
const unused = [...keys].filter((k) => !used.has(k)).sort()

console.log(`t() strings used in components : ${used.size}`)
console.log(`AR dictionary keys              : ${keys.size}`)
console.log(`\nMissing AR translations (${missing.length}):`)
missing.forEach((m) => console.log(`  ✗ ${JSON.stringify(m)}`))
console.log(`\nUnused AR keys (harmless) (${unused.length}):`)
unused.forEach((u) => console.log(`  - ${JSON.stringify(u)}`))

if (missing.length > 0) process.exit(1)
console.log('\n✓ All t() strings are covered.')
