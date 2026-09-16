import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Expand, MicOff, Play, RefreshCw, UserRoundX } from 'lucide-react'
import { videoApi } from '../lib/api'
import { formatDuration, formatSourceTime } from '../lib/format'
import { usePrincipal } from '../hooks/usePrincipal'
import { Button, Card, ErrorCard, LoadingCards, PageNav, SectionLabel, SuccessNote } from '../components/ui'

export function DeadFootagePage() {
  const access=usePrincipal(); const qc=useQueryClient(); const {videoId,segmentId}=useParams(); const [beforeSeconds,setBeforeSeconds]=useState(0); const [afterSeconds,setAfterSeconds]=useState(0)
  const query=useQuery({queryKey:['dead-footage',videoId],queryFn:()=>videoApi.deadFootage(videoId)})
  const promote=useMutation({mutationFn:()=>videoApi.promoteDeadFootage(videoId,segmentId)})
  const extend=useMutation({mutationFn:()=>videoApi.extendDeadFootage(videoId,segmentId,beforeSeconds*1000,afterSeconds*1000),onSuccess:()=>{qc.invalidateQueries({queryKey:['dead-footage',videoId]});qc.invalidateQueries({queryKey:['video-meetings',videoId]})}})
  if(query.isLoading)return <div className="page"><LoadingCards/></div>; if(query.isError)return <div className="page"><ErrorCard error={query.error}/></div>; const segment=query.data.find(row=>row.segment_id===segmentId); if(!segment)return <div className="page"><ErrorCard error={{message:'Dead-footage segment not found'}}/></div>
  const canEdit=access.can('meeting.boundaries.edit')
  return <div className="page"><PageNav/><div className="page-heading"><div><SectionLabel blue>DEAD FOOTAGE REVIEW</SectionLabel><h2>{formatSourceTime(segment.start_ms)}–{formatSourceTime(segment.end_ms)}</h2><p>{formatDuration(segment.duration_ms)} excluded from extracted meetings</p></div>{canEdit&&<Button disabled={promote.isPending||promote.isSuccess} onClick={()=>promote.mutate()}><RefreshCw size={15}/>Mark as meeting</Button>}</div>
    {promote.isSuccess&&<SuccessNote>{promote.data.warning} {promote.data.job_id?`Job ${promote.data.job_id} created.`:promote.data.requires_reprocess?'Remote processing is required; no job identifier was returned.':''}</SuccessNote>}{extend.isSuccess&&<SuccessNote>Dead-footage boundaries were extended. {extend.data.affected_analyses} dependent Analyses were affected.</SuccessNote>}{(promote.isError||extend.isError)&&<div className="warning-callout"><p>{(promote.error||extend.error).message}</p></div>}
    <div className="dead-review-grid"><Card className="dead-player"><SectionLabel>SOURCE SEGMENT</SectionLabel><div className="dead-video-stage"><Play size={28}/><span>Source proxy becomes playable when media derivatives are available.</span></div><div className="dead-time-row"><span>Start <strong>{formatSourceTime(segment.start_ms)}</strong></span><span>End <strong>{formatSourceTime(segment.end_ms)}</strong></span></div></Card><Card><SectionLabel>WHY THIS IS NOT A MEETING</SectionLabel><div className="classification-pill">DEAD FOOTAGE</div><div className="detection-facts"><div><UserRoundX/><span>Maximum people detected</span><strong>{segment.people_detected_max}</strong></div><div><MicOff/><span>Human speech coverage</span><strong>{segment.speech_pct}%</strong></div></div><div className="rule-explanation"><AlertTriangle size={17}/><div><strong>{segment.reason}</strong><p>{segment.rule}</p></div></div></Card></div>
    {canEdit&&<Card className="dead-extension"><div><SectionLabel>EXTEND CLASSIFICATION</SectionLabel><p>Grow this dead span into adjacent meeting footage. Saved changes are audited and may stale dependent Analyses.</p></div><label>Before (seconds)<input type="number" min="0" value={beforeSeconds} onChange={event=>setBeforeSeconds(Math.max(0,Number(event.target.value)))}/></label><label>After (seconds)<input type="number" min="0" value={afterSeconds} onChange={event=>setAfterSeconds(Math.max(0,Number(event.target.value)))}/></label><Button disabled={(!beforeSeconds&&!afterSeconds)||extend.isPending} onClick={()=>extend.mutate()}><Expand size={14}/>Extend dead footage</Button></Card>}
    <Card><SectionLabel>DETECTION SIGNALS</SectionLabel><SignalChart signals={segment.signals}/></Card>
  </div>
}

function SignalChart({signals}){const people=signals?.person||signals?.people_present||[];const speech=signals?.speech||signals?.human_speech_present||[];if(!people.length&&!speech.length)return <div className="signals-unavailable"><span>Signal history is not yet persisted.</span><p>The classification summary remains authoritative and auditable.</p></div>;return <div className="signal-chart" aria-label="Person and human speech detection history"><div>{people.map((value,index)=><i key={index} className={value?'person on':'person'}/>)}</div><div>{speech.map((value,index)=><i key={`s${index}`} className={value?'speech on':'speech'}/>)}</div></div>}
