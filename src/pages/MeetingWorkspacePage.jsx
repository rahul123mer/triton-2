import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, BadgeCheck, Check, ChevronRight, Clock3, CopyPlus, Download, FileClock, FileSearch, Gauge, Pencil, Plus, Send, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import { analysisApi, galleryApi, meetingApi } from '../lib/api'
import { formatDuration, formatSourceTime, participantSummary } from '../lib/format'
import { MeetingPlayer } from '../components/MeetingPlayer'
import { DeleteButton } from '../components/DeleteButton'
import { TranscriptPanel } from '../components/TranscriptPanel'
import { Button, Card, ErrorCard, LoadingCards, PageNav, SectionLabel, StatusPill } from '../components/ui'
import { useMeetingAnalysisId } from '../hooks/useMeetingAnalysis'
import { usePlayback } from '../stores/playback'
import { useSelection } from '../stores/selection'
import { EvidenceTimeline, evidenceCategories } from '../components/EvidenceTimeline'
import { ParticipantTimeline } from '../components/ParticipantTimeline'
import { EvidenceDetail } from '../components/EvidenceDetail'
import { ScorecardView } from '../components/ScorecardView'
import { LineageInspector } from '../components/LineageInspector'
import { ParticipantsView } from '../components/ParticipantsView'
import { GovernanceView, NotesView } from '../components/GovernanceView'
import { usePrincipal } from '../hooks/usePrincipal'
import { AnalysisActions, AuditLogPanel, CookbookPanel, EvidencePins, MeetingSummaryCard,
         NotesPanel, PersonAvatar, ScoreOverview } from '../components/dashboard'

// Overview is the master surface: score, recording, transcript, cookbook,
// participants, audit trail and Publish visible at once. The remaining tabs are
// depth on one of those panels, not the only route to it — Publish in particular
// used to exist ONLY inside the Governance tab, which is not where anyone looks
// for it.
//
// It was called "Workspace" until the page it sits on was already called Meeting
// Workspace, which made the first tab a restatement of the heading above it
// rather than a description of what it holds.
//
// Order matters here and is deliberate: the SCORE opens the page, the recording
// follows it. Consulting footage is what you do once the score raises a question,
// so leading with the player put the answer below the fold behind a video nobody
// had asked to play.
const tabs=['Overview','Intelligence','Participants','Timeline','Evidence','Notes','Governance']
/* The tab KEY and the tab LABEL came apart when these were renamed. The key is in
 * the URL (`?tab=Evidence`) and in every switchTab call; renaming it would break
 * links people already hold and silently drop them on the default tab. So the keys
 * stay and only the words change -- a bookmark still lands on the panel it was
 * taken from, which now has a different name above it. */
const TAB_LABEL={Evidence:'Recipe Analysis',Governance:'Evidence'}
const labelFor=tab=>TAB_LABEL[tab]||tab

