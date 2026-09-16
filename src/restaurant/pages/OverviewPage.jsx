import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { ChartCard, LiveFeedGrid, MetricStack, TableActivityChart, useRestaurantWindow } from '../components'
import { kpis } from '../analytics'

const quickActions = [
  { label: 'Tables', to: '/restaurant/tables' },
  { label: 'Kitchen', to: '/restaurant/kitchen' },
  { label: 'Analysis', to: '/restaurant/analysis' },
]

export function RestaurantOverviewPage() {
  const navigate = useNavigate()
  const { start, end } = useRestaurantWindow()
  const snapshot = kpis(start, end)
  const kitchenActive = snapshot.kitchenCounterActivity
  const peak = Math.max(snapshot.occupiedTables, snapshot.waiterVisits, snapshot.kitchenCounterActivity, snapshot.occupancySessions, 1)
  return (
    <>
      <div className="ss-dash-top">
        <ChartCard
          className="ss-chart-card"
          title="Table activity"
          detail="Occupancy dwell and waiter visits by table. Hover a column for session detail."
        >
          <TableActivityChart
            tables={snapshot.tableRows}
            onSelect={(table) => navigate(`/restaurant/tables/${table.tableId}`)}
          />
        </ChartCard>
        <ChartCard
          className="ss-metric-card"
          title="Activity summary"
          detail="Totals counted from occupancy, waiter, and kitchen events in this period."
        >
          <MetricStack items={[
            { label: 'Occupied tables', value: snapshot.occupiedTables, width: Math.max(8, (snapshot.occupiedTables / snapshot.totalTables) * 100) },
            { label: 'Waiter visits', value: snapshot.waiterVisits, width: Math.max(8, (snapshot.waiterVisits / Math.max(peak, 1)) * 100) },
            { label: 'Kitchen station activity', value: kitchenActive, width: Math.max(8, (kitchenActive / Math.max(snapshot.counterRows.length, 1)) * 100) },
            { label: 'Occupancy sessions', value: snapshot.occupancySessions, width: Math.max(8, (snapshot.occupancySessions / Math.max(snapshot.totalTables, 1)) * 100) },
          ]} />
        </ChartCard>
      </div>

      <div className="ss-dash-bottom">
        <section className="ss-live-panel" id="live-feed">
          <header className="ss-live-head">
            <div>
              <h2>Live Feed</h2>
              <p>All pinned cameras will be displayed here</p>
            </div>
            <span className="ss-live-keys">Keyboard: Space (play/pause), M (mute), F (fullscreen), → ← (switch)</span>
          </header>
          <LiveFeedGrid />
        </section>
        <section className="ss-quick-panel">
          <h2>Quick Action</h2>
          <div className="ss-quick-list">
            {quickActions.map((action) => (
              <button key={action.to} type="button" className="ss-quick-item" onClick={() => navigate(action.to)}>
                <span>{action.label}</span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
