import { DashboardTiles } from '@/components/DashboardTiles'
import { cachedQuery } from '@/lib/cache/query-cache'
import { getDashboardMetrics } from '@/lib/services/dashboard.service'
export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const metrics = await cachedQuery('dash:metrics', () => getDashboardMetrics(), 10000)
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Today</h2>
      <DashboardTiles initial={metrics} />
    </div>
  )
}
 
