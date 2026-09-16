import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Card, SectionLabel } from '../../components/ui'
import { FloorPlan, StatusBadge, EmptyFilter, useRestaurantWindow } from '../components'
import { kpis } from '../analytics'
import { formatClock, formatDwell } from '../format'

export function TablesPage() {
  const navigate = useNavigate()
  const { start, end } = useRestaurantWindow()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const rows = kpis(start, end).tableRows
  const filtered = useMemo(() => rows.filter((row) => (
    (status === 'all' || row.status === status)
    && (!query.trim() || row.code.toLowerCase().includes(query.trim().toLowerCase()))
  )), [rows, query, status])
  return (
    <>
      <div className="list-toolbar">
        <div className="lib-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a table…" aria-label="Search tables" /></div>
        <div className="note-tabs">
          {[['all', 'All'], ['occupied', 'Occupied'], ['available', 'Available'], ['reserved', 'Reserved'], ['cleared', 'Recently cleared']].map(([key, label]) => (
            <button key={key} className={status === key ? 'active' : ''} onClick={() => setStatus(key)}>{label}</button>
          ))}
        </div>
        <span className="list-count">{filtered.length} of {rows.length}</span>
      </div>
      <div className="rdi-split">
        <Card>
          <SectionLabel>FLOOR</SectionLabel>
          <FloorPlan tables={filtered.length ? filtered : rows} onSelect={(table) => navigate(`/restaurant/tables/${table.tableId}`)} />
        </Card>
        <Card>
          <SectionLabel>TABLE ACTIVITY</SectionLabel>
          {filtered.length === 0 ? <EmptyFilter title="No tables match this view" detail="Clear search or status filters to return to the full dining room." /> : (
            <div className="table-scroll">
              <table className="rdi-list">
                <thead><tr><th>Table</th><th>Status</th><th>Guests</th><th>Dwell</th><th>Visits</th><th>Last activity</th></tr></thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.tableId}>
                      <td><button type="button" onClick={() => navigate(`/restaurant/tables/${row.tableId}`)}>{row.code}</button></td>
                      <td><StatusBadge status={row.status} label={row.label} /></td>
                      <td>{row.guestCount || '—'}</td>
                      <td>{row.occupancyMs ? formatDwell(row.occupancyMs) : '—'}</td>
                      <td>{row.visitCount}</td>
                      <td>{row.lastActivity ? formatClock(row.lastActivity.endAt || row.lastActivity.startAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
