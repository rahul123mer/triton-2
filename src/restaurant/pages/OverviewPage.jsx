import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, PlayCircle, X } from 'lucide-react'
import { Button, Card, SectionLabel } from '../../components/ui'
import { ChartCard, TableActivityChart, VideoEvidence, useRestaurantRanges, useRestaurantWindow } from '../components'
import { insightsFor, kpis, regionSummaries, resolveEvent, restaurantSummary } from '../analytics'
import { formatClock, formatDwell } from '../format'
import { AttentionPill, Avatar, DwellCell, PersonCell, RankBadge, RankTable, StatGrid } from '../widgets'
import { useConfigStore } from '../configStore'
import { useRestaurantStore } from '../store'

const quickLinks = [
  { label: 'Server performance', to: '/restaurant/analytics/servers' },
  { label: 'Table sessions', to: '/restaurant/analytics/tables' },
  { label: 'Kitchen live feed', to: '/restaurant/live/kitchen' },
  { label: 'Resolve unknown faces', to: '/restaurant/cohorts/serving' },
]

export function RestaurantOverviewPage() {
  const navigate = useNavigate()
  const selectEvent = useRestaurantStore((s) => s.selectEvent)
  const { ranges, periodLabel, isRange } = useRestaurantRanges()
  const { start, end } = useRestaurantWindow()
  const unresolvedCount = useConfigStore((s) => s.unresolved.length)
  const summary = useMemo(() => restaurantSummary(ranges), [ranges])
  const regions = useMemo(() => regionSummaries(ranges), [ranges])
  const snapshot = useMemo(() => kpis(start, end), [start, end])
  const findings = useMemo(() => insightsFor(start, end), [start, end])
  const topServers = summary.servers.filter((row) => row.visitCount > 0).slice(0, 5)
  const topKitchen = summary.kitchen.filter((row) => row.dwellMs > 0).slice(0, 4)
  const maxServerVisits = Math.max(1, ...topServers.map((row) => row.visitCount))
  const maxKitchen = Math.max(1, ...topKitchen.map((row) => row.dwellMs))
  const lead = topServers[0] || null
  const [spotlightOpen, setSpotlightOpen] = useState(false)

  return (
    <div className="ss-overview">
      <StatGrid
        columns={6}
        items={[
          { label: 'Occupancy sessions', value: summary.sessions, hint: `${summary.tablesUsed} of ${summary.totalTables} tables used` },
          { label: 'Covers', value: summary.covers, hint: isRange ? `${summary.days} days` : 'Guests seated in window' },
          { label: 'Avg occupancy', value: formatDwell(summary.averageSessionMs), hint: 'Per session' },
          { label: 'Server visits', value: summary.visitCount, hint: 'Only while tables were occupied' },
          { label: 'Attention score', value: summary.attention.toFixed(2), hint: `${summary.band.label} · visits per 15 min occupied`, tone: summary.band.tone },
          { label: 'Needs attention', value: summary.underServed + summary.unvisited, hint: `${summary.unvisited} sessions with no visit`, tone: summary.underServed + summary.unvisited ? 'warn' : undefined },
        ]}
      />

      {lead ? (
        <button type="button" className="ss-spotlight" onClick={() => setSpotlightOpen(true)}>
          <Avatar person={lead} size={44} />
          <div className="ss-spotlight-copy">
            <strong>{lead.name} leads the floor</strong>
            <span>
              {lead.visitCount} visits across {lead.tablesServed} tables while they were occupied · attention {lead.attention.toFixed(2)} · {lead.visitsOutsideOccupancy === 1 ? '1 visit' : `${lead.visitsOutsideOccupancy} visits`} to empty tables excluded
            </span>
          </div>
          <span className="ss-spotlight-cta"><PlayCircle size={18} /> View evidence</span>
        </button>
      ) : null}

      {spotlightOpen && lead ? (
        <SpotlightEvidence
          server={lead}
          onClose={() => setSpotlightOpen(false)}
          onOpenServer={() => { setSpotlightOpen(false); navigate(`/restaurant/analytics/servers/${lead.personId}`) }}
          onOpenEvent={(eventId) => { setSpotlightOpen(false); selectEvent(eventId) }}
        />
      ) : null}

      <div className="ss-overview-grid">
        <Card className="ss-panel-card">
          <header className="ss-section-head ss-section-head-row">
            <div>
              <SectionLabel>SERVING STAFF</SectionLabel>
              <h3>Server ranking</h3>
              <p>Attention score = visits ÷ (occupied minutes ÷ 15). {periodLabel}.</p>
            </div>
            <button type="button" className="ss-link-btn" onClick={() => navigate('/restaurant/analytics/servers')}>Full table <ArrowUpRight size={14} /></button>
          </header>
          <RankTable
            rows={topServers}
            rowKey={(row) => row.personId}
            onRowClick={(row) => navigate(`/restaurant/analytics/servers/${row.personId}`)}
            columns={[
              { key: 'rank', label: '#', width: 40, render: (row) => <RankBadge rank={row.rank} /> },
              { key: 'name', label: 'Server', sortValue: (row) => row.name, render: (row) => <PersonCell person={row} meta={row.employeeCode} /> },
              { key: 'tablesServed', label: 'Tables', align: 'right' },
              { key: 'visitCount', label: 'Visits', align: 'right', render: (row) => <DwellCellCount value={row.visitCount} max={maxServerVisits} /> },
              { key: 'occupancyMs', label: 'Occupied time covered', align: 'right', render: (row) => formatDwell(row.occupancyMs) },
              { key: 'attention', label: 'Attention', align: 'right', render: (row) => <AttentionPill score={row.attention} /> },
            ]}
            empty={{ title: 'No server visits during occupancy', detail: 'Widen the window or pick a service period.' }}
          />
        </Card>

        <Card className="ss-panel-card">
          <header className="ss-section-head ss-section-head-row">
            <div>
              <SectionLabel>KITCHEN STAFF</SectionLabel>
              <h3>Station time</h3>
              <p>Presence inside a station polygon. No activity classification.</p>
            </div>
            <button type="button" className="ss-link-btn" onClick={() => navigate('/restaurant/analytics/kitchen')}>Full table <ArrowUpRight size={14} /></button>
          </header>
          <RankTable
            rows={topKitchen}
            rowKey={(row) => row.personId}
            onRowClick={(row) => navigate(`/restaurant/analytics/kitchen/${row.personId}`)}
            columns={[
              { key: 'rank', label: '#', width: 40, render: (row) => <RankBadge rank={row.rank} /> },
              { key: 'name', label: 'Employee', sortValue: (row) => row.name, render: (row) => <PersonCell person={row} meta={row.title || row.employeeCode} /> },
              { key: 'primary', label: 'Primary region', sortValue: (row) => row.primaryRegion?.name || '', render: (row) => row.primaryRegion?.name || '—' },
              { key: 'dwellMs', label: 'Station time', align: 'right', render: (row) => <DwellCell ms={row.dwellMs} max={maxKitchen} /> },
            ]}
            empty={{ title: 'No kitchen presence', detail: 'No enrolled cook was inside a station polygon in this window.' }}
          />
          <div className="ss-region-strip">
            {regions.map((region) => (
              <div key={region.regionId} className="ss-region-tile">
                <span>{region.name}</span>
                <strong>{formatDwell(region.dwellMs)}</strong>
                <em>{region.staffCount} staff · {region.visits} station visits</em>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="ss-overview-grid ss-overview-grid-wide">
        <ChartCard
          className="ss-chart-card"
          title="Table activity"
          detail="Occupancy dwell and server visits by table for the first day of the period. Click a column for the session records."
        >
          <TableActivityChart
            tables={snapshot.tableRows}
            onSelect={(table) => navigate(`/restaurant/analytics/tables/${table.tableId}`)}
          />
        </ChartCard>

        <div className="ss-overview-side">
          <Card className="ss-panel-card">
            <header className="ss-section-head">
              <SectionLabel>KEY FINDINGS</SectionLabel>
              <h3>Operational reads</h3>
            </header>
            <div className="ss-finding-list">
              {findings.slice(0, 4).map((finding) => (
                <button
                  key={finding.insightId}
                  type="button"
                  className="ss-finding-row"
                  onClick={() => { if (finding.eventIds[0]) selectEvent(finding.eventIds[0]); else navigate(finding.href) }}
                >
                  <span>{finding.text}</span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </Card>
          <Card className="ss-panel-card">
            <header className="ss-section-head">
              <SectionLabel>QUICK LINKS</SectionLabel>
              <h3>Go to</h3>
            </header>
            <div className="ss-quick-list">
              {quickLinks.map((action) => (
                <button key={action.to} type="button" className="ss-quick-item" onClick={() => navigate(action.to)}>
                  <span>{action.label}{action.to.includes('cohorts') && unresolvedCount ? <em className="ss-count-dot">{unresolvedCount}</em> : null}</span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SpotlightEvidence({ server, onClose, onOpenServer, onOpenEvent }) {
  const visits = useMemo(() => (
    server.sessions
      .flatMap((session) => session.visits
        .filter((visit) => visit.personId === server.personId)
        .map((visit) => ({
          ...visit,
          table: session.table,
          date: session.date,
          sessionStart: session.startAt,
          sessionEnd: session.endAt,
        })))
      .sort((a, b) => a.startAt.localeCompare(b.startAt) || a.eventId.localeCompare(b.eventId))
  ), [server])
  const [activeId, setActiveId] = useState(visits[0]?.eventId || null)
  const active = visits.find((visit) => visit.eventId === activeId) || visits[0] || null
  const detail = active ? resolveEvent(active.eventId, active.date) : null

  return (
    <div className="ss-evidence-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="ss-evidence-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotlight-evidence-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ss-evidence-head">
          <div className="ss-evidence-identity">
            <Avatar person={server} size={48} />
            <div>
              <SectionLabel blue>FLOOR LEAD · EVIDENCE</SectionLabel>
              <h2 id="spotlight-evidence-title">{server.name} leads the floor</h2>
              <p>
                {server.visitCount} visits across {server.tablesServed} tables while occupied · attention {server.attention.toFixed(2)} ({server.band.label}) · {server.visitsOutsideOccupancy === 1 ? '1 empty-table visit' : `${server.visitsOutsideOccupancy} empty-table visits`} excluded
              </p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close evidence"><X size={18} /></button>
        </header>

        <div className="ss-evidence-body">
          <div className="ss-evidence-video">
            {detail ? (
              <>
                <VideoEvidence video={detail.video} event={detail} />
                <div className="ss-evidence-caption">
                  <strong>{detail.table?.code || 'Table'} · {formatClock(detail.startAt)} – {formatClock(detail.endAt)}</strong>
                  <span>{detail.camera?.name || detail.video?.title} · {formatDwell(detail.durationMs)} · confidence {detail.confidence != null ? `${Math.round(detail.confidence * 100)}%` : '—'}</span>
                </div>
              </>
            ) : (
              <div className="rdi-video-missing">No visit evidence for this server in the selected window.</div>
            )}
          </div>

          <div className="ss-evidence-list">
            <header>
              <SectionLabel>VISITS DURING OCCUPANCY</SectionLabel>
              <h3>{visits.length} events</h3>
              <p>Select a visit to load its camera clip. Double-check empty-table visits were excluded from the attention score.</p>
            </header>
            <div className="ss-evidence-rows" role="list">
              {visits.map((visit, index) => {
                const isOn = visit.eventId === (active?.eventId)
                return (
                  <button
                    key={visit.eventId}
                    type="button"
                    role="listitem"
                    className={`ss-evidence-row${isOn ? ' is-on' : ''}`}
                    onClick={() => setActiveId(visit.eventId)}
                  >
                    <em>{String(index + 1).padStart(2, '0')}</em>
                    <span>
                      <strong>{visit.table?.code || 'Table'}</strong>
                      <small>{formatClock(visit.startAt)} – {formatClock(visit.endAt)} · {formatDwell(visit.durationMs)}</small>
                    </span>
                    <kbd>{visit.confidence != null ? `${Math.round(visit.confidence * 100)}%` : '—'}</kbd>
                  </button>
                )
              })}
            </div>
            <div className="ss-evidence-actions">
              {active ? (
                <Button variant="secondary" onClick={() => onOpenEvent(active.eventId)}>Open full event drawer</Button>
              ) : null}
              <Button onClick={onOpenServer}>Open {server.name.split(' ')[0]}&apos;s page</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
