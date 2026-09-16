import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { CameraDesk, DurationBars, KitchenMap, StationTimeline, useRestaurantWindow } from '../components'
import { counterSummaries, kitchenEmployeeSummaries, kitchenInWindow } from '../analytics'
import { formatClock, formatDwell } from '../format'
import { videos } from '../data'
import { useRestaurantStore } from '../store'

export function KitchenPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const counterId = params.get('counter') || ''
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const { start, end, label } = useRestaurantWindow()
  const counters = counterSummaries(start, end)
  const employees = kitchenEmployeeSummaries(start, end)
  const selected = counters.find((row) => row.counterId === counterId)
  const dwells = kitchenInWindow(start, end, { counterId: counterId || undefined })
  const timelineCounters = counterId ? counters.filter((row) => row.counterId === counterId) : counters
  const movementStations = new Set(['ctr-pass', 'ctr-pastry', 'ctr-cold'])
  const video = videos.find((item) => item.videoId === (movementStations.has(counterId) ? 'vid-kitchen-movement' : 'vid-kitchen-activity'))
  const activeEmployees = employees.filter((row) => row.visitCount)
  return (
    <>
      <div className="rdi-kpis" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
        <Card className="rdi-kpi"><span>Active employees</span><strong>{activeEmployees.length}</strong></Card>
        <Card className="rdi-kpi"><span>Stations with activity</span><strong>{counters.filter((row) => row.visitCount).length}</strong></Card>
        <Card className="rdi-kpi"><span>Total station dwell</span><strong>{formatDwell(counters.reduce((sum, row) => sum + row.dwellMs, 0))}</strong></Card>
        <Card className="rdi-kpi"><span>Station visits</span><strong>{counters.reduce((sum, row) => sum + row.visitCount, 0)}</strong></Card>
      </div>
      <CameraDesk
        video={video}
        label={selected ? `${selected.name} · Kitchen camera` : 'Kitchen 01'}
        title={selected ? selected.name : 'Kitchen live'}
        detail="Filter a station on the left. Zone polygons and tracked staff appear when Polygons is on."
      >
        <div className="ss-cam-desk-filters">
          <button type="button" className={!counterId ? 'is-on' : ''} onClick={() => setParams({})}>All stations</button>
          {counters.map((row) => (
            <button
              key={row.counterId}
              type="button"
              className={counterId === row.counterId ? 'is-on' : ''}
              onClick={() => setParams({ counter: row.counterId })}
            >
              {row.name}
            </button>
          ))}
        </div>
      </CameraDesk>
      <div className="rdi-split" style={{ marginTop: 16 }}>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>KITCHEN STATIONS</SectionLabel>
            <h3>Station activity</h3>
            <p>Each card is one kitchen counter. Select a station to filter the live camera and events below.</p>
          </header>
          <KitchenMap counters={counters} activeId={counterId} onSelect={(counter) => setParams({ counter: counter.counterId })} />
        </Card>
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>UTILISATION</SectionLabel>
            <h3>Dwell by station</h3>
            <p>Total time staff spent at each counter in the selected window.</p>
          </header>
          <DurationBars rows={counters.map((row) => ({ id: row.counterId, label: row.name, dwellMs: row.dwellMs }))} />
        </Card>
      </div>
      <Card className="ss-panel-card" style={{ marginTop: 16 }}>
        <header className="ss-section-head">
          <SectionLabel>EMPLOYEES</SectionLabel>
          <h3>Kitchen staff</h3>
          <p>Face-recognised employees with station dwell in this period.</p>
        </header>
        <div className="ss-stack-list ss-stack-grid">
          {activeEmployees.map((person) => (
            <button key={person.personId} type="button" className="ss-stack-item" onClick={() => navigate(`/restaurant/kitchen/${person.personId}`)}>
              <strong>{person.name}</strong>
              <span>{formatDwell(person.dwellMs)} total · {person.visitCount} station visits · last {person.lastActivity ? formatClock(person.lastActivity.endAt) : '—'}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card className="ss-panel-card" style={{ marginTop: 16 }}>
        <header className="ss-section-head">
          <SectionLabel>{selected ? `${selected.name.toUpperCase()} TIMELINE` : 'PARTICIPANT TIMELINE'}</SectionLabel>
          <h3>{selected ? `Who was at ${selected.name}` : 'Who was on camera at each station'}</h3>
          <p>
            {selected
              ? `Presence bars for ${selected.name} during ${label}. Click a segment to open that person's video evidence.`
              : `One lane per recognised employee for ${label}. Click a segment to open the matching video evidence in the side drawer.`}
          </p>
        </header>
        <StationTimeline
          dwells={dwells}
          counters={timelineCounters}
          windowStart={start}
          windowEnd={end}
          onSelect={selectEvent}
          selectedId={selectedEventId}
        />
      </Card>
    </>
  )
}
