import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { CameraDesk, LiveCamera, StationTimeline, useRestaurantWindow } from '../components'
import { counterSummaries, kitchenInWindow } from '../analytics'
import { cameras, kitchenRegions, lookup, videoPersonZones, videos } from '../data'
import { formatClock, formatDwell } from '../format'
import { Avatar } from '../widgets'
import { useRestaurantStore } from '../store'

const KITCHEN_VIDEOS = {
  'cam-kit-01': 'vid-kitchen-activity',
  'cam-kit-02': 'vid-kitchen-movement',
}

export function LiveKitchenPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const counterId = params.get('counter') || ''
  const cameraParam = params.get('camera') || ''
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const { start, end, label } = useRestaurantWindow()
  const counters = useMemo(() => counterSummaries(start, end), [start, end])
  const selected = counters.find((row) => row.counterId === counterId)
  const cameraId = cameraParam || selected?.cameraId || 'cam-kit-01'
  const camera = lookup.camera[cameraId]
  const video = videos.find((item) => item.videoId === KITCHEN_VIDEOS[cameraId]) || videos[4]
  const dwells = useMemo(() => kitchenInWindow(start, end, { counterId: counterId || undefined }), [start, end, counterId])
  const onCamera = useMemo(() => {
    const onClip = new Set(
      (videoPersonZones[video?.videoId] || [])
        .filter((zone) => zone.kind === 'person' && zone.personId)
        .map((zone) => zone.personId),
    )
    const byPerson = new Map()
    for (const dwell of dwells) {
      if (dwell.cameraId !== cameraId && !counterId) continue
      if (onClip.size && !onClip.has(dwell.personId)) continue
      const entry = byPerson.get(dwell.personId) || { person: lookup.person[dwell.personId], dwellMs: 0, last: null, station: null }
      entry.dwellMs += dwell.durationMs
      if (!entry.last || dwell.endAt > entry.last) {
        entry.last = dwell.endAt
        entry.station = lookup.counter[dwell.counterId]
      }
      byPerson.set(dwell.personId, entry)
    }
    for (const personId of onClip) {
      if (!byPerson.has(personId) && lookup.person[personId]) {
        const zone = (videoPersonZones[video?.videoId] || []).find((row) => row.personId === personId)
        byPerson.set(personId, {
          person: lookup.person[personId],
          dwellMs: 0,
          last: null,
          station: { name: zone?.detail || lookup.person[personId]?.station },
        })
      }
    }
    return [...byPerson.values()].sort((a, b) => b.dwellMs - a.dwellMs)
  }, [dwells, cameraId, counterId, video?.videoId])
  const timelineCounters = counterId ? counters.filter((row) => row.counterId === counterId) : counters.filter((row) => row.cameraId === cameraId)
  const timelineDwells = counterId ? dwells : dwells.filter((row) => row.cameraId === cameraId)
  const kitchenCams = cameras.filter((row) => row.zone === 'kitchen')

  const setQuery = (next) => {
    const merged = new URLSearchParams()
    if (next.camera) merged.set('camera', next.camera)
    if (next.counter) merged.set('counter', next.counter)
    setParams(merged)
  }

  return (
    <div className="ss-live">
      <div className="ss-live-tabs" role="tablist" aria-label="Kitchen cameras">
        {kitchenCams.map((row) => (
          <button
            key={row.cameraId}
            type="button"
            role="tab"
            aria-selected={cameraId === row.cameraId}
            className={cameraId === row.cameraId ? 'is-on' : ''}
            onClick={() => setQuery({ camera: row.cameraId })}
          >
            <span className="ss-live-dot" /> {row.name}
            <em>{row.coverage}</em>
          </button>
        ))}
      </div>

      <CameraDesk
        video={video}
        label={`${camera?.name} · ${selected ? selected.name : (kitchenRegions.find((r) => r.cameraId === cameraId)?.name || camera?.coverage)}`}
        title={selected ? selected.name : camera?.name}
        detail={selected
          ? `Filtered to ${selected.name}. Turn on Polygons to see the station zone and tracked staff.`
          : `${camera?.coverage}. Filter a station below, or turn on Polygons to see every zone on this camera.`}
      >
        <div className="ss-cam-desk-filters">
          <button type="button" className={!counterId ? 'is-on' : ''} onClick={() => setQuery({ camera: cameraId })}>All stations</button>
          {counters.filter((row) => row.cameraId === cameraId).map((row) => (
            <button
              key={row.counterId}
              type="button"
              className={counterId === row.counterId ? 'is-on' : ''}
              onClick={() => setQuery({ camera: cameraId, counter: row.counterId })}
            >
              {row.name}
            </button>
          ))}
        </div>
        <div className="ss-on-camera">
          <span className="ss-cam-desk-zones-label">On camera in this window</span>
          {onCamera.length === 0 ? <span className="ss-muted">No enrolled staff observed.</span> : onCamera.map((row) => (
            <button key={row.person?.personId} type="button" className="ss-on-camera-row" onClick={() => navigate(`/restaurant/analytics/kitchen/${row.person?.personId}`)}>
              <Avatar person={row.person} size={26} />
              <span><strong>{row.person?.name}</strong><em>{row.station?.name} · last seen {formatClock(row.last)}</em></span>
              <b>{formatDwell(row.dwellMs)}</b>
            </button>
          ))}
        </div>
      </CameraDesk>

      <div className="ss-live-secondary">
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>OTHER KITCHEN CAMERA</SectionLabel>
            <h3>{kitchenCams.find((row) => row.cameraId !== cameraId)?.name}</h3>
          </header>
          {kitchenCams.filter((row) => row.cameraId !== cameraId).map((row) => (
            <button key={row.cameraId} type="button" className="ss-live-thumb" onClick={() => setQuery({ camera: row.cameraId })}>
              <LiveCamera video={videos.find((item) => item.videoId === KITCHEN_VIDEOS[row.cameraId])} cameraName={row.name} size="feed" />
            </button>
          ))}
        </Card>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>{selected ? `${selected.name.toUpperCase()} TIMELINE` : 'WHO WAS ON THIS CAMERA'}</SectionLabel>
            <h3>{selected ? `Presence at ${selected.name}` : `Presence on ${camera?.name}`}</h3>
            <p>{label}. Click a segment to open the matching video evidence.</p>
          </header>
          <StationTimeline
            dwells={timelineDwells}
            counters={timelineCounters}
            windowStart={start}
            windowEnd={end}
            onSelect={selectEvent}
            selectedId={selectedEventId}
          />
        </Card>
      </div>
    </div>
  )
}
