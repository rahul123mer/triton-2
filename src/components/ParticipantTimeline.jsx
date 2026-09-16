import { useMemo, useState } from 'react'
import { usePlayback } from '../stores/playback'
import { formatDuration, formatSourceTime } from '../lib/format'
import { SectionLabel } from './ui'

/* Who was there, and when — one lane per person instead of one per evidence
 * category.
 *
 * It is NOT evidence laned by person, which is what "timeline by participant"
 * first suggests. Every semantic event carries a `participant_id` column and on
 * real footage **0 of 905 are populated**: the pipeline attributes evidence to a
 * meeting, not to a speaker. Lanes drawn that way would be empty, so this draws
 * what is actually recorded — presence intervals from face tracking and speaking
 * intervals from diarization.
 *
 * Those two are disjoint on this footage and that is the point of seeing them
 * together: fifteen people hold all the presence and no speech, four hold all the
 * speech and no presence, because the face-to-speaker bridge never fires without
 * an enrolled voice (§4). Drawn on one axis, that is obvious at a glance in a way
 * a participant list never made it.
 */
export function ParticipantTimeline({ participants, meeting, onJump }) {
  const currentMs = usePlayback(s => s.currentMs)
  const seek = usePlayback(s => s.seek)
  const [hover, setHover] = useState(null)

  const span = Math.max(1, meeting.end_offset_ms - meeting.start_offset_ms)
  const pct = ms => ((ms - meeting.start_offset_ms) / span) * 100

  // Anyone the recording says nothing about would be an empty row, and a wall of
  // empty rows is how a reader concludes the feature is broken. Ordered by how
  // much there is to see, so the people the meeting actually captured come first.
  const lanes = useMemo(() => (participants || [])
    .map(person => {
      const presence = person.presence_intervals || []
      const speech = person.speaking_intervals || []
      return {
        person,
        presence,
        speech,
        presentMs: presence.reduce((n, i) => n + (i.end_ms - i.start_ms), 0),
        speechMs: speech.reduce((n, i) => n + (i.end_ms - i.start_ms), 0),
      }
    })
    .filter(lane => lane.presence.length || lane.speech.length)
    .sort((a, b) => (b.presentMs + b.speechMs) - (a.presentMs + a.speechMs)),
    [participants])

  if (!lanes.length) return (
    <div className="no-results">
      Nothing was attributed to a participant in this recording — no face was
      tracked and no speech was diarized, so there is nothing to lay out in time.
    </div>
  )

  // A click anywhere on a lane goes to that MOMENT, not to the nearest bar. The
  // question this view answers is "what was happening at 4:12", and demanding a
  // hit on a 3px bar to ask it would make the empty stretches unclickable — which
  // are exactly the stretches worth investigating.
  const jumpTo = (event, laneEl) => {
    const box = laneEl.getBoundingClientRect()
    if (!box.width) return
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width))
    const at = Math.round(meeting.start_offset_ms + ratio * span)
    seek(at)
    onJump?.(at)
  }

  return (
    <div className="ptl">
      <div className="ptl-legend">
        <span><i className="ptl-swatch present"/>On camera</span>
        <span><i className="ptl-swatch speech"/>Speaking</span>
        <span className="ptl-hint">Click any point in a row to play from that moment</span>
      </div>

      <div className="ptl-rows">
        {lanes.map(({ person, presence, speech, presentMs, speechMs }) => (
          <div className="ptl-row" key={person.participant_id}>
            <div className="ptl-who">
              <strong>{person.display_name}</strong>
              <span>
                {presentMs ? formatDuration(presentMs, { short: true }) + ' on camera' : 'not on camera'}
                {speechMs ? ` · ${formatDuration(speechMs, { short: true })} speaking` : ''}
              </span>
            </div>
            <button
              className="ptl-lane"
              onClick={e => jumpTo(e, e.currentTarget)}
              onMouseMove={e => {
                const box = e.currentTarget.getBoundingClientRect()
                setHover(meeting.start_offset_ms +
                  Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)) * span)
              }}
              onMouseLeave={() => setHover(null)}
              aria-label={`Play from a chosen moment in ${person.display_name}'s timeline`}
            >
              {presence.map((iv, i) => (
                <i className="ptl-bar present" key={`p${i}`}
                   style={{ left: `${pct(iv.start_ms)}%`,
                            width: `${Math.max(0.4, ((iv.end_ms - iv.start_ms) / span) * 100)}%` }}
                   title={`On camera ${formatSourceTime(iv.start_ms)}–${formatSourceTime(iv.end_ms)}`}/>
              ))}
              {speech.map((iv, i) => (
                <i className="ptl-bar speech" key={`s${i}`}
                   style={{ left: `${pct(iv.start_ms)}%`,
                            width: `${Math.max(0.4, ((iv.end_ms - iv.start_ms) / span) * 100)}%` }}
                   title={`Speaking ${formatSourceTime(iv.start_ms)}–${formatSourceTime(iv.end_ms)}`}/>
              ))}
              {/* The playhead is drawn on every lane rather than once above them:
                  reading "who was talking at this moment" means looking across
                  rows, and a single marker at the top forces you to hold a
                  horizontal position in your head while your eye travels down. */}
              <span className="ptl-playhead" style={{ left: `${pct(currentMs)}%` }}/>
            </button>
          </div>
        ))}
      </div>

      <div className="ptl-scale">
        <span>{formatSourceTime(meeting.start_offset_ms)}</span>
        <span className="ptl-cursor">{formatSourceTime(hover ?? currentMs)}</span>
        <span>{formatSourceTime(meeting.end_offset_ms)}</span>
      </div>
    </div>
  )
}
