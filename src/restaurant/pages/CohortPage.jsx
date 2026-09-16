import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUp, Plus, Search, Trash2, UserCheck, UserRound } from 'lucide-react'
import { Button, Card, Modal, SectionLabel } from '../../components/ui'
import { EmptyFilter, useRestaurantRanges } from '../components'
import { kitchenPerformance, serverPerformance } from '../analytics'
import { lookup } from '../data'
import { formatClock, formatDwell, formatPercent } from '../format'
import { AttentionPill, Avatar } from '../widgets'
import { useConfigStore } from '../configStore'

const COPY = {
  waiter: {
    eyebrow: 'SERVING STAFF',
    title: 'Serving staff cohort',
    lead: 'Everyone the floor cameras should recognise. Enrol a face once and every visit they make to an occupied table is attributed to them.',
    enroll: 'Enrol server',
    kind: 'server',
    drill: (id) => `/restaurant/analytics/servers/${id}`,
  },
  kitchen: {
    eyebrow: 'KITCHEN STAFF',
    title: 'Kitchen staff cohort',
    lead: 'Everyone the kitchen cameras should recognise. Station time is attributed to enrolled faces only.',
    enroll: 'Enrol cook',
    kind: 'cook',
    drill: (id) => `/restaurant/analytics/kitchen/${id}`,
  },
}

