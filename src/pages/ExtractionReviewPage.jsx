import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, GitMerge, Scissors, Save, Trash2 } from 'lucide-react'
import { meetingApi, videoApi } from '../lib/api'
import { formatSourceTime } from '../lib/format'
import { usePrincipal } from '../hooks/usePrincipal'
import { Button, Card, ErrorCard, LoadingCards, PageNav, SectionLabel, SuccessNote } from '../components/ui'

export function ExtractionReviewPage() {
  const access=usePrincipal(); const {videoId}=useParams(); const qc=useQueryClient(); const query=useQuery({queryKey:['video-meetings',videoId],queryFn:()=>videoApi.meetings(videoId)}); const [selected,setSelected]=useState([]); const [result,setResult]=useState(null)
  const changed=()=>qc.invalidateQueries({queryKey:['video-meetings',videoId]})
  const mutationOptions={onSuccess:response=>{setResult(response);changed()}}
  const boundaries=useMutation({mutationFn:({id,start,end})=>meetingApi.setBoundaries(id,{start_offset_ms:start,end_offset_ms:end}),...mutationOptions})
  const split=useMutation({mutationFn:({id,at})=>meetingApi.split(id,at),...mutationOptions})
  const merge=useMutation({mutationFn:()=>meetingApi.merge(selected),onSuccess:response=>{setResult(response);setSelected([]);changed()}})
  const markDead=useMutation({mutationFn:({id,reason})=>meetingApi.markAsDead(id,reason),...mutationOptions})
  if(query.isLoading)return <div className="page"><LoadingCards/></div>; if(query.isError)return <div className="page"><ErrorCard error={query.error}/></div>
  const canEdit=access.can('meeting.boundaries.edit'); const error=boundaries.error||split.error||merge.error||markDead.error
  return <div className="page"><PageNav/><div className="page-heading"><div><SectionLabel blue>MEETING EXTRACTION REVIEW</SectionLabel><h2>Review meeting boundaries</h2><p>Governed edits invalidate affected downstream analyses and state whether remote reprocessing is required.</p></div><Button variant="secondary" disabled={!canEdit||selected.length<2||merge.isPending} onClick={()=>merge.mutate()}><GitMerge size={14}/>Merge selected ({selected.length})</Button></div>
    {!canEdit&&<div className="permissions-placeholder"><strong>Read-only extraction review</strong><p>Your live permissions do not include meeting.boundaries.edit.</p></div>}
    {result&&<SuccessNote>{result.warning} {result.requires_reprocess?`Remote job ${result.job_id||'queued'} is required.`:'Existing evidence still covers this change.'}</SuccessNote>}{error&&<div className="warning-callout" role="alert"><p>{error.message}</p></div>}
    <div className="boundary-list">{query.data.map(meeting=><BoundaryRow key={meeting.meeting_id} meeting={meeting} canEdit={canEdit} checked={selected.includes(meeting.meeting_id)} onCheck={checked=>setSelected(current=>checked?[...current,meeting.meeting_id]:current.filter(id=>id!==meeting.meeting_id))} onSave={(start,end)=>boundaries.mutate({id:meeting.meeting_id,start,end})} onSplit={at=>split.mutate({id:meeting.meeting_id,at})} onMarkDead={reason=>markDead.mutate({id:meeting.meeting_id,reason})}/>)}</div>
    <div className="definition-callout"><AlertTriangle size={18}/><div><strong>Review consequence</strong><p>Boundary changes are audit-visible. Dependent Analyses become stale; reclassification supersedes the Meeting rather than deleting its history.</p></div></div>
  </div>
}

function BoundaryRow({meeting,canEdit,checked,onCheck,onSave,onSplit,onMarkDead}) {
  const [start,setStart]=useState(meeting.start_offset_ms); const [end,setEnd]=useState(meeting.end_offset_ms); const [at,setAt]=useState(Math.round((meeting.start_offset_ms+meeting.end_offset_ms)/2)); const [reason,setReason]=useState('')
  return <Card className="boundary-row"><label className="merge-check"><input type="checkbox" checked={checked} disabled={!canEdit} onChange={event=>onCheck(event.target.checked)}/><span>Select for merge</span></label><div className="boundary-title"><strong>{meeting.label}</strong><span>{formatSourceTime(meeting.start_offset_ms)}–{formatSourceTime(meeting.end_offset_ms)}</span></div><label>Start ms<input type="number" value={start} disabled={!canEdit} onChange={event=>setStart(Number(event.target.value))}/></label><label>End ms<input type="number" value={end} disabled={!canEdit} onChange={event=>setEnd(Number(event.target.value))}/></label><Button variant="secondary" disabled={!canEdit||start>=end} onClick={()=>onSave(start,end)}><Save size={14}/>Save bounds</Button><label>Split at ms<input type="number" min={start+1} max={end-1} value={at} disabled={!canEdit} onChange={event=>setAt(Number(event.target.value))}/></label><Button variant="secondary" disabled={!canEdit||at<=start||at>=end} onClick={()=>onSplit(at)}><Scissors size={14}/>Split</Button><label className="dead-reason">Reclassification reason<input value={reason} disabled={!canEdit} maxLength="500" placeholder="Why this is not a meeting" onChange={event=>setReason(event.target.value)}/></label><Button variant="danger" disabled={!canEdit||!reason.trim()} onClick={()=>onMarkDead(reason.trim())}><Trash2 size={14}/>Mark as dead</Button></Card>
}
