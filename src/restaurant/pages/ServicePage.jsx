import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Card, SectionLabel } from '../../components/ui'
import { EmptyFilter, LiveCamera, useRestaurantWindow } from '../components'
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
      <div className="list-toolbar">
        <div className="lib-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a waiter…" aria-label="Search waiters" /></div>
        <span className="list-count">{filtered.length} recognised waiters</span>
      </div>
      <Card className="rdi-live-card">
        <SectionLabel>SERVICE CAMERA</SectionLabel>
        <LiveCamera video={videos.find((item) => item.videoId === 'vid-waiter-visit')} label="Dining Floor 01 · Waiter activity" />
      </Card>
      {filtered.length === 0 ? <Card style={{ marginTop: 14 }}><EmptyFilter title="No waiter activity" detail="No recognised service visits overlap the selected window." /></Card> : (
        <div className="rdi-person-grid" style={{ marginTop: 14 }}>
          {filtered.map((waiter) => (
            <Card key={waiter.personId}>
              <button type="button" className="rdi-person" onClick={() => navigate(`/restaurant/service/${waiter.personId}`)}>
                <header>
                  <div>
                    <SectionLabel>FACE RECOGNISED</SectionLabel>
                    <strong>{waiter.name}</strong>
                    <span style={{ color: 'var(--ink-400)', fontSize: 12 }}>{waiter.employeeCode}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{waiter.visitCount} visits</strong>
                    <div style={{ color: 'var(--ink-600)', fontSize: 12 }}>{formatDwell(waiter.dwellMs)}</div>
                  </div>
                </header>
                <div className="rdi-meta">
                  <div><span>Average visit</span><strong>{formatDwell(waiter.averageMs)}</strong></div>
                  <div><span>Tables</span><strong>{waiter.tableCount}</strong></div>
                  <div><span>First visit</span><strong>{waiter.firstVisit ? formatClock(waiter.firstVisit) : '—'}</strong></div>
                  <div><span>Last visit</span><strong>{waiter.lastVisit ? formatClock(waiter.lastVisit) : '—'}</strong></div>
                </div>
                {waiter.tablesVisited.map((row) => (
                  <span key={row.tableId} className="rdi-chip">{row.table.code} · {row.visits} visits · {formatDwell(row.dwellMs)}</span>
                ))}
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
