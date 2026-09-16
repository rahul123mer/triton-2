import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserCheck } from 'lucide-react'
import { Card, SectionLabel } from '../../components/ui'
import { DurationBars, EmptyFilter, useRestaurantRanges } from '../components'
import { ATTENTION_THRESHOLDS, kitchenPerformance, regionSummaries, restaurantSummary, serverPerformance, sessionRecords, tablePerformance } from '../analytics'
import { formatClock, formatDateChip, formatDwell, formatPercent } from '../format'
import { lookup } from '../data'
import { AttentionPill, Avatar, DwellCell, Footnote, PersonCell, RankBadge, RankTable, StatGrid, SubNav } from '../widgets'
import { useConfigStore } from '../configStore'
import { useRestaurantStore } from '../store'
import { ResolveModal } from './CohortPage'

const ATTENTION_NOTE = 'Attention score = table visits ÷ (occupied table minutes ÷ 15). A visit only counts while the table is occupied; visits to empty tables are excluded.'

export function AnalyticsPage({ view = 'restaurant' }) {
  const unresolved = useConfigStore((s) => s.unresolved)
  const items = [
    { label: 'Restaurant', to: '/restaurant/analytics', end: true },
    { label: 'Tables', to: '/restaurant/analytics/tables' },
    { label: 'Servers', to: '/restaurant/analytics/servers', count: unresolved.filter((row) => row.role === 'waiter').length || null },
    { label: 'Kitchen', to: '/restaurant/analytics/kitchen' },
  ]
  return (
    <div className="ss-analytics">
      <SubNav items={items} />
      {view === 'restaurant' ? <RestaurantView /> : null}
      {view === 'tables' ? <TablesView /> : null}
      {view === 'servers' ? <ServersView /> : null}
      {view === 'kitchen' ? <KitchenView /> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------

function RestaurantView() {
  const navigate = useNavigate()
  const { ranges, periodLabel, isRange } = useRestaurantRanges()
  const summary = useMemo(() => restaurantSummary(ranges), [ranges])
  const tables = useMemo(() => tablePerformance(ranges).filter((row) => row.sessionCount > 0), [ranges])
  const regions = useMemo(() => regionSummaries(ranges), [ranges])
  const maxOcc = Math.max(1, ...tables.map((row) => row.occupancyMs))
  const activeServers = summary.servers.filter((row) => row.visitCount > 0)
  const byDay = useMemo(() => ranges.map((range) => {
    const day = restaurantSummary([range])
    return { date: range.date, ...day }
  }), [ranges])

  return (
    <>
      <StatGrid
        columns={6}
        items={[
          { label: 'Sessions', value: summary.sessions, hint: `${summary.tablesUsed}/${summary.totalTables} tables used` },
          { label: 'Covers', value: summary.covers, hint: isRange ? `${summary.days} service days` : periodLabel.split(' · ').slice(1).join(' · ') },
          { label: 'Occupied time', value: formatDwell(summary.occupancyMs), hint: `${formatDwell(summary.averageSessionMs)} avg per session` },
          { label: 'Server visits', value: summary.visitCount, hint: `${activeServers.length} servers active` },
          { label: 'Attention score', value: summary.attention.toFixed(2), hint: summary.band.label, tone: summary.band.tone },
          { label: 'Kitchen station time', value: formatDwell(summary.kitchenDwellMs), hint: `${summary.activeKitchen} cooks observed` },
        ]}
      />

      {isRange ? (
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>BY DAY</SectionLabel>
            <h3>Period breakdown</h3>
            <p>One row per service day in the selected period, same time window each day.</p>
          </header>
          <RankTable
            rows={byDay}
            rowKey={(row) => row.date}
            defaultSort={null}
            columns={[
              { key: 'date', label: 'Day', sortValue: (row) => row.date, render: (row) => formatDateChip(row.date) },
              { key: 'sessions', label: 'Sessions', align: 'right' },
              { key: 'covers', label: 'Covers', align: 'right' },
              { key: 'occupancyMs', label: 'Occupied time', align: 'right', render: (row) => formatDwell(row.occupancyMs) },
              { key: 'visitCount', label: 'Visits', align: 'right' },
              { key: 'attention', label: 'Attention', align: 'right', render: (row) => <AttentionPill score={row.attention} compact /> },
            ]}
          />
        </Card>
      ) : null}

      <div className="rdi-split equal">
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>TABLES</SectionLabel>
            <h3>Occupancy by table</h3>
            <p>Total occupied time and coverage. Click a table for its session records.</p>
          </header>
          <RankTable
            rows={tables}
            rowKey={(row) => row.tableId}
            onRowClick={(row) => navigate(`/restaurant/analytics/tables/${row.tableId}`)}
            defaultSort="occupancyMs"
            columns={[
              { key: 'code', label: 'Table', sortValue: (row) => row.code, render: (row) => <strong>{row.code}</strong> },
              { key: 'sessionCount', label: 'Sessions', align: 'right' },
              { key: 'covers', label: 'Covers', align: 'right' },
              { key: 'occupancyMs', label: 'Occupied', align: 'right', render: (row) => <DwellCell ms={row.occupancyMs} max={maxOcc} /> },
              { key: 'visitCount', label: 'Visits', align: 'right' },
              { key: 'attention', label: 'Attention', align: 'right', render: (row) => <AttentionPill score={row.attention} compact /> },
            ]}
            footnote={ATTENTION_NOTE}
          />
        </Card>
        <div className="ss-stack">
          <Card className="ss-panel-card">
            <header className="ss-section-head">
              <SectionLabel>SERVERS</SectionLabel>
              <h3>Top servers</h3>
              <p>Ranked by attention score.</p>
            </header>
            <RankTable
              rows={activeServers.slice(0, 5)}
              rowKey={(row) => row.personId}
              onRowClick={(row) => navigate(`/restaurant/analytics/servers/${row.personId}`)}
              columns={[
                { key: 'rank', label: '#', width: 36, render: (row) => <RankBadge rank={row.rank} /> },
                { key: 'name', label: 'Server', sortValue: (row) => row.name, render: (row) => <PersonCell person={row} size={28} /> },
                { key: 'visitCount', label: 'Visits', align: 'right' },
                { key: 'attention', label: 'Attention', align: 'right', render: (row) => <AttentionPill score={row.attention} compact /> },
              ]}
            />
          </Card>
          <Card className="ss-panel-card">
            <header className="ss-section-head">
              <SectionLabel>KITCHEN</SectionLabel>
              <h3>Region time</h3>
              <p>Station time rolled up into the two kitchen regions.</p>
            </header>
            <DurationBars rows={regions.map((region) => ({ id: region.regionId, label: region.name, dwellMs: region.dwellMs }))} />
          </Card>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------

function TablesView() {
  const navigate = useNavigate()
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const { ranges, isRange } = useRestaurantRanges()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const records = useMemo(() => sessionRecords(ranges), [ranges])
  const filtered = useMemo(() => records.filter((record) => {
    if (filter === 'under' && !(record.visitCount > 0 && record.attention < ATTENTION_THRESHOLDS.steady)) return false
    if (filter === 'none' && record.visitCount !== 0) return false
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      return record.table.code.toLowerCase().includes(q) || record.servers.some((server) => server.person?.name.toLowerCase().includes(q))
    }
    return true
  }), [records, filter, query])
  const maxDur = Math.max(1, ...records.map((row) => row.durationMs))

  return (
    <>
      <div className="list-toolbar ss-analytics-toolbar">
        <div className="lib-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Table or server…" aria-label="Search sessions" /></div>
        <div className="note-tabs">
          {[['all', 'All sessions'], ['under', 'Under-served'], ['none', 'No visit']].map(([key, label]) => (
            <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        <span className="list-count">{filtered.length} of {records.length} sessions</span>
      </div>
      <Card className="ss-panel-card">
        <header className="ss-section-head">
          <SectionLabel>OCCUPANCY SESSIONS</SectionLabel>
          <h3>One record per seating</h3>
          <p>A table seated twice appears twice, each with its own duration, servers and visit count. Click the time to open video evidence, or the table for its history.</p>
        </header>
        <RankTable
          rows={filtered}
          rowKey={(row) => row.eventId}
          defaultSort={null}
          columns={[
            ...(isRange ? [{ key: 'date', label: 'Day', sortValue: (row) => row.date, render: (row) => formatDateChip(row.date) }] : []),
            { key: 'code', label: 'Table', sortValue: (row) => row.table.code, render: (row) => <button type="button" className="ss-cell-link" onClick={() => navigate(`/restaurant/analytics/tables/${row.tableId}`)}>{row.table.code}</button> },
            { key: 'startAt', label: 'Occupied', sortValue: (row) => row.startAt, render: (row) => <button type="button" className="ss-cell-link mono" onClick={() => selectEvent(row.eventId)}>{formatClock(row.startAt)} – {formatClock(row.endAt)}</button> },
            { key: 'durationMs', label: 'Duration', align: 'right', render: (row) => <DwellCell ms={row.durationMs} max={maxDur} /> },
            { key: 'guestCount', label: 'Guests', align: 'right' },
            { key: 'servers', label: 'Servers', sortable: false, render: (row) => <ServerStack servers={row.servers} /> },
            { key: 'visitCount', label: 'Visits', align: 'right' },
            { key: 'gapMs', label: 'Avg gap', align: 'right', render: (row) => (row.visitCount ? formatDwell(row.gapMs) : '—') },
            { key: 'attention', label: 'Attention', align: 'right', render: (row) => <AttentionPill score={row.attention} compact /> },
          ]}
          footnote={`${ATTENTION_NOTE} Avg gap is the mean time between visits inside the session.`}
          empty={{ title: 'No occupancy sessions', detail: 'Nothing was seated in this window, or the filter removed every session.' }}
        />
      </Card>
    </>
  )
}

function ServerStack({ servers }) {
  if (!servers.length) return <span className="ss-muted">No server visit</span>
  return (
    <span className="ss-server-stack">
      {servers.map((server) => (
        <span key={server.personId} className="ss-server-stack-item" title={`${server.person?.name} · ${server.visits} visit${server.visits === 1 ? '' : 's'} · ${formatDwell(server.dwellMs)}`}>
          <Avatar person={server.person} size={22} />
          <span>{server.person?.name.split(' ')[0]} <em>×{server.visits}</em></span>
        </span>
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------

function ServersView() {
  const navigate = useNavigate()
  const { ranges } = useRestaurantRanges()
  const unresolvedAll = useConfigStore((s) => s.unresolved)
  const unresolved = useMemo(() => unresolvedAll.filter((row) => row.role === 'waiter'), [unresolvedAll])
  const [resolving, setResolving] = useState(null)
  const rows = useMemo(() => serverPerformance(ranges), [ranges])
  const active = rows.filter((row) => row.visitCount > 0)
  const idle = rows.filter((row) => row.visitCount === 0)
  const maxVisits = Math.max(1, ...active.map((row) => row.visitCount))

  return (
    <>
      <Card className="ss-panel-card">
        <header className="ss-section-head">
          <SectionLabel>SERVING STAFF</SectionLabel>
          <h3>Performance comparison</h3>
          <p>Ranked by attention score. Click a row to see the tables, sessions and video behind the number.</p>
        </header>
        <RankTable
          rows={active}
          rowKey={(row) => row.personId}
          onRowClick={(row) => navigate(`/restaurant/analytics/servers/${row.personId}`)}
          defaultSort="attention"
          columns={[
            { key: 'rank', label: '#', width: 40, render: (row) => <RankBadge rank={row.rank} /> },
            { key: 'name', label: 'Server', sortValue: (row) => row.name, render: (row) => <PersonCell person={row} meta={row.employeeCode} /> },
            { key: 'tablesServed', label: 'Tables served', align: 'right' },
            { key: 'sessionsCovered', label: 'Sessions', align: 'right' },
            { key: 'occupancyMs', label: 'Occupied time covered', align: 'right', render: (row) => formatDwell(row.occupancyMs) },
            { key: 'visitCount', label: 'Table visits', align: 'right', render: (row) => <DwellCellCount value={row.visitCount} max={maxVisits} /> },
            { key: 'averageVisitMs', label: 'Avg visit', align: 'right', render: (row) => formatDwell(row.averageVisitMs) },
            { key: 'dwellMs', label: 'Time at tables', align: 'right', render: (row) => formatDwell(row.dwellMs) },
            { key: 'attention', label: 'Attention score *', align: 'right', render: (row) => <AttentionPill score={row.attention} /> },
          ]}
          footnote={`* ${ATTENTION_NOTE}`}
          empty={{ title: 'No server activity during occupancy', detail: 'No enrolled server visited an occupied table in this window.' }}
        />
        {idle.length ? (
          <div className="ss-idle-row">
            <span>Enrolled but not observed at an occupied table:</span>
            {idle.map((row) => <span key={row.personId} className="ss-idle-chip"><Avatar person={row} size={20} />{row.name}</span>)}
          </div>
        ) : null}
      </Card>

      <Card className="ss-panel-card">
        <header className="ss-section-head ss-section-head-row">
          <div>
            <SectionLabel>UNRESOLVED</SectionLabel>
            <h3>Faces not in the serving cohort</h3>
            <p>Detections that served tables but did not match an enrolled server. Resolve them so their visits count.</p>
          </div>
          <span className="list-count">{unresolved.length} pending</span>
        </header>
        {unresolved.length === 0 ? <EmptyFilter title="Everyone on the floor is recognised" detail="New unmatched faces will appear here after the next upload is processed." /> : (
          <div className="ss-unresolved-grid">
            {unresolved.map((row) => (
              <div key={row.unresolvedId} className="ss-unresolved-card">
                <Avatar person={{ personId: row.unresolvedId, name: '?', avatar: row.sample }} size={56} />
                <div className="ss-unresolved-copy">
                  <strong>Unresolved server · {lookup.camera[row.cameraId]?.name}</strong>
                  <span>{row.occurrences} detections · {formatClock(`${ranges[0].date}T${row.firstSeen}+05:30`)} – {formatClock(`${ranges[0].date}T${row.lastSeen}+05:30`)}</span>
                  <span>{row.tableIds?.map((id) => lookup.table[id]?.code).join(', ')} · best match {lookup.person[row.bestMatch.personId]?.name} {formatPercent(row.bestMatch.similarity)}</span>
                </div>
                <button type="button" className="button secondary" onClick={() => setResolving(row)}><UserCheck size={14} /> Resolve face</button>
              </div>
            ))}
          </div>
        )}
      </Card>
      {resolving ? <ResolveModal row={resolving} onClose={() => setResolving(null)} /> : null}
    </>
  )
}

function DwellCellCount({ value, max }) {
  return (
    <span className="ss-dwell-cell">
      <span className="ss-minibar" aria-hidden="true"><i style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></span>
      <span>{value}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------

function KitchenView() {
  const navigate = useNavigate()
  const { ranges } = useRestaurantRanges()
  const rows = useMemo(() => kitchenPerformance(ranges), [ranges])
  const regions = useMemo(() => regionSummaries(ranges), [ranges])
  const active = rows.filter((row) => row.dwellMs > 0)
  const maxDwell = Math.max(1, ...active.map((row) => row.dwellMs))
  const regionCols = regions.map((region) => ({
    key: region.regionId,
    label: region.name,
    align: 'right',
    sortValue: (row) => row.regions.find((item) => item.regionId === region.regionId)?.dwellMs || 0,
    render: (row) => {
      const ms = row.regions.find((item) => item.regionId === region.regionId)?.dwellMs || 0
      return ms ? formatDwell(ms) : <span className="ss-muted">—</span>
    },
  }))

  return (
    <>
      <div className="ss-region-strip ss-region-strip-top">
        {regions.map((region) => (
          <Card key={region.regionId} className="ss-region-card">
            <SectionLabel>{lookup.camera[region.cameraId]?.name}</SectionLabel>
            <h3>{region.name}</h3>
            <p>{region.description}</p>
            <div className="ss-region-numbers">
              <div><span>Station time</span><strong>{formatDwell(region.dwellMs)}</strong></div>
              <div><span>Staff</span><strong>{region.staffCount}</strong></div>
              <div><span>Visits</span><strong>{region.visits}</strong></div>
            </div>
            <DurationBars rows={region.stations.map((station) => ({ id: station.counterId, label: station.name, dwellMs: station.dwellMs }))} />
          </Card>
        ))}
      </div>
      <Card className="ss-panel-card">
        <header className="ss-section-head">
          <SectionLabel>KITCHEN STAFF</SectionLabel>
          <h3>Station time by employee</h3>
          <p>Time an enrolled cook spent inside a station polygon. Click a row for the per-station timeline and video.</p>
        </header>
        <RankTable
          rows={active}
          rowKey={(row) => row.personId}
          onRowClick={(row) => navigate(`/restaurant/analytics/kitchen/${row.personId}`)}
          defaultSort="dwellMs"
          columns={[
            { key: 'rank', label: '#', width: 40, render: (row) => <RankBadge rank={row.rank} /> },
            { key: 'name', label: 'Employee', sortValue: (row) => row.name, render: (row) => <PersonCell person={row} meta={`${row.title || 'Cook'} · ${row.employeeCode}`} /> },
            { key: 'primary', label: 'Primary region', sortValue: (row) => row.primaryRegion?.name || '', render: (row) => row.primaryRegion?.name || '—' },
            ...regionCols,
            { key: 'visitCount', label: 'Station visits', align: 'right' },
            { key: 'averageMs', label: 'Avg stay', align: 'right', render: (row) => formatDwell(row.averageMs) },
            { key: 'utilisation', label: 'Share of window', align: 'right', render: (row) => formatPercent(row.utilisation) },
            { key: 'dwellMs', label: 'Total station time', align: 'right', render: (row) => <DwellCell ms={row.dwellMs} max={maxDwell} /> },
          ]}
          footnote="A cook inside a station polygon is counted as working that station. Cleaning and dish-level activity are not inferred in this pass."
          empty={{ title: 'No kitchen presence', detail: 'No enrolled cook was observed in this window.' }}
        />
      </Card>
      <Footnote>Regions map to cameras: Kitchen 01 covers Food prep / cooking, Kitchen 02 covers Final food assembly. Rename or redraw polygons under Settings → Polygons.</Footnote>
    </>
  )
}
