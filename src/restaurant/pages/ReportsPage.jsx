import { Card, SectionLabel } from '../../components/ui'
import { DurationBars, useRestaurantWindow } from '../components'
import { insightsFor, kpis } from '../analytics'
import { restaurant } from '../data'
import { formatDateLong, formatDwell } from '../format'
import { useRestaurantStore } from '../store'
import { useNavigate } from 'react-router-dom'

export function RestaurantReportsPage() {
  const navigate = useNavigate()
  const date = useRestaurantStore((s) => s.date)
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const windowInfo = useRestaurantWindow()
  const snapshot = kpis(windowInfo.start, windowInfo.end)
  const findings = insightsFor(windowInfo.start, windowInfo.end)
  const longestSessions = [...snapshot.tableRows].filter((row) => row.occupancyMs).sort((a, b) => b.occupancyMs - a.occupancyMs).slice(0, 5)
  return (
    <div className="rdi-report">
      <Card>
        <SectionLabel blue>OVERVIEW</SectionLabel>
        <h2 style={{ margin: '6px 0' }}>{restaurant.name}</h2>
        <p style={{ color: 'var(--ink-600)' }}>{restaurant.location} · {formatDateLong(date)} · {windowInfo.label}</p>
        <div className="rdi-meta">
          <div><span>Occupied tables</span><strong>{snapshot.occupiedTables} / {snapshot.totalTables}</strong></div>
          <div><span>Average table dwell</span><strong>{formatDwell(snapshot.averageTableDwell)}</strong></div>
          <div><span>Waiter visits</span><strong>{snapshot.waiterVisits}</strong></div>
          <div><span>Kitchen staff observed</span><strong>{snapshot.kitchenStaffActive}</strong></div>
        </div>
      </Card>
      <h3>Table activity</h3>
      <Card>
        <DurationBars rows={snapshot.tableRows.filter((row) => row.occupancyMs).map((row) => ({ id: row.tableId, label: row.code, dwellMs: row.occupancyMs }))} />
        <table className="rdi-list" style={{ marginTop: 12 }}>
          <thead><tr><th>Table</th><th>Sessions</th><th>Occupancy</th><th>Waiter visits</th></tr></thead>
          <tbody>
            {longestSessions.map((row) => (
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
      <h3>Waiter activity</h3>
      <Card>
        <table className="rdi-list">
          <thead><tr><th>Waiter</th><th>Visits</th><th>Total dwell</th><th>Average visit</th></tr></thead>
          <tbody>
            {snapshot.waiterRows.filter((row) => row.visitCount).map((row) => (
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
      <h3>Kitchen activity</h3>
      <Card>
        <DurationBars rows={snapshot.counterRows.map((row) => ({ id: row.counterId, label: row.name, dwellMs: row.dwellMs }))} />
        <table className="rdi-list" style={{ marginTop: 12 }}>
          <thead><tr><th>Employee</th><th>Visits</th><th>Total dwell</th></tr></thead>
          <tbody>
            {snapshot.kitchenRows.filter((row) => row.visitCount).map((row) => (
              <tr key={row.personId}>
                <td><button type="button" onClick={() => navigate(`/restaurant/kitchen/${row.personId}`)}>{row.name}</button></td>
                <td>{row.visitCount}</td>
                <td>{formatDwell(row.dwellMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <h3>Key findings</h3>
      {findings.map((finding) => (
        <Card key={finding.insightId} className="rdi-insight" style={{ marginBottom: 10 }}>
          <p>{finding.text}</p>
          <button type="button" className="button secondary" style={{ marginTop: 10 }} onClick={() => finding.eventIds[0] && selectEvent(finding.eventIds[0])}>View evidence</button>
        </Card>
      ))}
    </div>
  )
}
