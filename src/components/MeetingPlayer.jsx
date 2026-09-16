import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Maximize, Pause, Play, Volume2 } from 'lucide-react'
import { usePlayback } from '../stores/playback'
import { formatSourceTime } from '../lib/format'
import { meetingApi } from '../lib/api'

export function MeetingPlayer({ media, meeting }) {
  const videoRef = useRef(null); const rafRef = useRef(); const lastPushRef = useRef(0); const [failed,setFailed]=useState(false)
  // Only person boxes are drawn. The pipeline emits no per-frame face geometry
  // (migration 009 added person_box; /tracks returns faces: [] on every frame),
  // so a Faces toggle offered an overlay that could never appear.
  const [showPersons,setShowPersons]=useState(true)
  const { currentMs, durationMs, clipOffsetMs, playing, registerVideo, unregisterVideo, seek, togglePlayback, setCurrentMs, setPlaying, setMediaAvailable } = usePlayback()
  const sourceMs=currentMs||media.clip_offset_ms;const bucket=Math.floor(sourceMs/15000);const fromMs=Math.max(media.clip_offset_ms,bucket*15000-1000);const toMs=Math.min(media.clip_offset_ms+media.duration_ms,fromMs+17000)
  const tracks=useQuery({queryKey:['meeting-tracks',meeting.meeting_id,fromMs,toMs],queryFn:()=>meetingApi.tracks(meeting.meeting_id,fromMs,toMs),placeholderData:previous=>previous})
  useEffect(() => {
    const video=videoRef.current; if(!video||!media)return
    registerVideo(video,{clipOffsetMs:media.clip_offset_ms,durationMs:media.duration_ms})
    let hls; let disposed=false
    const fail=()=>{setFailed(true);setMediaAvailable(false)}
    if(video.canPlayType('application/vnd.apple.mpegurl')) video.src=media.hls_url
    else import('hls.js').then(({default:Hls})=>{if(disposed)return;if(Hls.isSupported()){hls=new Hls();hls.loadSource(media.hls_url);hls.attachMedia(video);hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)fail()})}else fail()}).catch(fail)
    video.addEventListener('error',fail)
    return()=>{disposed=true;cancelAnimationFrame(rafRef.current);video.removeEventListener('error',fail);hls?.destroy();unregisterVideo(video)}
  },[media,registerVideo,setMediaAvailable,unregisterVideo])
  useEffect(()=>{
    const tick=(now)=>{const video=videoRef.current;if(video&&!video.paused&&now-lastPushRef.current>=100){setCurrentMs(media.clip_offset_ms+video.currentTime*1000);lastPushRef.current=now}rafRef.current=requestAnimationFrame(tick)}
    rafRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(rafRef.current)
  },[media,setCurrentMs])
  const relative=Math.max(0,currentMs-clipOffsetMs)
  const frames=tracks.data?.frames||[];const frame=[...frames].reverse().find(item=>item.t<=sourceMs)||frames[0];const visibleFrame=frame&&Math.abs(sourceMs-frame.t)<=1500?frame:null
  return <div className="meeting-player">
    <div className="video-stage">
      <video ref={videoRef} poster={media.poster_url || undefined} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} aria-label={`${meeting.label} recording`}/>
      {visibleFrame&&tracks.data.frame_width&&tracks.data.frame_height&&<svg className="track-overlay" viewBox={`0 0 ${tracks.data.frame_width} ${tracks.data.frame_height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {showPersons&&visibleFrame.persons.map((item,index)=><rect className="person-track-box" key={`person-${index}`} x={item.box[0]} y={item.box[1]} width={Math.max(0,item.box[2]-item.box[0])} height={Math.max(0,item.box[3]-item.box[1])}/>) }
      </svg>}
      {failed&&<div className="media-unavailable"><AlertTriangle size={25}/><strong>Sample media unavailable</strong><span>The synchronized transcript and source-time controls remain available.</span></div>}
      <div className="source-badge">SOURCE {formatSourceTime(currentMs || meeting.start_offset_ms)}</div>
      <div className="track-toggles"><label><input type="checkbox" checked={showPersons} onChange={event=>setShowPersons(event.target.checked)}/>People</label></div>
      {tracks.isError&&<div className="track-error" role="status">Tracking overlay unavailable</div>}
    </div>
    <div className="player-controls"><button className="player-button" onClick={togglePlayback} disabled={failed} aria-label={playing?'Pause':'Play'}>{playing?<Pause size={17}/>:<Play size={17}/>}</button><span className="player-time">{formatSourceTime(relative)} / {formatSourceTime(durationMs)}</span><input className="scrubber" type="range" min={0} max={durationMs||1} value={relative} onChange={e=>seek(clipOffsetMs+Number(e.target.value))} aria-label="Playback position"/><Volume2 size={16}/><button className="player-button" onClick={()=>videoRef.current?.requestFullscreen?.()} disabled={failed} aria-label="Fullscreen"><Maximize size={16}/></button></div>
  </div>
}
