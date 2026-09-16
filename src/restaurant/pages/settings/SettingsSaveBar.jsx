import { Save } from 'lucide-react'
import { Button } from '../../../components/ui'
import { useConfigStore } from '../../configStore'

/** Writes timings, users, tables and polygons to src/restaurant/settings.json via Vite. */
export function SettingsSaveBar({ note }) {
  const saveSettings = useConfigStore((s) => s.saveSettings)
  const saveState = useConfigStore((s) => s.saveState)
  const saveError = useConfigStore((s) => s.saveError)
  const savePath = useConfigStore((s) => s.savePath)
  const busy = saveState === 'saving'
  const label = busy
    ? 'Saving…'
    : saveState === 'saved'
      ? 'Saved'
      : saveState === 'error'
        ? 'Retry save'
        : 'Save to settings.json'

  return (
    <div className="ss-save-bar">
      <div>
        <strong>Persist settings</strong>
        <p>
          {note || 'Edits apply live in this session. Click Save to write them into'}
          {' '}
          <code>{savePath}</code>
          {' '}
          so they survive a refresh.
        </p>
        {saveState === 'saved' ? <span className="ss-save-ok">Saved successfully.</span> : null}
        {saveState === 'error' ? <span className="ss-save-err" role="alert">{saveError}</span> : null}
      </div>
      <Button onClick={() => saveSettings()} disabled={busy}>
        <Save size={14} /> {label}
      </Button>
    </div>
  )
}
