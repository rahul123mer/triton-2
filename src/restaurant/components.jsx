import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, X } from 'lucide-react'
import { Card, Button, SectionLabel, PageNav } from '../components/ui'
import { addDays, rangeBoundsList, windowBounds } from './analytics'
import { formatClock, formatDateChip, formatDwell, eventTypeLabel, personTypeLabel } from './format'
import { useRestaurantStore } from './store'
import { useConfigStore } from './configStore'
import { Avatar } from './widgets'
import { cameras, lookup, timeWindows, resolveVideoZones, videos } from './data'

export function useRestaurantWindow() {
  const date = useRestaurantStore((s) => s.date)
  const windowId = useRestaurantStore((s) => s.windowId)
  const customStart = useRestaurantStore((s) => s.customStart)
  const customEnd = useRestaurantStore((s) => s.customEnd)
  return useMemo(() => windowBounds(date, windowId, customStart, customEnd), [date, windowId, customStart, customEnd])
}

/** Per-day bounds for the selected date or date range. Analytics uses this. */
export function useRestaurantRanges() {
  const date = useRestaurantStore((s) => s.date)
  const dateEnd = useRestaurantStore((s) => s.dateEnd)
  const windowId = useRestaurantStore((s) => s.windowId)
  const customStart = useRestaurantStore((s) => s.customStart)
  const customEnd = useRestaurantStore((s) => s.customEnd)
  return useMemo(() => {
    const ranges = rangeBoundsList(date, dateEnd, windowId, customStart, customEnd)
    const first = ranges[0]
    const last = ranges[ranges.length - 1]
    const periodLabel = ranges.length > 1
      ? `${formatDateChip(first.date)} – ${formatDateChip(last.date)} · ${ranges.length} days · ${first.label.split(' · ')[0]}`
      : `${formatDateChip(first.date)} · ${first.label}`
    return { ranges, periodLabel, isRange: ranges.length > 1, start: first.start, end: last.end, windowLabel: first.label }
  }, [date, dateEnd, windowId, customStart, customEnd])
}

function useNativePicker() {
  const inputRef = useRef(null)
  const openPicker = (event) => {
    if (event.target.tagName === 'INPUT') return
    const input = inputRef.current
    if (!input) return
    try {
      if (typeof input.showPicker === 'function') input.showPicker()
      else input.click()
    } catch {
      input.click()
    }
  }
  return { inputRef, openPicker }
}

export function DateChip() {
  const date = useRestaurantStore((s) => s.date)
  const dateEnd = useRestaurantStore((s) => s.dateEnd)
  const setDate = useRestaurantStore((s) => s.setDate)
  const setDateEnd = useRestaurantStore((s) => s.setDateEnd)
  const clearRange = useRestaurantStore((s) => s.clearRange)
  const startPicker = useNativePicker()
  const endPicker = useNativePicker()
  return (
    <div className="ss-date-group" role="group" aria-label="Service date or period">
      <label className="ss-date-chip" onClick={startPicker.openPicker}>
        <CalendarDays size={16} />
        <span>{formatDateChip(date)}</span>
        <input
          ref={startPicker.inputRef}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Service date"
        />
      </label>
      {dateEnd ? (
        <>
          <span className="ss-date-to">to</span>
          <label className="ss-date-chip" onClick={endPicker.openPicker}>
            <span>{formatDateChip(dateEnd)}</span>
            <input
              ref={endPicker.inputRef}
              type="date"
              min={date}
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              aria-label="Period end date"
            />
          </label>
          <button type="button" className="ss-date-clear" onClick={clearRange} aria-label="Back to a single day"><X size={13} /></button>
        </>
      ) : (
        <button
          type="button"
          className="ss-date-range-btn"
          onClick={() => setDateEnd(addDays(date, 6))}
        >
          + Period
        </button>
      )}
    </div>
  )
}

