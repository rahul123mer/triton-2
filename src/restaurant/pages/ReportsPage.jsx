import { useNavigate } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { DurationBars, useRestaurantWindow } from '../components'
import { insightsFor, kpis } from '../analytics'
import { formatDwell } from '../format'
import { useRestaurantStore } from '../store'

export function RestaurantReportsPage() {
  const navigate = useNavigate()
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const windowInfo = useRestaurantWindow()
  const snapshot = kpis(windowInfo.start, windowInfo.end)
  const findings = insightsFor(windowInfo.start, windowInfo.end)
  const tableRows = snapshot.tableRows.filter((row) => row.occupancyMs).sort((a, b) => b.occupancyMs - a.occupancyMs)
  const waiterRows = snapshot.waiterRows.filter((row) => row.visitCount)
  const kitchenRows = snapshot.kitchenRows.filter((row) => row.visitCount)
  return (
    <div className="ss-reports">
      <div className="ss-report-kpis">
        <Card className="ss-report-kpi">
          <SectionLabel>Occupied tables</SectionLabel>
          <strong>{snapshot.occupiedTables} / {snapshot.totalTables}</strong>
          <p>Tables occupied during this window.</p>
        </Card>
        <Card className="ss-report-kpi">
          <SectionLabel>Average dwell</SectionLabel>
          <strong>{formatDwell(snapshot.averageTableDwell)}</strong>
          <p>Mean occupancy across {snapshot.occupancySessions} sessions.</p>
        </Card>
        <Card className="ss-report-kpi">
          <SectionLabel>Waiter visits</SectionLabel>
          <strong>{snapshot.waiterVisits}</strong>
          <p>Face-recognised service visits in zone.</p>
        </Card>
        <Card className="ss-report-kpi">
          <SectionLabel>Kitchen staff</SectionLabel>
          <strong>{snapshot.kitchenStaffActive}</strong>
          <p>Identified employees with station dwell.</p>
        </Card>
      </div>

      <div className="ss-report-grid">
        <Card>
          <header className="ss-section-head">
            <SectionLabel>Table activity</SectionLabel>
            <h3>Occupancy by table</h3>
            <p>Longest occupied tables and waiter coverage in this period.</p>
          </header>
          <DurationBars rows={tableRows.map((row) => ({ id: row.tableId, label: row.code, dwellMs: row.occupancyMs }))} />
          <table className="rdi-list ss-agg-table">
            <thead><tr><th>Table</th><th>Sessions</th><th>Occupancy</th><th>Visits</th></tr></thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.tableId}>
                  <td><button type="button" onClick={() => navigate(`/restaurant/tables/${row.tableId}`)}>{row.code}</button></td>
                  <td>{row.sessionCount}</td>
                  <td>{formatDwell(row.occupancyMs)}</td>
                  <td>{row.visitCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <header className="ss-section-head">
            <SectionLabel>Waiter activity</SectionLabel>
            <h3>Service by waiter</h3>
            <p>Visit count and dwell for recognised floor staff.</p>
          </header>
          <DurationBars rows={waiterRows.map((row) => ({ id: row.personId, label: row.name.split(' ')[0], dwellMs: row.dwellMs }))} />
          <table className="rdi-list ss-agg-table">
            <thead><tr><th>Waiter</th><th>Visits</th><th>Dwell</th><th>Average</th></tr></thead>
            <tbody>
              {waiterRows.map((row) => (
                <tr key={row.personId}>
                  <td><button type="button" onClick={() => navigate(`/restaurant/service/${row.personId}`)}>{row.name}</button></td>
                  <td>{row.visitCount}</td>
                  <td>{formatDwell(row.dwellMs)}</td>
                  <td>{formatDwell(row.averageMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <header className="ss-section-head">
            <SectionLabel>Kitchen stations</SectionLabel>
            <h3>Counter utilisation</h3>
            <p>Employee dwell accumulated at each kitchen station.</p>
          </header>
          <DurationBars rows={snapshot.counterRows.map((row) => ({ id: row.counterId, label: row.name, dwellMs: row.dwellMs }))} />
        </Card>

        <Card>
          <header className="ss-section-head">
            <SectionLabel>Kitchen staff</SectionLabel>
            <h3>Employees observed</h3>
            <p>Identified kitchen employees and their total station time.</p>
          </header>
          <table className="rdi-list">
            <thead><tr><th>Employee</th><th>Visits</th><th>Total dwell</th></tr></thead>
            <tbody>
              {kitchenRows.map((row) => (
                <tr key={row.personId}>
                  <td><button type="button" onClick={() => navigate(`/restaurant/kitchen/${row.personId}`)}>{row.name}</button></td>
                  <td>{row.visitCount}</td>
                  <td>{formatDwell(row.dwellMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <header className="ss-section-head">
        <SectionLabel>Key findings</SectionLabel>
        <h3>Operational reads</h3>
        <p>Highest occupancy, busiest waiter, and densest kitchen station in this window.</p>
      </header>
      <div className="ss-findings-grid">
        {findings.map((finding) => (
          <Card key={finding.insightId} className="ss-finding-card">
            <p>{finding.text}</p>
            <button type="button" className="button secondary" onClick={() => { if (finding.eventIds[0]) selectEvent(finding.eventIds[0]); else navigate(finding.href) }}>View evidence</button>
          </Card>
        ))}
      </div>
    </div>
  )
}
