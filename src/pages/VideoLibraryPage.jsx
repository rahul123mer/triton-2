import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, BadgeCheck, CalendarDays, ChevronDown, ChevronUp, ClipboardList, Clock3, Film, ListFilter, Search, Upload, Video } from 'lucide-react'
import { jobApi, meetingApi, videoApi } from '../lib/api'
import { formatDate, formatDuration, formatSourceTime } from '../lib/format'
import { DeleteButton } from '../components/DeleteButton'
import { usePrincipal } from '../hooks/usePrincipal'
import { Button, Card, ErrorCard, LoadingCards, Modal, Progress, SectionLabel, StatusPill, SuccessNote } from '../components/ui'

/* A recording is still to review until one of its meetings carries an analysis.
   Keyed on the VideoSummary field the Overview counter is computed from, so the
   "Still to review" tile and this list cannot disagree. */
const isPending = (video) => !video.analyzed_meeting_count

export function VideoLibraryPage() {
  const access = usePrincipal(); const [search,setSearch]=useState(''); const [room,setRoom]=useState('all'); const [uploadOpen,setUploadOpen]=useState(false); const [expandedJob,setExpandedJob]=useState(null); const qc=useQueryClient()
  // Review state is in the URL, unlike search and room: Home's "Still to review"
  // tile has to be able to point AT the four it counted. It linked here unfiltered,
  // so the page showed all five recordings looking identical -- the count was
  // correct and the answer to "which four?" was nowhere on the screen.
  const [params,setParams]=useSearchParams()
  const review=['pending','reviewed'].includes(params.get('review'))?params.get('review'):'all'
  const setReview=(next)=>setParams(previous=>{const merged=new URLSearchParams(previous)
    if(next==='all')merged.delete('review'); else merged.set('review',next)
    return merged},{replace:true})
  const retry=useMutation({mutationFn:jobApi.retry,onSuccess:()=>qc.invalidateQueries({queryKey:['jobs']})}); const cancel=useMutation({mutationFn:jobApi.cancel,onSuccess:()=>qc.invalidateQueries({queryKey:['jobs']})})
  const query=useQuery({queryKey:['videos'],queryFn:()=>videoApi.list()}); const jobs=useQuery({queryKey:['jobs'],queryFn:jobApi.list,refetchInterval:5000,enabled:access.can('job.read')})
  const filtered=useMemo(()=>(query.data||[]).filter(video=>(room==='all'||video.room_id===room)&&(review==='all'||(review==='pending')===isPending(video))&&`${video.filename} ${video.room_name}`.toLowerCase().includes(search.toLowerCase())),[query.data,room,review,search]); const rooms=[...new Map((query.data||[]).map(video=>[video.room_id,video.room_name])).entries()]
  const pendingCount=(query.data||[]).filter(isPending).length
  return <div className="page">
    <div className="page-heading"><div><SectionLabel blue>01 · SOURCE INGEST</SectionLabel><h2>Video Library</h2><p>Upload day-long recordings and review automatically extracted meetings.</p></div>{access.can('video.upload')&&<Button onClick={()=>setUploadOpen(true)}><Upload size={16}/>Upload video</Button>}</div>
    <Card className="library-card"><div className="toolbar"><div className="search-control"><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search videos or rooms…" aria-label="Search videos"/></div><div className="select-control"><ListFilter size={15}/><select value={room} onChange={event=>setRoom(event.target.value)} aria-label="Filter by room"><option value="all">All rooms</option>{rooms.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></div><div className="note-tabs review-filter" role="group" aria-label="Filter by review state">{[['all','All',(query.data||[]).length],['pending','Still to review',pendingCount],['reviewed','Reviewed',(query.data||[]).length-pendingCount]].map(([key,label,count])=><button key={key} className={review===key?'active':''} onClick={()=>setReview(key)}>{label}<span className="count-badge">{count}</span></button>)}</div></div>{query.isLoading?<LoadingCards/>:query.isError?<ErrorCard error={query.error}/>:<div className="video-library-grid">{filtered.map(video=><SourceVideoCard video={video} key={video.video_id}/>) }{filtered.length===0&&<div className="no-results">{review==='pending'?'Every recording has been analysed.':review==='reviewed'?'No recording has been analysed yet.':'No videos match these filters.'}</div>}</div>}</Card>
    {access.can('job.read')&&<Card className="jobs-card"><div className="card-heading"><div><SectionLabel>UPLOAD & PROCESSING STATUS</SectionLabel><h3>Durable Remote Compute jobs</h3></div><span className="job-persistence">Safe to leave this page</span></div>{(retry.isError||cancel.isError)&&<div className="warning-callout" role="alert"><p>{(retry.error||cancel.error).message}</p></div>}{jobs.isLoading?<LoadingCards/>:jobs.isError?<ErrorCard error={jobs.error}/>:<div className="job-list">{jobs.data.map(job=><div className="job-record" key={job.job_id}><div className="job-row"><button className="job-kind job-expand" onClick={()=>setExpandedJob(expandedJob===job.job_id?null:job.job_id)}><Film size={15}/><div><strong>{job.job_id}</strong><span>{job.kind} · {job.stage}</span></div>{expandedJob===job.job_id?<ChevronUp size={13}/>:<ChevronDown size={13}/>}</button><StatusPill status={job.status}/><div className="job-progress"><div><span style={{width:`${job.pct}%`}}/></div><strong>{job.pct}%</strong></div><div className="job-message">{job.message}</div><div className="job-actions">{access.can('job.control')&&['failed','cancelled'].includes(job.status)&&<Button variant="secondary" disabled={retry.isPending} onClick={()=>retry.mutate(job.job_id)}>Retry</Button>}{access.can('job.control')&&['queued','running'].includes(job.status)&&<Button variant="secondary" disabled={cancel.isPending} onClick={()=>cancel.mutate(job.job_id)}>Cancel</Button>}{job.status==='succeeded'&&<Link className="button secondary" to={job.target_type==='video'?`/videos/${job.target_id}`:'/analyses'}>Open results</Link>}</div></div>{expandedJob===job.job_id&&<div className="job-detail"><span><CalendarDays size={13}/>Submitted {new Date(job.created_at).toLocaleString()}</span><span>Stage {job.stage_index} of {job.stage_count}</span><span>Target {job.target_type}: {job.target_id}</span>{job.finished_at&&<span>Finished {new Date(job.finished_at).toLocaleString()}</span>}{job.error&&<strong>{job.error.message||String(job.error)}</strong>}</div>}</div>)}</div>}</Card>}
    {uploadOpen&&<UploadModal onClose={()=>setUploadOpen(false)} onComplete={()=>{qc.invalidateQueries({queryKey:['jobs']});qc.invalidateQueries({queryKey:['videos']})}}/>}
  </div>
}

