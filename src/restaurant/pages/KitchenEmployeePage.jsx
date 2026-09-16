import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { Crumbs, DurationBars, EventTimeline, EmptyFilter, CameraDesk, useRestaurantRanges, useRestaurantWindow } from '../components'
import { kitchenInWindow, kitchenPerformance } from '../analytics'
import { lookup, videos } from '../data'
import { formatClock, formatDwell, formatPercent } from '../format'
import { Avatar, StatGrid } from '../widgets'
import { useRestaurantStore } from '../store'

export function KitchenEmployeePage() {
  const { personId } = useParams()
  const [params, setParams] = useSearchParams()
  const counterId = params.get('counter') || ''
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const { start, end } = useRestaurantWindow()
  const { ranges, periodLabel } = useRestaurantRanges()
  const ranking = useMemo(() => kitchenPerformance(ranges), [ranges])
  const person = ranking.find((row) => row.personId === personId)
  const dwells = kitchenInWindow(start, end, { personId, counterId: counterId || undefined })
  const timeline = useMemo(() => dwells, [dwells])
  const movementStations = new Set(['ctr-pass', 'ctr-pastry', 'ctr-cold'])
  const preferredCounter = counterId || person?.counters?.[0]?.counterId || ''
  const video = videos.find((item) => item.videoId === (movementStations.has(preferredCounter) ? 'vid-kitchen-movement' : 'vid-kitchen-activity'))
  if (!person) return <EmptyFilter title="Employee not found" detail="Return to kitchen analytics and select an enrolled employee." />
  return (
    <>
      <Crumbs items={[{ label: 'Analytics', to: '/restaurant/analytics' }, { label: 'Kitchen', to: '/restaurant/analytics/kitchen' }, { label: person.name }]} />
      <div className="page-heading ss-person-heading" style={{ marginBottom: 14 }}>
        <div className="ss-person-heading-main">
          <Avatar person={person} size={56} />
          <div>
            <SectionLabel blue>KITCHEN STAFF · RANK {person.rank}</SectionLabel>
            <h2>{person.name}</h2>
            <p>{person.title || 'Cook'} · {person.employeeCode} · {periodLabel}</p>
          </div>
        </div>
      </div>
      <StatGrid
        columns={5}
        items={[
          { label: 'Total station time', value: formatDwell(person.dwellMs) },
          { label: 'Primary region', value: person.primaryRegion?.name || '—', hint: person.primaryRegion ? formatDwell(person.primaryRegion.dwellMs) : undefined },
          { label: 'Station visits', value: person.visitCount },
          { label: 'Average stay', value: formatDwell(person.averageMs) },
          { label: 'Share of window', value: formatPercent(person.utilisation) },
        ]}
      />
      <CameraDesk
        video={video}
        label={`${lookup.camera[video?.cameraId]?.name || 'Kitchen'} · ${person.name}`}
        title={`${person.name} · live`}
        detail={`Overlays stay locked to ${person.name} when focused. Select a station to switch camera.`}
        focusPersonId={personId}
      >
        <div className="ss-cam-desk-filters">
          <button type="button" className={!counterId ? 'is-on' : ''} onClick={() => setParams({})}>All stations</button>
          {person.counters.map((row) => (
            <button
              key={row.counterId}
              type="button"
              className={counterId === row.counterId ? 'is-on' : ''}
              onClick={() => setParams({ counter: row.counterId })}
            >
              {row.counter?.name}
            </button>
          ))}
        </div>
      </CameraDesk>
      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>BY REGION AND STATION</SectionLabel>
            <h3>Where the time went</h3>
          </header>
          <div className="ss-region-strip">
            {person.regions.map((region) => (
              <div key={region.regionId} className="ss-region-tile">
                <span>{region.name}</span>
                <strong>{region.dwellMs ? formatDwell(region.dwellMs) : '—'}</strong>
                <em>{region.visits} station visits</em>
              </div>
            ))}
          </div>
          <DurationBars rows={person.counters.map((row) => ({ id: row.counterId, label: row.counter?.name || row.counterId, dwellMs: row.dwellMs }))} />
        </Card>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>{counterId ? `${lookup.counter[counterId]?.name || 'Station'} ENTRY / EXIT` : 'STATION EVENTS'}</SectionLabel>
            <h3>Entry and exit</h3>
            {counterId && <button type="button" className="rdi-link" onClick={() => setParams({})}>All stations</button>}
          </header>
          {dwells.length === 0 ? <EmptyFilter title="No dwell records" detail="This employee was not observed at the selected station in this window." /> : (
            <div className="ss-event-list">
              {dwells.map((dwell) => (
                <button key={dwell.eventId} type="button" className="rdi-insight ss-event-item" onClick={() => selectEvent(dwell.eventId)}>
                  <strong>{formatClock(dwell.startAt)} – {formatClock(dwell.endAt)} · {lookup.counter[dwell.counterId].name}</strong>
                  <span>{formatDwell(dwell.durationMs)} · {lookup.camera[dwell.cameraId].name}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card className="ss-panel-card" style={{ marginTop: 14 }}>
        <header className="ss-section-head">
          <SectionLabel>PARTICIPANT TIMELINE</SectionLabel>
          <h3>Who was on camera at kitchen stations</h3>
          <p>First day of the period. Click a segment to open {person.name}&apos;s matching video evidence.</p>
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