export function MeetingWorkspacePage(){
  const access=usePrincipal()
  const qc=useQueryClient()
  const {meetingId}=useParams();const [params,setParams]=useSearchParams();const activeTab=tabs.includes(params.get('tab'))?params.get('tab'):tabs[0];const [search,setSearch]=useState('');const [debounced,setDebounced]=useState(''); const navigate=useNavigate()
  const reset=usePlayback(s=>s.reset);const currentMs=usePlayback(s=>s.currentMs)
  const seek=usePlayback(s=>s.seek)
  const evidenceId=useSelection(s=>s.evidenceId);const clearSelection=useSelection(s=>s.clear)
  const selectEvidence=useSelection(s=>s.selectEvidence)
  useEffect(()=>{const timer=setTimeout(()=>setDebounced(search),250);return()=>clearTimeout(timer)},[search])
  useEffect(()=>{reset();clearSelection()},[meetingId,reset,clearSelection])
  const meeting=useQuery({queryKey:['meeting',meetingId],queryFn:()=>meetingApi.detail(meetingId)})
  const media=useQuery({queryKey:['meeting-media',meetingId],queryFn:()=>meetingApi.media(meetingId),enabled:meeting.isSuccess})
  const transcript=useQuery({queryKey:['transcript',meetingId,debounced],queryFn:()=>meetingApi.transcript(meetingId,debounced?`q=${encodeURIComponent(debounced)}`:''),enabled:meeting.isSuccess})
  const analysisId=useMeetingAnalysisId(meetingId,meeting.data,params.get('analysis'),meeting.isSuccess)
  const analysis=useQuery({queryKey:['analysis',analysisId],queryFn:()=>analysisApi.detail(analysisId),enabled:Boolean(analysisId)})
  // Every analysis of this meeting, for the Cookbook panel. The workspace shows
  // ONE at a time -- the newest, or whatever ?analysis= names -- and "All
  // analyses" in the heading used to be the only route to the others. The panel
  // that names the lens is a better home for switching between lenses.
  const meetingAnalyses=useQuery({queryKey:['analyses',meetingId],queryFn:()=>analysisApi.list(`meeting_id=${meetingId}`),enabled:meeting.isSuccess})
  // 404 is the normal state for a meeting nobody has analysed, not an error to
  // surface -- so it resolves to null and the card explains what would write one.
  const summary=useQuery({queryKey:['summary',meetingId],
    queryFn:()=>meetingApi.summary(meetingId).catch(e=>{if(e.code==='not_found')return null;throw e}),
    enabled:meeting.isSuccess,retry:false})
  const scorecard=useQuery({queryKey:['scorecard',analysisId],queryFn:()=>analysisApi.scorecard(analysisId),enabled:Boolean(analysisId)})
  const evidence=useQuery({queryKey:['evidence',meetingId],queryFn:()=>meetingApi.evidence(meetingId),enabled:meeting.isSuccess})
  // What the inspector traces: the selected evidence item when there is one
  // (an exact anchor beats a timestamp), otherwise wherever the player is.
  // This asked for a hardcoded at_ms=10281481 — a fixture timestamp ~2.8 hours
  // into a 5-minute meeting — so it always traced whichever event happened to
  // be nearest the end, never the one on screen.
  const focusMs=useSelection(s=>s.focusMs)
  /* The FIRST moment this analysis actually cites.
   *
   * L4 and L5 only exist for a moment some Recipe cited, and nothing cites the
   * opening seconds -- so the inspector opened blank on every meeting and looked
   * broken. Worse, the moment cannot be changed from this tab: the player lives on
   * Overview, so on Intelligence there is no playhead to move.
   *
   * So when the reader has not chosen a moment, open on one that has something to
   * show rather than on wherever the playhead was left. Choosing a moment still
   * wins -- this is a starting point, not an override. */
  const firstCited=useMemo(()=>{
    for(const recipe of analysis.data?.recipes||[])
      for(const finding of recipe.findings||[])
        for(const ref of finding.evidence_refs||[])
          if(ref?.id)return ref.id
    return null
  },[analysis.data])
  const traceAnchor=evidenceId?`event_id=${encodeURIComponent(evidenceId)}`
    :focusMs!=null?`at_ms=${Math.max(0,Math.round(focusMs))}`
    :firstCited?`event_id=${encodeURIComponent(firstCited)}`
    :`at_ms=${Math.max(0,Math.round(currentMs??0))}`
  const lineage=useQuery({queryKey:['lineage',meetingId,traceAnchor,analysisId],queryFn:()=>meetingApi.lineage(meetingId,traceAnchor+(analysisId?`&analysis_id=${encodeURIComponent(analysisId)}`:'')),enabled:meeting.isSuccess&&activeTab==='Intelligence'})
  const participants=useQuery({queryKey:['participants',meetingId],queryFn:()=>meetingApi.participants(meetingId),enabled:meeting.isSuccess})
  // Governance and notes are no longer fetched only for their own tab: the
  // Workspace surface shows the recent audit trail and the note count beside the
  // score, which is the point of putting them on one screen.
  const governance=useQuery({queryKey:['governance',meetingId],queryFn:()=>meetingApi.governance(meetingId),enabled:meeting.isSuccess&&access.can('governance.read')})
  const notes=useQuery({queryKey:['notes',meetingId],queryFn:()=>meetingApi.notes(meetingId),enabled:meeting.isSuccess})
  const faces=useQuery({queryKey:['gallery','faces'],queryFn:galleryApi.faces,enabled:access.can('gallery.read')})
  // Switching tabs must not drop the rest of the query. Replacing the params
  // wholesale discarded ?analysis=, so arriving from Analyses → Inspect and then
  // clicking Governance lost the analysis: the tab fell back to the meeting's
  // PUBLISHED analysis, found none, and rendered "no data available" — hiding the
  // Publish button, which was then the only place to publish. You could only reach
  // it once something was already published.
  // Functional updater, not a snapshot of `params`. Rebuilding from the closure's
  // copy discards anything set between render and click: the overview panel's
  // counts set ?category= and then switch tab, and the tab switch was writing a
  // URL built before the category existed, so the Evidence tab opened unfiltered.
  // Same failure the ?analysis= note below describes, one call site along.
  const switchTab=(tab)=>setParams(previous=>{
    const next=new URLSearchParams(previous)
    if(tab===tabs[0])next.delete('tab'); else next.set('tab',tab)
    return next})
  /* Go to Overview AND bring the player into view.
   *
   * Switching tab was not enough. The player sits below the summary and the score
   * card, so jumping from the Timeline or from Recipe Analysis moved the playhead
   * to the right moment on a card that was off-screen -- the page appeared to do
   * nothing, and you had to know to scroll.
   *
   * The card cannot be scrolled to on the next line: the tab is a URL parameter, so
   * the switch is a re-render and `.player-card` does not exist yet. Polling by
   * frame waits for whatever that render costs instead of guessing a timeout, and
   * gives up after ~40 frames rather than looping forever if the card never mounts
   * (media failing to load, say). */
  const revealPlayer=()=>{
    switchTab(tabs[0])
    const smooth=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let tries=0
    const bring=()=>{
      const card=document.querySelector('.player-card')
      if(card)return card.scrollIntoView({behavior:smooth?'smooth':'auto',block:'center'})
      if(++tries<40)requestAnimationFrame(bring)
    }
    requestAnimationFrame(bring)
  }
  // The Evidence tab's category filter is in the URL rather than in the tab's own
  // state, because something OUTSIDE that tab now sets it: the overview panel's
  // counts open Evidence already narrowed to the kind that was clicked. Local
  // state cannot be handed a starting value by a sibling, and the filtered view
  // is worth linking to anyway.
  const evidenceCategory=params.get('category')||''
  const setEvidenceCategory=(category)=>setParams(previous=>{
    const next=new URLSearchParams(previous)
    if(category)next.set('category',category); else next.delete('category')
    return next})
  // ONE write, not setEvidenceCategory() followed by switchTab(). Two calls in the
  // same handler do not compose: react-router hands a functional updater the params
  // derived from the CURRENT location, which has not changed yet inside the same
  // tick, so the second call computed from a URL without the first's category and
  // the Evidence tab opened unfiltered. Set both keys in a single update.
  const openEvidence=(category)=>setParams(previous=>{
    const next=new URLSearchParams(previous)
    next.set('tab','Evidence')
    if(category)next.set('category',category); else next.delete('category')
    return next})
  const requestedEvidence=params.get('evidence')
  // The selection lives in two places -- ?evidence= and the selection store -- and
  // one effect pushed each way. They fought: clicking a pin produced 211 history
  // writes in two and a half seconds, alternating between the old id and the new
  // one forever, which is the flicker. Each effect saw the OTHER's value as a
  // change to react to, so neither ever settled.
  //
  // One shared ref records whichever value was last applied, in either direction.
  // The effect that fires first claims it; the other sees its own work is already
  // done and stops. The sync still works both ways -- a pasted ?evidence= URL
  // still selects, and clicking a pin still updates the URL -- but it converges
  // after exactly one write.
  const appliedEvidence=useRef(null)
  useEffect(()=>{
    if(requestedEvidence===appliedEvidence.current)return
    appliedEvidence.current=requestedEvidence
    const event=evidence.data?.find(e=>e.event_id===requestedEvidence)
    if(event&&event.event_id!==evidenceId)selectEvidence(event,seek)
  },[requestedEvidence,evidence.data,evidenceId,seek,selectEvidence])
  useEffect(()=>{
    if(!evidenceId||evidenceId===appliedEvidence.current)return
    appliedEvidence.current=evidenceId
    setParams(prev=>{const next=new URLSearchParams(prev);next.set('evidence',evidenceId);return next},{replace:true})
  },[evidenceId,setParams])
  if(meeting.isLoading)return <div className="page"><LoadingCards/></div>
  if(meeting.isError)return <div className="page"><ErrorCard error={meeting.error}/></div>
  const data=meeting.data;const audioMissing=currentMs>=data.start_offset_ms+1320000&&currentMs<=data.start_offset_ms+1380000
  return <div className="page workspace-page">
    <PageNav/>
    <div className="page-heading workspace-heading"><div><div className="heading-status"><SectionLabel blue>MEETING WORKSPACE</SectionLabel><StatusPill status={data.status}/></div><h2><MeetingName meeting={data} canEdit={access.can('meeting.boundaries.edit')}/>{data.traceability.room_name?` · ${data.traceability.room_name}`:''}</h2><p>Source {formatSourceTime(data.start_offset_ms)}–{formatSourceTime(data.end_offset_ms)} · {formatDuration(data.duration_ms)} · {participants.data?participantSummary(participants.data):`${data.participant_count} participants`}</p></div><div className="heading-actions"><DeleteButton permission="meeting.delete" label="Delete meeting" name={data.label}
      note="The extracted meeting, its evidence, analyses and playback derivatives are removed. The source video is kept."
      onDelete={()=>meetingApi.remove(meetingId)} onDone={()=>navigate('/meetings')}/></div></div>
    <div className="workspace-tabs" role="tablist" aria-label="Meeting workspace sections">{tabs.map(tab=><button role="tab" aria-selected={activeTab===tab} className={activeTab===tab?'active':''} key={tab} onClick={()=>switchTab(tab)}>{labelFor(tab)}</button>)}</div>
    {activeTab===tabs[0]?<div className="workspace-content">
      {audioMissing&&<div className="modality-warning"><AlertTriangle size={18}/><div><strong>Audio unavailable for this segment</strong><span>Transcript and speaker confidence are intentionally absent from 22:00–23:00. Visual evidence remains available.</span></div></div>}
      {analysis.data?.modality_confidence?.overall<.7&&<Link className="modality-warning confidence-link" to={`/analyses/${analysisId}/confidence`}><AlertTriangle size={18}/><div><strong>Degraded evidence confidence · {Math.round(analysis.data.modality_confidence.overall*100)}%</strong><span>Review modality impact, blocking Recipes and safe next actions.</span></div></Link>}
      <div className="cockpit">
        <aside className="cockpit-rail">
          <Card className="rail-card">
            <div className="rail-heading"><SectionLabel>PARTICIPANTS</SectionLabel><button onClick={()=>switchTab('Participants')}>Resolve</button></div>
            <div className="rail-people">{(participants.data||[]).map(person=><button key={person.participant_id} className="rail-person" onClick={()=>switchTab('Participants')}>
              <PersonAvatar person={person} faces={faces.data||[]}/>
              <div className="grow"><strong>{person.display_name}</strong><span>{person.identity_status.replaceAll('_',' ')}{person.speaking_ms?` · ${formatDuration(person.speaking_ms,{short:true})} speaking`:''}</span></div>
            </button>)}{participants.data?.length===0&&<div className="no-results">No participants resolved yet.</div>}</div>
          </Card>
        </aside>

        <div className="cockpit-main">
          {/* The score leads. It is the answer this page exists to give, and it
              used to open below the fold behind a video nobody had asked to play
              yet. The recording is what you consult once the score raises a
              question, so it follows the score rather than gating it.

              No evidence feed here: Evidence is a tab in the strip above, and the
              feed was a shorter copy of it competing with the transcript. */}
          <Card><MeetingSummaryCard summary={summary.data} participants={participants.data||[]}
            onOpenEvidence={()=>openEvidence(null)}/></Card>
          <Card>
            <div className="card-heading"><div><SectionLabel>INTELLIGENCE SCORE OVERVIEW</SectionLabel><h3>{analysis.data?analysis.data.name:'No analysis selected'}</h3>{analysis.data&&analysis.data.status!=='published'&&<span className="dash-draft-tag">Draft · not published</span>}</div>{analysisId&&<button className="link-button" onClick={()=>switchTab('Intelligence')}>Drivers & lineage <ChevronRight size={13}/></button>}</div>
            {analysisId&&scorecard.isLoading?<div className="inline-skeleton"/>
             :scorecard.isError?<ErrorCard error={scorecard.error}/>
             :scorecard.data&&analysis.data?<ScoreOverview analysis={analysis.data} scorecard={scorecard.data}/>
             :<NoAnalysis meetingId={meetingId} canCreate={access.can('analysis.create')}/>}
          </Card>
          <Card className="player-card"><div className="card-heading"><div><SectionLabel>MEETING RECORDING</SectionLabel><h3>Source-synchronized playback</h3></div><span className="source-clock">SOURCE TIME</span></div>
            {media.isLoading?<div className="player-skeleton"/>:media.isError?<ErrorCard error={media.error}/>:<MeetingPlayer media={media.data} meeting={data}/>}
            <EvidencePins events={evidence.data||[]} meeting={data}/>
          </Card>
          <Card className="transcript-card">{transcript.isLoading&&!transcript.data?<LoadingCards/>:<TranscriptPanel segments={transcript.data?.segments||[]} query={search} onQueryChange={setSearch} searching={transcript.isFetching}/>}</Card>
        </div>

        <aside className="cockpit-rail">
          <CookbookPanel analysis={analysis.data} analyses={meetingAnalyses.data||[]}
                         meetingId={meetingId} canCreate={access.can('analysis.create')}
                         onSelect={(id)=>setParams(previous=>{const next=new URLSearchParams(previous);next.set('analysis',id);return next})}/>
          <AuditLogPanel governance={governance.data} canRead={access.can('governance.read')}
                         loading={governance.isLoading} error={governance.error}
                         onViewAll={()=>switchTab('Governance')}/>
          <NotesPanel notes={notes.data||[]} onOpen={()=>switchTab('Notes')}/>
          <AnalysisActions analysis={analysis.data} access={access}/>
        </aside>
      </div>
      <div className="workspace-bottom-grid"><Card><SectionLabel>MEETING SIGNALS</SectionLabel><div className="signal-grid"><div><Users size={17}/><strong>{data.participant_count}</strong><span>Participants</span></div><div><Sparkles size={17}/><strong>{data.evidence_count}</strong><span>Evidence items</span></div><div><FileSearch size={17}/><strong>{data.transcript_segment_count}</strong><span>Transcript segments</span></div></div></Card><Card><SectionLabel>TRACEABILITY</SectionLabel><div className="trace-row"><span>Camera</span><strong>{data.traceability.camera_id}</strong><span>Audio</span><strong>{data.traceability.audio_source_id}</strong><span>Ruleset</span><strong>{data.traceability.extraction_ruleset_version}</strong></div></Card></div>
    </div>:<WorkspaceTab tab={activeTab} onSwitchTab={switchTab} onRevealPlayer={revealPlayer} category={evidenceCategory} onCategoryChange={setEvidenceCategory} meeting={data} evidence={evidence.data||[]} selectedEvidence={evidence.data?.find(e=>e.event_id===evidenceId)} analysis={analysis.data} scorecard={scorecard.data} lineage={lineage.data} lineageError={lineage.error?.message} participants={participants.data||[]} governance={governance.data} notes={notes.data||[]} faces={faces.data||[]}/>}
  </div>
}


