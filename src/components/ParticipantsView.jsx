import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Maximize2, Merge, Pause, Pencil, Play, Save, UserCheck, UserRound } from 'lucide-react'
import { galleryApi, meetingApi } from '../lib/api'
import { formatDuration, formatSourceTime, partitionParticipants } from '../lib/format'
import { Button, Modal, SectionLabel, SuccessNote } from './ui'
import { usePrincipal } from '../hooks/usePrincipal'

export function ParticipantsView({ meeting, participants, faces = [] }) {
  const access = usePrincipal()
  const qc = useQueryClient()
  // One card plays at a time. Holding the id here rather than in each card is
  // what keeps a second stream from starting on top of the first, and means only
  // one hls.js instance is ever alive.
  const [speaking, setSpeaking] = useState(null)
  const media = useQuery({ queryKey: ['meeting-media', meeting.meeting_id], queryFn: () => meetingApi.media(meeting.meeting_id) })
  const [rename, setRename] = useState(null)
  const [resolving, setResolving] = useState(null)
  const [enlarged, setEnlarged] = useState(null)
  const renameMutation = useMutation({ mutationFn: ({ id, name }) => meetingApi.updateParticipant(meeting.meeting_id, id, { display_name: name }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['participants', meeting.meeting_id] }); setRename(null) } })
  return <div className="participants-view">
    {renameMutation.isError&&<div className="warning-callout" role="alert"><p>{renameMutation.error.message}</p></div>}
    <section><SectionLabel>PARTICIPANT ANALYTICS</SectionLabel>
      {(() => { const g = partitionParticipants(participants); return <>
        <div className="people-summary">
          <span><strong>{g.identified.length}</strong> identified</span>
          {g.faces.length > 0 && <span><strong>{g.faces.length}</strong> unidentified face{g.faces.length === 1 ? '' : 's'}</span>}
          {g.speakers.length > 0 && <span><strong>{g.speakers.length}</strong> unattributed speaker{g.speakers.length === 1 ? '' : 's'}</span>}
        </div>
        {g.faces.length > 0 && <p className="people-note">Unidentified faces are clusters of face tracks nobody could name — one person filmed from several angles can produce many. They are not a headcount.</p>}
        {g.speakers.length > 0 && <p className="people-note">Unattributed speakers are voices with no face link. Without a voice enrolled for them the bridge cannot fire, so these are often people already listed above.</p>}
      </>; })()}
      <div className="participant-grid">{participants.map(p => <article className="participant-card" key={p.participant_id}>
      {(() => { const url = avatarFor(p, faces); return url
        ? <button className="participant-avatar is-zoomable" onClick={() => setEnlarged({ url, person: p })}
                  aria-label={`Enlarge the image of ${p.display_name}`}>
            <img src={url} alt=""/><span className="zoom-hint"><Maximize2 size={12}/></span>
          </button>
        // No image, nothing to enlarge: stays a plain div so it is not focusable
        // and does not advertise an action that would open an empty dialog.
        : <div className="participant-avatar"><UserRound size={25}/></div> })()}
      <div className="participant-name">{rename?.id === p.participant_id ? <div className="rename-control"><input value={rename.name} onChange={e => setRename({ ...rename, name: e.target.value })}/><button onClick={() => renameMutation.mutate({ id: p.participant_id, name: rename.name })}><Save size={12}/></button></div> : <><strong>{p.display_name}</strong><span>{p.role || 'Role not assigned'} · {p.identity_status}</span></>}</div>
      {access.can('participant.resolve')&&(['unresolved','unknown'].includes(p.identity_status) ? <button className="tiny-icon resolve-icon" onClick={() => setResolving(p)} aria-label={`Resolve ${p.display_name}`}><UserCheck size={12}/></button> : <button className="tiny-icon" onClick={() => setRename({ id: p.participant_id, name: p.display_name })} aria-label={`Rename ${p.display_name}`}><Pencil size={12}/></button>)}
      <ParticipantSignals participant={p} meeting={meeting} media={media.data}
                          playing={speaking===p.participant_id}
                          onPlay={()=>setSpeaking(current=>current===p.participant_id?null:p.participant_id)}
                          onStop={()=>setSpeaking(null)}/>
    </article>)}</div></section>
    {enlarged && <EnlargedFace {...enlarged} onClose={() => setEnlarged(null)}/>}
    {resolving && <ResolveIdentityModal participant={resolving} meetingId={meeting.meeting_id} onClose={() => setResolving(null)}/>} 
  </div>
}

