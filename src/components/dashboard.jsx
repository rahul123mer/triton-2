/* Panels shared by the master dashboard (Overview, mockup 01) and the per-meeting
   workspace. They live here rather than in either page because the two surfaces
   show the SAME analysis from different entry points — the dashboard picks a
   meeting from the library rail, the workspace arrives already scoped to one —
   and two copies of "the cookbook panel" would drift apart within a week. */
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, ChevronRight, Clock3, FileClock, Play, Plus, Printer, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { analysisApi } from '../lib/api'
import { formatDuration, formatSourceTime } from '../lib/format'
import { humaniseSpeakers, namedSpeakers } from '../lib/speakers'
import { evidenceCategories } from './EvidenceTimeline'
import { usePlayback } from '../stores/playback'
import { useSelection } from '../stores/selection'
import { Button, Card, ErrorCard, SectionLabel, StatusPill } from './ui'

/* Two band vocabularies exist and they are not the same: a Recipe/Analysis carries
   scoring.LABELS ("Excellent", "Good", "Mixed", "Weak", "Poor / High Concern")
   while the CSS — and the Overview contract's Band enum — use poor/fair/good/strong.
   Interpolating the label straight into a class name produced `band-Poor`, `/`,
   `High` and `Concern` as four separate classes, so every gauge rendered in the
   fallback colour. Derive the slug from the score, on scoring.LABELS' own floors,
   so one set of thresholds drives both. */
export const bandSlug=(score)=>score==null?'none':score>=85?'strong':score>=70?'good':score>=55?'fair':'poor'

export const categoryColor=(key)=>evidenceCategories.find(c=>c[0]===key)?.[2]||'#898781'
export const categoryLabel=(key)=>evidenceCategories.find(c=>c[0]===key)?.[1]||'Other'

/* Pin strip under the player. A real meeting yields ~180 events; drawn one-to-one
   over ~700px that is a solid bar of colour, so keep the most confident event per
   slot and label only four, spaced far enough apart not to collide. */
export function EvidencePins({events,meeting}){
  const seek=usePlayback(s=>s.seek);const currentMs=usePlayback(s=>s.currentMs)
  const selectEvidence=useSelection(s=>s.selectEvidence);const evidenceId=useSelection(s=>s.evidenceId)
  const span=Math.max(1,meeting.end_offset_ms-meeting.start_offset_ms)
  const at=ms=>`${Math.min(100,Math.max(0,((ms-meeting.start_offset_ms)/span)*100))}%`
  const SLOTS=44
  const pins=useMemo(()=>{
    const best=new Map()
    for(const event of events){
      const slot=Math.min(SLOTS-1,Math.floor(((event.start_ms-meeting.start_offset_ms)/span)*SLOTS))
      const held=best.get(slot)
      if(!held||event.confidence>held.confidence)best.set(slot,event)
    }
    if(evidenceId&&!Array.from(best.values()).some(e=>e.event_id===evidenceId)){
      const chosen=events.find(e=>e.event_id===evidenceId)   // never hide the selection
      if(chosen)best.set(-1,chosen)
    }
    return Array.from(best.values()).sort((a,b)=>a.start_ms-b.start_ms)
  },[events,evidenceId,meeting.start_offset_ms,span])
  const headline=useMemo(()=>{
    const pct=e=>((e.start_ms-meeting.start_offset_ms)/span)*100
    const chosen=[]
    for(const event of pins.slice().sort((a,b)=>b.confidence-a.confidence)){
      if(chosen.length>=4)break
      if(chosen.every(other=>Math.abs(pct(other)-pct(event))>=22))chosen.push(event)
    }
    return chosen.sort((a,b)=>a.start_ms-b.start_ms)
  },[pins,meeting.start_offset_ms,span])
  if(!events.length)return null
  return <div className="evidence-pin-strip" aria-label="Evidence pins">
    {/* Same overlap as the full timeline had: two events three seconds apart in a
        342-second meeting sit 0.9% of the width apart while a pin is 8px wide, so
        one covers the other and the click selects the neighbour. Hit-test the
        track and take the nearest pin instead of relying on paint order. */}
    <div className="pin-track" onClick={ev=>{
      const box=ev.currentTarget.getBoundingClientRect()
      if(!box.width)return
      const ms=meeting.start_offset_ms+((ev.clientX-box.left)/box.width)*span
      let best=pins[0], bestD=Math.abs(best.start_ms-ms)
      for(const e of pins){const d=Math.abs(e.start_ms-ms);if(d<bestD){best=e;bestD=d}}
      if(best)selectEvidence(best,seek)
    }}>
      <span className="pin-playhead" style={{left:at(currentMs)}}/>
      {pins.map(event=><button key={event.event_id} className={event.event_id===evidenceId?'pin active':'pin'} style={{left:at(event.start_ms),background:categoryColor(event.category)}}
        title={`${formatSourceTime(event.start_ms)} · ${event.summary}`} aria-label={`${formatSourceTime(event.start_ms)}. ${event.summary}`}
        onClick={()=>selectEvidence(event,seek)}/>)}
    </div>
    <div className="pin-labels">{headline.map(event=><button key={event.event_id} className="pin-label" style={{left:`${Math.min(91,Math.max(9,((event.start_ms-meeting.start_offset_ms)/span)*100))}%`}} onClick={()=>selectEvidence(event,seek)}>
      <span className="pin-label-time" style={{color:categoryColor(event.category)}}>{formatSourceTime(event.start_ms)}</span>
      <span className="pin-label-text">{categoryLabel(event.category)}</span>
    </button>)}</div>
    <div className="pin-scale"><span>{formatSourceTime(meeting.start_offset_ms)}</span><span className="pin-count">{pins.length} of {events.length} shown</span><span>{formatSourceTime(meeting.end_offset_ms)}</span></div>
  </div>
}

