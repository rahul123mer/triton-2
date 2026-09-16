import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Card, Modal, SectionLabel } from '../../../components/ui'
import { cameras, lookup } from '../../data'
import { StatGrid, SubNav } from '../../widgets'
import { useConfigStore } from '../../configStore'
import { SETTINGS_NAV } from './UploadsPage'

export function TablesConfigPage() {
  const tables = useConfigStore((s) => s.tables)
  const updateTable = useConfigStore((s) => s.updateTable)
  const addTable = useConfigStore((s) => s.addTable)
  const removeTable = useConfigStore((s) => s.removeTable)
  const [adding, setAdding] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const seats = tables.reduce((sum, row) => sum + Number(row.seats || 0), 0)
  const diningCams = cameras.filter((row) => row.zone === 'dining')

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
            <SectionLabel>TABLE CONFIGURATION</SectionLabel>
            <h3>Floor plan tables</h3>
            <p>The table code is what appears in analytics and on polygons. Seats set the covers ceiling. Camera decides which polygon set watches the table.</p>
          </div>
          <Button onClick={() => setAdding(true)}><Plus size={14} /> Add table</Button>
        </header>
        <div className="table-scroll">
          <table className="ss-rank is-dense ss-config-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Seats</th>
                <th>Camera</th>
                <th>Zone</th>
                <th>Reserved at dinner</th>
                <th>Position (x, y %)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tables.map((row) => (
                <tr key={row.tableId}>
                  <td><input className="ss-inline-input ss-inline-code" value={row.code} onChange={(e) => updateTable(row.tableId, { code: e.target.value.toUpperCase().slice(0, 4) })} aria-label={`Code for ${row.code}`} /></td>
                  <td><input className="ss-inline-input ss-inline-num" type="number" min={1} max={12} value={row.seats} onChange={(e) => updateTable(row.tableId, { seats: Number(e.target.value) })} aria-label={`Seats for ${row.code}`} /></td>
                  <td>
                    <select className="ss-inline-input" value={row.cameraId} onChange={(e) => updateTable(row.tableId, { cameraId: e.target.value })} aria-label={`Camera for ${row.code}`}>
                      {diningCams.map((camera) => <option key={camera.cameraId} value={camera.cameraId}>{camera.name}</option>)}
                    </select>
                  </td>
                  <td><code className="ss-code">zone-{row.tableId}</code></td>
                  <td>
                    <label className="ss-switch">
                      <input type="checkbox" checked={Boolean(row.reservedDinner)} onChange={(e) => updateTable(row.tableId, { reservedDinner: e.target.checked })} aria-label={`Reserved at dinner for ${row.code}`} />
                      <i /><span>{row.reservedDinner ? 'Reserved' : 'Walk-in'}</span>
                    </label>
                  </td>
                  <td className="ss-muted mono">{row.x}, {row.y}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="icon-button" aria-label={`Remove ${row.code}`} onClick={() => setConfirm(row)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ss-footnote">Changes apply to new uploads. Existing events keep the table they were recorded against. Camera coverage: {diningCams.map((camera) => `${camera.name} → ${lookup.camera[camera.cameraId]?.coverage}`).join(' · ')}.</p>
      </Card>

      {adding ? <AddTableModal onClose={() => setAdding(false)} onAdd={(partial) => { addTable(partial); setAdding(false) }} cameras={diningCams} nextCode={`T${String(tables.length + 1).padStart(2, '0')}`} /> : null}
      {confirm ? (
        <Modal
          title={`Remove ${confirm.code}?`}
          onClose={() => setConfirm(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Keep</Button>
            <Button onClick={() => { removeTable(confirm.tableId); setConfirm(null) }}>Remove table</Button>
          </>}
        >
          <p>The table is removed from the floor plan and its polygon stops producing occupancy events. Historical sessions are kept.</p>
        </Modal>
      ) : null}
    </div>
  )
}

function AddTableModal({ onClose, onAdd, cameras: cams, nextCode }) {
  const [code, setCode] = useState(nextCode)
  const [seats, setSeats] = useState(4)
  const [cameraId, setCameraId] = useState(cams[cams.length - 1]?.cameraId || 'cam-df-03')
  const [reserved, setReserved] = useState(false)
  return (
    <Modal
      title="Add table"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={!code.trim()} onClick={() => onAdd({ code: code.trim().toUpperCase(), seats: Number(seats), cameraId, reservedDinner: reserved })}>Add table</Button>
      </>}
    >
      <div className="ss-form-grid ss-form-grid-2">
        <label className="field-label">Code<input value={code} onChange={(e) => setCode(e.target.value)} maxLength={4} /></label>
        <label className="field-label">Seats<input type="number" min={1} max={12} value={seats} onChange={(e) => setSeats(e.target.value)} /></label>
        <label className="field-label">Camera
          <select value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
            {cams.map((camera) => <option key={camera.cameraId} value={camera.cameraId}>{camera.name}</option>)}
          </select>
        </label>
        <label className="field-label ss-check-label"><input type="checkbox" checked={reserved} onChange={(e) => setReserved(e.target.checked)} /> Reserved at dinner</label>
      </div>
      <p className="ss-footnote">After adding, draw its polygon under Settings → Polygons so occupancy is detected.</p>
    </Modal>
  )
}
