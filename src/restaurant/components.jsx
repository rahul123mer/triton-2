import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Card, Button, SectionLabel, PageNav } from '../components/ui'
import { windowBounds } from './analytics'
import { formatClock, formatDwell, eventTypeLabel, personTypeLabel } from './format'
import { useRestaurantStore } from './store'
import { cameras, timeWindows, videos } from './data'

export function useRestaurantWindow() {
  const date = useRestaurantStore((s) => s.date)
  const windowId = useRestaurantStore((s) => s.windowId)
  const customStart = useRestaurantStore((s) => s.customStart)
  const customEnd = useRestaurantStore((s) => s.customEnd)
  return useMemo(() => windowBounds(date, windowId, customStart, customEnd), [date, windowId, customStart, customEnd])
}

export function RestaurantFilters() {
  const date = useRestaurantStore((s) => s.date)
  const windowId = useRestaurantStore((s) => s.windowId)
  const customStart = useRestaurantStore((s) => s.customStart)
  const customEnd = useRestaurantStore((s) => s.customEnd)
  const setDate = useRestaurantStore((s) => s.setDate)
  const setWindowId = useRestaurantStore((s) => s.setWindowId)
  const setCustomRange = useRestaurantStore((s) => s.setCustomRange)
  return (
    <div className="rdi-filters">
      <label className="rdi-field">
        <span>Date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Service date" />
      </label>
      <div className="rdi-field">
        <span>Time window</span>
        <div className="rdi-window" role="tablist" aria-label="Time window">
          {timeWindows.map((item) => (
            <button key={item.windowId} type="button" className={windowId === item.windowId ? 'active' : ''} onClick={() => setWindowId(item.windowId)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {windowId === 'custom' && (
        <>
          <label className="rdi-field">
            <span>Start</span>
            <input type="time" value={customStart} onChange={(e) => setCustomRange(e.target.value, customEnd)} aria-label="Custom start time" />
          </label>
          <label className="rdi-field">
            <span>End</span>
            <input type="time" value={customEnd} onChange={(e) => setCustomRange(customStart, e.target.value)} aria-label="Custom end time" />
          </label>
        </>
      )}
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
    <div className="rdi-kitchen-map" aria-label="Kitchen stations">
      {counters.map((counter) => (
        <button
          key={counter.counterId}
          type="button"
          className={counter.counterId === activeId ? 'rdi-counter active' : 'rdi-counter'}
          style={{ left: `${counter.x}%`, top: `${counter.y}%`, width: `${counter.w}%`, height: `${counter.h}%` }}
          onClick={() => onSelect(counter)}
        >
          <strong>{counter.name}</strong>
          <span>{counter.visitCount} visits</span>
          <span>{formatDwell(counter.dwellMs)}</span>
        </button>
      ))}
    </div>
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

export function EventTimeline({ events, onSelect }) {
  if (!events.length) return <EmptyFilter title="No events in this window" detail="The selected filters do not overlap captured dwell-time events." />
  return (
    <div className="rdi-timeline">
      {events.map((event) => {
        const kind = event.eventType.startsWith('waiter') ? 'waiter' : event.eventType.startsWith('kitchen') ? 'kitchen' : 'guest'
        return (
          <div key={event.eventId} className={`rdi-tl-item ${kind}`}>
            <time dateTime={event.startAt}>{formatClock(event.startAt)}</time>
            <div className="rdi-tl-rail"><b /></div>
            <button type="button" className="rdi-tl-body" onClick={() => onSelect(event)}>
              <strong>{event.summary}</strong>
              <span>{eventTypeLabel(event.eventType)}{event.durationMs ? ` · ${formatDwell(event.durationMs)}` : ''}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function LiveCamera({ video, label }) {
  const [failed, setFailed] = useState(false)
  if (!video || failed) {
    return <div className="rdi-video-missing">Camera footage is currently unavailable.</div>
  }
  return (
    <div className="rdi-live">
      <video
        className="rdi-video"
        autoPlay
        muted
        loop
        playsInline
        controls
        preload="auto"
        src={video.src}
        aria-label={label || video.title}
        onError={() => setFailed(true)}
      />
      <div className="rdi-live-overlay">
        <span className="rdi-live-dot">LIVE</span>
        <span>{label || video.title}</span>
      </div>
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
  const [failed, setFailed] = useState(false)
  if (!video || failed) {
    return <div className="rdi-video-missing">{video ? 'Video evidence is currently unavailable for this camera clip.' : 'Visual evidence is not attached to this event.'}</div>
  }
  const start = Math.max(0, ((event?.durationMs || 0) > 8000 ? 4 : 1))
  return (
    <video
      className="rdi-video"
      autoPlay
      muted
      loop
      playsInline
      controls
      preload="auto"
      src={`${video.src}#t=${start}`}
      aria-label={video.title}
      onError={() => setFailed(true)}
    />
  )
}

export function EventDrawer({ detail, onClose, onOpen }) {
  if (!detail) return null
  return (
    <>
      <button type="button" className="rdi-drawer-backdrop" aria-label="Close event detail" onClick={onClose} />
      <aside className="rdi-drawer" role="dialog" aria-modal="true" aria-labelledby="event-detail-title">
        <header>
          <div>
            <SectionLabel blue>EVENT EVIDENCE</SectionLabel>
            <h2 id="event-detail-title">{detail.summary}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="rdi-drawer-body">
          <VideoEvidence video={detail.video} event={detail} />
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
          {detail.table && <Button variant="secondary" onClick={() => onOpen(`/restaurant/tables/${detail.table.tableId}`)}>Open table</Button>}
          {detail.person?.role === 'waiter' && <Button variant="secondary" onClick={() => onOpen(`/restaurant/service/${detail.person.personId}`)} style={{ marginLeft: 8 }}>Open waiter</Button>}
          {detail.person?.role === 'kitchen' && <Button variant="secondary" onClick={() => onOpen(`/restaurant/kitchen/${detail.person.personId}`)} style={{ marginLeft: 8 }}>Open employee</Button>}
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
