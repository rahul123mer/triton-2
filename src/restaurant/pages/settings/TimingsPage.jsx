import { RotateCcw } from 'lucide-react'
import { Button, Card, SectionLabel } from '../../../components/ui'
import { StatGrid, SubNav } from '../../widgets'
import { useConfigStore } from '../../configStore'
import { SETTINGS_NAV } from './settingsNav'
import { SettingsSaveBar } from './SettingsSaveBar'

function toInputTime(value) {
  return String(value || '00:00:00').slice(0, 5)
}

function fromInputTime(value) {
  const [h = '00', m = '00'] = String(value || '00:00').split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`
}

function minutesBetween(start, end) {
  const [sh, sm] = String(start).split(':').map(Number)
  const [eh, em] = String(end).split(':').map(Number)
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
}

export function TimingsPage() {
  const windows = useConfigStore((s) => s.serviceWindows)
  const updateServiceWindow = useConfigStore((s) => s.updateServiceWindow)
  const resetServiceWindows = useConfigStore((s) => s.resetServiceWindows)
  const enabled = windows.filter((row) => row.enabled)
  const totalMinutes = enabled.reduce((sum, row) => sum + minutesBetween(row.start, row.end), 0)
  const defaultWindow = windows.find((row) => row.windowId === 'dinner') || windows[2] || windows[0]
  const periodNames = windows.map((row) => row.label).filter(Boolean).join(', ') || 'Morning, Lunch, Dinner, Evening'

  return (
    <div className="ss-settings">
      <SubNav items={SETTINGS_NAV} />
      <StatGrid
        columns={4}
        items={[
          { label: 'Service periods', value: windows.length },
          { label: 'Enabled', value: enabled.length },
          { label: 'Covered hours', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, hint: 'Sum of enabled windows' },
          { label: 'Default period', value: defaultWindow?.label || 'Dinner', hint: 'Used when the app opens' },
        ]}
      />

      <Card className="ss-panel-card">
        <header className="ss-section-head ss-section-head-row">
          <div>
            <SectionLabel>RESTAURANT TIMINGS</SectionLabel>
            <h3>{periodNames}</h3>
            <p>Rename each period and set its start and end times. Names and hours drive the filter bar across Overview, Analytics and Live Feeds.</p>
          </div>
          <Button variant="secondary" onClick={resetServiceWindows}><RotateCcw size={14} /> Reset defaults</Button>
        </header>

        <div className="ss-timing-grid">
          {windows.map((row) => {
            const mins = minutesBetween(row.start, row.end)
            const invalid = mins <= 0
            return (
              <article key={row.windowId} className={`ss-timing-card${row.enabled ? '' : ' is-off'}${invalid ? ' is-invalid' : ''}`}>
                <header>
                  <div className="ss-timing-title">
                    <label className="field-label">Period name
                      <input
                        className="ss-timing-name"
                        value={row.label}
                        onChange={(e) => updateServiceWindow(row.windowId, { label: e.target.value })}
                        onBlur={(e) => {
                          const trimmed = e.target.value.trim()
                          if (!trimmed) {
                            const fallback = row.windowId.charAt(0).toUpperCase() + row.windowId.slice(1)
                            updateServiceWindow(row.windowId, { label: fallback })
                          } else if (trimmed !== row.label) {
                            updateServiceWindow(row.windowId, { label: trimmed })
                          }
                        }}
                        placeholder="e.g. Brunch"
                        aria-label={`Name for ${row.windowId}`}
                      />
                    </label>
                    <em>{row.windowId}</em>
                  </div>
                  <label className="ss-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(row.enabled)}
                      onChange={(e) => updateServiceWindow(row.windowId, { enabled: e.target.checked })}
                      aria-label={`Enable ${row.label || row.windowId}`}
                    />
                    <i /><span>{row.enabled ? 'On' : 'Off'}</span>
                  </label>
                </header>
                <div className="ss-timing-fields">
                  <label className="field-label">Starts
                    <input
                      type="time"
                      value={toInputTime(row.start)}
                      onChange={(e) => updateServiceWindow(row.windowId, { start: fromInputTime(e.target.value) })}
                      disabled={!row.enabled}
                    />
                  </label>
                  <label className="field-label">Ends
                    <input
                      type="time"
                      value={toInputTime(row.end)}
                      onChange={(e) => updateServiceWindow(row.windowId, { end: fromInputTime(e.target.value) })}
                      disabled={!row.enabled}
                    />
                  </label>
                </div>
                <footer>
                  <span>{invalid ? 'End must be after start' : `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m window`}</span>
                  <code>{toInputTime(row.start)} – {toInputTime(row.end)}</code>
                </footer>
              </article>
            )
          })}
        </div>
        <p className="ss-footnote">Renamed periods update the time-window tabs immediately. Custom ranges on the filter bar still override these presets for a single query. Disabled periods are hidden from the tabs.</p>
      </Card>
      <SettingsSaveBar note="Timings apply live. Save writes service windows into" />
    </div>
  )
}