/* Play one participant's speech, in their own card.
 *
 * The meeting is served as HLS with muxed audio, so this is a <video> element
 * playing audio only rather than an <audio> tag — a plain <audio> cannot load an
 * m3u8 outside Safari. It is mounted per card but only ONE card can be playing at
 * a time (the parent holds a single `speaking` id), so at most one hls.js
 * instance exists, and it is created only when someone actually presses play.
 * Nineteen eagerly-mounted players would fetch nineteen copies of a 370 MB
 * recording to show a control most of them cannot use.
 *
 * A person's speech is not one clip. These four speakers hold between 1 and 17
 * separate intervals, so playback walks them in order and skips the silence
 * between: at the end of an interval it seeks to the start of the next, and stops
 * after the last. Media time is source time minus clip_offset_ms — the clip does
 * not start at zero in the source video.
 */
function SpeechClips({ participant, media, intervals, playing, onToggle, onStop }) {
  const ref = useRef(null)
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  // Reaching the end is NOT a toggle. `timeupdate` fires several times past the
  // last interval, and the second call still saw playing===true from the render
  // that had not happened yet: toggle #1 stopped it, toggle #2 turned it straight
  // back on, and a 0.7s clip stuck forever showing "Clip 1 of 1" while paused.
  // Finishing sets the state directly, and the ref makes it happen once.
  const finished = useRef(false)
  const totalMs = intervals.reduce((total, v) => total + (v.end_ms - v.start_ms), 0)
  const offset = media?.clip_offset_ms || 0
  const toMedia = (sourceMs) => Math.max(0, (sourceMs - offset) / 1000)

  useEffect(() => {
    const element = ref.current
    if (!element || !playing || !media?.hls_url) return
    let hls, disposed = false
    const fail = () => setFailed(true)
    const start = () => { element.currentTime = toMedia(intervals[0].start_ms); element.play().catch(fail) }
    if (element.canPlayType('application/vnd.apple.mpegurl')) { element.src = media.hls_url; start() }
    else import('hls.js').then(({ default: Hls }) => {
      if (disposed) return
      if (!Hls.isSupported()) return fail()
      hls = new Hls(); hls.loadSource(media.hls_url); hls.attachMedia(element)
      hls.on(Hls.Events.MANIFEST_PARSED, start)
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) fail() })
    }).catch(fail)
    return () => { disposed = true; hls?.destroy(); element.pause() }
    // Intentionally keyed on `playing` alone: rebuilding the stream because the
    // interval index advanced would restart the download mid-sentence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, media])

  useEffect(() => { if (!playing) { setIndex(0); finished.current = false } }, [playing])

  const onTime = () => {
    const element = ref.current
    if (!element || !playing || finished.current) return
    const current = intervals[index]
    if (!current) return
    if (element.currentTime >= toMedia(current.end_ms)) {
      const next = intervals[index + 1]
      if (!next) { finished.current = true; element.pause(); onStop(); return }
      setIndex(index + 1)
      element.currentTime = toMedia(next.start_ms)
    }
  }

  return <div className="speech-clips">
    <button className="speech-play" onClick={onToggle} disabled={failed}
            aria-label={playing ? `Stop ${participant.display_name}'s speech` : `Play ${participant.display_name}'s speech`}>
      {playing ? <Pause size={13}/> : <Play size={13}/>}
    </button>
    <div className="grow">
      <strong>{formatDuration(totalMs, { short: true })} of speech</strong>
      <span>{failed ? 'Audio unavailable for this recording.'
             : playing ? `Clip ${index + 1} of ${intervals.length} · ${formatSourceTime(intervals[index]?.start_ms ?? 0)}`
             : `${intervals.length} clip${intervals.length === 1 ? '' : 's'}, silence skipped`}</span>
    </div>
    <video ref={ref} onTimeUpdate={onTime} onEnded={onStop} preload="none" playsInline hidden/>
  </div>
}

