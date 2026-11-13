// ============================================================================
// Campaign Templates — Pre-built block structures for QSR promotions
// ============================================================================
// These are Chai Builder block arrays that define the initial structure
// of a campaign landing page. When a brand opens the CampaignStudio,
// the appropriate template's blocks are passed as initialBlocks.
//
// Each block follows the ChaiBlock format:
//   { _id, _type, _name, content?, styles?, props? }
// ============================================================================

export interface CampaignTemplate {
  id: string
  name: string
  description: string
  category: 'food' | 'beauty' | 'tech' | 'lifestyle'
  blocks: any[]
}

// ============================================================================
// Template 1: Lunch Special (QSR — Food & Beverage)
// ============================================================================

export const LUNCH_SPECIAL: CampaignTemplate = {
  id: 'tpl_lunch_special',
  name: 'Lunch Special',
  description: 'A classic QSR lunch deal page with hero, menu grid, and CTA',
  category: 'food',
  blocks: [
    {
      _id: 'hero-lunch',
      _type: 'Hero',
      _name: 'Hero Section',
      content: 'Fresh Lunch Deals — 30% Off Today Only',
      styles: 'bg-gradient-to-br from-lime-400 to-teal-500 text-black py-16 px-6 text-center rounded-2xl',
      props: {
        backgroundImage: '',
        ctaText: 'Order Lunch Now',
        ctaHref: '/tastyigniter-checkout',
      },
    },
    {
      _id: 'social-proof-lunch',
      _type: 'SocialProof',
      _name: 'Social Proof',
      content: '🔥 1,240 people ordered this week',
      styles: 'text-center py-4 text-orange-600 font-semibold',
      props: {
        proofType: 'orders',
        proofCount: 1240,
      },
    },
    {
      _id: 'menu-grid-lunch',
      _type: 'TastyIgniterMenuBlock',
      _name: 'Menu Items',
      styles: 'py-8 px-6',
      props: {
        menuCategory: 'lunch',
        maxItems: 6,
        columns: 2,
      },
    },
    {
      _id: 'countdown-lunch',
      _type: 'CountdownTimer',
      _name: 'Urgency Timer',
      styles: 'bg-red-100 text-red-700 py-4 px-6 text-center rounded-xl',
      props: {
        duration: '4h',
        label: 'Deal ends in',
        variant: 'urgent',
      },
    },
    {
      _id: 'cta-lunch',
      _type: 'SparkCTA',
      _name: 'Order CTA',
      content: 'Order Now',
      styles: 'bg-lime-400 text-black py-4 px-8 rounded-xl text-center font-bold text-lg',
      props: {
        shortlink: 'pero.to/lunch-special',
        ctaText: 'Order Now',
        variant: 'primary',
      },
    },
  ],
}

// ============================================================================
// Template 2: New Product Launch
// ============================================================================

export const NEW_PRODUCT_LAUNCH: CampaignTemplate = {
  id: 'tpl_new_product',
  name: 'New Product Launch',
  description: 'A product reveal page with countdown, features, and pre-order CTA',
  category: 'food',
  blocks: [
    {
      _id: 'hero-launch',
      _type: 'Hero',
      _name: 'Product Reveal',
      content: 'The Spiciest Chicken in Tunis — Available for 48 Hours',
      styles: 'bg-gradient-to-br from-orange-500 to-red-600 text-white py-20 px-6 text-center rounded-2xl',
      props: {
        backgroundImage: '',
        ctaText: 'Pre-Order Now',
        ctaHref: '/tastyigniter-checkout',
      },
    },
    {
      _id: 'countdown-launch',
      _type: 'CountdownTimer',
      _name: '48h Countdown',
      styles: 'bg-black text-lime-400 py-6 px-6 text-center rounded-xl',
      props: {
        duration: '48h',
        label: 'Available for',
        variant: 'launch',
      },
    },
    {
      _id: 'features-launch',
      _type: 'CardGrid',
      _name: 'Product Features',
      styles: 'py-8 px-6 grid grid-cols-2 gap-4',
      props: {
        items: [
          { title: 'Cap Bon Peppers', description: 'Sourced from Cap Bon farms' },
          { title: '48h Only', description: 'Limited availability' },
          { title: '1,240 Orders', description: 'The hype is real' },
          { title: 'Free Delivery', description: 'Within Tunis' },
        ],
      },
    },
    {
      _id: 'social-proof-launch',
      _type: 'SocialProof',
      _name: 'Social Proof',
      content: '🔥 1,240 pre-orders in the first hour',
      styles: 'text-center py-4 text-orange-600 font-semibold',
      props: {
        proofType: 'preorders',
        proofCount: 1240,
      },
    },
    {
      _id: 'cta-launch',
      _type: 'SparkCTA',
      _name: 'Pre-Order CTA',
      content: 'Pre-Order Now',
      styles: 'bg-lime-400 text-black py-4 px-8 rounded-xl text-center font-bold text-lg',
      props: {
        shortlink: 'pero.to/spicy-chicken',
        ctaText: 'Pre-Order Now',
        variant: 'primary',
      },
    },
  ],
}

// ============================================================================
// Template 3: Weekend Promo
// ============================================================================

export const WEEKEND_PROMO: CampaignTemplate = {
  id: 'tpl_weekend_promo',
  name: 'Weekend Promo',
  description: 'A weekend special with bundle deal and social proof',
  category: 'food',
  blocks: [
    {
      _id: 'hero-weekend',
      _type: 'Hero',
      _name: 'Weekend Hero',
      content: 'Weekend Bundle: 2 Burgers + Fries + Drink — 25 TND',
      styles: 'bg-gradient-to-br from-violet-500 to-teal-500 text-white py-16 px-6 text-center rounded-2xl',
      props: {
        ctaText: 'Get the Bundle',
        ctaHref: '/tastyigniter-checkout',
      },
    },
    {
      _id: 'menu-weekend',
      _type: 'TastyIgniterMenuBlock',
      _name: 'Bundle Menu',
      styles: 'py-8 px-6',
      props: {
        menuCategory: 'bundles',
        maxItems: 3,
        columns: 1,
      },
    },
    {
      _id: 'countdown-weekend',
      _type: 'CountdownTimer',
      _name: 'Weekend Countdown',
      styles: 'bg-orange-100 text-orange-700 py-4 px-6 text-center rounded-xl',
      props: {
        duration: '2d',
        label: 'Weekend deal ends in',
        variant: 'standard',
      },
    },
    {
      _id: 'cta-weekend',
      _type: 'SparkCTA',
      _name: 'Order CTA',
      content: 'Order Bundle',
      styles: 'bg-lime-400 text-black py-4 px-8 rounded-xl text-center font-bold text-lg',
      props: {
        shortlink: 'pero.to/weekend-bundle',
        ctaText: 'Order Bundle',
        variant: 'primary',
      },
    },
  ],
}

// ============================================================================
// Template registry — used by CampaignStudio to select the initial blocks
// ============================================================================

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  LUNCH_SPECIAL,
  NEW_PRODUCT_LAUNCH,
  WEEKEND_PROMO,
]

export function getTemplate(id: string): CampaignTemplate | null {
  return CAMPAIGN_TEMPLATES.find((t) => t.id === id) || null
}

export function getTemplatesByCategory(category: string): CampaignTemplate[] {
  return CAMPAIGN_TEMPLATES.filter((t) => t.category === category)
}
