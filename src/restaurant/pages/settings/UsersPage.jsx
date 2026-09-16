import { useMemo, useState } from 'react'
import { Eye, EyeOff, Plus, Trash2, UserPlus } from 'lucide-react'
import { Button, Card, Modal, SectionLabel } from '../../../components/ui'
import { formatClock } from '../../format'
import { EMAIL_DOMAIN, normalizeWorkEmail, useConfigStore } from '../../configStore'
import { StatGrid, SubNav } from '../../widgets'
import { SETTINGS_NAV } from './settingsNav'
import { SettingsSaveBar } from './SettingsSaveBar'

const ROLES = ['Admin', 'Manager', 'Analyst', 'Viewer']

export function UsersPage() {
  const users = useConfigStore((s) => s.users)
  const addUser = useConfigStore((s) => s.addUser)
  const updateUser = useConfigStore((s) => s.updateUser)
  const removeUser = useConfigStore((s) => s.removeUser)
  const [registering, setRegistering] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [query, setQuery] = useState('')
  const [revealed, setRevealed] = useState({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((row) => [row.name, row.email, row.role, row.status].join(' ').toLowerCase().includes(q))
  }, [users, query])

  return (
    <div className="ss-settings">
      <SubNav items={SETTINGS_NAV} />
      <StatGrid
        columns={4}
        items={[
          { label: 'Users', value: users.length },
          { label: 'Active', value: users.filter((row) => row.status === 'active').length },
          { label: 'Invited', value: users.filter((row) => row.status === 'invited').length },
          { label: 'Admins', value: users.filter((row) => row.role === 'Admin').length },
        ]}
      />

      <Card className="ss-panel-card">
        <header className="ss-section-head ss-section-head-row">
          <div>
            <SectionLabel>USER MANAGEMENT</SectionLabel>
            <h3>People who can log in</h3>
            <p>All accounts use @{EMAIL_DOMAIN}. Register operators for SafeSpace Triton; roles control what they can change.</p>
          </div>
          <div className="ss-section-actions">
            <input
              className="ss-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, role…"
              aria-label="Search users"
            />
            <Button onClick={() => setRegistering(true)}><UserPlus size={14} /> Register user</Button>
          </div>
        </header>

        <div className="table-scroll">
          <table className="ss-rank is-dense ss-config-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Password</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const show = Boolean(revealed[row.userId])
                return (
                  <tr key={row.userId}>
                    <td>
                      <input
                        className="ss-inline-input"
                        value={row.name}
                        onChange={(e) => updateUser(row.userId, { name: e.target.value })}
                        aria-label={`Name for ${row.email}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ss-inline-input"
                        type="email"
                        value={row.email}
                        onChange={(e) => updateUser(row.userId, { email: e.target.value })}
                        aria-label={`Email for ${row.name}`}
                      />
                    </td>
                    <td>
                      <div className="ss-password-cell">
                        <input
                          className="ss-inline-input"
                          type={show ? 'text' : 'password'}
                          value={row.password || ''}
                          onChange={(e) => updateUser(row.userId, { password: e.target.value })}
                          aria-label={`Password for ${row.name}`}
                        />
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={show ? `Hide password for ${row.name}` : `Show password for ${row.name}`}
                          onClick={() => setRevealed((prev) => ({ ...prev, [row.userId]: !prev[row.userId] }))}
                        >
                          {show ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <select
                        className="ss-inline-input"
                        value={row.role}
                        onChange={(e) => updateUser(row.userId, { role: e.target.value })}
                        aria-label={`Role for ${row.name}`}
                      >
                        {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="ss-inline-input"
                        value={row.status}
                        onChange={(e) => updateUser(row.userId, { status: e.target.value })}
                        aria-label={`Status for ${row.name}`}
                      >
                        <option value="active">Active</option>
                        <option value="invited">Invited</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </td>
                    <td className="ss-muted mono">{row.createdOn}</td>
                    <td className="ss-muted mono">{row.lastLogin ? formatClock(row.lastLogin) : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button type="button" className="icon-button" aria-label={`Remove ${row.name}`} onClick={() => setConfirm(row)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="ss-muted" style={{ padding: 16 }}>No users match “{query}”.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="ss-footnote">Emails are always stored as @{EMAIL_DOMAIN}. Admin can change timings, users, tables and polygons. Manager can run analytics and uploads. Analyst is read/write on analytics only. Viewer is read-only.</p>
      </Card>

      {registering ? (
        <RegisterUserModal
          onClose={() => setRegistering(false)}
          existingEmails={users.map((row) => row.email.toLowerCase())}
          onAdd={(partial) => { addUser(partial); setRegistering(false) }}
        />
      ) : null}

      {confirm ? (
        <Modal
          title={`Remove ${confirm.name}?`}
          onClose={() => setConfirm(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button onClick={() => { removeUser(confirm.userId); setConfirm(null) }}>Remove user</Button>
          </>}
        >
          <p>{confirm.email} will no longer be able to sign in to SafeSpace Triton.</p>
        </Modal>
      ) : null}
      <SettingsSaveBar note="User edits apply live. Save writes accounts into" />
    </div>
  )
}

function RegisterUserModal({ onClose, onAdd, existingEmails }) {
  const [name, setName] = useState('')
  const [localPart, setLocalPart] = useState('')
  const [password, setPassword] = useState('SafeSpace@Change1')
  const [role, setRole] = useState('Viewer')
  const [showPassword, setShowPassword] = useState(true)
  const email = normalizeWorkEmail(localPart)
  const emailTaken = existingEmails.includes(email)
  const canSubmit = name.trim().length > 1 && localPart.trim().length > 1 && password.trim().length >= 6 && !emailTaken

  return (
    <Modal
      title="Register user"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={!canSubmit} onClick={() => onAdd({ name, email, role, password })}><Plus size={14} /> Register</Button>
      </>}
    >
      <div className="ss-form-grid ss-form-grid-2">
        <label className="field-label">Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Lee" autoFocus /></label>
        <label className="field-label">Work email
          <div className="ss-email-compose">
            <input value={localPart} onChange={(e) => setLocalPart(e.target.value.replace(/@.*/, ''))} placeholder="first.last" />
            <span>@{EMAIL_DOMAIN}</span>
          </div>
        </label>
        <label className="field-label">Password
          <div className="ss-password-cell">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="icon-button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </label>
        <label className="field-label">Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>
      {emailTaken ? <p className="ss-form-error" role="alert">That email is already registered.</p> : null}
      <p className="ss-footnote">Preview: {email || `name@${EMAIL_DOMAIN}`}. An invite is created with status Invited; the first successful login flips them to Active.</p>
    </Modal>
  )
}
