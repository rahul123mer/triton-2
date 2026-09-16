import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { Crumbs, EventTimeline, EmptyFilter, LiveCamera, useRestaurantWindow } from '../components'
import { visitsInWindow, waiterSummaries } from '../analytics'
import { lookup, videos } from '../data'
import { formatClock, formatDwell } from '../format'
import { useRestaurantStore } from '../store'

export function WaiterDetailPage() {
  const { personId } = useParams()
  const [params] = useSearchParams()
  const tableFilter = params.get('table') || ''
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const { start, end } = useRestaurantWindow()
  const waiter = waiterSummaries(start, end).find((row) => row.personId === personId)
  const visits = visitsInWindow(start, end, { personId, tableId: tableFilter || undefined })
  const timeline = useMemo(() => visits.flatMap((visit) => [
    lookup.event[`evt-${visit.visitId}-enter`],
    lookup.event[`evt-${visit.visitId}-exit`],
  ].filter(Boolean)), [visits])
  if (!waiter) return <EmptyFilter title="Waiter not found" detail="Return to service activity and select a recognised waiter." />
  return (
    <>
      <Crumbs items={[{ label: 'Service', to: '/restaurant/service' }, { label: waiter.name }]} />
      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <SectionLabel blue>WAITER</SectionLabel>
          <h2>{waiter.name}</h2>
          <p>{waiter.employeeCode} · Face recognition enrolled · {waiter.visitCount} visits in window</p>
        </div>
      </div>
      <div className="rdi-kpis" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
        <Card className="rdi-kpi"><span>Visits</span><strong>{waiter.visitCount}</strong></Card>
        <Card className="rdi-kpi"><span>Total dwell</span><strong>{formatDwell(waiter.dwellMs)}</strong></Card>
        <Card className="rdi-kpi"><span>Average visit</span><strong>{formatDwell(waiter.averageMs)}</strong></Card>
        <Card className="rdi-kpi"><span>Tables</span><strong>{waiter.tableCount}</strong></Card>
      </div>
      <Card className="rdi-live-card">
        <SectionLabel>SERVICE CAMERA</SectionLabel>
        <LiveCamera video={videos.find((item) => item.videoId === (tableFilter && lookup.table[tableFilter]?.cameraId === 'cam-df-02' ? 'vid-multi-table-service' : 'vid-waiter-visit'))} label="Dining floor · waiter activity" />
      </Card>
      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card>
          <SectionLabel>TABLES VISITED</SectionLabel>
          {waiter.tablesVisited.length === 0 ? <EmptyFilter title="No table visits" detail="This waiter was not observed in a table service zone during the window." /> : waiter.tablesVisited.map((row) => (
            <Link key={row.tableId} className="card rdi-insight" style={{ display: 'block', marginBottom: 8 }} to={`/restaurant/service/${personId}?table=${row.tableId}`}>
              <p><strong>{row.table.code}</strong></p>
              <p>{row.visits} visits · {formatDwell(row.dwellMs)} total</p>
            </Link>
          ))}
        </Card>
        <Card>
          <SectionLabel>{tableFilter ? `VISITS AT ${lookup.table[tableFilter]?.code || tableFilter}` : 'VISIT TIMELINE'}</SectionLabel>
          {tableFilter && <Link to={`/restaurant/service/${personId}`}>All tables</Link>}
          {visits.length === 0 ? <EmptyFilter title="No visits for this combination" detail="Choose another table or widen the time window." /> : visits.map((visit) => (
            <button key={visit.eventId} type="button" className="card rdi-insight" style={{ marginBottom: 8 }} onClick={() => selectEvent(visit.eventId)}>
              <p><strong>{formatClock(visit.startAt)}</strong> Entered {lookup.table[visit.tableId].code} service zone</p>
              <p><strong>{formatClock(visit.endAt)}</strong> Exited {lookup.table[visit.tableId].code} service zone</p>
              <p>Duration: {formatDwell(visit.durationMs)}</p>
            </button>
          ))}
        </Card>
      </div>
      <Card style={{ marginTop: 14 }}>
        <SectionLabel>ENTRY / EXIT TIMELINE</SectionLabel>
        <EventTimeline events={timeline} onSelect={(event) => selectEvent(event.eventId)} />
      </Card>
    </>
  )
}
