import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { Crumbs, EventTimeline, StatusBadge, EmptyFilter, CameraDesk, useRestaurantWindow } from '../components'
import { tableSummaries, timelineForTable, visitsInWindow, overlapsWindow } from '../analytics'
import { at, lookup, msBetween, occupancySessions, videos } from '../data'
import { formatClock, formatDwell } from '../format'
import { useRestaurantStore } from '../store'

export function TableDetailPage() {
  const { tableId } = useParams()
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const { start, end } = useRestaurantWindow()
  const table = lookup.table[tableId]
  const summary = tableSummaries(start, end).find((row) => row.tableId === tableId)
  const sessions = occupancySessions
    .filter((session) => session.tableId === tableId)
    .map((session) => ({
      ...session,
      eventId: `evt-${session.occupancyId}`,
      startAt: at(session.start),
      endAt: at(session.end),
      durationMs: msBetween(at(session.start), at(session.end)),
    }))
    .filter((session) => overlapsWindow(session, start, end))
  const visits = visitsInWindow(start, end, { tableId })
  const tableVideo = (tableId === 'tbl-04'
    ? videos.find((item) => item.videoId === 'vid-table-occupancy')
    : videos.find((item) => item.cameraId === table?.cameraId)) || videos[0]
  const timeline = useMemo(() => {
    const occupancy = timelineForTable(tableId, start, end).filter((event) => event.eventType === 'table.occupancy')
    return [...occupancy, ...visits].sort((a, b) => a.startAt.localeCompare(b.startAt))
  }, [tableId, start, end, visits])
  if (!table || !summary) {
    return <EmptyFilter title="Table not found" detail="Return to the dining floor and select a table from the layout." />
  }
  return (
    <>
      <Crumbs items={[{ label: 'Tables', to: '/restaurant/tables' }, { label: table.code }]} />
      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <SectionLabel blue>TABLE</SectionLabel>
          <h2>{table.code}</h2>
          <p>{table.seats}-top · {summary.camera.name} · {summary.label}</p>
        </div>
        <StatusBadge status={summary.status} label={summary.label} />
      </div>
      <div className="rdi-kpis" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
        <Card className="rdi-kpi"><span>Guest count</span><strong>{summary.guestCount || '—'}</strong></Card>
        <Card className="rdi-kpi"><span>Occupancy dwell</span><strong>{formatDwell(summary.occupancyMs)}</strong></Card>
        <Card className="rdi-kpi"><span>Sessions</span><strong>{summary.sessionCount}</strong></Card>
        <Card className="rdi-kpi"><span>Waiter visits</span><strong>{summary.visitCount}</strong></Card>
        <Card className="rdi-kpi"><span>Waiter dwell</span><strong>{formatDwell(summary.waiterDwellMs)}</strong></Card>
      </div>
      <CameraDesk
        video={tableVideo}
        label={`${summary.camera.name} · ${table.code}`}
        title={`${table.code} camera`}
        detail={`${table.seats}-top · ${summary.camera.name}. Each colour marks a guest or table standing area in the full frame.`}
      >
        <StatusBadge status={summary.status} label={summary.label} />
      </CameraDesk>
      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card>
          <SectionLabel>OCCUPANCY SESSIONS</SectionLabel>
          {sessions.length === 0 ? <EmptyFilter title="No occupancy in this window" detail="This table was not occupied during the selected period." /> : sessions.map((session) => (
            <button key={session.eventId} type="button" className="card rdi-insight" style={{ marginBottom: 8 }} onClick={() => selectEvent(session.eventId)}>
              <p><strong>{formatClock(session.startAt)}</strong> Guests seated</p>
              <p><strong>{formatClock(session.endAt)}</strong> Table cleared</p>
              <p>Duration: {formatDwell(session.durationMs)} · {session.guestCount} guests</p>
            </button>
          ))}
        </Card>
        <Card>
          <SectionLabel>WAITER INTERACTIONS</SectionLabel>
          {visits.length === 0 ? <EmptyFilter title="No waiter visits" detail="No recognised service-zone entries overlap this window." /> : (
            <table className="rdi-list">
              <thead><tr><th>Waiter</th><th>Entered</th><th>Duration</th></tr></thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.eventId}>
                    <td><Link to={`/restaurant/service/${visit.personId}?table=${tableId}`}>{lookup.person[visit.personId].name}</Link></td>
                    <td><button type="button" onClick={() => selectEvent(visit.eventId)}>{formatClock(visit.startAt)}</button></td>
                    <td>{formatDwell(visit.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
      <Card className="ss-panel-card" style={{ marginTop: 14 }}>
        <header className="ss-section-head">
          <SectionLabel>PARTICIPANT TIMELINE</SectionLabel>
          <h3>Who was on camera at {table.code}</h3>
          <p>Click a segment to open that person&apos;s matching video evidence.</p>
        </header>
        <EventTimeline
          events={timeline}
          windowStart={start}
          windowEnd={end}
          selectedId={selectedEventId}
          onSelect={(event) => selectEvent(event.eventId)}
        />
      </Card>
    </>
  )
}