/* Presence and talk time are DIFFERENT MEASUREMENTS, and the card used to imply
 * they were one.
 *
 * The reported symptom: "it says 0% despite showing content in the blue side
 * below their name". Both readings were correct and neither was a bug. The blue
 * strip is presence — when this face was on camera. The 0% is talk time — how
 * much of the meeting's speech was attributed to them. On the Nash footage the
 * two populations are completely disjoint: 15 face participants hold 100% of the
 * presence and 0% of the speech, while 4 "Off-camera Speaker" rows hold 100% of
 * the speech and 0% of the presence. Nobody is both seen and heard, because
 * without a voice enrolled the face-to-speaker bridge cannot fire (§4).
 *
 * So "0%" was answering a question the pipeline never got to ask. A measured
 * zero and an unattributable one are not the same claim — the same distinction
 * §6 draws between a score of 17 and a score out of 60 — and the card now says
 * which one it means.
 */
function ParticipantSignals({ participant: p, meeting, media, playing, onPlay, onStop }) {
  const heard = (p.speaker_ids || []).length > 0
  const spoken = p.speaking_intervals || []
  const presence = p.presence_intervals || []
  const presentMs = presence.reduce((total, v) => total + (v.end_ms - v.start_ms), 0)
  const at = (ms) => ((ms - meeting.start_offset_ms) / meeting.duration_ms) * 100
  return <>
    {heard ? <>
      <div className="talk-bar"><span style={{ width: `${p.talk_time_pct}%` }}/></div>
      <div className="participant-stats">
        <div><strong>{p.talk_time_pct}%</strong><span>Talk time</span></div>
        <div><strong>{p.turn_count}</strong><span>Turns</span></div>
        <div><strong>{p.questions_asked}</strong><span>Questions</span></div>
      </div>
    </> : <div className="stat-unattributed">
      <strong>No speech attributed</strong>
      <span>{presentMs
        ? 'Seen on camera, but no speaker was linked to this face — so talk time is unmeasured, not zero.'
        : 'Neither speech nor presence was attributed to this participant.'}</span>
    </div>}
    {/* The strip was unlabelled, which is how it came to be read as talk time. */}
    <div className="signal-row">
      <span className="signal-label">Presence</span>
      <span className="signal-value">{presentMs ? formatDuration(presentMs, { short: true }) : 'Not on camera'}</span>
    </div>
    <div className="presence-strip" role="img" aria-label={`On camera for ${formatDuration(presentMs,{short:true})}`}>
      {presence.map((v, i) => <span key={i} style={{ left: `${at(v.start_ms)}%`, width: `${((v.end_ms - v.start_ms) / meeting.duration_ms) * 100}%` }} title={`${formatDuration(v.end_ms - v.start_ms, { short: true })} present`}/>)}
    </div>
    {/* Play their speech from the card, which only exists where there IS speech:
        on this footage that is the four off-camera speakers and nobody with a
        face. A control that is dead on 15 of 19 cards is worse than none. */}
    {spoken.length > 0 && <SpeechClips participant={p} media={media} intervals={spoken}
                                       playing={playing} onToggle={onPlay} onStop={onStop}/>}
    {heard && !spoken.length && <div className="signal-row"><span className="signal-label">Speech</span><span className="signal-value">Attributed, but no clip boundaries stored</span></div>}
  </>
}

