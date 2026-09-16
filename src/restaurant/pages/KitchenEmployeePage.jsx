import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { Crumbs, DurationBars, EventTimeline, EmptyFilter, CameraDesk, useRestaurantWindow } from '../components'
import { kitchenEmployeeSummaries, kitchenInWindow } from '../analytics'
import { lookup, videos } from '../data'
import { formatClock, formatDwell } from '../format'
import { useRestaurantStore } from '../store'

export function KitchenEmployeePage() {
  const { personId } = useParams()
  const [params, setParams] = useSearchParams()
  const counterId = params.get('counter') || ''
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const { start, end } = useRestaurantWindow()
  const person = kitchenEmployeeSummaries(start, end).find((row) => row.personId === personId)
  const dwells = kitchenInWindow(start, end, { personId, counterId: counterId || undefined })
  const timeline = useMemo(() => dwells, [dwells])
  const movementStations = new Set(['ctr-pass', 'ctr-pastry', 'ctr-cold'])
  const preferredCounter = counterId || person?.countersVisited?.[0]?.counterId || ''
  const video = videos.find((item) => item.videoId === (movementStations.has(preferredCounter) ? 'vid-kitchen-movement' : 'vid-kitchen-activity'))
  if (!person) return <EmptyFilter title="Employee not found" detail="Return to kitchen intelligence and select an identified employee." />
  return (
    <>
      <Crumbs items={[{ label: 'Kitchen', to: '/restaurant/kitchen' }, { label: person.name }]} />
      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <SectionLabel blue>KITCHEN EMPLOYEE</SectionLabel>
          <h2>{person.name}</h2>
          <p>{person.employeeCode} · {person.station} · Face recognition enrolled</p>
        </div>
      </div>
      <div className="rdi-kpis" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
        <Card className="rdi-kpi"><span>Total dwell</span><strong>{formatDwell(person.dwellMs)}</strong></Card>
        <Card className="rdi-kpi"><span>Station visits</span><strong>{person.visitCount}</strong></Card>
        <Card className="rdi-kpi"><span>Average dwell</span><strong>{formatDwell(person.averageMs)}</strong></Card>
      </div>
      <CameraDesk
        video={video}
        label={`${lookup.camera[video?.cameraId]?.name || 'Kitchen'} · ${person.name}`}
        title={`${person.name} · live`}
        detail={`${person.station} · overlays stay locked to ${person.name} when focused.`}
        focusPersonId={personId}
      >
        <div className="ss-cam-desk-filters">
          <button type="button" className={!counterId ? 'is-on' : ''} onClick={() => setParams({})}>All counters</button>
          {person.countersVisited.map((row) => (
            <button
              key={row.counterId}
              type="button"
              className={counterId === row.counterId ? 'is-on' : ''}
              onClick={() => setParams({ counter: row.counterId })}
            >
              {row.counter.name}
            </button>
          ))}
        </div>
      </CameraDesk>
      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card>
          <SectionLabel>DWELL BY COUNTER</SectionLabel>
          <DurationBars rows={person.countersVisited.map((row) => ({ id: row.counterId, label: row.counter.name, dwellMs: row.dwellMs }))} />
          {person.countersVisited.map((row) => (
            <button key={row.counterId} type="button" className="rdi-chip" onClick={() => setParams({ counter: row.counterId })}>
              {row.counter.name} · {formatDwell(row.dwellMs)}
            </button>
          ))}
        </Card>
        <Card>
          <SectionLabel>{counterId ? `${lookup.counter[counterId]?.name || 'Station'} entry / exit` : 'COUNTER EVENTS'}</SectionLabel>
          {counterId && <button type="button" className="rdi-link" onClick={() => setParams({})}>All counters</button>}
          {dwells.length === 0 ? <EmptyFilter title="No dwell records" detail="This employee was not observed at the selected station in this window." /> : dwells.map((dwell) => (
            <button key={dwell.eventId} type="button" className="card rdi-insight" style={{ marginBottom: 8 }} onClick={() => selectEvent(dwell.eventId)}>
              <p><strong>{formatClock(dwell.startAt)}</strong> Entered {lookup.counter[dwell.counterId].name}</p>
              <p><strong>{formatClock(dwell.endAt)}</strong> Exited {lookup.counter[dwell.counterId].name}</p>
              <p>Duration: {formatDwell(dwell.durationMs)} · {lookup.camera[dwell.cameraId].name}</p>
            </button>
          ))}
        </Card>
      </div>
      <Card className="ss-panel-card" style={{ marginTop: 14 }}>
        <header className="ss-section-head">
          <SectionLabel>PARTICIPANT TIMELINE</SectionLabel>
          <h3>Who was on camera at kitchen stations</h3>
          <p>Click a segment to open {person.name}&apos;s matching video evidence.</p>
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
