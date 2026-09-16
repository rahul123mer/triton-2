import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { Crumbs, DurationBars, EventTimeline, EmptyFilter, LiveCamera, useRestaurantWindow } from '../components'
import { kitchenEmployeeSummaries, kitchenInWindow } from '../analytics'
import { lookup, videos } from '../data'
import { formatClock, formatDwell } from '../format'
import { useRestaurantStore } from '../store'

export function KitchenEmployeePage() {
  const { personId } = useParams()
  const [params, setParams] = useSearchParams()
  const counterId = params.get('counter') || ''
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const { start, end } = useRestaurantWindow()
  const person = kitchenEmployeeSummaries(start, end).find((row) => row.personId === personId)
  const dwells = kitchenInWindow(start, end, { personId, counterId: counterId || undefined })
  const timeline = useMemo(() => dwells.flatMap((dwell) => [
    lookup.event[`evt-${dwell.dwellId}-enter`],
    lookup.event[`evt-${dwell.dwellId}-exit`],
  ].filter(Boolean)), [dwells])
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
      <Card className="rdi-live-card">
        <SectionLabel>KITCHEN CAMERA</SectionLabel>
        <LiveCamera video={videos.find((item) => item.videoId === 'vid-kitchen-movement')} label="Kitchen 02 · station movement" />
      </Card>
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
      <Card style={{ marginTop: 14 }}>
        <SectionLabel>EMPLOYEE / COUNTER TIMELINE</SectionLabel>
        <EventTimeline events={timeline} onSelect={(event) => selectEvent(event.eventId)} />
      </Card>
    </>
  )
}
