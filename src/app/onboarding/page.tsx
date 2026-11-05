import { OnboardingWizard } from '@/components/perokio/onboarding/onboarding-wizard'

export const metadata = {
  title: 'Brand Setup · Perokio',
  description:
    'Set up your brand on Perokio in 7 steps. Fund your first verified fact in under 5 minutes.',
}

export default function OnboardingPage() {
  return <OnboardingWizard />
}
