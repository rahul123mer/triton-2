import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, ArrowUpRight, ChevronDown, ChevronUp, Database, FileClock, ShieldCheck } from 'lucide-react'
import { governanceApi } from '../lib/api'
import { usePrincipal } from '../hooks/usePrincipal'
import { Card, ErrorCard, LoadingCards, SectionLabel, StatusPill } from '../components/ui'

// Global governance answers "what changed today", which is why it is a separate
// route from the per-meeting trail rather than a duplicate of it. It reported an
// empty product for a different reason: `global_governance` was one of the methods
// PostgresRepo delegated to the in-memory FixtureRepo, which walks FIXTURE
// meetings — and a normal start points MI_FIXTURES_DIR at fixtures-clean, whose
// meetings.json is []. The page was structurally guaranteed to be blank no matter
// what the database held. It is native to PostgreSQL now.
const FILTERS=[
  ['all','All activity',()=>true],
  ['analysis','Analyses',e=>e.action.startsWith('analysis.')],
  ['extraction','Extraction changes',e=>e.action.startsWith('extraction.')],
  ['report','Exports',e=>e.action.startsWith('report.')],
  ['note','Notes',e=>e.action.startsWith('note.')],
]

export function GovernancePage() {
  const access = usePrincipal()
  const [filter,setFilter]=useState('all')
  const [expanded,setExpanded]=useState(null)
  const [page,setPage]=useState(0)
  const query = useQuery({ queryKey: ['governance', 'global'], queryFn: governanceApi.global, enabled: access.can('governance.read') })
  const activity=useMemo(()=>{const match=FILTERS.find(f=>f[0]===filter)?.[2]||(()=>true);return (query.data?.activity||[]).filter(match)},[query.data,filter])
  // A tenant's trail is hundreds of rows. Rendered whole it made the page twelve
  // thousand pixels tall, which is not an audit tool. Mockup 08 pages it.
  const PER_PAGE=25
  const pageCount=Math.max(1,Math.ceil(activity.length/PER_PAGE))
  const current=Math.min(page,pageCount-1)
  const shown=activity.slice(current*PER_PAGE,current*PER_PAGE+PER_PAGE)
  const choose=(key)=>{setFilter(key);setPage(0);setExpanded(null)}
  if (access.isLoading) return <div className="page"><LoadingCards/></div>
  if (!access.can('governance.read')) return <div className="page"><ErrorCard error={{ message: 'Governance is not available for this account.' }}/></div>
  const versions=query.data?.versions||[]
  const published=versions.filter(v=>v.status==='published')
  return <div className="page">
    <div className="page-heading"><div><SectionLabel blue>AUDIT EVIDENCE</SectionLabel><h2>Evidence</h2><p>Immutable activity across every meeting, version and reviewer intervention in your scope.</p></div></div>
    {access.principal?.provisional && <div className="provisional-callout"><ShieldCheck size={16}/><span>The current access matrix is provisional. Affordances below are driven from live permissions.</span></div>}
    {query.isError ? <ErrorCard error={query.error}/> : !query.data ? <LoadingCards/> : <>
      <div className="metric-grid"><Card className="metric-card"><div className="metric-icon"><Activity size={20}/></div><div><SectionLabel>Audit entries</SectionLabel><strong>{query.data.activity.length}</strong><span>Across all meetings</span></div></Card>
        <Card className="metric-card"><div className="metric-icon"><Database size={20}/></div><div><SectionLabel>Tracked versions</SectionLabel><strong>{versions.length}</strong><span>Analyses under governance</span></div></Card>
        <Card className="metric-card"><div className="metric-icon"><ShieldCheck size={20}/></div><div><SectionLabel>Published</SectionLabel><strong>{published.length}</strong><span>Frozen and exportable</span></div></Card>
        <Card className="metric-card"><div className="metric-icon"><FileClock size={20}/></div><div><SectionLabel>Last change</SectionLabel><strong>{query.data.activity[0]?new Date(query.data.activity[0].at).toLocaleDateString():'—'}</strong><span>{query.data.activity[0]?.actor||'No activity yet'}</span></div></Card>
      </div>
      <div className="governance-dashboard">
        <Card>
          <div className="card-heading"><div><SectionLabel>ACTIVITY TRAIL</SectionLabel><h3>{activity.length} governed events</h3></div></div>
          <div className="note-tabs trail-filters">{FILTERS.map(([key,label])=><button key={key} className={filter===key?'active':''} onClick={()=>choose(key)}>{label}</button>)}</div>
          <div className="activity-timeline">{shown.map(entry=>{
            const open=expanded===entry.entry_id;const hasDiff=entry.original_value!=null||entry.corrected_value!=null
            return <article key={entry.entry_id}><div className="activity-dot"/>
              <button className="audit-row" disabled={!hasDiff} onClick={()=>setExpanded(open?null:entry.entry_id)}>
                <div><time>{new Date(entry.at).toLocaleString()}</time><strong>{entry.actor}</strong><p>{entry.summary}</p><small>{entry.action}</small></div>
                {hasDiff&&(open?<ChevronUp size={14}/>:<ChevronDown size={14}/>)}
              </button>
              {open&&<div className="audit-diff"><div><span>Previous value</span><code>{entry.original_value??'Not set'}</code></div><div><span>Corrected value</span><code>{entry.corrected_value??'Not set'}</code></div><small>{entry.entity_type} · {entry.entity_id}</small></div>}
            </article>})}
            {activity.length===0&&<div className="no-results">No governed activity of this kind is visible in your scope.</div>}
          </div>
          {activity.length>0&&<div className="trail-pager">
            <span>Showing {current*PER_PAGE+1} to {current*PER_PAGE+shown.length} of {activity.length} events</span>
            <div><button disabled={current===0} onClick={()=>setPage(0)} aria-label="First page">&#124;&lt;</button>
              <button disabled={current===0} onClick={()=>setPage(current-1)} aria-label="Previous page">&lt;</button>
              <strong>{current+1} / {pageCount}</strong>
              <button disabled={current>=pageCount-1} onClick={()=>setPage(current+1)} aria-label="Next page">&gt;</button>
              <button disabled={current>=pageCount-1} onClick={()=>setPage(pageCount-1)} aria-label="Last page">&gt;&#124;</button></div>
          </div>}
        </Card>
        <Card>
          <div className="card-heading"><div><SectionLabel>TRACKED VERSIONS</SectionLabel><h3>Every analysis under governance</h3></div><Link to="/analyses">All analyses</Link></div>
          <div className="version-list">{versions.slice(0,25).map(version=><Link key={version.analysis_id} className="version-link" to={`/reports/${version.analysis_id}`}>
            <FileClock size={16}/>
            <div className="grow"><strong>{version.name}</strong><span>{version.cookbook_name} v{version.cookbook_version}{version.overall_score!=null?` · ${version.overall_score}/100`:''}</span></div>
            <StatusPill status={version.status}/><ArrowUpRight size={14}/>
          </Link>)}
          {versions.length===0&&<div className="no-results">No analyses have been created yet.</div>}
          {versions.length>25&&<div className="no-results">Showing the 25 most recent of {versions.length}.</div>}
          </div>
        </Card>
      </div>
    </>}
  </div>
}
