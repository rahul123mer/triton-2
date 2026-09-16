import { useState } from 'react'
import { DeleteButton } from '../components/DeleteButton'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams, useNavigate} from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CalendarDays, Camera, Clock3, FileVideo, RotateCcw, ShieldCheck, Users } from 'lucide-react'
import { videoApi } from '../lib/api'
import { formatBytes, formatDate, formatDuration, formatSourceTime } from '../lib/format'
import { BreakdownDonut, SourceTimeline } from '../components/FootageBreakdown'
import { Button, Card, ErrorCard, LoadingCards, Modal, PageNav, SectionLabel, Spinner, StatusPill, SuccessNote } from '../components/ui'
import { usePrincipal } from '../hooks/usePrincipal'

export function VideoDetailPage() {
  const access = usePrincipal()
  const { videoId } = useParams(); const navigate=useNavigate(); const [confirmOpen,setConfirmOpen]=useState(false); const [started,setStarted]=useState(false)
  const video = useQuery({ queryKey:['video',videoId], queryFn:()=>videoApi.detail(videoId) })
  // Playback for the SOURCE recording. Meeting clips are separate; reviewing an
  // extraction means watching the footage between the meetings too.
  const sourceMedia = useQuery({ queryKey:['source-media',videoId],
    queryFn:()=>videoApi.media(videoId), enabled:access.can('video.media.read') })
  const meetings = useQuery({ queryKey:['video-meetings',videoId], queryFn:()=>videoApi.meetings(videoId) })
  const dead = useQuery({ queryKey:['dead-footage',videoId], queryFn:()=>videoApi.deadFootage(videoId) })
  const impact = useMutation({ mutationFn:(dry)=>videoApi.extractionImpact(videoId,dry), onSuccess:(_,dry)=>{if(!dry)setStarted(true)} })
  const openImpact=()=>{setConfirmOpen(true); if(!impact.data)impact.mutate(true)}
  if(video.isLoading) return <div className="page"><LoadingCards/></div>
  if(video.isError) return <div className="page"><ErrorCard error={video.error}/></div>
  const data=video.data; const breakdown=data.footage_breakdown
  const segmentHref=(segment)=>{if(segment.kind==='meeting'&&segment.meeting_id)return `/meetings/${segment.meeting_id}`;const match=dead.data?.find(item=>item.start_ms===segment.start_ms&&item.end_ms===segment.end_ms);return match?`/videos/${videoId}/dead-footage/${encodeURIComponent(match.segment_id)}`:null}
  return <div className="page">
    <PageNav/>
    <div className="page-heading"><div><SectionLabel blue>VIDEO DETAIL</SectionLabel><h2>{data.filename}</h2><p>{data.room_name?`${data.room_name} · `:''}Uploaded by {data.uploaded_by}</p></div>{access.can('video.reprocess')&&<Button variant="secondary" onClick={openImpact}><RotateCcw size={16}/> Re-run extraction</Button>}<DeleteButton permission="video.delete" label="Delete video" name={data.filename} note="The source video, every meeting extracted from it and all playback derivatives are removed." onDelete={()=>videoApi.remove(videoId)} onDone={()=>navigate('/videos')}/></div>
    <div className="detail-grid top">
      <Card className="summary-card"><SectionLabel>SOURCE VIDEO SUMMARY</SectionLabel><div className="video-poster">{sourceMedia.data?.available
        ? <video className="source-video" controls preload="metadata"
            poster={sourceMedia.data.poster_url || undefined}
            src={sourceMedia.data.playback_url} aria-label={`${data.filename} source recording`}/>
        : <div className="poster-mark"><FileVideo size={34}/><span>{sourceMedia.isLoading?'Loading preview…':'No source file on disk'}</span></div>}
      <div className="poster-duration">{formatDuration(data.duration_ms)}</div></div><div className="metadata-grid"><Meta icon={CalendarDays} label="Recorded" value={formatDate(data.recorded_on)}/><Meta icon={Clock3} label="Duration" value={formatDuration(data.duration_ms)}/><Meta icon={Camera} label="Capture" value={`${data.resolution} · ${data.fps} fps`}/><Meta icon={FileVideo} label="File size" value={formatBytes(data.size_bytes)}/><Meta icon={ShieldCheck} label="Ruleset" value={data.extraction_ruleset_version}/><Meta icon={Users} label="Room" value={data.room_name}/></div></Card>
      <Card><SectionLabel>FOOTAGE BREAKDOWN</SectionLabel><h3>{breakdown.meeting_count} meetings from one recording</h3><BreakdownDonut breakdown={breakdown}/><div className="stat-strip"><div><span>Total footage</span><strong>{formatDuration(breakdown.total_duration_ms)}</strong></div><div><span>Meeting time</span><strong>{formatDuration(breakdown.meeting_duration_ms)}</strong></div><div className="danger"><span>Dead footage</span><strong>{breakdown.dead_footage_pct}%</strong></div></div></Card>
    </div>
    <Card><div className="card-heading"><div><SectionLabel>SOURCE TIMELINE</SectionLabel><h3>Meeting and dead-footage intervals</h3></div><div className="legend"><span><i className="swatch meeting"/>Meeting</span><span><i className="swatch dead"/>Dead footage</span></div></div><SourceTimeline breakdown={breakdown} getHref={segmentHref}/><div className="dead-segment-links">{(dead.data||[]).map((segment,i)=><Link key={segment.segment_id} to={`/videos/${videoId}/dead-footage/${encodeURIComponent(segment.segment_id)}`}>Review dead segment {i+1} · {formatSourceTime(segment.start_ms)}–{formatSourceTime(segment.end_ms)}</Link>)}</div>{dead.isLoading&&<div className="inline-skeleton"/>}{dead.isError&&<span className="table-sub">Dead-footage details could not be loaded.</span>}</Card>
    <Card><div className="card-heading"><div><SectionLabel>MEETINGS EXTRACTED ({meetings.data?.length || 0})</SectionLabel><h3>Detected sessions</h3></div><Link className="button secondary" to={`/videos/${videoId}/extraction-review`}>Review extraction</Link></div>{meetings.isLoading?<LoadingCards/>:<div className="meeting-list">{meetings.data.map(item=><Link to={`/meetings/${item.meeting_id}`} className="meeting-row" key={item.meeting_id}><div className="meeting-index">{item.label.replace('Meeting ','')}</div><div className="grow"><strong>{item.label}</strong><span>{formatSourceTime(item.start_offset_ms)}–{formatSourceTime(item.end_offset_ms)} in source</span></div><div className="meeting-metric"><span>Duration</span><strong>{formatDuration(item.duration_ms)}</strong></div><div className="meeting-metric"><span>Participants</span><strong>{item.participant_count}</strong></div>{item.overall_score!=null?<div className="meeting-score"><strong>{item.overall_score}</strong><span>{item.cookbook_name}</span></div>:<StatusPill status={item.status}/>}</Link>)}</div>}</Card>
    <div className="definition-callout"><div className="info-icon">i</div><div><strong>Dead Footage Definition</strong><p>Dead footage is any time period where both conditions are not met simultaneously: at least one person visually detected and at least one human voice detected. A meeting ends when both conditions remain absent for at least two continuous minutes.</p></div></div>
    {confirmOpen&&<Modal title="Re-run meeting extraction?" onClose={()=>{setConfirmOpen(false);setStarted(false)}} footer={<><Button variant="secondary" onClick={()=>setConfirmOpen(false)}>Cancel</Button><Button variant="danger" disabled={impact.isPending||started||!impact.data} onClick={()=>impact.mutate(false)}>{impact.isPending?<Spinner/>:<RotateCcw size={16}/>}Confirm re-extraction</Button></>}>
      {impact.isPending&&!impact.data?<div className="impact-loading"><Spinner/>Calculating downstream impact…</div>:started?<SuccessNote>Extraction job started. Existing records remain available for audit.</SuccessNote>:impact.data&&<><div className="warning-callout"><AlertTriangle size={19}/><p>{impact.data.warning}</p></div><div className="impact-grid"><div><strong>{impact.data.affected_meetings}</strong><span>Meetings</span></div><div><strong>{impact.data.affected_analyses_published}</strong><span>Published analyses</span></div><div><strong>{impact.data.affected_analyses_draft}</strong><span>Draft analyses</span></div><div><strong>{impact.data.affected_overrides}</strong><span>Manual overrides</span></div></div></>}
      {impact.isError&&<div className="warning-callout" role="alert"><p>{impact.error.message}</p></div>}
    </Modal>}
  </div>
}

function Meta({icon:Icon,label,value}){return <div className="meta-item"><Icon size={16}/><div><span>{label}</span><strong>{value}</strong></div></div>}
