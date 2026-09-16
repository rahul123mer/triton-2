import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { DurationBars, EmptyFilter, useRestaurantWindow } from '../components'
import { evaluateRecipe, cookbookStatus } from '../analytics'
import { counters, recipes, tables, waiters, kitchenStaff } from '../data'
import { formatClock, formatDwell } from '../format'
import { useRestaurantStore } from '../store'

export function RestaurantAnalysisPage() {
  const [params, setParams] = useSearchParams()
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const { start, end } = useRestaurantWindow()
  const recipeId = params.get('recipe') || 'rcp-waiter-service'
  const tableId = params.get('table') || ''
  const personId = params.get('person') || ''
  const counterId = params.get('counter') || ''
  const cookbook = cookbookStatus(start, end)[0]
  const result = useMemo(
    () => evaluateRecipe(recipeId, start, end, { tableId: tableId || undefined, personId: personId || undefined, counterId: counterId || undefined }),
    [recipeId, start, end, tableId, personId, counterId],
  )
  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }
  return (
    <>
      <div className="list-toolbar">
        <select value={cookbook.cookbookId} aria-label="Cookbook" disabled>
          <option value={cookbook.cookbookId}>{cookbook.name}</option>
        </select>
        <select value={recipeId} onChange={(e) => update('recipe', e.target.value)} aria-label="Recipe">
          {recipes.map((recipe) => <option key={recipe.recipeId} value={recipe.recipeId}>{recipe.name}</option>)}
        </select>
        <select value={tableId} onChange={(e) => update('table', e.target.value)} aria-label="Table">
          <option value="">All tables</option>
          {tables.map((table) => <option key={table.tableId} value={table.tableId}>{table.code}</option>)}
        </select>
        <select value={personId} onChange={(e) => update('person', e.target.value)} aria-label="Person">
          <option value="">All people</option>
          {[...waiters, ...kitchenStaff].map((person) => <option key={person.personId} value={person.personId}>{person.name}</option>)}
        </select>
        <select value={counterId} onChange={(e) => update('counter', e.target.value)} aria-label="Counter">
          <option value="">All counters</option>
          {counters.map((counter) => <option key={counter.counterId} value={counter.counterId}>{counter.name}</option>)}
        </select>
      </div>
      <Card>
        <SectionLabel>RESULT</SectionLabel>
        <h3 style={{ margin: '8px 0' }}>{result.recipe.name}</h3>
        <p>{result.result}</p>
        <div className="rdi-meta">
          <div><span>Events evaluated</span><strong>{result.eventsEvaluated}</strong></div>
          <div><span>Supporting evidence</span><strong>{result.supportingEvents.length}</strong></div>
        </div>
      </Card>
      <div className="rdi-split" style={{ marginTop: 14 }}>
        <Card>
          <SectionLabel>AGGREGATION</SectionLabel>
          {result.rows?.length
            ? <DurationBars rows={result.rows.map((row) => ({ id: row.id, label: row.label, dwellMs: row.dwellMs || row.occupancyMs || 0 }))} />
            : <EmptyFilter title="No matching aggregation" detail="The current filter combination does not return dwell-time totals." />}
        </Card>
        <Card>
          <SectionLabel>SUPPORTING EVENTS</SectionLabel>
          {result.supportingEvents.length === 0 ? <EmptyFilter title="No supporting events" detail="Widen the window or remove a table, person, or counter filter." /> : result.supportingEvents.map((event) => (
            <button key={event.eventId} type="button" className="card rdi-insight" style={{ marginBottom: 8 }} onClick={() => selectEvent(event.eventId)}>
              <p><strong>{formatClock(event.startAt)}</strong> · {event.summary}</p>
              <p>{event.durationMs ? formatDwell(event.durationMs) : 'Instant'} · {event.eventId}</p>
            </button>
          ))}
        </Card>
      </div>
    </>
  )
}
