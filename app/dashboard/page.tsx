import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  redirect('/dashboard/overview')
}
export const dynamic = 'force-dynamic'