/* The narrative account of a meeting, and the one panel here that is not a
 * measurement.
 *
 * Everything else on these screens reports something counted: a score, a
 * timestamp, a quote. This is the model's account in its own words, so it is
 * labelled as generated everywhere it appears and never presented as the
 * meeting's own record. It can be wrong in ways a count cannot.
 *
 * It replaced a panel that counted evidence categories. That panel was honest but
 * thin -- on real footage 197 of 219 events are speech-timing and silence
 * bookkeeping, so it reported "1 decision, 10 concerns" and little else. The
 * transcript says far more than the categoriser managed to extract from it.
 *
 * Not generated on view. Reading a meeting never wakes a model in this product --
 * an analysis is the app re-weighting evidence the pipeline already produced (§2)
 * -- so an absent summary is an honest empty state with an action, not a spinner
 * that costs a GPU call every time somebody opens the page.
 */
export function MeetingSummaryCard({summary, participants = [], onOpenEvidence}){
  // A speaker label is positional until somebody resolves it. Where the reviewer
  // HAS resolved one, show the name they gave: the account then reads about people
  // instead of about SPEAKER_02, and it improves as identities are fixed without
  // the stored summary being rewritten.
  const named = useMemo(() => namedSpeakers(participants), [participants])
  // Applied to the prose and to each contribution, not only to the headings: the
  // model puts labels wherever the transcript leads it, and substituting one path
  // left `SPEAKER_02` mid-sentence that resolving that speaker could never fix.
  const humanise = (text) => humaniseSpeakers(text, named)
  const speakerName = (label) => named[label] || humanise(label)

  // One heading, not two. Every other card here carries an eyebrow label above its
  // title, but "WHAT THIS MEETING PRODUCED" over "Summary of the discussion" was
  // the same sentence said twice in two type sizes.
  const heading = <div className="card-heading">
    <div><h3 className="summary-title">{summary ? 'Summary of the discussion' : 'Not summarised yet'}</h3>
      {summary&&<span className="summary-provenance">Generated {new Date(summary.generated_at).toLocaleString()}</span>}</div>
    {onOpenEvidence&&<button className="link-button" onClick={onOpenEvidence}>All evidence <ChevronRight size={13}/></button>}
  </div>

  // No "write one" button. A summary is written when the meeting is ANALYSED with a
  // Cookbook and at no other time, so an un-analysed meeting has nothing to offer
  // here except the reason -- and a button that writes prose for a meeting nobody
  // has chosen a lens for produces an account detached from any analysis of it.
  if(!summary)return <>
    {heading}
    <div className="no-analysis-state"><Sparkles size={22}/>
      <div><strong>No summary yet</strong>
        <span>A short account of what was discussed, and who said what, is written
          from the transcript when this meeting is analysed with a Cookbook.</span></div>
    </div>
  </>

  return <>
    {heading}
    {/* The standing "this is generated" disclaimer is gone: the heading already
        says "Generated <when>", and a banner repeating it on every read is noise.
        What remains is CONDITIONAL and load-bearing -- a truncated or stale
        account is describing something other than what the reader is looking at,
        and that cannot be inferred from the prose. */}
    {(summary.truncated||summary.stale)&&<p className="summary-caveat"><AlertTriangle size={13}/><span>
      {summary.truncated&&'The meeting was longer than the summariser reads, so this covers its opening and not its end. '}
      {summary.stale&&'The transcript has changed since this was written.'}
    </span></p>}
    <p className="summary-prose">{humanise(summary.summary)}</p>
    {summary.speakers?.length>0&&<div className="summary-speakers">
      <SectionLabel>WHO SAID WHAT</SectionLabel>
      {summary.speakers.map(row=><div className="summary-speaker" key={row.label}>
        <strong>{speakerName(row.label)}</strong><span>{humanise(row.contribution)}</span>
      </div>)}
      {(()=>{const unnamed=summary.speakers.filter(r=>!named[r.label]&&/^SPEAKER_/i.test(r.label)).length
        if(!unnamed)return null
        return <p className="summary-hint">{unnamed===summary.speakers.length
          ? 'No speaker has been identified yet, so these are positional labels. Resolve them under Participants and this account names people instead.'
          : `${unnamed} of these are still positional labels. Resolve them under Participants to see who they were.`}</p>})()}
    </div>}
  </>
}

