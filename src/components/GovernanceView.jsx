import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronDown, ChevronUp, Download, FileClock, Send } from 'lucide-react'
import { analysisApi, meetingApi } from '../lib/api'
import { usePrincipal } from '../hooks/usePrincipal'
import { Button, Card, SectionLabel, StatusPill } from './ui'
import { blockedNames } from './dashboard'

/* Which version identifiers reach the screen.
 *
 * The MODEL VERSIONS list rendered whatever the pipeline recorded, which meant a
 * third-party model name was printed on the Governance tab. The record itself is
 * unchanged -- the database and the API still carry it, because provenance is the
 * point of this panel -- but the UI shows only the versions Triton owns.
 *
 * Allowlist rather than denylist on purpose: a vendor key added later is hidden by
 * default instead of appearing on screen until someone notices.
 */
const OWN_VERSION_KEYS = new Set([
  'recipe_catalog', 'score_version', 'extraction_ruleset_version', 'pipeline_version',
])
export function ownVersions(versions) {
  return Object.entries(versions || {}).filter(([key]) => OWN_VERSION_KEYS.has(key))
}

export function NotesView({meetingId,notes,analysis,participants=[],evidence=[]}) {
  const access=usePrincipal(); const availableKinds=[access.can('note.reviewer.write')&&'reviewer',access.can('note.reviewer.write')&&'internal',access.can('note.participant.write')&&'participant_response'].filter(Boolean); const [kind,setKind]=useState('reviewer'); const [text,setText]=useState(''); const [visibility,setVisibility]=useState('team'); const [participantId,setParticipantId]=useState(''); const [recipeId,setRecipeId]=useState(''); const [anchorMs,setAnchorMs]=useState(''); const [evidenceId,setEvidenceId]=useState(''); const qc=useQueryClient()
  useEffect(()=>{if(availableKinds.length&&!availableKinds.includes(kind))setKind(availableKinds[0])},[availableKinds,kind])
  const add=useMutation({mutationFn:()=>{const event=evidence.find(item=>item.event_id===evidenceId);return meetingApi.addNote(meetingId,{kind,text,visibility,analysis_id:analysis?.analysis_id||null,participant_id:participantId||null,recipe_id:recipeId||null,anchor_ms:anchorMs===''?null:Number(anchorMs),evidence_ref:event?{kind:'semantic_event',id:event.event_id,start_ms:event.start_ms,end_ms:event.end_ms}:null})},onSuccess:()=>{setText('');qc.invalidateQueries({queryKey:['notes',meetingId]})}})
  return <div className="notes-view"><section><SectionLabel>NOTES & PARTICIPANT RESPONSE</SectionLabel><div className="note-tabs">{availableKinds.map(value=><button key={value} className={kind===value?'active':''} onClick={()=>setKind(value)}>{value.replaceAll('_',' ')}</button>)}</div><div className="notes-list">{notes.filter(note=>note.kind===kind).map(note=><article key={note.note_id}><strong>{note.author}</strong><time>{new Date(note.created_at).toLocaleString()}{note.edited_at?' · edited':''}</time><p>{note.text}</p><small>{note.visibility.replaceAll('_',' ')}{note.anchor_ms!=null?` · source ${note.anchor_ms} ms`:''}{note.participant_id?` · ${note.participant_id}`:''}{note.recipe_id?` · ${note.recipe_id}`:''}</small></article>)}{notes.filter(note=>note.kind===kind).length===0&&<div className="no-results">No {kind.replaceAll('_',' ')} notes are visible in your scope.</div>}</div>
    {availableKinds.length?<><div className="note-context-grid"><label className="field-label">Visibility<select value={visibility} onChange={event=>setVisibility(event.target.value)}><option value="private">Private</option><option value="team">Team</option><option value="published_with_report">Published with report</option></select></label><label className="field-label">Participant<select value={participantId} onChange={event=>setParticipantId(event.target.value)}><option value="">No participant</option>{participants.map(person=><option key={person.participant_id} value={person.participant_id}>{person.display_name}</option>)}</select></label><label className="field-label">Recipe<select value={recipeId} onChange={event=>setRecipeId(event.target.value)}><option value="">No Recipe</option>{(analysis?.recipes||[]).map(recipe=><option key={recipe.recipe_id} value={recipe.recipe_id}>{recipe.recipe_name}</option>)}</select></label><label className="field-label">Source anchor (ms)<input type="number" min="0" value={anchorMs} onChange={event=>setAnchorMs(event.target.value)}/></label><label className="field-label">Evidence<select value={evidenceId} onChange={event=>setEvidenceId(event.target.value)}><option value="">No evidence</option>{evidence.map(event=><option key={event.event_id} value={event.event_id}>{event.summary}</option>)}</select></label></div><textarea value={text} onChange={event=>setText(event.target.value)} placeholder="Add a traceable note…"/><Button disabled={!text.trim()||add.isPending} onClick={()=>add.mutate()}><Send size={14}/>Save note</Button>{add.isError&&<p className="weight-error">{add.error.message}</p>}</>:<div className="permissions-placeholder"><p>Your live permissions do not allow note entry.</p></div>}
  </section></div>
}

