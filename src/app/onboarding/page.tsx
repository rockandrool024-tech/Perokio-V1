import { OnboardingWizard } from '@/components/perokio/onboarding/onboarding-collapsed'

export const metadata = {
  title: 'Set up your brand · Perokio',
  description: 'Three fields. Generate your first Fact Bundle and schedule it for Monday.',
}

export default function OnboardingPage() {
  return <OnboardingWizard />
}
