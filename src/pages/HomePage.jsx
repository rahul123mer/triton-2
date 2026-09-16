import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BadgeCheck, ChevronRight, ClipboardList, Clock3, Film, Gauge, Search, Users } from 'lucide-react'
import { cookbookApi, meetingApi, overviewApi, videoApi } from '../lib/api'
import { formatBytes, formatDuration, sourceLabel } from '../lib/format'
import { usePrincipal } from '../hooks/usePrincipal'
import { Card, ErrorCard, LoadingCards, SectionLabel, StatusPill } from '../components/ui'
import { bandSlug } from '../components/dashboard'

/* Home — the landing route.
 *
 * It used to be the Master Analysis Dashboard: it picked one meeting and drew
 * that meeting's player, participants, gallery, evidence feed and score on the
 * start page. Reviewed after the demo, and cut: a landing page that commits to
 * ONE recording answers a question nobody asked on arrival, and every panel it
 * showed already has a home of its own — the player and the extraction report in
 * Meeting Workspace, faces and voices in Gallery.
 *
 * What is left is what belongs on a start page: where the deployment stands, what
 * is waiting to be worked on, and the lenses available to work with it. Nothing
 * here is scoped to a selected meeting, so there is no ?meeting= state to keep.
 */
export function HomePage(){
  const access=usePrincipal()

  const overview=useQuery({queryKey:['overview'],queryFn:overviewApi.get,enabled:access.can('meeting.read')})
  const videos=useQuery({queryKey:['videos'],queryFn:()=>videoApi.list(),enabled:access.can('video.read')})
  // Every meeting, not overview.recent_meetings — that is capped at five by the
  // Overview contract, which is fine for a counter strip and useless as the
  // library once a deployment has thirty recordings.
  const allMeetings=useQuery({queryKey:['meetings','library'],queryFn:()=>meetingApi.list(),enabled:access.can('meeting.read')})
  const cookbooks=useQuery({queryKey:['cookbooks'],queryFn:cookbookApi.list,enabled:access.can('cookbook.read')})
  const [libQuery,setLibQuery]=useState('')
  const [libStatus,setLibStatus]=useState('all')

  // Memoised so the || fallback does not hand useMemo a fresh [] every render.
  const rows=useMemo(()=>allMeetings.data||overview.data?.recent_meetings||[],
                     [allMeetings.data,overview.data])
  const needle=libQuery.trim().toLowerCase()
  const library=useMemo(()=>rows.filter(m=>
    (libStatus==='all'||m.status===libStatus)&&
    (!needle||`${m.label} ${m.room_name||''} ${m.cookbook_name||''} ${m.recorded_on}`.toLowerCase().includes(needle))
  ),[rows,libStatus,needle])
  // Meetings belong to a source video; at density a flat list of "1 Meeting,
  // 2 Meeting, 1 Meeting…" is unreadable, so group under the recording they
  // came from — the hierarchy NAVIGATION.md §1 asks the UI to keep visible.
  // Meetings are numbered WITHIN their source video (compute: "{n} Meeting"), so
  // three recordings that each yielded one meeting are all legitimately called
  // "1 Meeting". The recording is therefore what identifies a row, and the group
  // header carries it -- which is why the header, not the meeting label, is the
  // prominent text. The header holds no meeting COUNT: every meeting in a group is
  // listed under it, so the count was always derivable by looking, and once labels
  // became "{n} Meeting" a one-meeting recording read "1 MEETING" above a row
  // reading "1 Meeting". That only works when the header can tell them apart, so when
  // no room was set at upload fall back to the recording's own filename rather
  // than repeating "Room not set".
  const videoById=useMemo(()=>Object.fromEntries((videos.data||[]).map(v=>[v.video_id,v])),[videos.data])
  const grouped=useMemo(()=>{
    const by=new Map()
    for(const m of library){
      const key=m.video_id
      if(!by.has(key)){
        const source=videoById[key]
        by.set(key,{video_id:key,room:m.room_name||source?.room_name||null,
                    source:source?.filename||null,date:m.recorded_on,items:[]})
      }
      by.get(key).items.push(m)
    }
    return Array.from(by.values()).sort((a,b)=>String(b.date).localeCompare(String(a.date)))
  },[library,videoById])

  if(overview.isError)return <div className="page"><ErrorCard error={overview.error}/></div>
  // Guard on the DATA, not on isLoading. A query that is disabled or merely idle
  // reports isLoading===false with data still undefined, so gating on the flag
  // let a render through with no payload and threw on data.video_count.
  if(access.isLoading||!overview.data)return <div className="page"><LoadingCards/></div>
  const data=overview.data

  return <div className="page home-page">
    {/* Just "Home". The eyebrow said HOME, the title said "Meeting intelligence
        workspace" and the paragraph explained the page to somebody already looking
        at it -- three lines of chrome above the numbers people came for. */}
    <div className="page-heading">
      <div><h2>Home</h2></div>
    </div>

    <div className="dash-metrics">
      <MiniMetric icon={Film} label="Source videos" value={data.video_count} to="/videos"/>
      <MiniMetric icon={Gauge} label="Meetings extracted" value={data.meeting_count} to="/meetings"/>
      <MiniMetric icon={BadgeCheck} label="Analyzed" value={data.analyzed_count} to="/analyses"/>
      {/* Outstanding work, so it is drawn as outstanding: zero is the good state
          and gets no warning colour. */}
      <MiniMetric icon={ClipboardList} label="Still to review" value={data.unreviewed_video_count} to="/videos?review=pending"
                  tone={data.unreviewed_video_count>0?'attention':null}
                  hint={data.unreviewed_video_count===1?'recording has no analysis yet':'recordings have no analysis yet'}/>
      <ParticipantMetric data={data} canReadGallery={access.can('gallery.read')}/>
      <ThroughputMetric data={data}/>
    </div>

    <div className="home-grid">
      <Card className="home-library">
        <div className="card-heading">
          <div><SectionLabel>MEETING LIBRARY</SectionLabel><h3>{rows.length} extracted meeting{rows.length===1?'':'s'}</h3></div>
          <Link className="link-button" to="/videos">Video library <ChevronRight size={13}/></Link>
        </div>
        <div className="lib-filters">
          <div className="lib-search"><Search size={14}/><input value={libQuery} onChange={e=>setLibQuery(e.target.value)} placeholder="Search meetings or rooms…" aria-label="Search the meeting library"/></div>
          <select value={libStatus} onChange={e=>setLibStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option><option value="analyzed">Analyzed</option>
            <option value="extracted">Extracted</option><option value="processing">Processing</option>
          </select>
        </div>
        <div className="lib-count">{library.length} of {rows.length} meetings{libStatus!=='all'||needle?' · filtered':''}</div>
        {/* A row opens the meeting rather than selecting it in place: there is no
            in-page detail left for a selection to fill. */}
        <div className="home-library-list">{grouped.map(group=><div className="lib-group" key={group.video_id}>
          <div className="lib-group-head" title={group.source||group.video_id}><strong className={group.room?'':'is-source'}>{group.room||sourceLabel(group.source)||group.video_id}</strong><span>{group.date}</span></div>
          {group.items.map(item=><Link key={item.meeting_id} className="dash-meeting-card" to={`/meetings/${item.meeting_id}`}>
            <span className="dash-card-top"><strong>{item.label}</strong>{item.overall_score!=null
              ? <span className={`dash-card-score band-${bandSlug(item.overall_score)}`}>{item.overall_score}</span>
              : <StatusPill status={item.status}/>}</span>
            <span className="dash-card-meta">{formatDuration(item.duration_ms,{short:true})} · {item.participant_count} people{item.cookbook_name?` · ${item.cookbook_name}`:''}</span>
          </Link>)}
        </div>)}
        {library.length===0&&<div className="no-results">{rows.length?'No meetings match these filters.':'No meetings extracted yet. Upload a source video to begin.'}</div>}</div>
      </Card>

      <div className="home-cookbooks">
        <div className="card-heading">
          <div><SectionLabel>COOKBOOKS</SectionLabel><h3>{(cookbooks.data||[]).length} scoring lens{(cookbooks.data||[]).length===1?'':'es'}</h3></div>
          <Link className="link-button" to="/cookbooks">Manage <ChevronRight size={13}/></Link>
        </div>
        {!access.can('cookbook.read')?<Card className="rail-card"><div className="no-results">Cookbooks are outside your access scope.</div></Card>
         :cookbooks.isLoading?<LoadingCards/>
         :cookbooks.isError?<ErrorCard error={cookbooks.error}/>
         :<div className="cookbook-card-list">{(cookbooks.data||[]).map(cookbook=><CookbookCard key={cookbook.cookbook_id} cookbook={cookbook}/>)}
           {(cookbooks.data||[]).length===0&&<Card className="rail-card"><div className="no-results">No Cookbooks are defined yet.</div></Card>}</div>}
      </div>
    </div>
  </div>
}

/* The strip is navigation as much as it is a counter: every tile that has a
   destination is a link, and the ones that do not stay inert rather than
   pretending. */
function MiniMetric({icon:Icon,label,value,to,tone,hint}){
  const className=tone?`mini-metric tone-${tone}`:'mini-metric'
  const body=<><span className="mini-metric-icon"><Icon size={16}/></span>
    <div><strong>{value}</strong><span>{label}</span>{hint&&<em className="mini-metric-hint">{hint}</em>}</div></>
  return to?<Link className={className} to={to}>{body}</Link>:<div className={className}>{body}</div>
}

/* Meeting time, and what it was distilled OUT of.
 *
 * The only tile in the strip with nowhere to go: every other one is a link, and
 * this one was drawn identically while being inert, so it read as a link that did
 * not work. It is now explicitly a summary -- a different shape, no hover, no
 * pointer -- and it earns the space by answering the question the bare figure
 * provoked: 44 minutes out of WHAT?
 *
 * Meeting time is the YIELD. The videos and the bytes are the input it was found
 * in, which is the number that says how much work the deployment has done -- 2.6 GB
 * of footage watched to produce 44 minutes worth keeping.
 */
function ThroughputMetric({data}){
  return <div className="mini-metric metric-summary">
    <span className="mini-metric-icon"><Clock3 size={16}/></span>
    <div><strong>{formatDuration(data.total_meeting_ms,{short:true})}</strong><span>Meeting time</span></div>
    <div className="metric-from">
      <span><strong>{data.video_count}</strong> video{data.video_count===1?'':'s'}</span>
      {/* Only when the number is actually there. `formatBytes(undefined)` returns
          "0 B", which would state that nothing was processed -- a wrong figure reads
          worse than an absent one, and an API older than this field is exactly when
          it would appear. */}
      {typeof data.total_source_bytes==='number'&&
        <span><strong>{formatBytes(data.total_source_bytes)}</strong> processed</span>}
    </div>
  </div>
}

/* Participants, split by whether we know who they are.
 *
 * Home shows TWO states, not the contract's three. `unknown` (no candidate identity
 * found) and `unresolved` (a candidate was deduced, awaiting confirmation) are
 * different rows in the database and the Gallery still separates them -- but on a
 * landing page the distinction is machinery, and both answer the same question the
 * reader is asking: how many people don't we have a name for.
 *
 * They are SUMMED rather than the unresolved row being dropped. The breakdown sits
 * under a headline count and a reader adds it up by eye, so showing 12 and 25 under
 * a headline of 45 would just look wrong. Folded, it still reconciles.
 *
 * Known people are enrolled identities, so that count opens the Faces gallery;
 * unknown opens the review queue, which is where either state is resolved.
 */
function ParticipantMetric({data,canReadGallery}){
  const parts=[['known',data.known_participant_count,'/gallery?tab=faces'],
               ['unknown',data.unknown_participant_count+data.unresolved_participant_count,
                '/gallery?tab=unresolved']]
  return <div className="mini-metric metric-wide">
    <span className="mini-metric-icon"><Users size={16}/></span>
    <div><strong>{data.participant_count}</strong><span>Participants</span></div>
    <div className="metric-breakdown">{parts.map(([label,value,to])=>canReadGallery
      ? <Link key={label} className={`metric-part part-${label}`} to={to}><strong>{value}</strong><span>{label}</span></Link>
      : <span key={label} className={`metric-part part-${label}`}><strong>{value}</strong><span>{label}</span></span>)}</div>
  </div>
}

/* A Cookbook is a question set with weights, and the weights are the part worth
   seeing before you pick one. Prebuilt Cookbooks are immutable by design — a
   score is only comparable between meetings if the question was the same — so the
   card states which kind it is rather than offering an edit it cannot honour.
   The full list, and the clone editor, are on /cookbooks. */
function CookbookCard({cookbook}){
  const recipes=useMemo(()=>cookbook.recipes||[],[cookbook.recipes])
  const risk=useMemo(()=>recipes.filter(r=>r.polarity==='-'),[recipes])
  const total=recipes.filter(r=>r.enabled!==false).reduce((sum,r)=>sum+Math.abs(r.weight),0)
  // Plain slice, and deliberately so. This card carried a +/- chip per row until
  // the polarity was pointed out as a control that does nothing here -- on
  // /cookbooks the identical chip is a BUTTON that flips polarity. With the sign
  // gone the row is a weight, so promoting a 5% risk Recipe over a 25% positive
  // one to make a polarity visible would surface a lighter Recipe and show
  // nothing for it. The mix is stated once, in the footer.
  const shown=recipes.slice(0,4)
  return <Card className="cookbook-card">
    <div className="cookbook-card-head">
      <div><strong>{cookbook.name}</strong><span>v{cookbook.version}{cookbook.created_by?` · ${cookbook.created_by}`:''}</span></div>
      <StatusPill status={cookbook.status}/>
    </div>
    <div className="weight-list">{shown.map(recipe=><div key={recipe.recipe_id} className="weight-row">
      <span className="grow">{recipe.name}</span>
      <strong>{recipe.weight}%</strong>
    </div>)}
    {recipes.length===0&&<div className="no-results">This Cookbook has no Recipes.</div>}</div>
    <div className="cookbook-card-foot">
      {recipes.length>shown.length
        ? <Link to="/cookbooks">{recipes.length-shown.length} more recipe{recipes.length-shown.length===1?'':'s'} <ChevronRight size={12}/></Link>
        : <span/>}
      <span className="weight-total-inline">{recipes.length-risk.length} positive · {risk.length} risk · <strong className={total===100?'ok':'bad'}>{total}%</strong></span>
    </div>
  </Card>
}