/* Which recordings are still to review.
 *
 * The card used to show `video.status`, which is the INGEST state and reads
 * "Processed" on every recording that finished uploading. Five identical pills,
 * and no way to tell the four with no analysis from the one that has one -- so
 * Home could count them and the library could not point at them.
 *
 * Ingest state has not been dropped: it still shows while a recording is
 * anything other than processed, because a video that is still uploading or has
 * failed is not meaningfully "to review" yet.
 */
function ReviewBadge({video}) {
  if (video.status !== 'processed') return <StatusPill status={video.status}/>
  const n = video.analyzed_meeting_count
  return n
    ? <span className="review-badge reviewed"><BadgeCheck size={12}/>{n} analysed</span>
    : <span className="review-badge pending"><ClipboardList size={12}/>Still to review</span>
}

function SourceVideoCard({video}) {
  const meetings=useQuery({queryKey:['video-meetings',video.video_id],queryFn:()=>videoApi.meetings(video.video_id)})
  return <article className="source-video-card"><div className="source-video-head"><div className="source-video-title"><Video size={18}/><div><strong>{video.filename}</strong><span>{video.room_name||'Room not assigned'} · {formatDate(video.recorded_on)}</span></div></div><ReviewBadge video={video}/></div><div className="source-video-facts"><span><Clock3 size={12}/>{formatDuration(video.duration_ms)}</span><span>{video.meeting_count} meeting{video.meeting_count===1?'':'s'}</span><span>{video.dead_footage_pct}% dead footage</span></div>{meetings.isLoading?<div className="inline-skeleton"/>:meetings.isError?<div className="clip-error">{meetings.error.message}</div>:<div className="source-clips">{meetings.data.map(meeting=><PlayableMeetingClip meeting={meeting} key={meeting.meeting_id}/>)}{meetings.data.length===0&&<div className="no-results">No meeting clips extracted yet.</div>}</div>}<div className="source-video-actions">{/* Deleting a MEETING never deletes its recording: a source video is a
        first-class object you can re-extract from, and throwing away the original because
        its last clip was removed is not recoverable. But the delete lived only on the
        detail page, so a video you wanted gone from the library could not be removed from
        the library. */}
      <DeleteButton permission="video.delete" label="Delete video" name={video.filename} subtle
        note="The recording, its extracted meetings, their evidence and analyses are all removed. This cannot be undone."
        onDelete={()=>videoApi.remove(video.video_id)}/>
      <Link className="button secondary" to={`/videos/${video.video_id}/extraction-review`}>Review extraction</Link><Link className="button primary" to={`/videos/${video.video_id}`}>Video details <ArrowUpRight size={14}/></Link></div></article>
}

