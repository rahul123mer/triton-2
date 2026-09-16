import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { Crumbs, EventTimeline, StatusBadge, EmptyFilter, CameraDesk, useRestaurantRanges, useRestaurantWindow } from '../components'
import { sessionRecords, tableSummaries, timelineForTable, visitsInWindow } from '../analytics'
import { lookup, videos } from '../data'
import { formatClock, formatDateChip, formatDwell } from '../format'
import { AttentionPill, Avatar, RankTable, StatGrid } from '../widgets'
import { useRestaurantStore } from '../store'

export function TableDetailPage() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const { start, end } = useRestaurantWindow()
  const { ranges, isRange, periodLabel } = useRestaurantRanges()
  const table = lookup.table[tableId]
  const summary = tableSummaries(start, end).find((row) => row.tableId === tableId)
  const sessions = useMemo(() => sessionRecords(ranges, { tableId }), [ranges, tableId])
  const visits = visitsInWindow(start, end, { tableId })
  const tableVideo = (tableId === 'tbl-04'
    ? videos.find((item) => item.videoId === 'vid-table-occupancy')
    : videos.find((item) => item.cameraId === table?.cameraId)) || videos[0]
  const timeline = useMemo(() => {
    const occupancy = timelineForTable(tableId, start, end).filter((event) => event.eventType === 'table.occupancy')
    return [...occupancy, ...visits].sort((a, b) => a.startAt.localeCompare(b.startAt))
  }, [tableId, start, end, visits])
  if (!table || !summary) {
    return <EmptyFilter title="Table not found" detail="Return to table analytics and select a table." />
  }
  const occupancyMs = sessions.reduce((sum, row) => sum + row.durationMs, 0)
  const visitCount = sessions.reduce((sum, row) => sum + row.visitCount, 0)
  const covers = sessions.reduce((sum, row) => sum + (row.guestCount || 0), 0)
  const attention = occupancyMs ? visitCount / (occupancyMs / 900000) : 0
  const servers = [...new Set(sessions.flatMap((row) => row.servers.map((server) => server.personId)))].map((id) => lookup.person[id]).filter(Boolean)
  const maxDur = Math.max(1, ...sessions.map((row) => row.durationMs))

  return (
    <>
      <Crumbs items={[{ label: 'Analytics', to: '/restaurant/analytics' }, { label: 'Tables', to: '/restaurant/analytics/tables' }, { label: table.code }]} />
      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <SectionLabel blue>TABLE</SectionLabel>
          <h2>{table.code}</h2>
          <p>{table.seats}-top · {summary.camera.name} · {periodLabel}</p>
        </div>
        <StatusBadge status={summary.status} label={summary.label} />
      </div>
      <StatGrid
        columns={6}
        items={[
          { label: 'Sessions', value: sessions.length, hint: isRange ? `${ranges.length} days` : 'In window' },
          { label: 'Covers', value: covers || '—' },
          { label: 'Occupied time', value: formatDwell(occupancyMs), hint: sessions.length ? `${formatDwell(Math.round(occupancyMs / sessions.length))} avg` : undefined },
          { label: 'Server visits', value: visitCount, hint: 'During occupancy' },
          { label: 'Servers', value: servers.length, hint: servers.map((row) => row.name.split(' ')[0]).join(', ') || '—' },
          { label: 'Attention', value: attention.toFixed(2), hint: 'Visits per 15 occupied min' },
        ]}
      />
      <CameraDesk
        video={tableVideo}
        label={`${summary.camera.name} · ${table.code}`}
        title={`${table.code} camera`}
        detail={`${table.seats}-top · ${summary.camera.name}. Each colour marks a guest or table area in the full frame.`}
      >
        <StatusBadge status={summary.status} label={summary.label} />
      </CameraDesk>
      <Card className="ss-panel-card" style={{ marginTop: 14 }}>
        <header className="ss-section-head">
          <SectionLabel>OCCUPANCY SESSIONS</SectionLabel>
          <h3>Each seating on its own row</h3>
          <p>Servers and visits are counted only inside the session. Click the time to open the seating on video; click a server to open their drilldown.</p>
        </header>
        <RankTable
          rows={sessions}
          rowKey={(row) => row.eventId}
          defaultSort={null}
          columns={[
            ...(isRange ? [{ key: 'date', label: 'Day', sortValue: (row) => row.date, render: (row) => formatDateChip(row.date) }] : []),
            { key: 'startAt', label: 'Occupied', sortValue: (row) => row.startAt, render: (row) => <button type="button" className="ss-cell-link mono" onClick={() => selectEvent(row.eventId)}>{formatClock(row.startAt)} – {formatClock(row.endAt)}</button> },
            { key: 'durationMs', label: 'Duration', align: 'right', render: (row) => <span className="ss-dwell-cell"><span className="ss-minibar"><i style={{ width: `${Math.max(4, (row.durationMs / maxDur) * 100)}%` }} /></span><span>{formatDwell(row.durationMs)}</span></span> },
            { key: 'guestCount', label: 'Guests', align: 'right' },
            { key: 'servers', label: 'Servers during occupancy', sortable: false, render: (row) => row.servers.length ? (
              <span className="ss-server-stack">
                {row.servers.map((server) => (
                  <Link key={server.personId} className="ss-server-stack-item" to={`/restaurant/analytics/servers/${server.personId}?table=${tableId}`}>
                    <Avatar person={server.person} size={22} /><span>{server.person?.name} <em>×{server.visits} · {formatDwell(server.dwellMs)}</em></span>
                  </Link>
                ))}
              </span>
            ) : <span className="ss-muted">No server visit</span> },
            { key: 'visitCount', label: 'Visits', align: 'right' },
            { key: 'attention', label: 'Attention', align: 'right', render: (row) => <AttentionPill score={row.attention} compact /> },
          ]}
          empty={{ title: 'No occupancy in this period', detail: 'This table was not seated during the selected window.' }}
        />
      </Card>
      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>PARTICIPANT TIMELINE</SectionLabel>
            <h3>Who was on camera at {table.code}</h3>
            <p>First day of the period. Click a segment to open that person&apos;s matching video evidence.</p>
          </header>
          <EventTimeline
            events={timeline}
            windowStart={start}
            windowEnd={end}
            selectedId={selectedEventId}
            onSelect={(event) => selectEvent(event.eventId)}
          />
        </Card>
        <Card>
          <SectionLabel>SERVER VISITS</SectionLabel>
          {visits.length === 0 ? <EmptyFilter title="No server visits" detail="No recognised service-zone entries overlap this window." /> : (
            <table className="rdi-list">
              <thead><tr><th>Server</th><th>Entered</th><th>Duration</th></tr></thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.eventId}>
                    <td><button type="button" onClick={() => navigate(`/restaurant/analytics/servers/${visit.personId}?table=${tableId}`)}>{lookup.person[visit.personId].name}</button></td>
                    <td><button type="button" onClick={() => selectEvent(visit.eventId)}>{formatClock(visit.startAt)}</button></td>
                    <td>{formatDwell(visit.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  )
}
