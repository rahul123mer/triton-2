import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Plus, RotateCcw, Trash2, Undo2, X } from 'lucide-react'
import { Button, Card, SectionLabel } from '../../../components/ui'
import { cameras, lookup, videos } from '../../data'
import { SubNav } from '../../widgets'
import { useConfigStore } from '../../configStore'
import { SETTINGS_NAV } from './settingsNav'
import { SettingsSaveBar } from './SettingsSaveBar'

const ROLE_OPTIONS = [
  ['table', 'Table (occupancy)'],
  ['station', 'Kitchen station (dwell)'],
  ['service', 'Service zone (visits)'],
  ['movement', 'Movement corridor'],
]
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#94a3b8', '#ef4444']
const CLOSE_THRESHOLD = 2.2

function clamp(value) {
  return Math.max(0.5, Math.min(99.5, value))
}

function roundPoint(point) {
  return [Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10]
}

function nearPoint(a, b, threshold = CLOSE_THRESHOLD) {
  if (!a || !b) return false
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return Math.hypot(dx, dy) <= threshold
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
  const [drawing, setDrawing] = useState(null)
  const [cursor, setCursor] = useState(null)
  const stageRef = useRef(null)
  const videoRef = useRef(null)
  const selected = areas.find((zone) => zone.zoneId === selectedId) || null

  useEffect(() => {
    if (!areas.some((zone) => zone.zoneId === selectedId)) setSelectedId(areas[0]?.zoneId || null)
  }, [areas, selectedId])

  useEffect(() => {
    setDrawing(null)
    setCursor(null)
    setDrag(null)
  }, [video.videoId])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (paused) el.pause()
    else el.play().catch(() => {})
  }, [paused, video.videoId])

  const toPercent = (event) => {
    const box = stageRef.current?.getBoundingClientRect()
    if (!box) return null
    return roundPoint([clamp(((event.clientX - box.left) / box.width) * 100), clamp(((event.clientY - box.top) / box.height) * 100)])
  }

  const startDrawing = () => {
    setDrag(null)
    setSelectedId(null)
    setDrawing({
      points: [],
      color: COLORS[areas.length % COLORS.length],
      role: camera?.zone === 'kitchen' ? 'station' : 'table',
      label: camera?.zone === 'kitchen' ? `Station ${areas.length + 1}` : `Table zone ${areas.length + 1}`,
    })
  }

  const cancelDrawing = () => {
    setDrawing(null)
    setCursor(null)
  }

  const undoLastPoint = () => {
    setDrawing((prev) => {
      if (!prev?.points.length) return prev
      return { ...prev, points: prev.points.slice(0, -1) }
    })
  }

  const finishDrawing = (draft) => {
    const source = draft || drawing
    if (!source || source.points.length < 3) return
    const zone = addZone(video.videoId, {
      role: source.role,
      label: source.label,
      color: source.color,
      points: source.points,
    })
    setDrawing(null)
    setCursor(null)
    setSelectedId(zone.zoneId)
  }

  useEffect(() => {
    if (!drawing) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDrawing(null)
        setCursor(null)
      } else if ((event.key === 'Backspace' || event.key === 'Delete') && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLSelectElement)) {
        if (!drawing.points.length) return
        event.preventDefault()
        setDrawing((prev) => (prev ? { ...prev, points: prev.points.slice(0, -1) } : null))
      } else if (event.key === 'Enter' && drawing.points.length >= 3 && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault()
        const zone = addZone(video.videoId, {
          role: drawing.role,
          label: drawing.label,
          color: drawing.color,
          points: drawing.points,
        })
        setDrawing(null)
        setCursor(null)
        setSelectedId(zone.zoneId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawing, addZone, video.videoId])

  const placePoint = (point) => {
    if (!drawing || !point) return
    if (drawing.points.length >= 3 && nearPoint(point, drawing.points[0])) {
      finishDrawing(drawing)
      return
    }
    setDrawing((prev) => (prev ? { ...prev, points: [...prev.points, point] } : null))
  }

  const onStageClick = (event) => {
    if (!drawing || drag) return
    if (event.target.closest('.ss-poly-vertex, .ss-poly-label, button')) return
    const point = toPercent(event)
    if (!point) return
    placePoint(point)
  }

  const onPointerMove = (event) => {
    if (drawing) {
      const point = toPercent(event)
      setCursor(point)
    }
    if (!drag || drawing) return
    const point = toPercent(event)
    if (!point) return
    if (drag.kind === 'vertex') {
      moveZonePoint(video.videoId, drag.zoneId, drag.index, point)
    } else if (drag.kind === 'move') {
      const dx = point[0] - drag.origin[0]
      const dy = point[1] - drag.origin[1]
      const zone = areas.find((row) => row.zoneId === drag.zoneId)
      if (!zone) return
      const next = drag.start.map(([x, y]) => [clamp(x + dx), clamp(y + dy)])
      updateZone(video.videoId, drag.zoneId, { points: next.map(roundPoint) })
    }
  }

  const stopDrag = () => setDrag(null)

  const removeSelected = () => {
    if (!selected) return
    removeZone(video.videoId, selected.zoneId)
    setSelectedId(null)
  }

  const cameraVideos = useMemo(() => videos.map((row) => ({ ...row, camera: lookup.camera[row.cameraId] })), [])
  const draftPoints = drawing?.points || []
  const previewLine = drawing && cursor && draftPoints.length
    ? [...draftPoints, cursor]
    : draftPoints
  const canClose = draftPoints.length >= 3
  const closingHover = Boolean(drawing && cursor && canClose && nearPoint(cursor, draftPoints[0]))

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
              <p>
                {drawing
                  ? 'Click the frame to place each corner. Click the first point again (or Finish) to close. Undo removes the last point; Cancel / Remove discards the draft.'
                  : 'Click Draw polygon, then place corners one by one on the frame. Drag existing vertices to reshape, or drag inside a finished polygon to move it.'}
              </p>
            </div>
            <div className="ss-poly-actions">
              <Button variant="secondary" onClick={() => setPaused((value) => !value)}>{paused ? 'Play frame' : 'Freeze frame'}</Button>
              <Button variant="secondary" onClick={() => { cancelDrawing(); resetZones(video.videoId) }}><RotateCcw size={14} /> Reset</Button>
              {drawing ? (
                <>
                  <Button variant="secondary" disabled={!draftPoints.length} onClick={undoLastPoint}><Undo2 size={14} /> Undo point</Button>
                  <Button variant="secondary" onClick={cancelDrawing}><X size={14} /> Cancel / Remove</Button>
                  <Button disabled={!canClose} onClick={() => finishDrawing()}><Check size={14} /> Finish polygon</Button>
                </>
              ) : (
                <>
                  {selected ? (
                    <Button variant="secondary" onClick={removeSelected}><Trash2 size={14} /> Remove polygon</Button>
                  ) : null}
                  <Button onClick={startDrawing}><Plus size={14} /> Draw polygon</Button>
                </>
              )}
            </div>
          </header>

          {drawing ? (
            <div className="ss-poly-draw-banner" role="status">
              <strong>Drawing mode</strong>
              <span>
                {draftPoints.length === 0
                  ? 'Click the first corner on the video.'
                  : draftPoints.length < 3
                    ? `${draftPoints.length} point${draftPoints.length === 1 ? '' : 's'} placed — need ${3 - draftPoints.length} more.`
                    : closingHover
                      ? 'Release on the first point to close.'
                      : `${draftPoints.length} points — click the first point or Finish to close.`}
              </span>
            </div>
          ) : null}

          <div
            ref={stageRef}
            className={`ss-poly-stage${drag ? ' is-dragging' : ''}${drawing ? ' is-drawing' : ''}`}
            onClick={onStageClick}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrag}
            onPointerLeave={() => { stopDrag(); if (drawing) setCursor(null) }}
            onDoubleClick={(event) => {
              if (!drawing) return
              event.preventDefault()
              if (draftPoints.length >= 3) finishDrawing()
            }}
          >
            <video ref={videoRef} src={video.src} muted loop playsInline preload="auto" className="ss-poly-video" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ss-poly-svg">
              {areas.map((zone) => {
                const isSel = zone.zoneId === selectedId && !drawing
                return (
                  <g key={zone.zoneId} className={`ss-poly${isSel ? ' is-selected' : ''}${drawing ? ' is-muted' : ''}`} style={{ color: zone.color }}>
                    <polygon
                      points={zone.points.map((point) => point.join(',')).join(' ')}
                      onPointerDown={(event) => {
                        if (drawing) return
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

              {drawing ? (
                <g className="ss-poly-draft" style={{ color: drawing.color }}>
                  {previewLine.length > 1 ? (
                    <polyline
                      points={previewLine.map((point) => point.join(',')).join(' ')}
                      className="ss-poly-draft-line"
                    />
                  ) : null}
                  {canClose && draftPoints.length ? (
                    <line
                      x1={draftPoints[draftPoints.length - 1][0]}
                      y1={draftPoints[draftPoints.length - 1][1]}
                      x2={draftPoints[0][0]}
                      y2={draftPoints[0][1]}
                      className={`ss-poly-draft-close${closingHover ? ' is-hot' : ''}`}
                    />
                  ) : null}
                  {canClose ? (
                    <polygon
                      points={draftPoints.map((point) => point.join(',')).join(' ')}
                      className="ss-poly-draft-fill"
                    />
                  ) : null}
                  {draftPoints.map((point, index) => (
                    <circle
                      key={`draft-${index}`}
                      cx={point[0]}
                      cy={point[1]}
                      r={index === 0 ? 1.8 : 1.3}
                      className={`ss-poly-vertex ss-poly-draft-vertex${index === 0 && canClose ? ' is-close' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (index === 0 && canClose) finishDrawing()
                      }}
                    />
                  ))}
                  {cursor && !closingHover ? (
                    <circle cx={cursor[0]} cy={cursor[1]} r="1" className="ss-poly-cursor" />
                  ) : null}
                </g>
              ) : null}

              {people.map((zone) => {
                const frame = zone.track?.[0] || zone
                return <ellipse key={zone.zoneId} cx={frame.x} cy={frame.y} rx={frame.rx || zone.rx || 4} ry={frame.ry || zone.ry || 2.4} className="ss-poly-person" style={{ color: zone.color }} />
              })}
            </svg>
            {!drawing ? areas.map((zone) => {
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
            }) : null}
          </div>
          <p className="ss-footnote">
            {drawing
              ? 'Shortcuts: Esc cancels, Backspace undoes the last point, Enter finishes (3+ points), double-click finishes.'
              : `Tracked people (dashed ellipses) come from the detector and are shown for reference only. ${people.length} on this camera.`}
          </p>
        </Card>

        <div className="ss-poly-side">
          <Card className="ss-panel-card">
            <header className="ss-section-head">
              <SectionLabel>ZONES ON THIS CAMERA</SectionLabel>
              <h3>{areas.length} polygon{areas.length === 1 ? '' : 's'}</h3>
            </header>
            <div className="ss-poly-list">
              {areas.map((zone) => (
                <div key={zone.zoneId} className={`ss-poly-item-row${zone.zoneId === selectedId && !drawing ? ' is-on' : ''}`}>
                  <button type="button" className="ss-poly-item" onClick={() => { if (!drawing) setSelectedId(zone.zoneId) }} disabled={Boolean(drawing)}>
                    <i style={{ background: zone.color }} />
                    <span><strong>{zone.label}</strong><em>{ROLE_OPTIONS.find(([key]) => key === zone.role)?.[1] || zone.role} · {zone.points.length} pts</em></span>
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${zone.label}`}
                    disabled={Boolean(drawing)}
                    onClick={() => {
                      removeZone(video.videoId, zone.zoneId)
                      if (selectedId === zone.zoneId) setSelectedId(null)
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {areas.length === 0 ? <p className="ss-muted">No polygons yet. Click Draw polygon and place corners on the camera frame.</p> : null}
            </div>
          </Card>

          {selected && !drawing ? (
            <Card className="ss-panel-card">
              <header className="ss-section-head ss-section-head-row">
                <div>
                  <SectionLabel>SELECTED</SectionLabel>
                  <h3>{selected.label}</h3>
                </div>
                <button type="button" className="icon-button" aria-label="Delete polygon" onClick={removeSelected}><Trash2 size={15} /></button>
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
                      <div key={index} className="ss-vertex-row">
                        <span className="mono">{index + 1}: {point[0].toFixed(1)}, {point[1].toFixed(1)}</span>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Remove vertex ${index + 1}`}
                          disabled={selected.points.length <= 3}
                          onClick={() => updateZone(video.videoId, selected.zoneId, { points: selected.points.filter((_, i) => i !== index) })}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="ss-form-actions ss-form-actions-left">
                    <Button variant="secondary" onClick={() => {
                      const points = selected.points
                      const [ax, ay] = points[points.length - 1]
                      const [bx, by] = points[0]
                      updateZone(video.videoId, selected.zoneId, { points: [...points, roundPoint([(ax + bx) / 2, (ay + by) / 2])] })
                    }}>Add vertex</Button>
                    <Button variant="secondary" disabled={selected.points.length <= 3} onClick={() => updateZone(video.videoId, selected.zoneId, { points: selected.points.slice(0, -1) })}>Remove last</Button>
                  </div>
                </div>
                <Button variant="secondary" onClick={removeSelected}><Trash2 size={14} /> Remove this polygon</Button>
              </div>
            </Card>
          ) : null}

          {drawing ? (
            <Card className="ss-panel-card">
              <header className="ss-section-head">
                <SectionLabel>DRAFT</SectionLabel>
                <h3>{drawing.label}</h3>
                <p className="ss-muted" style={{ margin: '6px 0 0' }}>Place corners on the video. Nothing is saved until you finish.</p>
              </header>
              <div className="ss-poly-form">
                <label className="field-label">Display name<input value={drawing.label} onChange={(e) => setDrawing((prev) => prev ? { ...prev, label: e.target.value } : prev)} /></label>
                <label className="field-label">Type
                  <select value={drawing.role} onChange={(e) => setDrawing((prev) => prev ? { ...prev, role: e.target.value } : prev)}>
                    {ROLE_OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <div className="field-label">Colour
                  <div className="ss-swatches">
                    {COLORS.map((color) => (
                      <button key={color} type="button" className={`ss-swatch${drawing.color === color ? ' is-on' : ''}`} style={{ background: color }} aria-label={color} onClick={() => setDrawing((prev) => prev ? { ...prev, color } : prev)} />
                    ))}
                  </div>
                </div>
                <div className="field-label">Points placed
                  <div className="ss-vertex-list">
                    {draftPoints.length === 0 ? <span className="ss-muted">None yet</span> : null}
                    {draftPoints.map((point, index) => (
                      <span key={index} className="mono">{index + 1}: {point[0].toFixed(1)}, {point[1].toFixed(1)}</span>
                    ))}
                  </div>
                </div>
                <div className="ss-form-actions ss-form-actions-left">
                  <Button variant="secondary" disabled={!draftPoints.length} onClick={undoLastPoint}><Undo2 size={14} /> Undo</Button>
                  <Button variant="secondary" onClick={cancelDrawing}><Trash2 size={14} /> Remove draft</Button>
                  <Button disabled={!canClose} onClick={() => finishDrawing()}><Check size={14} /> Finish</Button>
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
      <SettingsSaveBar note="Polygon edits apply live. Save writes area zones into" />
    </div>
  )
}
