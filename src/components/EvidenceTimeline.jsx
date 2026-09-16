import { useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckSquare2, CircleHelp, Hand, Lightbulb, MessageCircleWarning, MousePointer2 } from 'lucide-react'
import { usePlayback } from '../stores/playback'
import { useSelection } from '../stores/selection'
import { formatSourceTime } from '../lib/format'

export const evidenceCategories=[
  ['engagement_attention','Engagement / Attention','#1baf7a',Hand],['intent_commitment','Intent / Commitment','#4a3aa7',Lightbulb],['objection_concern','Objection / Concern','#eda100',MessageCircleWarning],['value_proof','Value / Proof','#e87ba4',CircleHelp],['action_decision','Action / Decision','#008300',CheckSquare2],['other','Other','#898781',AlertCircle],
]

export function EvidenceTimeline({events,meeting,onSelected}){
  const svgRef=useRef();const [zoom,setZoom]=useState([meeting.start_offset_ms,meeting.end_offset_ms]);const [showData,setShowData]=useState(false);const currentMs=usePlayback(s=>s.currentMs);const seek=usePlayback(s=>s.seek);const selected=useSelection(s=>s.evidenceId);const selectEvidence=useSelection(s=>s.selectEvidence)
  const visible=useMemo(()=>events.filter(e=>e.start_ms>=zoom[0]&&e.start_ms<=zoom[1]),[events,zoom]);const width=1000,left=190,right=20,rowH=55,plot=width-left-right
  const x=ms=>left+((ms-zoom[0])/(zoom[1]-zoom[0]))*plot
  const pick=(event)=>{selectEvidence(event,seek);onSelected?.(event)}
  // Pins are 10 units wide in a 790-unit plot. With 86 events in one lane the
  // average gap is 9 units, so pins physically overlap and a click lands on
  // whichever happens to paint last -- you aim at one mark and select its
  // neighbour. Hit-test the lane instead and take the nearest event to the
  // pointer, which is exact at any density.
  const pickNearest=(clickEvent, laneEvents)=>{
    if(!laneEvents.length)return
    const box=svgRef.current?.getBoundingClientRect()
    if(!box)return
    const xSvg=((clickEvent.clientX-box.left)/box.width)*width
    const ms=zoom[0]+((xSvg-left)/plot)*(zoom[1]-zoom[0])
    let best=laneEvents[0], bestD=Math.abs(best.start_ms-ms)
    for(const e of laneEvents){const d=Math.abs(e.start_ms-ms);if(d<bestD){best=e;bestD=d}}
    pick(best)
  }
  const activate=(keyboardEvent,event)=>{if(keyboardEvent.key==='Enter'||keyboardEvent.key===' '){keyboardEvent.preventDefault();keyboardEvent.stopPropagation();pick(event)}}
  const ordered=visible.slice().sort((a,b)=>a.start_ms-b.start_ms)
  const keydown=e=>{const i=ordered.findIndex(v=>v.event_id===selected);if(e.key==='ArrowRight'&&i<ordered.length-1)pick(ordered[i+1]);if(e.key==='ArrowLeft'&&i>0)pick(ordered[i-1])}
  return <div className="evidence-timeline-shell" onKeyDown={keydown} tabIndex={0} aria-label="Recipe analysis timeline. Use arrow keys to move between items."><svg ref={svgRef} viewBox={`0 0 ${width} ${rowH*6+34}`} role="img" aria-label={`${events.length} timestamped evidence items`}>
    <rect x={left} y="0" width={plot} height={rowH*6} fill="var(--page)"/>
    {evidenceCategories.map(([key,label,color],lane)=><g key={key}><rect x="0" y={lane*rowH} width={width} height={rowH} fill={lane%2?'var(--card)':'var(--page)'}/>
        <rect className="lane-hit" x={left} y={lane*rowH} width={plot} height={rowH} fill="transparent"
              onClick={ev=>pickNearest(ev, visible.filter(e=>e.category===key))}/><line x1={left} x2={width-right} y1={(lane+1)*rowH} y2={(lane+1)*rowH} stroke="var(--border)"/>{/* Native <text>, not a foreignObject. The HTML version laid out with a real
          bounding box and a light computed colour and still painted nothing, which
          left the lanes unlabelled — six anonymous rows of dots. SVG text has no
          such ambiguity. */}
        <text className="lane-label-text" x="14" y={lane*rowH+rowH/2+4} fill="var(--ink-600)">{label}</text>
        <text className="lane-label-count" x={left-14} y={lane*rowH+rowH/2+4} textAnchor="end" fill="var(--ink-400)">{visible.filter(e=>e.category===key).length}</text>
        <rect x="4" y={lane*rowH+rowH/2-5} width="4" height="10" rx="2" fill={color}/>{visible.filter(e=>e.category===key).map(event=><g key={event.event_id} className="evidence-pin" onClick={()=>pick(event)} onKeyDown={keyboardEvent=>activate(keyboardEvent,event)} role="button" tabIndex="0" aria-label={`${formatSourceTime(event.start_ms)}. ${event.summary}. ${Math.round(event.confidence*100)}% confidence`}><rect x={x(event.start_ms)-5} y={lane*rowH+20} width="10" height="16" rx="4" fill={color} stroke={selected===event.event_id?'var(--blue-800)':'var(--card)'} strokeWidth={selected===event.event_id?3:2}/><title>{formatSourceTime(event.start_ms)} · {event.summary} · {Math.round(event.confidence*100)}%</title></g>)}</g>)}
    {currentMs>=zoom[0]&&currentMs<=zoom[1]&&<line x1={x(currentMs)} x2={x(currentMs)} y1="0" y2={rowH*6} stroke="var(--critical)" strokeWidth="2"/>}
    <text x={left} y={rowH*6+23} fontSize="10" fill="var(--ink-400)">{formatSourceTime(zoom[0])}</text><text x={width-right} textAnchor="end" y={rowH*6+23} fontSize="10" fill="var(--ink-400)">{formatSourceTime(zoom[1])}</text>
  </svg><div className="timeline-tools"><span><MousePointer2 size={13}/>Click a mark to synchronize video and transcript</span><div><button onClick={()=>setShowData(v=>!v)}>{showData?'Hide data':'View data'}</button><button onClick={()=>setZoom([meeting.start_offset_ms,meeting.end_offset_ms])}>Reset zoom</button></div></div>{showData&&<div className="timeline-data"><table><thead><tr><th>Time</th><th>Category</th><th>Summary</th><th>Confidence</th></tr></thead><tbody>{ordered.map(event=><tr key={event.event_id}><td>{formatSourceTime(event.start_ms)}</td><td>{evidenceCategories.find(c=>c[0]===event.category)?.[1]}</td><td><button onClick={()=>pick(event)}>{event.summary}</button></td><td>{Math.round(event.confidence*100)}%</td></tr>)}</tbody></table></div>}</div>
}
