import { DashboardTiles } from '@/components/DashboardTiles'

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <DashboardTiles />
      <p className="text-sm text-muted">Live updates via Realtime.</p>
    </div>
  )
}

