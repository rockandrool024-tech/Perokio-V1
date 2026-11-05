'use client'

import { AppShell } from '@/components/perokio/shared/app-shell'
import { BrandApp } from '@/components/perokio/brand/brand-app'
import { CreatorApp } from '@/components/perokio/creator/creator-app'
import { AdminApp } from '@/components/perokio/admin/admin-app'
import { usePerokioStore } from '@/store/perokio'
import { MobileNav } from '@/components/perokio/shared/mobile-nav'

export default function Home() {
  const role = usePerokioStore((s) => s.role)

  return (
    <AppShell>
      {role === 'brand' && <BrandApp />}
      {role === 'creator' && <CreatorApp />}
      {role === 'admin' && <AdminApp />}
      <MobileNav />
    </AppShell>
  )
}