/* The face at a size you can actually judge.
 *
 * The card thumbnail is 42px, which is enough to tell two strangers apart and not
 * enough to decide WHO one of them is -- the question this screen exists to
 * answer. The crop is served at 256px, so there is nothing to fetch: the same URL,
 * drawn larger.
 *
 * The caption states which of the two kinds of image this is, because they carry
 * different claims: an enrolled photograph asserts an identity, a frame cut from
 * the recording only shows who was there. Guessing wrong about that is exactly
 * the confusion the separate face_crop_url field exists to prevent.
 */
/* Exported so the Gallery's unresolved queue can enlarge a face too. An unknown
 * face is exactly the one worth looking at closely -- the queue asks who this was,
 * and a 90px thumbnail is not enough to answer it. */
export function EnlargedFace({ url, person, onClose }) {
  const cut = Boolean(person.face_crop_url) && url === person.face_crop_url
  return <Modal title={person.display_name} onClose={onClose}
                footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
    <div className="face-enlarged"><img src={url} alt={`${person.display_name}, enlarged`}/></div>
    <p className="modal-help">{cut
      ? 'A frame from this meeting in which this face was detected. It shows who was present; it does not claim who they are.'
      : 'The enrolled gallery photograph for this identity.'}</p>
  </Modal>
}

/* Exported so the Gallery's unresolved queue can resolve IN PLACE.
 *
 * The queue used to offer "Resolve in meeting", a link that navigated to the
 * meeting's Participants tab and left you to find the row again. Reusing this
 * modal rather than writing a second one is the point: resolution, the merge
 * offered on a 409, and the cache invalidation are one implementation, so the two
 * entry points cannot drift into resolving by different rules. */
