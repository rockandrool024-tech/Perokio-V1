// ============================================================================
// Custom Chai Builder Blocks — Perokio-specific components
// ============================================================================
// These blocks are registered with the Chai Builder SDK so brands can
// drag-and-drop them in the visual editor. Each block maps to a React
// component that renders in the editor preview AND the live page.
//
// The Chai Builder SDK (v4.0.0-beta) uses registerChaiLibrary() to
// register custom block libraries. Each library contains block definitions
// with _type, _name, _category, and component.
// ============================================================================

import { Sparkles, Clock, ShoppingBag } from 'lucide-react'

// ============================================================================
// Block 1: TastyIgniterMenuBlock — fetches and renders menu items
// ============================================================================

export const TastyIgniterMenuComponent = ({ menuCategory, maxItems, columns }: {
  menuCategory: string
  maxItems: number
  columns: number
}) => {
  // V1: Mock menu items. V2: fetch from TastyIgniter headless API
  const mockItems = [
    { name: 'Spicy Chicken Burger', price: '12 TND', emoji: '🍔' },
    { name: 'Cap Bon Salad', price: '8 TND', emoji: '🥗' },
    { name: 'Fresh Lemonade', price: '3 TND', emoji: '🍋' },
    { name: 'Olive Oil Fries', price: '4 TND', emoji: '🍟' },
  ].slice(0, maxItems || 4)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns || 2}, 1fr)`, gap: '1rem' }}>
      {mockItems.map((item, i) => (
        <div key={i} style={{
          padding: '1rem', borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: '2rem' }}>{item.emoji}</div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
          <div style={{ color: '#D8EF70', fontFamily: 'monospace', fontSize: '0.875rem' }}>{item.price}</div>
        </div>
      ))}
    </div>
  )
}

export const TastyIgniterMenuBlock = {
  _type: 'TastyIgniterMenuBlock',
  _name: 'TastyIgniter Menu',
  _category: 'Perokio',
  _icon: ShoppingBag,
  props: {
    menuCategory: { type: 'string', default: 'lunch' },
    maxItems: { type: 'number', default: 6 },
    columns: { type: 'number', default: 2 },
  },
  component: TastyIgniterMenuComponent,
}

// ============================================================================
// Block 2: SparkCTA — a button that links to a pero.to shortlink
// ============================================================================

export const SparkCTAComponent = ({ shortlink, ctaText, variant }: {
  shortlink: string
  ctaText: string
  variant: 'primary' | 'secondary'
}) => {
  const bgColor = variant === 'primary' ? '#D8EF70' : '#ED7A42'
  const textColor = variant === 'primary' ? '#0A0F0D' : '#FFFFFF'
  return (
    <a
      href={`https://${shortlink}`}
      style={{
        display: 'block',
        textAlign: 'center',
        padding: '1rem 2rem',
        borderRadius: '12px',
        background: bgColor,
        color: textColor,
        fontWeight: 700,
        fontSize: '1.125rem',
        textDecoration: 'none',
        transition: 'transform 0.2s',
      }}
    >
      {ctaText || 'Order Now'}
    </a>
  )
}

export const SparkCTABlock = {
  _type: 'SparkCTA',
  _name: 'Spark CTA Button',
  _category: 'Perokio',
  _icon: Sparkles,
  props: {
    shortlink: { type: 'string', default: 'pero.to/' },
    ctaText: { type: 'string', default: 'Order Now' },
    variant: { type: 'select', options: ['primary', 'secondary'], default: 'primary' },
  },
  component: SparkCTAComponent,
}

// ============================================================================
// Block 3: CountdownTimer — urgency timer for promotions
// ============================================================================

export const CountdownTimerComponent = ({ duration, label, variant }: {
  duration: string
  label: string
  variant: 'urgent' | 'launch' | 'standard'
}) => {
  const colors = {
    urgent: { bg: 'rgba(229,72,77,0.1)', text: '#E5484D', border: 'rgba(229,72,77,0.3)' },
    launch: { bg: 'rgba(10,15,13,0.8)', text: '#D8EF70', border: 'rgba(216,239,112,0.3)' },
    standard: { bg: 'rgba(237,122,66,0.1)', text: '#ED7A42', border: 'rgba(237,122,66,0.3)' },
  }
  const c = colors[variant || 'standard']

  return (
    <div style={{
      textAlign: 'center',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      fontFamily: 'monospace',
      fontWeight: 600,
    }}>
      {label || 'Deal ends in'}: <span style={{ fontSize: '1.25rem' }}>{duration}</span>
    </div>
  )
}

export const CountdownTimerBlock = {
  _type: 'CountdownTimer',
  _name: 'Countdown Timer',
  _category: 'Perokio',
  _icon: Clock,
  props: {
    duration: { type: 'string', default: '4h' },
    label: { type: 'string', default: 'Deal ends in' },
    variant: {
      type: 'select',
      options: ['urgent', 'launch', 'standard'],
      default: 'standard',
    },
  },
  component: CountdownTimerComponent,
}

// ============================================================================
// Register all custom blocks with Chai Builder
// ============================================================================
// The Chai Builder SDK uses registerChaiLibrary() to register custom block
// libraries. We register a "Perokio" library containing all our blocks.
// ============================================================================

export function registerPerokioBlocks() {
  // Dynamic import — the SDK is loaded lazily
  import('@chaibuilder/sdk')
    .then(({ registerChaiLibrary }) => {
      const allBlocks = [TastyIgniterMenuBlock, SparkCTABlock, CountdownTimerBlock]
      registerChaiLibrary('perokio-blocks', {
        name: 'Perokio Blocks',
        description: 'Custom blocks for TastyIgniter, Spark CTAs, and countdowns',
        getBlocksList: async () => {
          return allBlocks.map((b) => ({
            id: b._type,
            group: 'Perokio',
            name: b._name,
            description: b._name,
          }))
        },
        getBlock: async ({ block }) => {
          // Return the block as an HTML string (Chai Builder renders it)
          const found = allBlocks.find((b) => b._type === block.id)
          if (!found) return ''
          // Return a simple HTML representation
          return `<div data-chai-block="${found._type}">${found._name}</div>`
        },
      })
      console.log('✓ Perokio custom blocks registered with Chai Builder')
    })
    .catch((e) => {
      // SDK not available — fail silently (the mock preview handles this)
      console.warn('Perokio block registration skipped (SDK not available):', e.message)
    })
}