function PlayableMeetingClip({meeting}) {
  const videoRef=useRef(null);const [failed,setFailed]=useState(false);const media=useQuery({queryKey:['meeting-media',meeting.meeting_id],queryFn:()=>meetingApi.media(meeting.meeting_id)})
  useEffect(()=>{const video=videoRef.current;if(!video||!media.data)return;let hls;let disposed=false;const fail=()=>setFailed(true);setFailed(false);if(video.canPlayType('application/vnd.apple.mpegurl'))video.src=media.data.hls_url;else import('hls.js').then(({default:Hls})=>{if(disposed)return;if(Hls.isSupported()){hls=new Hls();hls.loadSource(media.data.hls_url);hls.attachMedia(video);hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)fail()})}else fail()}).catch(fail);video.addEventListener('error',fail);return()=>{disposed=true;video.removeEventListener('error',fail);hls?.destroy();video.removeAttribute('src');video.load()}},[media.data])
  return <div className="meeting-clip">{media.isLoading?<div className="clip-poster-skeleton"/>:media.isError?<div className="clip-error">Clip unavailable</div>:<div className="clip-player"><video ref={videoRef} controls preload="metadata" poster={media.data.poster_url||undefined} aria-label={`${meeting.label} clip`}/>{failed&&<div className="clip-error overlay">Playback unavailable</div>}</div>}<div className="clip-copy"><div><strong>{meeting.label}</strong><span>{formatSourceTime(meeting.start_offset_ms)}–{formatSourceTime(meeting.end_offset_ms)} · {formatDuration(meeting.duration_ms)} · {meeting.participant_count} participant{meeting.participant_count===1?'':'s'}</span></div><Link className="icon-button" to={`/meetings/${meeting.meeting_id}`} aria-label={`Open ${meeting.label}`}><ArrowUpRight size={15}/></Link></div></div>
}

function UploadModal({onClose,onComplete}) {
  const inputRef=useRef(); const [file,setFile]=useState(null); const [metadata,setMetadata]=useState({room_id:'',room_name:'',camera_id:'',recorded_on:'',notes:'',tags:''}); const [progress,setProgress]=useState(0); const [ticket,setTicket]=useState(null); const [result,setResult]=useState(null); const [error,setError]=useState(null); const [uploading,setUploading]=useState(false)
  const setField=(key,value)=>setMetadata(current=>({...current,[key]:value}))
  const begin=async()=>{if(!file)return;setUploading(true);setError(null);try{const body={filename:file.name,size_bytes:file.size,content_type:file.type||'video/mp4',...Object.fromEntries(Object.entries(metadata).filter(([key,value])=>key!=='tags'&&value)),tags:metadata.tags.split(',').map(tag=>tag.trim()).filter(Boolean)};const created=await videoApi.createUpload(body);setTicket(created);const parts=created.parts.filter((_,index)=>index*created.part_size_bytes<file.size);for(let index=0;index<parts.length;index++){const part=parts[index];const start=(part.part_number-1)*created.part_size_bytes;const end=Math.min(start+created.part_size_bytes,file.size);await videoApi.uploadPart(part.url,file.slice(start,end));setProgress(Math.round(((index+1)/(parts.length+1))*100))}const completed=await videoApi.completeUpload(created.complete_url);setProgress(100);setResult({...completed,accepted_metadata:created.accepted_metadata});onComplete()}catch(uploadError){setError(uploadError)}finally{setUploading(false)}}
  const close=async()=>{if(ticket&&!result){try{await videoApi.abortUpload(ticket.abort_url)}catch{/* ticket may already be terminal */}}onClose()}
  return <Modal title="Upload source video" onClose={close} footer={<><Button variant="secondary" disabled={uploading} onClick={close}>{result?'Close':'Cancel'}</Button>{!result&&<Button disabled={!file||uploading} onClick={begin}><Upload size={16}/>{uploading?'Uploading…':'Start upload'}</Button>}</>}>
    {result?<><SuccessNote>Upload completed and processing job {result.job_id} was submitted. You may safely leave this page.</SuccessNote>{result.accepted_metadata&&<dl className="accepted-metadata">{Object.entries(result.accepted_metadata).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{Array.isArray(value)?value.join(', '):value||'—'}</dd></div>)}</dl>}</>:<><button className="dropzone" disabled={uploading} onClick={()=>inputRef.current.click()}><Upload size={25}/><strong>{file?file.name:'Choose a day-long recording'}</strong><span>{file?`${(file.size/1024/1024).toFixed(1)} MB`:'MP4, MOV, or MKV · multipart upload'}</span></button><input ref={inputRef} hidden type="file" accept="video/*" onChange={event=>{setFile(event.target.files[0]);setProgress(0);setError(null)}}/><div className="upload-metadata-grid"><label className="field-label">Room name<input value={metadata.room_name} onChange={event=>setField('room_name',event.target.value)}/></label><label className="field-label">Room ID<input value={metadata.room_id} onChange={event=>setField('room_id',event.target.value)}/></label><label className="field-label">Camera ID<input value={metadata.camera_id} onChange={event=>setField('camera_id',event.target.value)}/></label><label className="field-label">Recorded date<input type="date" value={metadata.recorded_on} onChange={event=>setField('recorded_on',event.target.value)}/></label></div><label className="field-label">Tags, comma-separated<input value={metadata.tags} onChange={event=>setField('tags',event.target.value)}/></label><label className="field-label">Source notes<textarea value={metadata.notes} onChange={event=>setField('notes',event.target.value)}/></label>{progress>0&&<Progress value={progress} label={progress===100?'Processing submitted':'Uploading parts'}/>}<div className="upload-callout"><Film size={17}/><span>Meeting extraction starts only after every part is stored and the upload is completed.</span></div>{error&&<div className="warning-callout"><p>{error.message}</p></div>}</>}
  </Modal>
}
