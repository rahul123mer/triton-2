import { Link, useNavigate } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { FloorPlan, KpiStrip, DurationBars, CameraWall, useRestaurantWindow } from '../components'
import { cookbookStatus, insightsFor, kpis } from '../analytics'
import { formatDwell } from '../format'

export function RestaurantOverviewPage() {
  const navigate = useNavigate()
  const { start, end } = useRestaurantWindow()
  const snapshot = kpis(start, end)
  const insights = insightsFor(start, end)
  const cookbook = cookbookStatus(start, end)[0]
  return (
    <>
      <KpiStrip items={[
        { label: 'Total tables', value: snapshot.totalTables, hint: 'Dining room' },
        { label: 'Occupied tables', value: snapshot.occupiedTables, hint: 'As of window end' },
        { label: 'Average table dwell', value: formatDwell(snapshot.averageTableDwell), hint: `${snapshot.occupancySessions} occupancy sessions` },
        { label: 'Waiter visits', value: snapshot.waiterVisits, hint: 'Face-recognised service' },
        { label: 'Total waiter dwell', value: formatDwell(snapshot.waiterDwell), hint: 'Time in table zones' },
        { label: 'Active kitchen staff', value: snapshot.kitchenStaffActive, hint: 'Identified on camera' },
        { label: 'Kitchen counter activity', value: snapshot.kitchenCounterActivity, hint: 'Stations with dwell' },
      ]} />

      <Card className="rdi-live-card">
        <SectionLabel>CAMERA FEED</SectionLabel>
        <CameraWall initialId="vid-dining-floor" />
      </Card>

      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card>
          <SectionLabel>DINING FLOOR</SectionLabel>
          <FloorPlan tables={snapshot.tableRows} onSelect={(table) => navigate(`/restaurant/tables/${table.tableId}`)} />
        </Card>
        <div>
          <Card>
            <SectionLabel>OPERATIONAL READ</SectionLabel>
            <p className="rdi-empty" style={{ padding: '8px 0 12px', textAlign: 'left' }}>
              Occupancy, service visits, and kitchen station dwell are derived from the same captured event stream and sliced to this window.
            </p>
            {insights.map((insight) => (
              <button key={insight.insightId} type="button" className="card rdi-insight" style={{ marginBottom: 8 }} onClick={() => navigate(insight.href)}>
                <p>{insight.text}</p>
              </button>
            ))}
          </Card>
          <Card style={{ marginTop: 12 }}>
            <SectionLabel>WAITERS</SectionLabel>
            <DurationBars rows={snapshot.waiterRows.filter((row) => row.dwellMs).map((row) => ({ id: row.personId, label: row.name.split(' ')[0], dwellMs: row.dwellMs }))} />
            <Link className="button secondary" to="/restaurant/service" style={{ marginTop: 12 }}>Service activity</Link>
          </Card>
        </div>
      </div>

      <div className="rdi-split equal" style={{ marginTop: 14 }}>
        <Card>
          <SectionLabel>KITCHEN STATIONS</SectionLabel>
          <DurationBars rows={snapshot.counterRows.map((row) => ({ id: row.counterId, label: row.name, dwellMs: row.dwellMs }))} />
          <Link className="button secondary" to="/restaurant/kitchen" style={{ marginTop: 12 }}>Kitchen intelligence</Link>
        </Card>
        <Card>
          <SectionLabel>FINE DINING OPERATIONS</SectionLabel>
          <p style={{ color: 'var(--ink-600)', fontSize: 13 }}>{cookbook.description}</p>
          <div className="rdi-meta">
            <div><span>Recipes</span><strong>{cookbook.recipeCount}</strong></div>
            <div><span>Status</span><strong>Active</strong></div>
            <div><span>Events evaluated</span><strong>{cookbook.eventsEvaluated}</strong></div>
            <div><span>Use case</span><strong>{cookbook.useCase}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="button primary" to="/restaurant/cookbooks">Open cookbook</Link>
            <Link className="button secondary" to="/restaurant/analysis">Run analysis</Link>
            <Link className="button secondary" to="/restaurant/reports">Report</Link>
          </div>
        </Card>
      </div>
    </>
  )
}