export function GovernanceView({meeting,governance,analysis}) {
  const access=usePrincipal(); const qc=useQueryClient(); const [expanded,setExpanded]=useState(null); const publish=useMutation({mutationFn:()=>analysisApi.publish(analysis.analysis_id),onSuccess:()=>qc.invalidateQueries({queryKey:['analysis',analysis.analysis_id]})})
  /* Two cards, not two sections inside one. They answer different questions -- what
     HAPPENED, and what this analysis WAS -- and sharing a single surface made them
     read as one long panel with a rule down the middle. */
  return <div className="governance-view"><Card><section><div className="governance-actions"><SectionLabel>IMMUTABLE ACTIVITY LOG</SectionLabel><div>{access.can('report.read')&&<Link className="button secondary" to={`/reports/${analysis.analysis_id}`}><Download size={14}/>Report preview</Link>}{access.can('analysis.publish')&&analysis.status!=='published'&&<Button disabled={!analysis.publishable||publish.isPending} onClick={()=>publish.mutate()}><Send size={14}/>Publish</Button>}</div></div>{analysis.status!=='published'&&!analysis.publishable&&<p className="action-blocked"><AlertTriangle size={13}/><span><strong>Not ready to publish or export.</strong> This recording held too little evidence to assess {blockedNames(analysis).join(', ')}. Resolve the evidence, or re-weight a copy of the Cookbook.</span></p>}<div className="activity-timeline">{governance.activity.map(item=>{const open=expanded===item.entry_id;const hasDiff=item.original_value!=null||item.corrected_value!=null;return <article key={item.entry_id}><div className="activity-dot"/><button className="audit-row" disabled={!hasDiff} onClick={()=>setExpanded(open?null:item.entry_id)}><div><time>{new Date(item.at).toLocaleString()}</time><strong>{item.actor}</strong><p>{item.summary}</p></div>{hasDiff&&(open?<ChevronUp size={14}/>:<ChevronDown size={14}/>)}</button>{open&&<div className="audit-diff"><div><span>Previous value</span><code>{formatAuditValue(item.original_value)}</code></div><div><span>Corrected value</span><code>{formatAuditValue(item.corrected_value)}</code></div><small>{item.entity_type} · {item.entity_id}</small></div>}</article>})}</div>{publish.isError&&<p className="weight-error">{publish.error.message}</p>}</section></Card>
    <Card><section><SectionLabel>VERSIONS & TRACEABILITY</SectionLabel><div className="version-list">{governance.versions.map(version=><article key={version.analysis_id}><FileClock size={16}/><div><strong>{version.name}</strong><span>{version.cookbook_name} v{version.cookbook_version}</span></div><StatusPill status={version.status}/></article>)}</div><dl className="trace-dl"><div><dt>Source</dt><dd>{meeting.traceability.source_filename}</dd></div><div><dt>Room / camera</dt><dd>{meeting.traceability.room_name} · {meeting.traceability.camera_id}</dd></div><div><dt>Evidence coverage</dt><dd>{meeting.traceability.evidence_coverage}%</dd></div><div><dt>Cookbook</dt><dd>{analysis.cookbook_name} v{analysis.cookbook_version}</dd></div><div><dt>Scoring engine</dt><dd>{analysis.score_version||'Not reported'}</dd></div></dl><SectionLabel>MODEL VERSIONS</SectionLabel><dl className="model-version-list">{ownVersions(analysis.model_versions).map(([model,version])=><div key={model}><dt>{model}</dt><dd>{version}</dd></div>)}</dl><div className="permissions-placeholder"><SectionLabel>LIVE ACCESS</SectionLabel><p>{access.principal?.permissions.join(' · ')||'No permissions reported'}{access.principal?.provisional?' · provisional matrix':''}</p></div></section></Card>
  </div>
}

function formatAuditValue(value){if(value==null)return 'Not set';return typeof value==='string'?value:JSON.stringify(value,null,2)}
