import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Card, SectionLabel } from '../../components/ui'
import { CameraDesk, EmptyFilter, useRestaurantWindow } from '../components'
import { waiterSummaries } from '../analytics'
import { formatClock, formatDwell } from '../format'
import { videos } from '../data'

export function ServicePage() {
  const navigate = useNavigate()
  const { start, end } = useRestaurantWindow()
  const [query, setQuery] = useState('')
  const rows = waiterSummaries(start, end)
  const filtered = useMemo(() => rows.filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase())), [rows, query])
  return (
    <>
      <CameraDesk
        video={videos.find((item) => item.videoId === 'vid-waiter-visit')}
        label="Dining Floor 01 · Waiter activity"
        title="Service floor"
        detail="Recognised waiters appear as tracked people when Polygons is on. Labels update as staff pass."
      >
        <div className="list-toolbar" style={{ margin: 0, padding: 0, border: 0 }}>
          <div className="lib-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a waiter…" aria-label="Search waiters" /></div>
        </div>
        <span className="list-count">{filtered.length} recognised waiters</span>
      </CameraDesk>
      <header className="ss-section-head" style={{ marginTop: 20, marginBottom: 12 }}>
        <SectionLabel>FACE RECOGNISED</SectionLabel>
        <h3>Waiter roster</h3>
        <p>Open a card for live camera focus, table visits, and entry/exit timeline.</p>
      </header>
      {filtered.length === 0 ? <Card><EmptyFilter title="No waiter activity" detail="No recognised service visits overlap the selected window." /></Card> : (
        <div className="rdi-person-grid">
          {filtered.map((waiter) => (
            <Card key={waiter.personId} className="rdi-person-card">
              <button type="button" className="rdi-person" onClick={() => navigate(`/restaurant/service/${waiter.personId}`)}>
                <header>
                  <div className="rdi-person-id">
                    <SectionLabel>FACE RECOGNISED</SectionLabel>
                    <strong>{waiter.name}</strong>
                    <span className="rdi-person-code">{waiter.employeeCode}</span>
                  </div>
                  <div className="rdi-person-stat">
                    <strong>{waiter.visitCount} visits</strong>
                    <span>{formatDwell(waiter.dwellMs)}</span>
                  </div>
                </header>
                <div className="rdi-meta">
                  <div><span>Average visit</span><strong>{formatDwell(waiter.averageMs)}</strong></div>
                  <div><span>Tables</span><strong>{waiter.tableCount}</strong></div>
                  <div><span>First visit</span><strong>{waiter.firstVisit ? formatClock(waiter.firstVisit) : '—'}</strong></div>
                  <div><span>Last visit</span><strong>{waiter.lastVisit ? formatClock(waiter.lastVisit) : '—'}</strong></div>
                </div>
                <div className="rdi-person-chips">
                  {waiter.tablesVisited.map((row) => (
                    <span key={row.tableId} className="rdi-chip">{row.table.code} · {row.visits} visits · {formatDwell(row.dwellMs)}</span>
                  ))}
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
