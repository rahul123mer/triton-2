import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Headphones, Search, SignalLow } from 'lucide-react'
import { usePlayback } from '../stores/playback'
import { formatSourceTime } from '../lib/format'
import { SectionLabel } from './ui'

export function TranscriptPanel({ segments, query, onQueryChange, searching }) {
  const parentRef=useRef(null); const [follow,setFollow]=useState(true); const currentMs=usePlayback(s=>s.currentMs); const seek=usePlayback(s=>s.seek)
  const activeIndex=useMemo(()=>segments.findIndex(s=>currentMs>=s.start_ms&&currentMs<=s.end_ms),[segments,currentMs])
  const virtualizer=useVirtualizer({count:segments.length,getScrollElement:()=>parentRef.current,estimateSize:()=>88,overscan:7})
  // scrollToIndex flushes synchronously, and calling it straight from an effect
  // makes React warn: "flushSync was called from inside a lifecycle method". It
  // fired on every transcript click and every evidence pin -- ten times in one
  // pass of the workspace -- because both move the playhead, which moves the
  // active segment. A synchronous flush mid-lifecycle re-enters rendering, which
  // is the same family as the render loop the evidence selection had.
  //
  // Defer it by a frame: the scroll is a visual follow-up to the render, not part
  // of it, so it belongs after the commit.
  useEffect(()=>{
    if(!(follow&&activeIndex>=0))return
    const frame=requestAnimationFrame(()=>{
      // Ask the virtualizer WHERE the row is and scroll there ourselves.
      // scrollToIndex flushes synchronously, and React warns whenever that lands
      // while it is rendering -- deferring by a frame narrowed the window but did
      // not close it, because React 18 can still be working when the frame fires.
      // Setting scrollTop never calls flushSync, so the race disappears rather
      // than getting smaller.
      const el=parentRef.current
      const offset=virtualizer.getOffsetForIndex?.(activeIndex,'center')
      const top=Array.isArray(offset)?offset[0]:offset
      if(el&&typeof top==='number')el.scrollTop=top
      else virtualizer.scrollToIndex(activeIndex,{align:'center'})
    })
    return ()=>cancelAnimationFrame(frame)
  },[activeIndex,follow,virtualizer])
  return <div className="transcript-panel">
    <div className="transcript-head"><div><SectionLabel>TRANSCRIPT / CAPTIONS</SectionLabel><strong>{segments.length} segments</strong></div><button className={follow?'follow active':'follow'} onClick={()=>setFollow(v=>!v)} aria-pressed={follow}>{follow?'Following':'Follow'}</button></div>
    <div className="transcript-search"><Search size={15}/><input value={query} onChange={e=>onQueryChange(e.target.value)} placeholder="Search transcript…" aria-label="Search transcript"/>{searching&&<span>Searching…</span>}</div>
    <div className="transcript-scroll" ref={parentRef} onWheel={()=>setFollow(false)}><div style={{height:`${virtualizer.getTotalSize()}px`,position:'relative'}}>{virtualizer.getVirtualItems().map(row=>{const segment=segments[row.index];const active=row.index===activeIndex;const diarization=segment.diarization_confidence;return <button key={segment.segment_id} data-index={row.index} ref={virtualizer.measureElement} className={active?'transcript-segment active':'transcript-segment'} style={{position:'absolute',top:0,left:0,width:'100%',transform:`translateY(${row.start}px)`}} onClick={()=>{seek(segment.start_ms);setFollow(true)}}><span className="transcript-time">{formatSourceTime(segment.start_ms)}</span><span className="transcript-copy"><strong>{segment.display_name||segment.speaker_id||'Unresolved speaker'}</strong><span>{renderHighlight(segment)}</span><small><Headphones size={11}/>{Math.round(segment.confidence*100)}% ASR{diarization!=null&&<span className={diarization<.7?'speaker-confidence low':'speaker-confidence'}>· {Math.round(diarization*100)}% speaker attribution</span>}{diarization!=null&&diarization<.7&&<em><SignalLow size={11}/> review speaker</em>}</small></span></button>})}</div>{segments.length===0&&<div className="transcript-empty">No transcript segments match “{query}”.</div>}</div>
  </div>
}

function renderHighlight(segment){if(!segment.highlights?.length)return segment.text;const {start,end}=segment.highlights[0];return <>{segment.text.slice(0,start)}<mark>{segment.text.slice(start,end)}</mark>{segment.text.slice(end)}</>}
