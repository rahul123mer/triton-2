import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Card, Modal, SectionLabel } from '../../../components/ui'
import { cameras, lookup } from '../../data'
import { StatGrid, SubNav } from '../../widgets'
import { useConfigStore } from '../../configStore'
import { SETTINGS_NAV } from './settingsNav'
import { SettingsSaveBar } from './SettingsSaveBar'

const SECTIONS = ['Booths', 'Centre', 'Wide floor', 'Patio', 'Private dining', 'Bar']
const SHAPES = ['Round', 'Square', 'Rectangle', 'Oval']

export function TablesConfigPage() {
  const tables = useConfigStore((s) => s.tables)
  const updateTable = useConfigStore((s) => s.updateTable)
  const addTable = useConfigStore((s) => s.addTable)
  const removeTable = useConfigStore((s) => s.removeTable)
  const [adding, setAdding] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const seats = tables.reduce((sum, row) => sum + Number(row.seats || 0), 0)
  const diningCams = cameras.filter((row) => row.zone === 'dining')
  const nextCode = (() => {
    const used = new Set(tables.map((row) => row.code.toUpperCase()))
    let n = 1
    while (used.has(`T${String(n).padStart(2, '0')}`)) n += 1
    return `T${String(n).padStart(2, '0')}`
  })()

  return (
    <div className="ss-settings">
      <SubNav items={SETTINGS_NAV} />
      <StatGrid
        columns={4}
        items={[
          { label: 'Tables', value: tables.length },
          { label: 'Seats', value: seats },
          { label: 'Reserved at dinner', value: tables.filter((row) => row.reservedDinner).length },
          { label: 'Cameras covering', value: new Set(tables.map((row) => row.cameraId)).size, hint: diningCams.map((row) => row.name).join(', ') },
        ]}
      />
      <Card className="ss-panel-card">
        <header className="ss-section-head ss-section-head-row">
          <div>
            <SectionLabel>TABLE REGISTRATION</SectionLabel>
            <h3>Register floor tables</h3>
            <p>Each table needs a unique Table ID (code), seat count and camera. Name, section and shape help staff recognise it on the floor plan and in analytics.</p>
          </div>
          <Button onClick={() => setAdding(true)}><Plus size={14} /> Register table</Button>
        </header>
        <div className="table-scroll">
          <table className="ss-rank is-dense ss-config-table">
            <thead>
              <tr>
                <th>Table ID</th>
                <th>Display name</th>
                <th>Seats</th>
                <th>Section</th>
                <th>Shape</th>
                <th>Camera</th>
                <th>Reserved at dinner</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tables.map((row) => (
                <tr key={row.tableId}>
                  <td>
                    <input
                      className="ss-inline-input ss-inline-code"
                      value={row.code}
                      onChange={(e) => updateTable(row.tableId, { code: e.target.value.toUpperCase().slice(0, 6) })}
                      aria-label={`Table ID for ${row.code}`}
                    />
                    <code className="ss-code ss-code-muted">{row.tableId}</code>
                  </td>
                  <td>
                    <input
                      className="ss-inline-input"
                      value={row.name || ''}
                      placeholder="e.g. Window booth"
                      onChange={(e) => updateTable(row.tableId, { name: e.target.value })}
                      aria-label={`Display name for ${row.code}`}
                    />
                  </td>
                  <td>
                    <input
                      className="ss-inline-input ss-inline-num"
                      type="number"
                      min={1}
                      max={16}
                      value={row.seats}
                      onChange={(e) => updateTable(row.tableId, { seats: Number(e.target.value) })}
                      aria-label={`Seats for ${row.code}`}
                    />
                  </td>
                  <td>
                    <select className="ss-inline-input" value={row.section || 'Centre'} onChange={(e) => updateTable(row.tableId, { section: e.target.value })} aria-label={`Section for ${row.code}`}>
                      {SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="ss-inline-input" value={row.shape || 'Square'} onChange={(e) => updateTable(row.tableId, { shape: e.target.value })} aria-label={`Shape for ${row.code}`}>
                      {SHAPES.map((shape) => <option key={shape} value={shape}>{shape}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="ss-inline-input" value={row.cameraId} onChange={(e) => updateTable(row.tableId, { cameraId: e.target.value })} aria-label={`Camera for ${row.code}`}>
                      {diningCams.map((camera) => <option key={camera.cameraId} value={camera.cameraId}>{camera.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <label className="ss-switch">
                      <input type="checkbox" checked={Boolean(row.reservedDinner)} onChange={(e) => updateTable(row.tableId, { reservedDinner: e.target.checked })} aria-label={`Reserved at dinner for ${row.code}`} />
                      <i /><span>{row.reservedDinner ? 'Reserved' : 'Walk-in'}</span>
                    </label>
                  </td>
                  <td>
                    <input
                      className="ss-inline-input"
                      value={row.notes || ''}
                      placeholder="Optional"
                      onChange={(e) => updateTable(row.tableId, { notes: e.target.value })}
                      aria-label={`Notes for ${row.code}`}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="icon-button" aria-label={`Remove ${row.code}`} onClick={() => setConfirm(row)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ss-footnote">Table ID is the short code shown in Analytics and on polygons. Internal id stays stable when you rename the code. After registering, draw the polygon under Settings → Polygons. Camera coverage: {diningCams.map((camera) => `${camera.name} → ${lookup.camera[camera.cameraId]?.coverage}`).join(' · ')}.</p>
      </Card>

      {adding ? (
        <RegisterTableModal
          onClose={() => setAdding(false)}
          cameras={diningCams}
          nextCode={nextCode}
          existingCodes={tables.map((row) => row.code.toUpperCase())}
          onAdd={(partial) => { addTable(partial); setAdding(false) }}
        />
      ) : null}

      {confirm ? (
        <Modal
          title={`Remove ${confirm.code}?`}
          onClose={() => setConfirm(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button onClick={() => { removeTable(confirm.tableId); setConfirm(null) }}>Remove table</Button>
          </>}
        >
          <p>Existing occupancy events keep their historical table reference. New uploads will no longer map to {confirm.code}.</p>
        </Modal>
      ) : null}
      <SettingsSaveBar note="Table registration applies live. Save writes the floor list into" />
    </div>
  )
}

function RegisterTableModal({ onClose, onAdd, cameras: cams, nextCode, existingCodes }) {
  const [code, setCode] = useState(nextCode)
  const [name, setName] = useState('')
  const [seats, setSeats] = useState(4)
  const [section, setSection] = useState('Centre')
  const [shape, setShape] = useState('Square')
  const [cameraId, setCameraId] = useState(cams[cams.length - 1]?.cameraId || 'cam-df-03')
  const [reserved, setReserved] = useState(false)
  const [notes, setNotes] = useState('')
  const duplicate = existingCodes.includes(code.trim().toUpperCase())
  const canSubmit = code.trim().length >= 2 && !duplicate

  return (
    <Modal
      title="Register table"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!canSubmit}
          onClick={() => onAdd({
            code: code.trim().toUpperCase(),
            name: name.trim(),
            seats: Number(seats),
            section,
            shape,
            cameraId,
            reservedDinner: reserved,
            notes: notes.trim(),
          })}
        >
          <Plus size={14} /> Register table
        </Button>
      </>}
    >
      <div className="ss-form-grid ss-form-grid-2">
        <label className="field-label">Table ID<input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="T11" autoFocus /></label>
        <label className="field-label">Display name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chef&apos;s table" /></label>
        <label className="field-label">Seats<input type="number" min={1} max={16} value={seats} onChange={(e) => setSeats(e.target.value)} /></label>
        <label className="field-label">Section
          <select value={section} onChange={(e) => setSection(e.target.value)}>
            {SECTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="field-label">Shape
          <select value={shape} onChange={(e) => setShape(e.target.value)}>
            {SHAPES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="field-label">Camera
          <select value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
            {cams.map((camera) => <option key={camera.cameraId} value={camera.cameraId}>{camera.name}</option>)}
          </select>
        </label>
        <label className="field-label ss-check-label"><input type="checkbox" checked={reserved} onChange={(e) => setReserved(e.target.checked)} /> Reserved at dinner</label>
        <label className="field-label" style={{ gridColumn: '1 / -1' }}>Notes<textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Accessibility, power outlet, preferred covers…" /></label>
      </div>
      {duplicate ? <p className="ss-form-error" role="alert">Table ID {code.toUpperCase()} is already registered.</p> : null}
      <p className="ss-footnote">After registering, draw its polygon under Settings → Polygons so occupancy is detected on that camera.</p>
    </Modal>
  )
}
