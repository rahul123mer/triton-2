import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { CameraDesk, FloorPlan, LiveCamera, StatusBadge, useRestaurantWindow } from '../components'
import { tableSummaries, visitsInWindow } from '../analytics'
import { cameras, lookup, videos } from '../data'
import { formatClock, formatDwell } from '../format'
import { Avatar } from '../widgets'

const DINING_VIDEOS = {
  'cam-df-01': 'vid-dining-floor',
  'cam-df-02': 'vid-multi-table-service',
  'cam-df-03': 'vid-dining-floor',
}

export function LiveTablesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const cameraId = params.get('camera') || 'cam-df-01'
  const tableParam = params.get('table') || ''
  const { start, end, label } = useRestaurantWindow()
  const rows = useMemo(() => tableSummaries(start, end), [start, end])
  const camera = lookup.camera[cameraId]
  const camTables = rows.filter((row) => row.cameraId === cameraId)
  const focusTable = camTables.find((row) => row.tableId === tableParam) || null
  const video = focusTable?.tableId === 'tbl-04'
    ? videos.find((item) => item.videoId === 'vid-table-occupancy')
    : videos.find((item) => item.videoId === DINING_VIDEOS[cameraId]) || videos[0]
  const visits = useMemo(() => visitsInWindow(start, end, { tableId: focusTable?.tableId }).filter((visit) => focusTable || visit.cameraId === cameraId), [start, end, focusTable, cameraId])
  const servers = useMemo(() => {
    const byPerson = new Map()
    for (const visit of visits) {
      const entry = byPerson.get(visit.personId) || { person: lookup.person[visit.personId], visits: 0, last: null }
      entry.visits += 1
      if (!entry.last || visit.endAt > entry.last) entry.last = visit.endAt
      byPerson.set(visit.personId, entry)
    }
    return [...byPerson.values()].sort((a, b) => b.visits - a.visits)
  }, [visits])
  const diningCams = cameras.filter((row) => row.zone === 'dining')
  const occupied = camTables.filter((row) => row.status === 'occupied').length

  const setQuery = (next) => {
    const merged = new URLSearchParams()
    if (next.camera) merged.set('camera', next.camera)
    if (next.table) merged.set('table', next.table)
    setParams(merged)
  }

  return (
    <div className="ss-live">
      <div className="ss-live-tabs" role="tablist" aria-label="Dining cameras">
        {diningCams.map((row) => {
          const count = rows.filter((table) => table.cameraId === row.cameraId && table.status === 'occupied').length
          return (
            <button
              key={row.cameraId}
              type="button"
              role="tab"
              aria-selected={cameraId === row.cameraId}
              className={cameraId === row.cameraId ? 'is-on' : ''}
              onClick={() => setQuery({ camera: row.cameraId })}
            >
              <span className="ss-live-dot" /> {row.name}
              <em>{row.coverage} · {count} occupied</em>
            </button>
          )
        })}
      </div>

      <CameraDesk
        video={video}
        label={`${camera?.name} · ${focusTable ? focusTable.code : camera?.coverage}`}
        title={focusTable ? `${focusTable.code} · ${focusTable.label}` : camera?.name}
        detail={focusTable
          ? `${focusTable.seats}-top · ${focusTable.guestCount || 0} guests · ${focusTable.occupancyMs ? formatDwell(focusTable.occupancyMs) : 'no occupancy'} in ${label}.`
          : `${occupied} of ${camTables.length} tables on this camera are occupied at the end of ${label}. Turn on Polygons for table zones and tracked staff.`}
      >
        <div className="ss-cam-desk-filters">
          <button type="button" className={!tableParam ? 'is-on' : ''} onClick={() => setQuery({ camera: cameraId })}>All tables</button>
          {camTables.map((row) => (
            <button
              key={row.tableId}
              type="button"
              className={`${tableParam === row.tableId ? 'is-on' : ''} status-${row.status}`}
              onClick={() => setQuery({ camera: cameraId, table: row.tableId })}
            >
              {row.code}
            </button>
          ))}
        </div>
        <div className="ss-on-camera">
          <span className="ss-cam-desk-zones-label">Servers on camera</span>
          {servers.length === 0 ? <span className="ss-muted">No enrolled server observed.</span> : servers.map((row) => (
            <button key={row.person?.personId} type="button" className="ss-on-camera-row" onClick={() => navigate(`/restaurant/analytics/servers/${row.person?.personId}${focusTable ? `?table=${focusTable.tableId}` : ''}`)}>
              <Avatar person={row.person} size={26} />
              <span><strong>{row.person?.name}</strong><em>last visit {formatClock(row.last)}</em></span>
              <b>{row.visits} visits</b>
            </button>
          ))}
        </div>
        {focusTable ? (
          <button type="button" className="button secondary ss-full" onClick={() => navigate(`/restaurant/analytics/tables/${focusTable.tableId}`)}>Open {focusTable.code} sessions</button>
        ) : null}
      </CameraDesk>

      <div className="ss-live-secondary">
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>FLOOR</SectionLabel>
            <h3>Table status</h3>
            <p>Status at the end of {label}. Click a table to focus its camera.</p>
          </header>
          <FloorPlan tables={rows} onSelect={(table) => setQuery({ camera: table.cameraId, table: table.tableId })} />
        </Card>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>OTHER CAMERAS</SectionLabel>
            <h3>Dining floor</h3>
          </header>
          <div className="ss-live-thumbs">
            {diningCams.filter((row) => row.cameraId !== cameraId).map((row) => (
              <button key={row.cameraId} type="button" className="ss-live-thumb" onClick={() => setQuery({ camera: row.cameraId })}>
                <LiveCamera video={videos.find((item) => item.videoId === DINING_VIDEOS[row.cameraId])} cameraName={row.name} size="feed" />
              </button>
            ))}
          </div>
          <table className="rdi-list ss-agg-table">
            <thead><tr><th>Table</th><th>Status</th><th>Guests</th><th>Occupied</th></tr></thead>
            <tbody>
              {camTables.map((row) => (
                <tr key={row.tableId}>
                  <td><button type="button" onClick={() => setQuery({ camera: cameraId, table: row.tableId })}>{row.code}</button></td>
                  <td><StatusBadge status={row.status} label={row.label} /></td>
                  <td>{row.guestCount || '—'}</td>
                  <td>{row.occupancyMs ? formatDwell(row.occupancyMs) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
