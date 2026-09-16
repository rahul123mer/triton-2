import { useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { Crumbs, EventTimeline, EmptyFilter, CameraDesk, useRestaurantRanges, useRestaurantWindow } from '../components'
import { serverPerformance, visitsInWindow } from '../analytics'
import { lookup, videoForWaiter, videos } from '../data'
import { formatClock, formatDateChip, formatDwell } from '../format'
import { AttentionPill, Avatar, RankTable, StatGrid } from '../widgets'
import { useRestaurantStore } from '../store'

export function WaiterDetailPage() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tableFilter = params.get('table') || ''
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const { start, end } = useRestaurantWindow()
  const { ranges, isRange, periodLabel } = useRestaurantRanges()
  const ranking = useMemo(() => serverPerformance(ranges), [ranges])
  const waiter = ranking.find((row) => row.personId === personId)
  const visits = visitsInWindow(start, end, { personId, tableId: tableFilter || undefined })
  const timeline = useMemo(() => visits, [visits])
  const videoId = videoForWaiter(personId, tableFilter)
  const video = videos.find((item) => item.videoId === videoId)
  if (!waiter) return <EmptyFilter title="Server not found" detail="Return to server analytics and select an enrolled server." />
  const sessions = tableFilter ? waiter.sessions.filter((row) => row.tableId === tableFilter) : waiter.sessions
  const maxDur = Math.max(1, ...sessions.map((row) => row.durationMs))

  return (
    <>
      <Crumbs items={[{ label: 'Analytics', to: '/restaurant/analytics' }, { label: 'Servers', to: '/restaurant/analytics/servers' }, { label: waiter.name }]} />
      <div className="page-heading ss-person-heading" style={{ marginBottom: 14 }}>
        <div className="ss-person-heading-main">
          <Avatar person={waiter} size={56} />
          <div>
            <SectionLabel blue>SERVER · RANK {waiter.rank}</SectionLabel>
            <h2>{waiter.name}</h2>
            <p>{waiter.employeeCode} · Face enrolled {waiter.enrolledOn || ''} · {periodLabel}</p>
          </div>
        </div>
        <AttentionPill score={waiter.attention} />
      </div>
      <StatGrid
        columns={6}
        items={[
          { label: 'Tables served', value: waiter.tablesServed },
          { label: 'Sessions covered', value: waiter.sessionsCovered, hint: isRange ? `${ranges.length} days` : undefined },
          { label: 'Occupied time covered', value: formatDwell(waiter.occupancyMs) },
          { label: 'Visits', value: waiter.visitCount, hint: `${waiter.visitsOutsideOccupancy} to empty tables excluded` },
          { label: 'Avg visit', value: formatDwell(waiter.averageVisitMs), hint: `${formatDwell(waiter.dwellMs)} at tables` },
          { label: 'Attention score', value: waiter.attention.toFixed(2), hint: waiter.band.label, tone: waiter.band.tone },
        ]}
      />
      <CameraDesk
        video={video}
        label={`${lookup.camera[video?.cameraId]?.name || 'Dining floor'} · ${waiter.name}`}
        title={`${waiter.name} · live`}
        detail="Overlays stay locked to this server. Guest and table boxes stay fixed."
        focusPersonId={personId}
      >
        {tableFilter ? <Link className="rdi-chip" to={`/restaurant/analytics/servers/${personId}`}>Filtered to {lookup.table[tableFilter]?.code} · clear</Link> : null}
      </CameraDesk>
      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>{tableFilter ? `SESSIONS AT ${lookup.table[tableFilter]?.code || tableFilter}` : 'SESSIONS COVERED'}</SectionLabel>
            <h3>Where the score comes from</h3>
            <p>Each occupied session this server visited, with visits counted only inside the session.</p>
          </header>
          <RankTable
            rows={sessions}
            rowKey={(row) => row.eventId}
            defaultSort={null}
            columns={[
              ...(isRange ? [{ key: 'date', label: 'Day', sortValue: (row) => row.date, render: (row) => formatDateChip(row.date) }] : []),
              { key: 'code', label: 'Table', sortValue: (row) => row.table.code, render: (row) => <button type="button" className="ss-cell-link" onClick={() => navigate(`/restaurant/analytics/tables/${row.tableId}`)}>{row.table.code}</button> },
              { key: 'startAt', label: 'Occupied', sortValue: (row) => row.startAt, render: (row) => <button type="button" className="ss-cell-link mono" onClick={() => selectEvent(row.eventId)}>{formatClock(row.startAt)} – {formatClock(row.endAt)}</button> },
              { key: 'durationMs', label: 'Duration', align: 'right', render: (row) => <span className="ss-dwell-cell"><span className="ss-minibar"><i style={{ width: `${Math.max(4, (row.durationMs / maxDur) * 100)}%` }} /></span><span>{formatDwell(row.durationMs)}</span></span> },
              { key: 'mine', label: 'My visits', align: 'right', sortValue: (row) => row.servers.find((s) => s.personId === personId)?.visits || 0, render: (row) => row.servers.find((s) => s.personId === personId)?.visits || 0 },
              { key: 'others', label: 'Other servers', sortable: false, render: (row) => row.servers.filter((s) => s.personId !== personId).map((s) => s.person?.name.split(' ')[0]).join(', ') || <span className="ss-muted">—</span> },
              { key: 'attention', label: 'Session attention', align: 'right', render: (row) => <AttentionPill score={row.attention} compact /> },
            ]}
            empty={{ title: 'No occupied sessions visited', detail: 'This server was not observed at an occupied table in the period.' }}
          />
        </Card>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>BY TABLE</SectionLabel>
            <h3>Coverage per table</h3>
          </header>
          {waiter.byTable.length === 0 ? <EmptyFilter title="No tables" detail="No occupied-table visits in this period." /> : waiter.byTable.map((row) => (
            <Link key={row.tableId} className={`ss-table-cov${tableFilter === row.tableId ? ' is-on' : ''}`} to={`/restaurant/analytics/servers/${personId}?table=${row.tableId}`}>
              <strong>{row.table.code}</strong>
              <span>{row.visits} visits · {row.sessions} session{row.sessions === 1 ? '' : 's'} · {formatDwell(row.dwellMs)}</span>
              <AttentionPill score={row.attention} compact />
            </Link>
          ))}
        </Card>
      </div>
      <Card className="ss-panel-card" style={{ marginTop: 14 }}>
        <header className="ss-section-head">
          <SectionLabel>PARTICIPANT TIMELINE</SectionLabel>
          <h3>Who was on camera at service tables</h3>
          <p>First day of the period. Click a segment to open {waiter.name}&apos;s matching video evidence.</p>
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
