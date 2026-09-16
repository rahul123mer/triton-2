import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, SectionLabel } from '../../components/ui'
import { DurationBars, EmptyFilter, LiveCamera, useRestaurantWindow } from '../components'
import { evaluateRecipe, cookbookStatus } from '../analytics'
import { counters, lookup, recipes, tables, waiters, kitchenStaff } from '../data'
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
  const totalDwell = (result.rows || []).reduce((sum, row) => sum + (row.dwellMs || row.occupancyMs || 0), 0)
  const evidence = result.supportingEvents[0]
  const evidenceVideo = evidence ? lookup.video[evidence.videoId] : null
  return (
    <div className="ss-analysis">
      <div className="list-toolbar ss-analysis-filters">
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

      <Card className="ss-analysis-result">
        <header className="ss-section-head">
          <SectionLabel>Result</SectionLabel>
          <h3>{result.recipe.name}</h3>
          <p>{result.recipe.description}</p>
        </header>
        <p className="ss-analysis-finding">{result.result}</p>
        <div className="ss-analysis-kpis">
          <div><span>Events evaluated</span><strong>{result.eventsEvaluated}</strong></div>
          <div><span>Supporting evidence</span><strong>{result.supportingEvents.length}</strong></div>
          <div><span>Ranked subjects</span><strong>{result.rows?.length || 0}</strong></div>
          <div><span>Total dwell</span><strong>{totalDwell ? formatDwell(totalDwell) : '—'}</strong></div>
        </div>
      </Card>

      <div className="rdi-split equal">
        <Card>
          <header className="ss-section-head">
            <SectionLabel>Aggregation</SectionLabel>
            <h3>Ranked dwell</h3>
            <p>Dwell time for each waiter, table, or station returned by this recipe.</p>
          </header>
          {result.rows?.length
            ? (
              <>
                <DurationBars rows={result.rows.map((row) => ({ id: row.id, label: row.label, dwellMs: row.dwellMs || row.occupancyMs || 0 }))} />
                <table className="rdi-list ss-agg-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Dwell</th>
                      <th>{result.rows[0]?.visits != null ? 'Visits' : result.rows[0]?.sessions != null ? 'Sessions' : 'Count'}</th>
                      <th>{result.rows[0]?.tables != null ? 'Tables' : result.rows[0]?.guests != null ? 'Guests' : result.rows[0]?.employees != null ? 'Staff' : '—'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.label}</td>
                        <td>{formatDwell(row.dwellMs || row.occupancyMs || 0)}</td>
                        <td>{row.visits ?? row.sessions ?? '—'}</td>
                        <td>{row.tables ?? row.guests ?? row.employees ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )
            : <EmptyFilter title="No matching aggregation" detail="The current filter combination does not return dwell-time totals." />}
        </Card>
        <Card className="ss-evidence-card">
          <header className="ss-section-head">
            <SectionLabel>Supporting events</SectionLabel>
            <h3>Evidence stream</h3>
            <p>Each event that contributed to this result. Open one for camera footage and timestamps.</p>
          </header>
          {evidenceVideo ? <LiveCamera video={evidenceVideo} cameraName={lookup.camera[evidence.cameraId]?.name} size="feed" /> : null}
          {result.supportingEvents.length === 0 ? <EmptyFilter title="No supporting events" detail="Widen the window or remove a table, person, or counter filter." /> : (
            <div className="ss-event-list">
              {result.supportingEvents.map((event) => (
                <button key={event.eventId} type="button" className="rdi-insight ss-event-item" onClick={() => selectEvent(event.eventId)}>
                  <strong>{formatClock(event.startAt)} · {event.summary}</strong>
                  <span>{event.durationMs ? formatDwell(event.durationMs) : 'Instant'} · {lookup.table[event.tableId]?.code || lookup.counter[event.counterId]?.name || 'Floor'}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <header className="ss-section-head">
          <SectionLabel>Cookbook recipes</SectionLabel>
          <h3>{cookbook.name}</h3>
          <p>Switch recipe to re-evaluate the same window without leaving analysis.</p>
        </header>
        <div className="ss-recipe-switch">
          {recipes.map((recipe) => (
            <button
              key={recipe.recipeId}
              type="button"
              className={recipe.recipeId === recipeId ? 'active' : ''}
              onClick={() => update('recipe', recipe.recipeId)}
            >
              <strong>{recipe.name}</strong>
              <span>{recipe.description}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
