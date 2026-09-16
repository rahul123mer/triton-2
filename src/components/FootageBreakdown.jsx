import { formatDuration, formatSourceTime } from '../lib/format'
import { Link } from 'react-router-dom'

export function BreakdownDonut({ breakdown }) {
  const meeting = breakdown.meeting_pct
  return <div className="donut-wrap">
    <div className="donut" style={{background:`conic-gradient(var(--meeting) 0 ${meeting}%, var(--dead) ${meeting}% 100%)`}}><div><strong>{meeting}%</strong><span>Meeting</span></div></div>
    <div className="legend vertical"><span><i className="swatch meeting"/>Meetings <strong>{formatDuration(breakdown.meeting_duration_ms, {short:true})}</strong></span><span><i className="swatch dead"/>Dead footage <strong>{formatDuration(breakdown.dead_duration_ms, {short:true})}</strong></span></div>
  </div>
}

export function SourceTimeline({ breakdown, getHref }) {
  return <div className="source-timeline-wrap"><div className="source-timeline" aria-label="Source footage timeline">{breakdown.segments.map((segment, i) => {const content=segment.kind==='meeting'&&<span>{segment.label?.replace('Meeting ','M')}</span>;const props={className:segment.kind,style:{width:`${((segment.end_ms-segment.start_ms)/breakdown.total_duration_ms)*100}%`},title:`${segment.label||'Dead footage'} · ${formatSourceTime(segment.start_ms)}–${formatSourceTime(segment.end_ms)}`};const href=getHref?.(segment);return href?<Link {...props} to={href} key={`${segment.kind}-${i}`} aria-label={`Open ${props.title}`}>{content}</Link>:<div {...props} key={`${segment.kind}-${i}`}>{content}</div>})}</div><div className="timeline-axis"><span>00:00:00</span><span>{formatSourceTime(breakdown.total_duration_ms)}</span></div></div>
}
