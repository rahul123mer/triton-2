import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Button, Card, SectionLabel } from '../../../components/ui'
import { cameras, lookup, videos } from '../../data'
import { SubNav } from '../../widgets'
import { useConfigStore } from '../../configStore'
import { SETTINGS_NAV } from './UploadsPage'

const ROLE_OPTIONS = [
  ['table', 'Table (occupancy)'],
  ['station', 'Kitchen station (dwell)'],
  ['service', 'Service zone (visits)'],
  ['movement', 'Movement corridor'],
]
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#94a3b8', '#ef4444']

function clamp(value) {
  return Math.max(0.5, Math.min(99.5, value))
}

export function PolygonsPage() {
  const [params, setParams] = useSearchParams()
  const videoId = params.get('video') || videos[0].videoId
  const video = videos.find((row) => row.videoId === videoId) || videos[0]
  const camera = lookup.camera[video.cameraId]
  const zonesByVideo = useConfigStore((s) => s.zonesByVideo)
  const updateZone = useConfigStore((s) => s.updateZone)
  const moveZonePoint = useConfigStore((s) => s.moveZonePoint)
  const addZone = useConfigStore((s) => s.addZone)
  const removeZone = useConfigStore((s) => s.removeZone)
  const resetZones = useConfigStore((s) => s.resetZones)
  const zones = zonesByVideo[video.videoId] || []
  const areas = zones.filter((zone) => zone.kind === 'area')
  const people = zones.filter((zone) => zone.kind === 'person')
  const [selectedId, setSelectedId] = useState(areas[0]?.zoneId || null)
  const [paused, setPaused] = useState(true)
  const [drag, setDrag] = useState(null)
  const stageRef = useRef(null)
  const videoRef = useRef(null)
  const selected = areas.find((zone) => zone.zoneId === selectedId) || null

  useEffect(() => {
    if (!areas.some((zone) => zone.zoneId === selectedId)) setSelectedId(areas[0]?.zoneId || null)
  }, [areas, selectedId])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (paused) el.pause()
    else el.play().catch(() => {})
  }, [paused, video.videoId])

  const toPercent = (event) => {
    const box = stageRef.current?.getBoundingClientRect()
    if (!box) return null
    return [clamp(((event.clientX - box.left) / box.width) * 100), clamp(((event.clientY - box.top) / box.height) * 100)]
  }

  const onPointerMove = (event) => {
    if (!drag) return
    const point = toPercent(event)
    if (!point) return
    if (drag.kind === 'vertex') {
      moveZonePoint(video.videoId, drag.zoneId, drag.index, [Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10])
    } else if (drag.kind === 'move') {
      const dx = point[0] - drag.origin[0]
      const dy = point[1] - drag.origin[1]
      const zone = areas.find((row) => row.zoneId === drag.zoneId)
      if (!zone) return
      const next = drag.start.map(([x, y]) => [clamp(x + dx), clamp(y + dy)])
      updateZone(video.videoId, drag.zoneId, { points: next.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) })
    }
  }

  const stopDrag = () => setDrag(null)

  const cameraVideos = useMemo(() => videos.map((row) => ({ ...row, camera: lookup.camera[row.cameraId] })), [])

  return (
    <div className="ss-settings">
      <SubNav items={SETTINGS_NAV} />
      <div className="ss-poly-tabs" role="tablist" aria-label="Camera">
        {cameraVideos.map((row) => (
          <button
            key={row.videoId}
            type="button"
            role="tab"
            aria-selected={row.videoId === video.videoId}
            className={row.videoId === video.videoId ? 'is-on' : ''}
            onClick={() => setParams({ video: row.videoId })}
          >
            <strong>{row.camera?.name}</strong>
            <span>{row.title} · {(zonesByVideo[row.videoId] || []).filter((zone) => zone.kind === 'area').length} zones</span>
          </button>
        ))}
      </div>

      <div className="ss-poly-layout">
        <Card className="ss-panel-card ss-poly-stage-card">
          <header className="ss-section-head ss-section-head-row">
            <div>
              <SectionLabel>{camera?.name}</SectionLabel>
              <h3>{video.title}</h3>
              <p>Drag a vertex to reshape, drag inside a polygon to move it. Coordinates are percentages of the frame so they survive resolution changes.</p>
            </div>
            <div className="ss-poly-actions">
              <Button variant="secondary" onClick={() => setPaused((value) => !value)}>{paused ? 'Play frame' : 'Freeze frame'}</Button>
              <Button variant="secondary" onClick={() => resetZones(video.videoId)}><RotateCcw size={14} /> Reset</Button>
              <Button onClick={() => { const zone = addZone(video.videoId, { role: camera?.zone === 'kitchen' ? 'station' : 'table', label: camera?.zone === 'kitchen' ? 'New station' : 'New table', color: COLORS[areas.length % COLORS.length] }); setSelectedId(zone.zoneId) }}><Plus size={14} /> Add polygon</Button>
            </div>
          </header>
          <div
            ref={stageRef}
            className={`ss-poly-stage${drag ? ' is-dragging' : ''}`}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
          >
            <video ref={videoRef} src={video.src} muted loop playsInline preload="auto" className="ss-poly-video" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ss-poly-svg">
              {areas.map((zone) => {
                const isSel = zone.zoneId === selectedId
                return (
                  <g key={zone.zoneId} className={`ss-poly${isSel ? ' is-selected' : ''}`} style={{ color: zone.color }}>
                    <polygon
                      points={zone.points.map((point) => point.join(',')).join(' ')}
                      onPointerDown={(event) => {
                        event.stopPropagation()
                        setSelectedId(zone.zoneId)
                        const origin = toPercent(event)
                        if (origin) setDrag({ kind: 'move', zoneId: zone.zoneId, origin, start: zone.points.map((point) => [...point]) })
                      }}
                    />
                    {isSel ? zone.points.map((point, index) => (
                      <circle
                        key={`${zone.zoneId}-${index}`}
                        cx={point[0]}
                        cy={point[1]}
                        r="1.3"
                        className="ss-poly-vertex"
                        onPointerDown={(event) => { event.stopPropagation(); setDrag({ kind: 'vertex', zoneId: zone.zoneId, index }) }}
                      />
                    )) : null}
                  </g>
                )
              })}
              {people.map((zone) => {
                const frame = zone.track?.[0] || zone
                return <ellipse key={zone.zoneId} cx={frame.x} cy={frame.y} rx={frame.rx || zone.rx || 4} ry={frame.ry || zone.ry || 2.4} className="ss-poly-person" style={{ color: zone.color }} />
              })}
            </svg>
            {areas.map((zone) => {
              const xs = zone.points.map((point) => point[0])
              const ys = zone.points.map((point) => point[1])
              return (
                <button
                  key={`${zone.zoneId}-label`}
                  type="button"
                  className={`ss-poly-label${zone.zoneId === selectedId ? ' is-selected' : ''}`}
                  style={{ left: `${(Math.min(...xs) + Math.max(...xs)) / 2}%`, top: `${Math.min(...ys)}%`, background: zone.color }}
                  onClick={() => setSelectedId(zone.zoneId)}
                >
                  {zone.label}
                </button>
              )
            })}
          </div>
          <p className="ss-footnote">Tracked people (dashed ellipses) come from the detector and are shown for reference only. {people.length} on this camera.</p>
        </Card>

        <div className="ss-poly-side">
          <Card className="ss-panel-card">
            <header className="ss-section-head">
              <SectionLabel>ZONES ON THIS CAMERA</SectionLabel>
              <h3>{areas.length} polygon{areas.length === 1 ? '' : 's'}</h3>
            </header>
            <div className="ss-poly-list">
              {areas.map((zone) => (
                <button key={zone.zoneId} type="button" className={`ss-poly-item${zone.zoneId === selectedId ? ' is-on' : ''}`} onClick={() => setSelectedId(zone.zoneId)}>
                  <i style={{ background: zone.color }} />
                  <span><strong>{zone.label}</strong><em>{ROLE_OPTIONS.find(([key]) => key === zone.role)?.[1] || zone.role} · {zone.points.length} pts</em></span>
                </button>
              ))}
              {areas.length === 0 ? <p className="ss-muted">No polygons yet. Add one to start producing events from this camera.</p> : null}
            </div>
          </Card>

          {selected ? (
            <Card className="ss-panel-card">
              <header className="ss-section-head ss-section-head-row">
                <div>
                  <SectionLabel>SELECTED</SectionLabel>
                  <h3>{selected.label}</h3>
                </div>
                <button type="button" className="icon-button" aria-label="Delete polygon" onClick={() => removeZone(video.videoId, selected.zoneId)}><Trash2 size={15} /></button>
              </header>
              <div className="ss-poly-form">
                <label className="field-label">Display name<input value={selected.label} onChange={(e) => updateZone(video.videoId, selected.zoneId, { label: e.target.value })} /></label>
                <label className="field-label">Badge (shown on camera)<input value={selected.badge || ''} onChange={(e) => updateZone(video.videoId, selected.zoneId, { badge: e.target.value })} placeholder="e.g. 4 seated" /></label>
                <label className="field-label">Type
                  <select value={selected.role} onChange={(e) => updateZone(video.videoId, selected.zoneId, { role: e.target.value })}>
                    {ROLE_OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <div className="field-label">Colour
                  <div className="ss-swatches">
                    {COLORS.map((color) => (
                      <button key={color} type="button" className={`ss-swatch${selected.color === color ? ' is-on' : ''}`} style={{ background: color }} aria-label={color} onClick={() => updateZone(video.videoId, selected.zoneId, { color })} />
                    ))}
                  </div>
                </div>
                <div className="field-label">Vertices
                  <div className="ss-vertex-list">
                    {selected.points.map((point, index) => (
                      <span key={index} className="mono">{index + 1}: {point[0].toFixed(1)}, {point[1].toFixed(1)}</span>
                    ))}
                  </div>
                  <div className="ss-form-actions ss-form-actions-left">
                    <Button variant="secondary" onClick={() => {
                      const points = selected.points
                      const [ax, ay] = points[points.length - 1]
                      const [bx, by] = points[0]
                      updateZone(video.videoId, selected.zoneId, { points: [...points, [Math.round(((ax + bx) / 2) * 10) / 10, Math.round(((ay + by) / 2) * 10) / 10]] })
                    }}>Add vertex</Button>
                    <Button variant="secondary" disabled={selected.points.length <= 3} onClick={() => updateZone(video.videoId, selected.zoneId, { points: selected.points.slice(0, -1) })}>Remove last</Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="ss-panel-card">
            <header className="ss-section-head">
              <SectionLabel>COVERAGE</SectionLabel>
              <h3>Cameras</h3>
            </header>
            <ul className="ss-coverage">
              {cameras.map((row) => (
                <li key={row.cameraId}><strong>{row.name}</strong><span>{row.coverage}</span></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
