import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Film, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { Button, Card, SectionLabel, StatusPill } from '../../../components/ui'
import { EmptyFilter } from '../../components'
import { cameras, lookup, timeWindows } from '../../data'
import { formatClock, formatDateChip, formatDwell } from '../../format'
import { RankTable, StatGrid, SubNav } from '../../widgets'
import { useConfigStore } from '../../configStore'

export const SETTINGS_NAV = [
  { label: 'Uploads video', to: '/restaurant/settings/uploads' },
  { label: 'Tables', to: '/restaurant/settings/tables' },
  { label: 'Cookbooks', to: '/restaurant/settings/cookbooks' },
  { label: 'Polygons', to: '/restaurant/settings/polygons' },
]

const STAGES = [
  [0.18, 'Uploading'],
  [0.42, 'Transcoding'],
  [0.7, 'Detecting people and faces'],
  [0.9, 'Matching cohorts and zones'],
  [1, 'Writing events'],
]

export function UploadsPage() {
  const navigate = useNavigate()
  const uploads = useConfigStore((s) => s.uploads)
  const queueUpload = useConfigStore((s) => s.queueUpload)
  const updateUpload = useConfigStore((s) => s.updateUpload)
  const removeUpload = useConfigStore((s) => s.removeUpload)
  const log = useConfigStore((s) => s.log)
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [cameraId, setCameraId] = useState('cam-df-01')
  const [recordedOn, setRecordedOn] = useState('2026-09-16')
  const [windowId, setWindowId] = useState('dinner')
  const [error, setError] = useState(null)
  const timers = useRef({})

  useEffect(() => () => Object.values(timers.current).forEach(clearInterval), [])

  const processed = uploads.filter((row) => row.status === 'processed')
  const totalHours = processed.reduce((sum, row) => sum + (row.durationMs || 0), 0)

  const simulate = (uploadId, sizeMb) => {
    const started = Date.now()
    const totalMs = Math.min(14000, 6000 + sizeMb * 2)
    timers.current[uploadId] = setInterval(() => {
      const pct = Math.min(1, (Date.now() - started) / totalMs)
      const stage = STAGES.find(([limit]) => pct <= limit)?.[1] || 'Writing events'
      if (pct >= 1) {
        clearInterval(timers.current[uploadId])
        delete timers.current[uploadId]
        updateUpload(uploadId, {
          status: 'processed',
          progress: 100,
          stage: null,
          durationMs: 3 * 3600000,
          events: 40 + Math.round(sizeMb / 40),
          faces: 3 + (sizeMb % 3),
        })
        log('Upload processed and events written')
        return
      }
      updateUpload(uploadId, { status: pct < 0.18 ? 'uploading' : 'processing', progress: Math.round(pct * 100), stage })
    }, 400)
  }

  const submit = () => {
    if (!file) {
      setError('Choose a recording first.')
      return
    }
    if (!/\.(mp4|mov|mkv)$/i.test(file.name)) {
      setError('Only MP4, MOV or MKV exports are accepted.')
      return
    }
    setError(null)
    const sizeMb = Math.max(1, Math.round(file.size / 1024 / 1024))
    const uploadId = queueUpload({
      fileName: file.name,
      sizeMb,
      cameraId,
      recordedOn,
      window: timeWindows.find((row) => row.windowId === windowId)?.label || 'Custom',
    })
    simulate(uploadId, sizeMb)
    setFile(null)
  }

  return (
    <div className="ss-settings">
      <SubNav items={SETTINGS_NAV} />
      <StatGrid
        columns={4}
        items={[
          { label: 'Recordings processed', value: processed.length, hint: `${formatDwell(totalHours).replace(/ 0s$/, '')} of footage` },
          { label: 'In progress', value: uploads.filter((row) => ['uploading', 'processing'].includes(row.status)).length },
          { label: 'Failed', value: uploads.filter((row) => row.status === 'failed').length, tone: uploads.some((row) => row.status === 'failed') ? 'warn' : undefined },
          { label: 'Events written', value: uploads.reduce((sum, row) => sum + (row.events || 0), 0) },
        ]}
      />

      <div className="ss-settings-grid">
        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>UPLOAD</SectionLabel>
            <h3>Add a camera recording</h3>
            <p>One export per camera per service. Tag it so events land on the right tables and stations.</p>
          </header>
          <button type="button" className={`ss-dropzone ss-dropzone-wide${file ? ' has-file' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files?.[0] || null); setError(null) }}>
            <Upload size={26} />
            <strong>{file ? file.name : 'Drop an NVR export or click to browse'}</strong>
            <span>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'MP4, MOV or MKV · multipart upload · safe to leave the page'}</span>
            {file ? <i className="ss-dropzone-clear" role="button" aria-label="Clear file" onClick={(e) => { e.stopPropagation(); setFile(null) }}><X size={14} /></i> : null}
          </button>
          <input ref={inputRef} hidden type="file" accept="video/*,.mkv" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null) }} />
          <div className="ss-form-grid">
            <label className="field-label">Camera
              <select value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
                {cameras.map((camera) => <option key={camera.cameraId} value={camera.cameraId}>{camera.name} · {camera.coverage}</option>)}
              </select>
            </label>
            <label className="field-label">Recorded on<input type="date" value={recordedOn} onChange={(e) => setRecordedOn(e.target.value)} /></label>
            <label className="field-label">Service window
              <select value={windowId} onChange={(e) => setWindowId(e.target.value)}>
                {timeWindows.filter((row) => row.windowId !== 'custom').map((row) => <option key={row.windowId} value={row.windowId}>{row.label} · {row.start.slice(0, 5)}–{row.end.slice(0, 5)}</option>)}
              </select>
            </label>
          </div>
          {error ? <p className="ss-form-error" role="alert">{error}</p> : null}
          <div className="ss-form-actions">
            <Button onClick={submit} disabled={!file}><Upload size={14} /> Upload and process</Button>
          </div>
        </Card>

        <Card className="ss-panel-card">
          <header className="ss-section-head">
            <SectionLabel>WHAT HAPPENS NEXT</SectionLabel>
            <h3>Processing pipeline</h3>
          </header>
          <ol className="ss-steps">
            <li><strong>Transcode</strong><span>Normalise the export and read the burned-in clock.</span></li>
            <li><strong>Detect</strong><span>People tracked frame to frame; faces embedded.</span></li>
            <li><strong>Match</strong><span>Faces compared with the Kitchen and Serving cohorts. Unmatched faces go to the Resolve queue.</span></li>
            <li><strong>Zones</strong><span>Tracks intersected with the polygons for this camera to produce occupancy, visit and station events.</span></li>
            <li><strong>Publish</strong><span>Events appear in Analytics for the tagged date and window.</span></li>
          </ol>
          <Button variant="secondary" onClick={() => navigate('/restaurant/settings/polygons')}>Check polygons for {lookup.camera[cameraId]?.name}</Button>
        </Card>
      </div>

      <Card className="ss-panel-card">
        <header className="ss-section-head ss-section-head-row">
          <div>
            <SectionLabel>HISTORY</SectionLabel>
            <h3>Uploads</h3>
            <p>Every recording submitted for this restaurant, newest first.</p>
          </div>
          <span className="list-count">{uploads.length} recordings</span>
        </header>
        {uploads.length === 0 ? <EmptyFilter title="No uploads yet" detail="Add a recording above." /> : (
          <RankTable
            rows={uploads}
            rowKey={(row) => row.uploadId}
            defaultSort={null}
            columns={[
              { key: 'fileName', label: 'Recording', sortValue: (row) => row.fileName, render: (row) => (
                <span className="ss-file-cell"><Film size={15} /><span><strong>{row.fileName}</strong><em>{row.sizeMb ? `${row.sizeMb.toLocaleString()} MB` : ''}{row.durationMs ? ` · ${formatDwell(row.durationMs).replace(/ 0m 0s$/, '')}` : ''}</em></span></span>
              ) },
              { key: 'camera', label: 'Camera', sortValue: (row) => lookup.camera[row.cameraId]?.name, render: (row) => lookup.camera[row.cameraId]?.name || row.cameraId },
              { key: 'recordedOn', label: 'Service', sortValue: (row) => `${row.recordedOn} ${row.window}`, render: (row) => `${formatDateChip(row.recordedOn)} · ${row.window}` },
              { key: 'uploadedAt', label: 'Uploaded', sortValue: (row) => row.uploadedAt, render: (row) => `${formatDateChip(row.uploadedAt.slice(0, 10))} ${formatClock(row.uploadedAt).slice(0, 5)}` },
              { key: 'status', label: 'Status', sortValue: (row) => row.status, render: (row) => (
                row.status === 'uploading' || row.status === 'processing'
                  ? <span className="ss-progress-cell"><span className="ss-progress"><i style={{ width: `${row.progress || 0}%` }} /></span><em>{row.stage || 'Queued'} · {row.progress || 0}%</em></span>
                  : row.status === 'failed'
                    ? <span className="ss-failed-cell" title={row.error}><StatusPill status="failed" /><em>{row.error}</em></span>
                    : <span className="ss-ok-cell"><CheckCircle2 size={14} /> Processed</span>
              ) },
              { key: 'events', label: 'Events', align: 'right', render: (row) => (row.status === 'processed' ? row.events : '—') },
              { key: 'faces', label: 'Faces', align: 'right', render: (row) => (row.status === 'processed' ? row.faces : '—') },
              { key: 'actions', label: '', sortable: false, align: 'right', render: (row) => (
                <span className="ss-row-actions">
                  {row.status === 'failed' ? <button type="button" className="icon-button" aria-label="Retry" onClick={() => { updateUpload(row.uploadId, { status: 'uploading', progress: 0, error: null }); simulate(row.uploadId, row.sizeMb || 800) }}><RefreshCw size={14} /></button> : null}
                  {row.status === 'processed' ? <button type="button" className="icon-button" aria-label="Open analytics" onClick={() => navigate('/restaurant/analytics')}><Film size={14} /></button> : null}
                  <button type="button" className="icon-button" aria-label="Remove from history" onClick={() => removeUpload(row.uploadId)}><Trash2 size={14} /></button>
                </span>
              ) },
            ]}
          />
        )}
      </Card>
    </div>
  )
}
