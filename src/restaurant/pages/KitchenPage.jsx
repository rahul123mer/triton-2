import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { DurationBars, EmptyFilter, KitchenMap, LiveCamera, useRestaurantWindow } from '../components'
import { counterSummaries, kitchenEmployeeSummaries, kitchenInWindow } from '../analytics'
import { formatClock, formatDwell } from '../format'
import { lookup, videos } from '../data'
import { useRestaurantStore } from '../store'

export function KitchenPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const counterId = params.get('counter') || ''
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const { start, end } = useRestaurantWindow()
  const counters = counterSummaries(start, end)
  const employees = kitchenEmployeeSummaries(start, end)
  const selected = counters.find((row) => row.counterId === counterId)
  const dwells = kitchenInWindow(start, end, { counterId: counterId || undefined })
  return (
    <>
      <div className="rdi-kpis" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
        <Card className="rdi-kpi"><span>Active employees</span><strong>{employees.filter((row) => row.visitCount).length}</strong></Card>
        <Card className="rdi-kpi"><span>Stations with activity</span><strong>{counters.filter((row) => row.visitCount).length}</strong></Card>
        <Card className="rdi-kpi"><span>Total station dwell</span><strong>{formatDwell(counters.reduce((sum, row) => sum + row.dwellMs, 0))}</strong></Card>
        <Card className="rdi-kpi"><span>Station visits</span><strong>{counters.reduce((sum, row) => sum + row.visitCount, 0)}</strong></Card>
      </div>
      <Card className="rdi-live-card">
        <SectionLabel>KITCHEN CAMERA</SectionLabel>
        <LiveCamera video={videos.find((item) => item.videoId === (counterId === 'ctr-pass' || counterId === 'ctr-pastry' || counterId === 'ctr-cold' ? 'vid-kitchen-movement' : 'vid-kitchen-activity'))} label={selected ? `${selected.name} · Kitchen camera` : 'Kitchen 01'} />
      </Card>
      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card>
          <SectionLabel>KITCHEN STATIONS</SectionLabel>
          <KitchenMap counters={counters} activeId={counterId} onSelect={(counter) => setParams({ counter: counter.counterId })} />
        </Card>
        <Card>
          <SectionLabel>UTILISATION</SectionLabel>
          <DurationBars rows={counters.map((row) => ({ id: row.counterId, label: row.name, dwellMs: row.dwellMs }))} />
        </Card>
      </div>
      <div className="rdi-split equal" style={{ marginTop: 14 }}>
        <Card>
          <SectionLabel>EMPLOYEES</SectionLabel>
          {employees.filter((row) => row.visitCount).map((person) => (
            <button key={person.personId} type="button" className="card rdi-insight" style={{ marginBottom: 8 }} onClick={() => navigate(`/restaurant/kitchen/${person.personId}`)}>
              <p><strong>{person.name}</strong></p>
              <p>{formatDwell(person.dwellMs)} total · {person.visitCount} station visits · last {person.lastActivity ? formatClock(person.lastActivity.endAt) : '—'}</p>
            </button>
          ))}
        </Card>
        <Card>
          <SectionLabel>{selected ? `${selected.name.toUpperCase()} EVENTS` : 'STATION EVENTS'}</SectionLabel>
          {dwells.length === 0 ? <EmptyFilter title="No kitchen dwell in this window" detail="Select another station or widen the period." /> : dwells.map((dwell) => (
            <button key={dwell.eventId} type="button" className="card rdi-insight" style={{ marginBottom: 8 }} onClick={() => selectEvent(dwell.eventId)}>
              <p><strong>{lookup.person[dwell.personId].name}</strong> · {lookup.counter[dwell.counterId].name}</p>
              <p>{formatClock(dwell.startAt)} – {formatClock(dwell.endAt)} · {formatDwell(dwell.durationMs)}</p>
            </button>
          ))}
        </Card>
      </div>
    </>
  )
}