export function CohortPage({ role }) {
  const navigate = useNavigate()
  const copy = COPY[role]
  const { ranges, periodLabel } = useRestaurantRanges()
  const waiters = useConfigStore((s) => s.waiters)
  const kitchenStaff = useConfigStore((s) => s.kitchenStaff)
  const unresolvedAll = useConfigStore((s) => s.unresolved)
  const removePerson = useConfigStore((s) => s.removePerson)
  const [query, setQuery] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [resolving, setResolving] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const people = role === 'kitchen' ? kitchenStaff : waiters
  const unresolved = unresolvedAll.filter((row) => row.role === role)
  const stats = useMemo(() => {
    const rows = role === 'kitchen' ? kitchenPerformance(ranges) : serverPerformance(ranges)
    return Object.fromEntries(rows.map((row) => [row.personId, row]))
  }, [ranges, role])
  const filtered = people.filter((person) => !query.trim() || person.name.toLowerCase().includes(query.trim().toLowerCase()) || (person.employeeCode || '').toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="ss-cohort">
      <div className="page-heading ss-cohort-head">
        <div>
          <SectionLabel blue>{copy.eyebrow}</SectionLabel>
          <h2>{copy.title}</h2>
          <p>{copy.lead}</p>
        </div>
        <Button onClick={() => setEnrolling(true)}><Plus size={14} /> {copy.enroll}</Button>
      </div>

      <div className="list-toolbar ss-analytics-toolbar">
        <div className="lib-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or employee code…" aria-label="Search cohort" /></div>
        <span className="list-count">{people.length} enrolled · {unresolved.length} unresolved · {periodLabel}</span>
      </div>

      <div className="ss-cohort-grid">
        {filtered.map((person) => {
          const stat = stats[person.personId]
          return (
            <Card key={person.personId} className={`ss-cohort-card${person.pending ? ' is-pending' : ''}`}>
              <button type="button" className="ss-cohort-open" onClick={() => navigate(copy.drill(person.personId))}>
                <Avatar person={person} size={72} className="ss-cohort-avatar" />
                <strong>{person.name}</strong>
                <span>{person.title ? `${person.title} · ` : ''}{person.employeeCode}</span>
              </button>
              <dl className="ss-cohort-facts">
                <div><dt>Enrolled</dt><dd>{person.enrolledOn || 'today'}</dd></div>
                <div><dt>Samples</dt><dd>{person.samples ?? 1}</dd></div>
                {role === 'kitchen' ? (
                  <>
                    <div><dt>Station time</dt><dd>{stat?.dwellMs ? formatDwell(stat.dwellMs) : '—'}</dd></div>
                    <div><dt>Primary</dt><dd>{stat?.primaryRegion?.name || person.station || '—'}</dd></div>
                  </>
                ) : (
                  <>
                    <div><dt>Visits</dt><dd>{stat?.visitCount ?? 0}</dd></div>
                    <div><dt>Attention</dt><dd>{stat?.visitCount ? <AttentionPill score={stat.attention} compact /> : '—'}</dd></div>
                  </>
                )}
              </dl>
              <footer className="ss-cohort-foot">
                <span className={`ss-enrolled-pill${person.pending ? ' is-pending' : ''}`}>{person.pending ? 'Indexing samples' : 'Recognised'}</span>
                <button type="button" className="icon-button" aria-label={`Remove ${person.name}`} onClick={() => setConfirmRemove(person)}><Trash2 size={15} /></button>
              </footer>
            </Card>
          )
        })}
        {filtered.length === 0 ? <Card><EmptyFilter title="No one matches" detail="Clear the search or enrol a new person." /></Card> : null}
      </div>

      <Card className="ss-panel-card">
        <header className="ss-section-head ss-section-head-row">
          <div>
            <SectionLabel>UNRESOLVED / DETECTED</SectionLabel>
            <h3>Faces the cameras saw but could not name</h3>
            <p>Resolve to an enrolled {copy.kind}, or enrol as a new person. Their past detections are re-attributed.</p>
          </div>
          <span className="list-count">{unresolved.length} pending</span>
        </header>
        {unresolved.length === 0 ? <EmptyFilter title="Queue is clear" detail="New unmatched faces appear here after the next upload is processed." /> : (
          <div className="ss-unresolved-grid">
            {unresolved.map((row) => (
              <div key={row.unresolvedId} className="ss-unresolved-card">
                <Avatar person={{ personId: row.unresolvedId, name: '?', avatar: row.sample }} size={64} />
                <div className="ss-unresolved-copy">
                  <strong>Unresolved {copy.kind} · {lookup.camera[row.cameraId]?.name}</strong>
                  <span>{row.occurrences} detections · {formatClock(`${ranges[0].date}T${row.firstSeen}+05:30`)} – {formatClock(`${ranges[0].date}T${row.lastSeen}+05:30`)}</span>
                  <span>{row.note}</span>
                  <span>Best match: {lookup.person[row.bestMatch.personId]?.name} at {formatPercent(row.bestMatch.similarity)} (below threshold)</span>
                </div>
                <div className="ss-unresolved-actions">
                  <Button variant="secondary" onClick={() => setResolving(row)}><UserCheck size={14} /> Resolve face</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {enrolling ? <EnrollModal role={role} onClose={() => setEnrolling(false)} /> : null}
      {resolving ? <ResolveModal row={resolving} onClose={() => setResolving(null)} /> : null}
      {confirmRemove ? (
        <Modal
          title={`Remove ${confirmRemove.name}?`}
          onClose={() => setConfirmRemove(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setConfirmRemove(null)}>Keep</Button>
            <Button variant="danger" onClick={() => { removePerson(confirmRemove.personId); setConfirmRemove(null) }}>Remove from cohort</Button>
          </>}
        >
          <p>Their enrolled face samples are removed and future detections will land in the unresolved queue. Past analytics stay attributed.</p>
        </Modal>
      ) : null}
    </div>
  )
}

export function EnrollModal({ role, onClose, initialName = '', initialAvatar = null }) {
  const enrollPerson = useConfigStore((s) => s.enrollPerson)
  const [name, setName] = useState(initialName)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState(role === 'kitchen' ? 'Cook' : 'Server')
  const [station, setStation] = useState('Food prep')
  const [preview, setPreview] = useState(initialAvatar)
  const [files, setFiles] = useState([])
  const [done, setDone] = useState(null)
  const inputRef = useRef(null)
  const canSubmit = name.trim().length > 1 && (files.length > 0 || preview)

  const pick = (list) => {
    const arr = Array.from(list || [])
    if (!arr.length) return
    setFiles(arr)
    const url = URL.createObjectURL(arr[0])
    setPreview(url)
  }

  return (
    <Modal
      title={`Enrol ${role === 'kitchen' ? 'kitchen staff' : 'serving staff'}`}
      onClose={onClose}
      footer={done ? <Button onClick={onClose}>Done</Button> : <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={!canSubmit} onClick={() => {
          const person = enrollPerson({ name: name.trim(), role, employeeCode: code.trim() || undefined, avatar: preview, title, station })
          setDone(person)
        }}><FileUp size={14} /> Enrol</Button>
      </>}
    >
      {done ? (
        <div className="ss-enroll-done">
          <Avatar person={done} size={64} />
          <div>
            <strong>{done.name} is enrolled</strong>
            <p>{files.length || 1} sample{files.length === 1 ? '' : 's'} indexed. Recognition starts with the next processed upload; detections that already match will move out of the unresolved queue.</p>
          </div>
        </div>
      ) : (
        <div className="ss-enroll-form">
          <button type="button" className={`ss-dropzone${preview ? ' has-preview' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files) }}>
            {preview ? <img src={preview} alt="" /> : <UserRound size={28} />}
            <strong>{files.length ? `${files.length} photo${files.length === 1 ? '' : 's'} selected` : preview ? 'Using detected face sample' : 'Drop face photos or click to browse'}</strong>
            <span>Frontal, well lit. 3–6 photos give the best match rate.</span>
          </button>
          <input ref={inputRef} hidden type="file" accept="image/*" multiple onChange={(e) => pick(e.target.files)} />
          <label className="field-label">Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Nair" /></label>
          <div className="ss-form-row">
            <label className="field-label">Employee code<input value={code} onChange={(e) => setCode(e.target.value)} placeholder={role === 'kitchen' ? 'KIT-0xx' : 'SRV-0xx'} /></label>
            <label className="field-label">Role title
              <select value={title} onChange={(e) => setTitle(e.target.value)}>
                {(role === 'kitchen' ? ['Cook', 'Chef de partie', 'Head chef', 'Pastry cook', 'Commis'] : ['Server', 'Senior server', 'Sommelier', 'Runner', 'Host']).map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>
          {role === 'kitchen' ? (
            <label className="field-label">Home station
              <select value={station} onChange={(e) => setStation(e.target.value)}>
                {['Food prep', 'Cooking line', 'Cold prep', 'Final assembly', 'Pastry finishing', 'Pass'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          ) : null}
        </div>
      )}
    </Modal>
  )
}

export function ResolveModal({ row, onClose }) {
  const waiters = useConfigStore((s) => s.waiters)
  const kitchenStaff = useConfigStore((s) => s.kitchenStaff)
  const resolveUnresolved = useConfigStore((s) => s.resolveUnresolved)
  const dismissUnresolved = useConfigStore((s) => s.dismissUnresolved)
  const candidates = row.role === 'kitchen' ? kitchenStaff : waiters
  const [mode, setMode] = useState('existing')
  const [personId, setPersonId] = useState(row.bestMatch?.personId || candidates[0]?.personId || '')
  const [name, setName] = useState('')
  const [result, setResult] = useState(null)
  const ordered = [...candidates].sort((a, b) => (a.personId === row.bestMatch?.personId ? -1 : b.personId === row.bestMatch?.personId ? 1 : 0))
  const canSubmit = mode === 'existing' ? Boolean(personId) : name.trim().length > 1

  return (
    <Modal
      title="Resolve face"
      onClose={onClose}
      footer={result ? <Button onClick={onClose}>Done</Button> : <>
        <Button variant="secondary" onClick={() => { dismissUnresolved(row.unresolvedId); onClose() }}>Not staff · dismiss</Button>
        <Button disabled={!canSubmit} onClick={() => {
          const target = resolveUnresolved(row.unresolvedId, mode === 'existing' ? { personId } : { name: name.trim(), role: row.role })
          setResult(target)
        }}><UserCheck size={14} /> {mode === 'existing' ? 'Attach to person' : 'Enrol as new'}</Button>
      </>}
    >
      {result ? (
        <div className="ss-enroll-done">
          <Avatar person={result} size={64} />
          <div>
            <strong>{row.occurrences} detections now belong to {result.name}</strong>
            <p>Analytics for the period have been re-attributed. Future detections of this face resolve automatically.</p>
          </div>
        </div>
      ) : (
        <div className="ss-resolve">
          <div className="ss-resolve-sample">
            <Avatar person={{ personId: row.unresolvedId, name: '?', avatar: row.sample }} size={120} />
            <div>
              <strong>{lookup.camera[row.cameraId]?.name}</strong>
              <span>{row.occurrences} detections</span>
              <span>{row.note}</span>
            </div>
          </div>
          <div className="segmented ss-resolve-mode">
            <button type="button" className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>Existing person</button>
            <button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>New person</button>
          </div>
          {mode === 'existing' ? (
            <div className="ss-resolve-list" role="radiogroup" aria-label="Match to enrolled person">
              {ordered.map((person) => (
                <label key={person.personId} className={`ss-resolve-option${personId === person.personId ? ' is-on' : ''}`}>
                  <input type="radio" name="resolve-person" checked={personId === person.personId} onChange={() => setPersonId(person.personId)} />
                  <Avatar person={person} size={36} />
                  <span><strong>{person.name}</strong><em>{person.employeeCode}{person.personId === row.bestMatch?.personId ? ` · best match ${formatPercent(row.bestMatch.similarity)}` : ''}</em></span>
                </label>
              ))}
            </div>
          ) : (
            <label className="field-label">Full name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name for the new enrolment" /></label>
          )}
        </div>
      )}
    </Modal>
  )
}