/* What the score is actually out of.
 *
 * BRD 20.2 refuses to invent a score for a Recipe with no evidence, and refuses
 * to redistribute its weight. Correct -- but the result was then drawn as
 * "17 /100" under the band "Poor / High Concern", which is the false precision
 * the rule exists to prevent: 40 points of weight had contributed nothing, so 17
 * was the FLOOR of a 17-57 range, not a verdict. Max contribution of a Recipe is
 * its weight (basis caps at 100), so the achievable total is the scorable weight.
 */
export function scoreCeiling(analysis){
  const rs=(analysis?.recipes||[]).filter(r=>r.enabled!==false)
  const scorable=rs.filter(r=>r.status==='SCORABLE')
  if(!rs.length||scorable.length===rs.length) return null      // nothing withheld
  return scorable.reduce((n,r)=>n+(r.weight||0),0)
}

/* Recipe ids mean nothing to the person reading the report. */
export function blockedNames(analysis){
  const by=Object.fromEntries((analysis?.recipes||[]).map(r=>[r.recipe_id,r.recipe_name]))
  return (analysis?.blocking_recipes||[]).map(id=>by[id]||id)
}

function Gauge({score,size=104,label,ceiling=null}){
  const r=size/2-Math.max(6,size*0.085), c=2*Math.PI*r
  const filled=score==null?0:(score/100)*c
  const slug=bandSlug(score)
  const stroke=slug==='strong'?'var(--good)':slug==='good'?'var(--blue-700)':slug==='fair'?'var(--warning)':slug==='poor'?'var(--critical)':'var(--ink-400)'
  // The value overlay is centred on the ring rather than offset by a fixed number
  // of pixels, so one component serves both the 104px hero and the 62px tiles.
  const w=Math.max(9,size*0.085)
  return <div className="score-gauge" style={{width:size,height:size}}>
    <svg viewBox={`0 0 ${size} ${size}`} style={{width:size,height:size}} role="img" aria-label={score==null?'Not scored':`${label||'Score'} ${score} out of ${ceiling??100}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--divider)" strokeWidth={w}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round"
              strokeDasharray={`${filled} ${c}`} transform={`rotate(-90 ${size/2} ${size/2})`}/>
    </svg>
    <div className="gauge-value">
      <strong style={{fontSize:Math.round(size*0.26)}}>{score??'—'}</strong>
      <span style={{fontSize:Math.max(8,Math.round(size*0.095))}}>{score==null?'not scored':ceiling!=null?`of ${ceiling} possible`:'/100'}</span>
    </div>
  </div>
}

/* A participant's face, when we actually have one.
 *
 * participant.avatar_url and participant.identity_id both come back null: absorb
 * writes identity_id as a hardcoded NULL, so a resolved participant is never
 * joined to the gallery row that holds their photograph. The names do match --
 * the pipeline named them FROM that gallery -- so link by name, which is the
 * same fallback GalleryMapping already reports as source "name_link".
 *
 * An unresolved participant never shows INITIALS: "U1" for "Unknown 1" looks
 * like an identification, and this is the screen where a reviewer decides whether
 * one has been made. A cropped frame is a different matter -- it shows the face
 * that was detected without claiming to know whose it is -- so face_crop_url is
 * used where there is one, and the icon remains for anyone with no geometry.
 */
export function PersonAvatar({person, faces}) {
  const known = person.identity_status === 'known'
  const name = (person.display_name || '').trim().toLowerCase()
  const match = known && name
    ? (faces || []).find(f => (f.display_name || '').trim().toLowerCase() === name)
    : null
  const url = person.avatar_url || match?.avatar_url || person.face_crop_url
  const initials = (person.display_name || '?').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
  return <span className={`person-dot status-${person.identity_status}${url ? ' has-photo' : ''}`}>
    {url ? <img src={url} alt="" loading="lazy"/> : known ? initials : <UserRound size={15} aria-hidden="true"/>}
  </span>
}

export function ScoreOverview({analysis,scorecard}){
  const ceiling=scoreCeiling(analysis), missing=blockedNames(analysis)
  return <div className="score-overview">
    <div className="score-hero-col">
      <Gauge score={scorecard.overall_score} label="Overall meeting score" ceiling={ceiling}/>
      <small>Overall meeting score</small>
      {ceiling==null
        ? <span className={`score-band band-${bandSlug(scorecard.overall_score)}`}>{scorecard.overall_band||'Not scored'}</span>
        : <span className="score-band band-incomplete">Incomplete · {missing.length} of {(analysis.recipes||[]).length} criteria unscored</span>}
    </div>
    <div className="score-tiles">{(analysis.recipes||[]).map(recipe=><Link key={recipe.recipe_id} className={recipe.status==='NOT_SCORABLE'?'score-tile unscorable':'score-tile'} to={`/analyses/${analysis.analysis_id}/recipes/${recipe.recipe_id}`}>
      <span className="tile-name">{recipe.recipe_name}</span>
      <Gauge score={recipe.score} size={62}/>
      <span className="tile-meta">{recipe.weight}% · {recipe.polarity==='-'?'risk':'positive'}</span>
      {recipe.status==='NOT_SCORABLE'&&<span className="tile-flag"><AlertTriangle size={12}/>No evidence</span>}
    </Link>)}</div>
    {!analysis.publishable&&<div className="modality-warning inline"><AlertTriangle size={16}/><div><strong>{missing.length} of {(analysis.recipes||[]).length} criteria could not be assessed</strong><span>This recording held too little evidence for {missing.join(', ')}. Their weight is left out rather than guessed at or shared among the rest, so the score above is the lowest this meeting could earn{ceiling!=null&&<> — not {scorecard.overall_score} out of 100</>}. Resolve the evidence, or re-weight a copy of the Cookbook, to publish.</span></div></div>}
  </div>
}

export function EvidenceFeed({events,limit=8,onOpenAll}){
  const seek=usePlayback(s=>s.seek)
  const selectEvidence=useSelection(s=>s.selectEvidence);const evidenceId=useSelection(s=>s.evidenceId)
  return <>
    <div className="card-heading"><div><SectionLabel>EVIDENCE</SectionLabel><h3>{events.length} timestamped semantic events</h3></div>{onOpenAll&&<button className="link-button" onClick={onOpenAll}>Open library <ChevronRight size={13}/></button>}</div>
    <div className="evidence-feed">{events.slice(0,limit).map(event=><button key={event.event_id} className={event.event_id===evidenceId?'evidence-feed-row active':'evidence-feed-row'} onClick={()=>selectEvidence(event,seek)}>
      <span className="evidence-time">{formatSourceTime(event.start_ms)}</span>
      <span className="evidence-chip" style={{background:categoryColor(event.category)}}>{categoryLabel(event.category)}</span>
      <span className="grow evidence-summary">{event.summary}</span>
      <span className="evidence-confidence">{Math.round(event.confidence*100)}%</span>
    </button>)}{events.length===0&&<div className="no-results">No evidence has been extracted for this meeting yet.</div>}</div>
  </>
}

/* The Cookbook panel is where a meeting's LENS is chosen.
 *
 * Weights stay read-only here: a prebuilt Cookbook is immutable by design,
 * because a score is only comparable between meetings if the question was the
 * same. Re-weighting is a clone, and that editor is /cookbooks.
 *
 * What this panel now owns is which lens you are looking through. The workspace
 * heading used to carry "All analyses" and "New analysis"; both were removed as
 * generic buttons over a page that is already about one meeting, and both land
 * here instead, where the cookbook they act on is named. Scoring the same meeting
 * under another Cookbook is cheap -- the AI ran once at extraction, so a second
 * lens is a re-weighting, not a re-analysis (§2) -- which is exactly why the
 * comparison belongs in front of the reviewer rather than behind a button.
 */
export function CookbookPanel({analysis, analyses = [], meetingId, canCreate, onSelect}){
  const others = analyses.filter(a => a.analysis_id !== analysis?.analysis_id)
  // "another" only makes sense once there IS one. On a meeting nobody has analysed
  // the same control was claiming a first analysis existed.
  const addNew = canCreate && meetingId
    ? <Link className="cookbook-add" to={`/analyses/new?meeting_id=${meetingId}`}>
        <Plus size={13}/>{analysis ? 'Score with another cookbook' : 'Score this meeting'}</Link>
    : null
  if(!analysis)return <Card className="rail-card">
    <div className="rail-heading"><SectionLabel>COOKBOOK</SectionLabel><Link to="/cookbooks">All cookbooks</Link></div>
    <div className="no-results">A Cookbook is chosen when you create an Analysis.</div>{addNew}
  </Card>
  const recipes=analysis.recipes||[]
  const total=recipes.reduce((sum,r)=>sum+Math.abs(r.weight),0)
  return <Card className="rail-card">
    <div className="rail-heading"><SectionLabel>COOKBOOK</SectionLabel><Link to="/cookbooks">All cookbooks</Link></div>
    <div className="rail-cookbook"><strong>{analysis.cookbook_name}</strong><span>v{analysis.cookbook_version}</span></div>
    {recipes.length===0
      ? <div className="no-results">This analysis carries no Recipe results — the meeting has no precomputed evidence to weight.</div>
      : <>
    <div className="weight-head"><span className="grow">Recipe</span><span>Polarity</span><span>Weight</span></div>
    <div className="weight-list">{recipes.map(recipe=><Link key={recipe.recipe_id} className="weight-row" to={`/analyses/${analysis.analysis_id}/recipes/${recipe.recipe_id}`}>
      <span className="grow">{recipe.recipe_name}</span>
      <span className={recipe.polarity==='-'?'polarity risk':'polarity positive'}>{recipe.polarity==='-'?'−':'+'}</span>
      <strong>{recipe.weight}%</strong>
    </Link>)}</div>
    <div className="weight-total"><span>Total weight</span><strong className={total===100?'ok':'bad'}>{total}%{total===100&&<BadgeCheck size={13}/>}</strong></div>
      </>}
    {/* The same meeting under other lenses. Named with their scores, because the
        comparison is the point -- and a score is meaningless without the ceiling
        it was measured against, so each carries its own. */}
    {others.length>0&&<div className="cookbook-others">
      <SectionLabel>ALSO SCORED UNDER</SectionLabel>
      {others.map(other=><button key={other.analysis_id} className="cookbook-other"
                                 onClick={()=>onSelect?.(other.analysis_id)}>
        <span className="grow"><strong>{other.cookbook_name}</strong>
          <span>{other.status==='published'?'Published':other.status==='stale'?'Stale':'Draft'}</span></span>
        <span className="cookbook-other-score">{other.overall_score??'—'}</span>
        <ChevronRight size={13}/>
      </button>)}
    </div>}
    {addNew}
  </Card>
}

export function AuditLogPanel({governance,canRead,error,loading,onViewAll}){
  return <Card className="rail-card">
    <div className="rail-heading"><SectionLabel>GOVERNANCE / AUDIT LOG</SectionLabel>{onViewAll?<button onClick={onViewAll}>View all</button>:<Link to="/governance">View all</Link>}</div>
    {!canRead?<div className="no-results">Governance is outside your access scope.</div>
     :loading?<div className="inline-skeleton"/>
     :error?<ErrorCard error={error}/>
     :<div className="rail-activity">{(governance?.activity||[]).slice(0,6).map(entry=><div className="rail-activity-row" key={entry.entry_id}>
        <span className="activity-icon"><FileClock size={13}/></span>
        <div className="grow"><strong>{entry.summary}</strong><span>{entry.actor} · {new Date(entry.at).toLocaleString()}</span></div>
      </div>)}{(governance?.activity||[]).length===0&&<div className="no-results">Nothing has been changed here yet.</div>}</div>}
  </Card>
}

export function NotesPanel({notes=[],title='NOTES',kind,onOpen}){
  const rows=kind?notes.filter(n=>n.kind===kind):notes
  return <Card className="rail-card">
    <div className="rail-heading"><SectionLabel>{title}</SectionLabel><div className="rail-heading-right"><span className="count-badge">{rows.length}</span>{onOpen&&<button onClick={onOpen}>Add / view</button>}</div></div>
    <div className="rail-notes">{rows.slice(0,3).map(note=><article key={note.note_id}><strong>{note.author}</strong><p>{note.text}</p><small>{note.kind.replaceAll('_',' ')} · {note.visibility.replaceAll('_',' ')}</small></article>)}
    {rows.length===0&&<div className="no-results">No notes are visible in your scope.</div>}</div>
  </Card>
}

export function GalleryRail({faces=[],voices=[],loading}){
  const [tab,setTab]=useState('faces')
  return <Card className="rail-card">
    <div className="rail-heading"><SectionLabel>GALLERY</SectionLabel><Link to="/gallery">Manage</Link></div>
    <div className="note-tabs"><button className={tab==='faces'?'active':''} onClick={()=>setTab('faces')}>Face Gallery</button><button className={tab==='voices'?'active':''} onClick={()=>setTab('voices')}>Voice Samples</button></div>
    {loading?<div className="inline-skeleton"/>:tab==='faces'
      ?<div className="face-grid">{faces.map(face=><Link key={face.identity_id} className="face-cell" to="/gallery" title={face.display_name}>
          <span className="face-avatar">{face.avatar_url?<img src={face.avatar_url} alt=""/>:<em>{(face.display_name||'?').split(/\s+/).map(p=>p[0]).join('').slice(0,2).toUpperCase()}</em>}<i className={`face-flag status-${face.identity_status}`}/></span>
          <span className="face-name">{face.display_name}</span>
        </Link>)}{faces.length===0&&<div className="no-results">No faces enrolled.</div>}</div>
      :<div className="voice-list">{voices.map(voice=><div className="voice-row" key={voice.identity_id}>
          <span className="voice-play"><Play size={12}/></span>
          <div className="grow"><strong>{voice.display_name}</strong><span>{voice.sample_count} sample{voice.sample_count===1?'':'s'}</span></div>
          <span className="voice-len">{voice.total_speech_ms?formatDuration(voice.total_speech_ms,{short:true}):'—'}</span>
        </div>)}{voices.length===0&&<div className="no-results">No voice samples enrolled.</div>}</div>}
  </Card>
}

/* Publish used to live only inside the Governance tab, reached through
   Analyses → Inspect. It is the terminal action of the workflow and belongs on
   the surface that shows the score it publishes. */
export function AnalysisActions({analysis,access}){
  const qc=useQueryClient()
  const publish=useMutation({mutationFn:()=>analysisApi.publish(analysis.analysis_id),onSuccess:()=>{qc.invalidateQueries({queryKey:['analysis',analysis.analysis_id]});qc.invalidateQueries({queryKey:['governance']});qc.invalidateQueries({queryKey:['overview']})}})
  if(!analysis)return <Card className="rail-card"><SectionLabel>ACTIONS</SectionLabel><div className="no-results">Create an Analysis to publish or export.</div></Card>
  const published=analysis.status==='published'
  return <Card className="rail-card actions-card">
    <SectionLabel>ACTIONS</SectionLabel>
    <div className="action-status"><StatusPill status={analysis.status}/><span>{analysis.cookbook_name} v{analysis.cookbook_version}</span></div>
    {access.can('analysis.publish')&&!published&&<Button className="full" disabled={!analysis.publishable||publish.isPending} onClick={()=>publish.mutate()}><Send size={15}/>{publish.isPending?'Publishing…':'Publish analysis'}</Button>}
    {published&&<div className="success-note"><BadgeCheck size={16}/>Published {analysis.published_at?new Date(analysis.published_at).toLocaleString():''}</div>}
    {/* Print, not "Download report": the report page is where you read it, print
        it and export it, and "download" described only the last of those. */}
    {access.can('report.read')&&<Link className="button secondary full" to={`/reports/${analysis.analysis_id}`}><Printer size={15}/>Print report</Link>}
    {/* Both terminal actions are blocked by the same rule, so it is stated ONCE,
        here, naming the criteria. It used to be a hover tooltip reading "Resolve
        blocking Recipes before publishing" -- system vocabulary, invisible on
        touch, and it named nothing. BRD 20.2 is the reason a report cannot leave
        the building; a person deciding what to do next needs to know WHICH
        criteria to resolve. */}
    {!published&&!analysis.publishable&&<p className="action-blocked"><AlertTriangle size={13}/><span>
      <strong>Not ready to publish or export.</strong> This recording held too little evidence to assess {blockedNames(analysis).join(', ')}. Resolve the evidence, or re-weight a copy of the Cookbook.
    </span></p>}
    {publish.isError&&<p className="weight-error">{publish.error.message}</p>}
    <div className="action-meta"><span><BadgeCheck size={13}/>{analysis.evidence_coverage}% coverage</span><span><Clock3 size={13}/>{(analysis.elapsed_ms/1000).toFixed(1)}s</span><span><ShieldCheck size={13}/>{analysis.reused_base_inference?'Base reused':'Base rerun'}</span></div>
  </Card>
}