export function ResolveIdentityModal({ participant, meetingId, onClose, onResolved }) {
  const qc=useQueryClient();const [mode,setMode]=useState('existing');const [identityId,setIdentityId]=useState('');const [name,setName]=useState('');const [rematch,setRematch]=useState(false)
  const faces=useQuery({queryKey:['gallery-faces'],queryFn:galleryApi.faces});const voices=useQuery({queryKey:['gallery-voices'],queryFn:galleryApi.voices});const identities=[...(faces.data||[]),...(voices.data||[])].filter((row,index,all)=>all.findIndex(x=>x.identity_id===row.identity_id)===index)
  // Resolving from the Gallery must empty the row out of the queue, and resolving
  // from a meeting must stop the Gallery still offering it. Neither page knows
  // which one it is, so both caches are invalidated from here.
  const synced=()=>{qc.invalidateQueries({queryKey:['participants',meetingId]})
    qc.invalidateQueries({queryKey:['gallery-unresolved']})
    qc.invalidateQueries({queryKey:['overview']})
    onResolved?.()}
  const resolve=useMutation({mutationFn:()=>galleryApi.resolve(participant.participant_id,{identity_id:mode==='existing'?identityId:null,display_name:mode==='name'?name:null,rematch}),onSuccess:synced})
  // A 409 here is not a dead end. Face tracking splits one person across several
  // participants, so "that identity is already in this meeting" usually means the
  // reviewer has found a duplicate -- which is the thing they came to fix. The
  // conflict carries who holds it, so the merge can be offered by name.
  const clash=resolve.error?.code==='identity_already_assigned'?resolve.error.details:null
  const merge=useMutation({
    mutationFn:()=>galleryApi.mergeParticipant(participant.participant_id,clash.assigned_to),
    onSuccess:()=>{qc.invalidateQueries({queryKey:['meeting',meetingId]})
      qc.invalidateQueries({queryKey:['analysis']});synced()},
  })
  const valid=mode==='existing'?Boolean(identityId):Boolean(name.trim())
  return <Modal title={`Resolve ${participant.display_name}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Close</Button>{clash&&!merge.isSuccess
      ? <Button disabled={merge.isPending} onClick={()=>merge.mutate()}><Merge size={14}/>{merge.isPending?'Merging…':`Merge into ${clash.assigned_name||'them'}`}</Button>
      : <Button disabled={!valid||resolve.isPending||resolve.isSuccess||merge.isSuccess} onClick={()=>resolve.mutate()}><UserCheck size={14}/>Resolve identity</Button>}</>}>
    {resolve.isSuccess?<SuccessNote>{resolve.data.display_name} resolved. {resolve.data.requires_compute?`Remote rematch job ${resolve.data.job_id||'queued'} created.`:'No Remote Compute was used.'}</SuccessNote>:<><div className="segmented"><button className={mode==='existing'?'active':''} onClick={()=>setMode('existing')}>Existing identity</button><button className={mode==='name'?'active':''} onClick={()=>setMode('name')}>Name only</button></div>{mode==='existing'?<label className="field-label">Gallery identity<select value={identityId} onChange={e=>setIdentityId(e.target.value)}><option value="">Select identity…</option>{identities.map(i=><option value={i.identity_id} key={i.identity_id}>{i.display_name} · {i.identity_id}</option>)}</select></label>:<label className="field-label">Display name<input value={name} onChange={e=>setName(e.target.value)}/></label>}<label className="rematch-check"><input type="checkbox" checked={rematch} onChange={e=>setRematch(e.target.checked)}/><span>Run remote face/voice rematch</span></label><p className="modal-help">Naming or mapping is application-only. Select rematch only when embeddings must be compared again.</p>{merge.isSuccess&&<SuccessNote>Merged into {merge.data.display_name}. {merge.data.moved_face_tracks} face track{merge.data.moved_face_tracks===1?'':'s'} and {merge.data.moved_evidence} evidence item{merge.data.moved_evidence===1?'':'s'} moved across{merge.data.affected_analyses?`; ${merge.data.affected_analyses} analysis${merge.data.affected_analyses===1?'':'es'} marked stale`:''}.</SuccessNote>}
    {clash&&!merge.isSuccess&&<div className="warning-callout" role="alert">
      <p><strong>{clash.assigned_name||'That identity'} is already in this meeting</strong> as a separate participant.</p>
      <p>If this is the same person seen again, merging moves {participant.display_name}&apos;s {participant.face_track_ids?.length||0} face track{participant.face_track_ids?.length===1?'':'s'} and their evidence into {clash.assigned_name||'them'}, then removes this duplicate row. Analyses of this meeting are marked stale, and the merge cannot be undone.</p>
    </div>}
    {merge.isError&&<div className="warning-callout" role="alert"><p>{merge.error.message}</p></div>}
    {resolve.isError&&!clash&&<div className="warning-callout" role="alert"><p>{resolve.error.message}</p></div>}</>}
  </Modal>
}

// Three sources, in descending order of what they claim.
//
// avatar_url is an ENROLLED photograph -- someone decided this is that person. It
// is always null in practice: absorb_compute_result stores identity_id as a
// hardcoded NULL, so a resolved participant is never joined to the gallery row
// holding their picture. The names match, because the pipeline named them FROM
// that gallery, so a name link stands in -- the same fallback GalleryMapping
// reports as source "name_link".
//
// face_crop_url claims far less: a frame from THIS meeting in which this face was
// detected. That is why it is offered for unknown participants, where the two
// above are meaningless. It asserts "here is who we saw", not "here is who they
// are", which is exactly the question a reviewer resolving an unknown is asking.
function avatarFor(person, faces) {
  if (person.avatar_url) return person.avatar_url
  const name = (person.display_name || '').trim().toLowerCase()
  const enrolled = person.identity_status === 'known' && name
    ? (faces || []).find(f => (f.display_name || '').trim().toLowerCase() === name)?.avatar_url
    : null
  return enrolled || person.face_crop_url || null
}
