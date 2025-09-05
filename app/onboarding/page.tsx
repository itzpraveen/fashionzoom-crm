import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  // Onboarding is no longer required; send users to leads
  redirect('/leads')
}