export function ChartCard({ title, detail, action, children, className = '' }) {
  return (
    <section className={`card ${className}`.trim()}>
      <header className="ss-card-head">
        <div>
          <h3>{title}</h3>
          {detail ? <p>{detail}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

function axisTime(ms) {
  if (!ms) return '0'
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function occupancyScale(peakMs) {
  const minutes = Math.max(30, Math.ceil((peakMs || 0) / 60000 / 30) * 30)
  return minutes * 60000
}

function scaleTicks(max, count = 4) {
  return Array.from({ length: count + 1 }, (_, index) => (max * index) / count)
}

export function TableActivityChart({ tables, onSelect }) {
  const [hoverId, setHoverId] = useState(null)
  const ordered = [...tables].sort((a, b) => a.code.localeCompare(b.code))
  const occMax = occupancyScale(Math.max(0, ...ordered.map((row) => row.occupancyMs || 0)))
  const visMax = Math.max(4, Math.ceil(Math.max(0, ...ordered.map((row) => row.visitCount || 0)) / 4) * 4)
  const occTicks = scaleTicks(occMax)
  const visTicks = scaleTicks(visMax)
  return (
    <div className="ss-vchart">
      <div className="ss-chart-legend">
        <span><i className="ss-legend-occ" />Occupancy dwell</span>
        <span><i className="ss-legend-vis" />Waiter visits</span>
      </div>
      <div className="ss-vchart-frame">
        <div className="ss-vchart-y ss-vchart-y-left" aria-hidden="true">
          {occTicks.slice().reverse().map((tick) => <span key={`occ-${tick}`}>{axisTime(tick)}</span>)}
        </div>
        <div className="ss-vchart-plot">
          <div className="ss-vchart-canvas" aria-hidden="true">
            {occTicks.slice(1).map((tick) => (
              <i key={`grid-${tick}`} className="ss-vchart-grid" style={{ bottom: `${(tick / occMax) * 100}%` }} />
            ))}
          </div>
          {ordered.map((table, index) => {
            const occH = occMax ? Math.max(0, (table.occupancyMs / occMax) * 100) : 0
            const visH = visMax ? Math.max(0, (table.visitCount / visMax) * 100) : 0
            const edge = index < 2 ? 'start' : index > ordered.length - 3 ? 'end' : 'mid'
            const open = hoverId === table.tableId
            return (
              <button
                key={table.tableId}
                type="button"
                className={`ss-vchart-col edge-${edge} ${table.status}${open ? ' is-open' : ''}`}
                onClick={() => onSelect(table)}
                onPointerEnter={() => setHoverId(table.tableId)}
                onPointerLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(table.tableId)}
                onBlur={() => setHoverId(null)}
                aria-label={`${table.code}, ${table.label}, ${table.occupancyMs ? formatDwell(table.occupancyMs) : 'no occupancy'}, ${table.visitCount} waiter visits, ${table.sessionCount} sessions`}
              >
                <div className="ss-vchart-bars">
                  <span className="ss-vbar occ" style={{ height: `${occH}%` }} />
                  <span className="ss-vbar vis" style={{ height: `${visH}%` }} />
                </div>
                <strong>{table.code}</strong>
                {open ? (
                  <div className="ss-vchart-tip" role="tooltip">
                    <header>
                      <b>{table.code}</b>
                      <em>{table.label}</em>
                    </header>
                    <dl>
                      <div><dt>Occupancy</dt><dd>{table.occupancyMs ? formatDwell(table.occupancyMs) : '—'}</dd></div>
                      <div><dt>Sessions</dt><dd>{table.sessionCount}</dd></div>
                      <div><dt>Guests</dt><dd>{table.guestCount || '—'}</dd></div>
                      <div><dt>Seats</dt><dd>{table.seats}</dd></div>
                      <div><dt>Waiter visits</dt><dd>{table.visitCount}</dd></div>
                      <div><dt>Waiter dwell</dt><dd>{table.waiterDwellMs ? formatDwell(table.waiterDwellMs) : '—'}</dd></div>
                      <div><dt>Camera</dt><dd>{table.camera?.name || '—'}</dd></div>
                    </dl>
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
        <div className="ss-vchart-y ss-vchart-y-right" aria-hidden="true">
          {visTicks.slice().reverse().map((tick) => <span key={`vis-${tick}`}>{tick}</span>)}
        </div>
      </div>
      <div className="ss-vchart-axis-captions">
        <span>Dwell</span>
        <span>Table</span>
        <span>Visits</span>
      </div>
    </div>
  )
}

export function ScatterPlot({ rows, axis }) {
  return (
    <div className="ss-plot" role="img" aria-label="Activity by location">
      {rows.map((row) => (
        <div key={row.label} className="ss-plot-row">
          <span>{row.label}</span>
          <div className="ss-plot-axis">
            {row.points.map((point, index) => (
              <i key={`${row.label}-${index}`} className={`ss-plot-dot ${point.tone || 'red'}`} style={{ left: `${point.x}%` }} />
            ))}
          </div>
        </div>
      ))}
      <div className="ss-plot-labels">
        {axis.map((label) => <span key={label}>{label}</span>)}
      </div>
    </div>
  )
}

export function MetricStack({ items }) {
  return (
    <div className="ss-metrics">
      {items.map((item) => (
        <div key={item.label} className="ss-metric">
          <div className="ss-metric-head">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="ss-metric-track" aria-hidden="true">
            <div className="ss-metric-fill" style={{ width: `${Math.min(100, item.width)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RestaurantFilters() {
  const windowId = useRestaurantStore((s) => s.windowId)
  const customStart = useRestaurantStore((s) => s.customStart)
  const customEnd = useRestaurantStore((s) => s.customEnd)
  const setWindowId = useRestaurantStore((s) => s.setWindowId)
  const setCustomRange = useRestaurantStore((s) => s.setCustomRange)
  const { periodLabel, isRange } = useRestaurantRanges()
  const bounds = { label: periodLabel }
  return (
    <div className="rdi-filters ss-filters-bar">
      <DateChip />
      <div className="rdi-field ss-window-field">
        <span>Time window</span>
        <div className="rdi-window" role="tablist" aria-label="Time window">
          {timeWindows.map((item) => (
            <button
              key={item.windowId}
              type="button"
              role="tab"
              aria-selected={windowId === item.windowId}
              className={windowId === item.windowId ? 'active' : ''}
              onClick={() => setWindowId(item.windowId)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {windowId === 'custom' && (
        <div className="ss-custom-range">
          <label className="rdi-field">
            <span>Start</span>
            <input type="time" value={customStart} onChange={(e) => setCustomRange(e.target.value, customEnd)} aria-label="Custom start time" />
          </label>
          <label className="rdi-field">
            <span>End</span>
            <input type="time" value={customEnd} onChange={(e) => setCustomRange(customStart, e.target.value)} aria-label="Custom end time" />
          </label>
        </div>
      )}
      <div className="ss-filter-summary" aria-live="polite">
        <strong>{bounds.label}</strong>
        <span>{isRange ? 'Analytics aggregate the period; live feeds show the first day' : 'Data updates with this window'}</span>
      </div>
    </div>
  )
}

export function StatusBadge({ status, label }) {
  return <span className={`rdi-status ${status}`}>{label}</span>
}

export function EmptyFilter({ title, detail }) {
  return (
    <div className="rdi-empty">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  )
}

export function KpiStrip({ items }) {
  return (
    <div className="rdi-kpis">
      {items.map((item) => (
        <Card key={item.label} className="rdi-kpi">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.hint ? <em>{item.hint}</em> : null}
        </Card>
      ))}
    </div>
  )
}

export function FloorPlan({ tables, onSelect }) {
  return (
    <div className="rdi-floor" role="img" aria-label="Restaurant floor layout">
      <div className="rdi-floor-legend">
        <span><i style={{ background: 'var(--good)' }} />Occupied</span>
        <span><i style={{ background: 'var(--blue-700)' }} />Reserved</span>
        <span><i style={{ background: 'var(--warning)' }} />Recently cleared</span>
        <span><i style={{ background: 'var(--ink-400)' }} />Available</span>
      </div>
      <div className="rdi-host">Host</div>
      <div className="rdi-pass">Service pass</div>
      {tables.map((table) => (
        <button
          key={table.tableId}
          type="button"
          className={`rdi-table ${table.status}`}
          style={{ left: `${table.x}%`, top: `${table.y}%`, width: `${table.w}%`, height: `${table.h}%` }}
          onClick={() => onSelect(table)}
          aria-label={`${table.code}, ${table.label}, ${table.guestCount || 0} guests`}
        >
          <strong>{table.code}</strong>
          <span>{table.seats} seats</span>
          <span>{table.label}</span>
          {table.occupancyMs > 0 && <span>{formatDwell(table.occupancyMs)}</span>}
        </button>
      ))}
    </div>
  )
}

export function KitchenMap({ counters, activeId, onSelect }) {
  return (
    <div className="ss-station-grid" aria-label="Kitchen stations">
      {counters.map((counter) => (
        <button
          key={counter.counterId}
          type="button"
          className={`ss-station-card${counter.counterId === activeId ? ' is-active' : ''}`}
          onClick={() => onSelect(counter)}
        >
          <strong>{counter.name}</strong>
          <span>{counter.visitCount} visits</span>
          <em>{formatDwell(counter.dwellMs)}</em>
        </button>
      ))}
    </div>
  )
}

const PERSON_SWATCH = {
  'kit-daniel': '#6da7ec',
  'kit-maria': '#34d399',
  'kit-olivia': '#c084fc',
  'kit-james': '#fbbf24',
  'wtr-alex': '#6da7ec',
  'wtr-sofia': '#f472b6',
  'wtr-ethan': '#38bdf8',
  'wtr-danielb': '#a3e635',
}

function timelineTicks(windowStart, windowEnd) {
  const startMs = new Date(windowStart).getTime()
  const endMs = new Date(windowEnd).getTime()
  const span = Math.max(1, endMs - startMs)
  const tickLabel = (ms) => new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(ms))
  return [
    { at: startMs, left: 0, label: tickLabel(startMs) },
    { at: startMs + span / 2, left: 50, label: tickLabel(startMs + span / 2) },
    { at: endMs, left: 100, label: tickLabel(endMs) },
  ]
}

function segmentStyle(startAt, endAt, windowStart, windowEnd) {
  const startMs = new Date(windowStart).getTime()
  const endMs = new Date(windowEnd).getTime()
  const span = Math.max(1, endMs - startMs)
  const from = new Date(startAt).getTime()
  const to = new Date(endAt || startAt).getTime()
  const left = ((Math.max(from, startMs) - startMs) / span) * 100
  const width = Math.max(0.45, ((Math.max(to, from + 1000) - Math.max(from, startMs)) / span) * 100)
  return { left: `${left}%`, width: `${width}%` }
}

/** Participant-style evidence timeline used across Kitchen / Service / Tables. */
export function EvidenceTimeline({
  lanes,
  windowStart,
  windowEnd,
  onSelect,
  selectedId = null,
  legend = [
    { tone: 'present', label: 'On camera / dwell' },
    { tone: 'active', label: 'Active visit' },
  ],
  hint = 'Click any segment to open video evidence',
}) {
  const [hoverLabel, setHoverLabel] = useState(null)
  const ticks = timelineTicks(windowStart, windowEnd)
  const visible = (lanes || []).filter((lane) => lane.segments?.length)

  if (!visible.length) {
    return <EmptyFilter title="No timeline activity in this window" detail="Select another filter or widen the period." />
  }

  const pickNearest = (lane, clientX, laneEl) => {
    const box = laneEl.getBoundingClientRect()
    if (!box.width || !lane.segments.length) return null
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width))
    const at = new Date(windowStart).getTime() + ratio * (new Date(windowEnd).getTime() - new Date(windowStart).getTime())
    let best = lane.segments[0]
    let bestDist = Infinity
    for (const segment of lane.segments) {
      const mid = (new Date(segment.startAt).getTime() + new Date(segment.endAt || segment.startAt).getTime()) / 2
      const dist = Math.abs(mid - at)
      if (dist < bestDist) {
        best = segment
        bestDist = dist
      }
    }
    return best.eventId
  }

  return (
    <div className="rdi-ptl">
      <div className="rdi-ptl-legend">
        {legend.map((item) => (
          <span key={item.label}><i className={`rdi-ptl-swatch ${item.tone}`} />{item.label}</span>
        ))}
        <em className="rdi-ptl-hint">{hint}</em>
      </div>
      <div className="rdi-ptl-rows">
        {visible.map((lane) => (
          <div className="rdi-ptl-row" key={lane.id}>
            <div className="rdi-ptl-who">
              <strong>{lane.name}</strong>
              <span>{lane.detail}</span>
            </div>
            <div
              className="rdi-ptl-lane"
              role="presentation"
              onClick={(event) => {
                if (event.target !== event.currentTarget) return
                const eventId = pickNearest(lane, event.clientX, event.currentTarget)
                if (eventId) onSelect(eventId)
              }}
              onMouseMove={(event) => {
                const box = event.currentTarget.getBoundingClientRect()
                const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width))
                const at = new Date(windowStart).getTime() + ratio * (new Date(windowEnd).getTime() - new Date(windowStart).getTime())
                setHoverLabel(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(at)))
              }}
              onMouseLeave={() => setHoverLabel(null)}
            >
              {lane.segments.map((segment) => (
                <button
                  key={segment.eventId + (segment.tone || 'present')}
                  type="button"
                  className={`rdi-ptl-bar ${segment.tone || 'present'}${selectedId === segment.eventId ? ' is-selected' : ''}`}
                  style={{
                    ...segmentStyle(segment.startAt, segment.endAt, windowStart, windowEnd),
                    ...(segment.color ? { background: segment.color } : null),
                  }}
                  title={segment.title || lane.name}
                  aria-label={segment.title || `Open evidence for ${lane.name}`}
                  onClick={() => onSelect(segment.eventId)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rdi-ptl-scale" aria-hidden="true">
        <span>{ticks[0].label}</span>
        <span className="rdi-ptl-cursor">{hoverLabel || ticks[1].label}</span>
        <span>{ticks[2].label}</span>
      </div>
    </div>
  )
}

export function StationTimeline({ dwells, counters, windowStart, windowEnd, onSelect, selectedId = null }) {
  const focusCounter = counters.length === 1 ? counters[0].counterId : null
  const peopleIds = [...new Set(dwells.map((row) => row.personId))]
  const lanes = peopleIds.map((personId) => {
    const person = lookup.person[personId]
    const segments = dwells
      .filter((dwell) => dwell.personId === personId)
      .map((dwell) => ({
        eventId: dwell.eventId,
        startAt: dwell.startAt,
        endAt: dwell.endAt,
        tone: focusCounter && dwell.counterId === focusCounter ? 'active' : 'present',
        color: PERSON_SWATCH[personId],
        title: `${person?.name || 'Staff'} · ${lookup.counter[dwell.counterId]?.name || 'Station'} · ${formatDwell(dwell.durationMs)}`,
      }))
    const dwellMs = segments.reduce((sum, row) => sum + Math.max(0, new Date(row.endAt) - new Date(row.startAt)), 0)
    return {
      id: personId,
      name: person?.name || personId,
      detail: `${formatDwell(dwellMs)} on camera · ${segments.length} station visit${segments.length === 1 ? '' : 's'}`,
      segments,
    }
  }).sort((a, b) => b.segments.length - a.segments.length)

  return (
    <EvidenceTimeline
      lanes={lanes}
      windowStart={windowStart}
      windowEnd={windowEnd}
      onSelect={onSelect}
      selectedId={selectedId}
      legend={[
        { tone: 'present', label: 'At station' },
        { tone: 'active', label: 'Focused station' },
      ]}
      hint="Click any segment to open the correct video evidence"
    />
  )
}

export function DurationBars({ rows, maxMs }) {
  const peak = maxMs || Math.max(1, ...rows.map((row) => row.dwellMs || 0))
  if (!rows.length) return <EmptyFilter title="No dwell time in this window" detail="Choose another period or clear a filter to see station and table activity." />
  return (
    <div className="rdi-bars">
      {rows.map((row) => (
        <div key={row.id} className="rdi-bar-row">
          <span>{row.label}</span>
          <div className="rdi-bar-track" aria-hidden="true"><div className="rdi-bar-fill" style={{ width: `${Math.max(4, (row.dwellMs / peak) * 100)}%` }} /></div>
          <strong>{formatDwell(row.dwellMs)}</strong>
        </div>
      ))}
    </div>
  )
}

export function EventTimeline({ events, onSelect, windowStart, windowEnd, selectedId = null }) {
  if (!events.length) return <EmptyFilter title="No events in this window" detail="The selected filters do not overlap captured dwell-time events." />

  const start = windowStart || events.reduce((min, event) => (event.startAt < min ? event.startAt : min), events[0].startAt)
  const end = windowEnd || events.reduce((max, event) => ((event.endAt || event.startAt) > max ? (event.endAt || event.startAt) : max), events[0].endAt || events[0].startAt)

  const byLane = new Map()
  for (const event of events) {
    const laneId = event.personId || event.tableId || event.counterId || event.eventType
    const laneName = event.personId
      ? lookup.person[event.personId]?.name
      : event.tableId
        ? lookup.table[event.tableId]?.code
        : event.counterId
          ? lookup.counter[event.counterId]?.name
          : eventTypeLabel(event.eventType)
    if (!byLane.has(laneId)) {
      byLane.set(laneId, { id: laneId, name: laneName || 'Event', segments: [], dwellMs: 0 })
    }
    const lane = byLane.get(laneId)
    const isPresence = event.durationMs > 0 || event.eventType.endsWith('.visit') || event.eventType.endsWith('.dwell') || event.eventType === 'table.occupancy'
    lane.segments.push({
      eventId: event.eventId,
      startAt: event.startAt,
      endAt: event.endAt || event.startAt,
      tone: isPresence ? 'present' : 'active',
      color: event.personId ? PERSON_SWATCH[event.personId] : undefined,
      title: `${event.summary} · ${formatClock(event.startAt)}`,
    })
    if (event.durationMs) lane.dwellMs += event.durationMs
  }

  const lanes = [...byLane.values()].map((lane) => ({
    ...lane,
    detail: lane.dwellMs
      ? `${formatDwell(lane.dwellMs)} on camera · ${lane.segments.length} events`
      : `${lane.segments.length} event${lane.segments.length === 1 ? '' : 's'}`,
  }))

  return (
    <EvidenceTimeline
      lanes={lanes}
      windowStart={start}
      windowEnd={end}
      onSelect={(eventId) => {
        const event = events.find((row) => row.eventId === eventId)
        if (event) onSelect(event)
        else onSelect({ eventId })
      }}
      selectedId={selectedId}
      hint="Click any point in a row to open that person's evidence"
    />
  )
}

export function CameraDesk({ video, label, cameraName, title, detail, focusPersonId = null, children }) {
  const zonesByVideo = useConfigStore((s) => s.zonesByVideo)
  const [liveZones, setLiveZones] = useState(() => resolveVideoZones(video?.videoId, 0, focusPersonId, zonesByVideo))
  useEffect(() => {
    setLiveZones(resolveVideoZones(video?.videoId, 0, focusPersonId, zonesByVideo))
  }, [video?.videoId, focusPersonId, zonesByVideo])
  return (
    <div className="ss-cam-desk">
      <aside className="ss-cam-desk-side">
        <SectionLabel blue>LIVE CAMERA</SectionLabel>
        <h3>{title || label || cameraName || video?.title}</h3>
        {detail ? <p className="ss-cam-desk-copy">{detail}</p> : null}
        {children}
        {liveZones.length ? (
          <div className="ss-cam-desk-zones">
            <span className="ss-cam-desk-zones-label">Mapped areas</span>
            {liveZones.map((zone) => (
              <div key={zone.zoneId} className={`ss-cam-desk-zone${zone.focused ? ' is-focus' : ''}`}>
                <i style={{ background: zone.color }} />
                <div>
                  <strong>{zone.label}{zone.badge ? ` · ${zone.badge}` : ''}</strong>
                  <span>{zone.kind === 'area' ? 'Zone polygon' : zone.detail || 'Tracked person'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </aside>
      <div className="ss-cam-desk-main">
        <LiveCamera
          size="panel"
          video={video}
          label={label}
          cameraName={cameraName}
          focusPersonId={focusPersonId}
          onZonesChange={setLiveZones}
        />
      </div>
    </div>
  )
}

export function LiveCamera({ video, label, cameraName, size = 'hero', focusPersonId = null, onZonesChange }) {
  const videoRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [showZones, setShowZones] = useState(Boolean(focusPersonId) || size === 'evidence')
  const [ready, setReady] = useState(false)
  const [timeSec, setTimeSec] = useState(0)
  const title = cameraName || label || video?.title
  const zonesByVideo = useConfigStore((s) => s.zonesByVideo)
  const zones = useMemo(
    () => (video ? resolveVideoZones(video.videoId, timeSec, focusPersonId, zonesByVideo) : []),
    [video, timeSec, focusPersonId, zonesByVideo],
  )
  const areaZones = zones.filter((zone) => zone.kind === 'area')
  const peopleCount = zones.filter((zone) => zone.kind === 'person').length

  useEffect(() => {
    setFailed(false)
    setReady(false)
    setTimeSec(0)
    if (focusPersonId || size === 'evidence') setShowZones(true)
  }, [video?.videoId, video?.src, focusPersonId, size])

  useEffect(() => {
    onZonesChange?.(zones)
  }, [zones, onZonesChange])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined
    const markReady = () => setReady(Boolean(el.videoWidth && el.videoHeight))
    const onTime = () => setTimeSec(el.currentTime || 0)
    markReady()
    el.addEventListener('loadedmetadata', markReady)
    el.addEventListener('loadeddata', markReady)
    el.addEventListener('timeupdate', onTime)
    return () => {
      el.removeEventListener('loadedmetadata', markReady)
      el.removeEventListener('loadeddata', markReady)
      el.removeEventListener('timeupdate', onTime)
    }
  }, [video?.src])

  if (!video || failed) {
    return (
      <div className={`ss-player ss-player-${size} is-error`}>
        <div className="ss-player-stage">
          <div className="ss-player-frame ss-player-frame-empty">
            <div className="ss-player-hud">
              <div className="ss-player-id">
                <span className="ss-live-pill">LIVE</span>
                <span className="ss-cam-name">{title}</span>
              </div>
            </div>
            <div className="ss-cam-error-body">
              <span className="ss-cam-warn" aria-hidden="true">!</span>
              <p>Video playback error</p>
              <button type="button" className="ss-retry" onClick={() => setFailed(false)}>Retry Connection</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={`ss-player ss-player-${size}`}>
      <div className="ss-player-stage">
        <div className="ss-player-frame">
          <video
            ref={videoRef}
            className="rdi-video ss-player-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src={video.src}
            aria-label={title}
            onError={() => setFailed(true)}
          />
          {ready && showZones && zones.length ? <VideoZoneOverlay zones={zones} /> : null}
          <div className="ss-player-hud">
            <div className="ss-player-id">
              <span className="ss-live-pill">LIVE</span>
              <span className="ss-cam-name">{title}</span>
            </div>
            {zones.length ? (
              <button
                type="button"
                className={`ss-zone-toggle${showZones ? ' is-on' : ''}`}
                aria-pressed={showZones}
                onClick={() => setShowZones((value) => !value)}
              >
                Polygons
              </button>
            ) : null}
          </div>
          {ready && showZones && areaZones.length ? (
            <div className="ss-player-stats">
              <div><span>Zones</span><strong>{areaZones.length}</strong></div>
              <div><span>Tracked</span><strong>{peopleCount}</strong></div>
              {areaZones.slice(0, 3).map((zone) => (
                <div key={zone.zoneId}><span style={{ color: zone.color }}>{zone.label}</span><strong>{zone.badge || 'active'}</strong></div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function areaCenter(points) {
  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])
  return {
    left: (Math.min(...xs) + Math.max(...xs)) / 2,
    top: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
}

function VideoZoneOverlay({ zones }) {
  const areas = zones.filter((zone) => zone.kind === 'area' && zone.points)
  const people = zones.filter((zone) => zone.kind === 'person')
  return (
    <div className="ss-video-zones" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ss-video-zones-svg">
        <defs>
          {people.map((zone) => (
            <radialGradient key={`grad-${zone.zoneId}`} id={`blob-${zone.zoneId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={zone.color} stopOpacity="0.85" />
              <stop offset="55%" stopColor={zone.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={zone.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        {areas.map((zone) => (
          <g key={zone.zoneId} className="ss-vzone ss-vzone-area" style={{ color: zone.color }}>
            <polygon points={zone.points.map((point) => point.join(',')).join(' ')} />
            {zone.points.map((point, index) => (
              <circle key={`${zone.zoneId}-dot-${index}`} className="ss-vzone-dot" cx={point[0]} cy={point[1]} r="0.9" />
            ))}
          </g>
        ))}
        {people.map((zone) => (
          <g key={zone.zoneId} className={`ss-vzone ss-vzone-person${zone.focused ? ' is-focus' : ''}`}>
            {zone.trail?.length > 1 ? (
              <polyline
                className="ss-vzone-trail"
                points={zone.trail.map((point) => point.join(',')).join(' ')}
                stroke={zone.color}
              />
            ) : null}
            <ellipse
              className="ss-vzone-blob"
              cx={zone.x}
              cy={zone.y}
              rx={zone.rx}
              ry={zone.ry}
              fill={`url(#blob-${zone.zoneId})`}
            />
            <ellipse className="ss-vzone-ring" cx={zone.x} cy={zone.y} rx={zone.rx * 0.55} ry={zone.ry * 0.55} stroke={zone.color} />
          </g>
        ))}
      </svg>
      {areas.map((zone) => {
        const center = areaCenter(zone.points)
        return (
          <span
            key={`${zone.zoneId}-badge`}
            className="ss-vzone-badge"
            style={{ left: `${center.left}%`, top: `${center.top}%`, background: zone.color }}
          >
            {zone.badge || zone.label}
          </span>
        )
      })}
      {people.map((zone) => (
        <span
          key={`${zone.zoneId}-label`}
          className={`ss-vzone-chip${zone.focused ? ' is-focus' : ''}`}
          style={{ left: `${zone.x}%`, top: `${Math.max(4, zone.y - zone.ry * 3.2)}%`, '--zone': zone.color }}
        >
          {zone.label}
        </span>
      ))}
    </div>
  )
}

export function LiveFeedGrid() {
  const tiles = [
    { video: videos.find((item) => item.videoId === 'vid-dining-floor'), name: 'Dining Floor 01' },
    { video: videos.find((item) => item.videoId === 'vid-kitchen-activity'), name: 'Kitchen 01' },
  ]
  return (
    <div className="ss-live-grid">
      {tiles.map((tile) => (
        <LiveCamera key={tile.name} video={tile.video} cameraName={tile.name} size="feed" />
      ))}
    </div>
  )
}

export function CameraWall({ initialId }) {
  const [activeId, setActiveId] = useState(initialId || videos[0].videoId)
  const active = videos.find((item) => item.videoId === activeId) || videos[0]
  const camera = cameras.find((item) => item.cameraId === active.cameraId)
  return (
    <div className="rdi-camera-wall">
      <LiveCamera video={active} label={`${camera?.name || 'Camera'} · ${active.title}`} />
      <div className="rdi-cam-switch" role="tablist" aria-label="Cameras">
        {videos.map((item) => {
          const cam = cameras.find((row) => row.cameraId === item.cameraId)
          return (
            <button key={item.videoId} type="button" className={item.videoId === activeId ? 'active' : ''} onClick={() => setActiveId(item.videoId)}>
              {cam?.name || item.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function VideoEvidence({ video, event }) {
  if (!video) {
    return <div className="rdi-video-missing">Visual evidence is not attached to this event.</div>
  }
  return (
    <LiveCamera
      key={`${event?.eventId || video.videoId}:${event?.personId || 'all'}`}
      video={video}
      cameraName={video.title}
      size="evidence"
      focusPersonId={event?.personId || null}
    />
  )
}

export function EventDrawer({ detail, onClose, onOpen }) {
  if (!detail) return null
  return (
    <>
      <button type="button" className="rdi-drawer-backdrop" aria-label="Close event detail" onClick={onClose} />
      <aside className="rdi-drawer ss-event-drawer" role="dialog" aria-modal="true" aria-labelledby="event-detail-title">
        <header>
          <div>
            <SectionLabel blue>EVENT EVIDENCE</SectionLabel>
            <h2 id="event-detail-title">{detail.summary}</h2>
            <p className="ss-drawer-lead">
              {detail.person?.name ? `${detail.person.name} · ` : ''}
              {formatClock(detail.startAt)} – {formatClock(detail.endAt)}
              {detail.durationMs ? ` · ${formatDwell(detail.durationMs)}` : ''}
              {detail.counter ? ` · ${detail.counter.name}` : detail.table ? ` · ${detail.table.code}` : ''}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="rdi-drawer-body">
          <div className="ss-drawer-video">
            <VideoEvidence video={detail.video} event={detail} />
          </div>
          {detail.person ? (
            <div className="ss-drawer-person">
              <Avatar person={detail.person} size={36} />
              <div>
                <strong>{detail.person.name}</strong>
                <span>{detail.person.employeeCode || personTypeLabel(detail.person.role)} · matched to this event</span>
              </div>
            </div>
          ) : null}
          <div className="rdi-meta">
            <div><span>Event ID</span><strong>{detail.eventId}</strong></div>
            <div><span>Event type</span><strong>{eventTypeLabel(detail.eventType)}</strong></div>
            <div><span>Person</span><strong>{detail.person?.name || 'Guest party'}</strong></div>
            <div><span>Person type</span><strong>{detail.person ? personTypeLabel(detail.person.role) : 'Guest'}</strong></div>
            <div><span>Location</span><strong>{detail.table?.code || detail.counter?.name || 'Floor'}</strong></div>
            <div><span>Zone</span><strong>{detail.zoneId}</strong></div>
            <div><span>Start</span><strong>{formatClock(detail.startAt)}</strong></div>
            <div><span>End</span><strong>{formatClock(detail.endAt)}</strong></div>
            <div><span>Duration</span><strong>{detail.durationMs ? formatDwell(detail.durationMs) : 'Instant'}</strong></div>
            <div><span>Camera</span><strong>{detail.camera?.name || '—'}</strong></div>
            <div><span>Confidence</span><strong>{detail.confidence != null ? `${Math.round(detail.confidence * 100)}%` : '—'}</strong></div>
            <div><span>Video</span><strong>{detail.video?.title || 'Not available'}</strong></div>
          </div>
          <div className="ss-drawer-actions">
            {detail.table && <Button variant="secondary" onClick={() => onOpen(`/restaurant/analytics/tables/${detail.table.tableId}`)}>Open table</Button>}
            {detail.person?.role === 'waiter' && <Button variant="secondary" onClick={() => onOpen(`/restaurant/analytics/servers/${detail.person.personId}`)}>Open server</Button>}
            {detail.person?.role === 'kitchen' && <Button variant="secondary" onClick={() => onOpen(`/restaurant/analytics/kitchen/${detail.person.personId}`)}>Open employee</Button>}
          </div>
        </div>
      </aside>
    </>
  )
}

export function PageHeader({ eyebrow, title, detail, actions }) {
  return (
    <div className="page">
      <PageNav />
      <div className="rdi-bar">
        <div>
          <SectionLabel blue>{eyebrow}</SectionLabel>
          <h2>{title}</h2>
          {detail ? <p>{detail}</p> : null}
        </div>
        <div>{actions}</div>
      </div>
    </div>
  )
}

export function Crumbs({ items }) {
  const navigate = useNavigate()
  return (
    <nav className="rdi-crumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.label}>
          {item.to ? <Link to={item.to} onClick={(e) => { e.preventDefault(); navigate(item.to) }}>{item.label}</Link> : item.label}
          {index < items.length - 1 ? ' / ' : ''}
        </span>
      ))}
    </nav>
  )
}