function NoAnalysis({meetingId,canCreate}){return <div className="no-analysis-state"><Gauge size={22}/><div><strong>No analysis yet</strong><span>This Meeting has evidence but no Cookbook interpretation.</span></div>{canCreate&&<Link className="button primary" to={`/analyses/new?meeting_id=${meetingId}`}><Plus size={14}/>Create analysis</Link>}</div>}

function WorkspaceTab({tab,onSwitchTab,onRevealPlayer,category='',onCategoryChange,meeting,evidence,selectedEvidence,analysis,scorecard,lineage,lineageError,participants,governance,notes,faces=[]}){
  const setCategory=onCategoryChange||(()=>{});const [minConfidence,setMinConfidence]=useState(0);const chooseEvidence=useSelection(s=>s.selectEvidence);const seekTo=usePlayback(s=>s.seek);const filtered=evidence.filter(e=>(!category||e.category===category)&&e.confidence>=minConfidence);const chosen=selectedEvidence||filtered[0];const chosenIndex=filtered.findIndex(e=>e.event_id===chosen?.event_id)
  // Laned by PERSON, not by evidence category. Clicking anywhere goes to that
  // moment and then to the surface holding the player -- the same reason the
  // Evidence tab's "Jump to video" switches tabs: seeking alone moves a store
  // nothing on this tab is watching, and the control looks dead.
  if(tab==='Timeline')return <Card className="tab-surface"><div className="card-heading"><div><SectionLabel>PARTICIPANT TIMELINE</SectionLabel><h3>Who was on camera, and who was speaking</h3></div></div><ParticipantTimeline participants={participants} meeting={meeting} onJump={()=>onRevealPlayer?.()}/></Card>
  if(tab==='Evidence')return <div className="evidence-tab"><Card><div className="card-heading"><div><SectionLabel>RECIPE ANALYSIS</SectionLabel><h3>Filter and inspect what was detected</h3></div><div className="evidence-filters"><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option><option value="engagement_attention">Engagement / Attention</option><option value="intent_commitment">Intent / Commitment</option><option value="objection_concern">Objection / Concern</option><option value="value_proof">Value / Proof</option><option value="action_decision">Action / Decision</option><option value="other">Other</option></select><select value={minConfidence} onChange={e=>setMinConfidence(Number(e.target.value))}><option value="0">Any confidence</option><option value="0.5">≥50%</option><option value="0.75">≥75%</option><option value="0.9">≥90%</option></select></div></div><EvidenceTimeline events={filtered} meeting={meeting}/></Card><Card><EvidenceDetail event={chosen} participants={participants}
        onJump={(event)=>{
          // The player is mounted on Workspace, not here, so seeking alone moved a
          // store nobody was watching and the button looked dead. Select the moment,
          // then go to the surface that can actually show it.
          chooseEvidence(event,seekTo)
          onRevealPlayer?.()
        }}
        onPrevious={chosenIndex>0?()=>chooseEvidence(filtered[chosenIndex-1],seekTo):null} onNext={chosenIndex>=0&&chosenIndex<filtered.length-1?()=>chooseEvidence(filtered[chosenIndex+1],seekTo):null}/></Card></div>
  if(tab==='Intelligence')return <div className="intelligence-tab">{lineageError?<Card className="planned-tab"><Gauge size={25}/><h3>Lineage unavailable</h3><p>This moment could not be traced. {lineageError}</p></Card>:lineage?<Card><LineageInspector lineage={lineage}/></Card>:<LoadingCards/>}{analysis&&scorecard?<Card><ScorecardView analysis={analysis} scorecard={scorecard}/></Card>:<Card className="planned-tab"><Gauge size={25}/><h3>No published analysis</h3><p>Scores shown here belong to a meeting's published analysis, and this meeting has none yet. Open a specific analysis from the Analyses tab to see its drivers and recipe results, or publish one.</p><Link className="button-secondary" to={`/analyses?meeting=${meeting.meeting_id}`}>View analyses</Link></Card>}</div>
  if(tab==='Participants')return <Card><ParticipantsView meeting={meeting} participants={participants} faces={faces}/></Card>
  if(tab==='Notes')return <Card><NotesView meetingId={meeting.meeting_id} notes={notes} analysis={analysis} participants={participants} evidence={evidence}/></Card>
  if(tab==='Governance'&&governance&&analysis)return <GovernanceView meeting={meeting} governance={governance} analysis={analysis}/>
  // Governance without an analysis is a real state, not an error: a meeting can be
  // extracted and audited before anyone interprets it. Showing the trail alone
  // beats "no data available", which is what it used to say.
  if(tab==='Governance'&&governance)return <Card className="tab-surface"><div className="card-heading"><div><SectionLabel>IMMUTABLE ACTIVITY LOG</SectionLabel><h3>{governance.activity.length} governed events</h3></div><Link className="button secondary" to={`/analyses?meeting_id=${meeting.meeting_id}`}>Choose an analysis</Link></div><div className="activity-timeline">{governance.activity.map(item=><article key={item.entry_id}><div className="activity-dot"/><div className="audit-row"><div><time>{new Date(item.at).toLocaleString()}</time><strong>{item.actor}</strong><p>{item.summary}</p></div></div></article>)}{governance.activity.length===0&&<div className="no-results">Nothing has been changed on this meeting yet.</div>}</div></Card>
  return <Card className="planned-tab"><Gauge size={25}/><h3>{tab}</h3><p>This section has no data available.</p></Card>
}

/* Compute names meetings "{n} Meeting", numbered within their source video, so a
   library of one-meeting recordings is a wall of "1 Meeting". The ordinal leads
   so it reads as a position rather than a name — which is all a generated label
   can honestly claim — but it is still only meaningful inside its own recording.
   Only a person knows it was the Nashville sync. The rename is audited and shows
   in Governance. */
function MeetingName({meeting, canEdit}){
  const qc=useQueryClient()
  const [editing,setEditing]=useState(false)
  const [value,setValue]=useState(meeting.label)
  const save=useMutation({
    mutationFn:()=>meetingApi.rename(meeting.meeting_id, value.trim()),
    onSuccess:()=>{setEditing(false)
      qc.invalidateQueries({queryKey:['meeting',meeting.meeting_id]})
      qc.invalidateQueries({queryKey:['meetings']});qc.invalidateQueries({queryKey:['overview']})
      qc.invalidateQueries({queryKey:['videos']});qc.invalidateQueries({queryKey:['governance']})},
  })
  if(!canEdit)return <>{meeting.label}</>
  if(!editing)return <button className="meeting-rename" title="Rename this meeting"
      onClick={()=>{setValue(meeting.label);setEditing(true)}}>{meeting.label}<Pencil size={14}/></button>
  return <span className="meeting-rename-edit">
    <input value={value} autoFocus maxLength={120} aria-label="Meeting name"
      onChange={e=>setValue(e.target.value)}
      onKeyDown={e=>{if(e.key==='Enter'&&value.trim())save.mutate();if(e.key==='Escape')setEditing(false)}}/>
    <button className="icon-button" disabled={!value.trim()||save.isPending} onClick={()=>save.mutate()} aria-label="Save name"><Check size={15}/></button>
    <button className="icon-button" onClick={()=>setEditing(false)} aria-label="Cancel rename"><X size={15}/></button>
    {save.isError&&<em className="weight-error">{save.error.message}</em>}
  </span>
}
