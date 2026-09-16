import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DeleteButton } from '../components/DeleteButton'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CopyPlus, Download, ExternalLink, Plus, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { analysisApi } from '../lib/api'
import { scoreCeiling, blockedNames } from '../components/dashboard'
import { formatDuration } from '../lib/format'
import { Card, LoadingCards, SectionLabel, StatusPill } from '../components/ui'
import { usePrincipal } from '../hooks/usePrincipal'

export function AnalysesPage({ mode }) {
  const access = usePrincipal()
  const [params] = useSearchParams()
  const meetingId = params.get('meeting_id') || ''
  const q = useQuery({ queryKey: ['analyses', meetingId], queryFn: () => analysisApi.list(meetingId ? `meeting_id=${encodeURIComponent(meetingId)}` : '') })
  const all = useMemo(() => (q.data || []).filter(a => mode !== 'reports' || a.status === 'published'), [q.data, mode])
  // A deployment with thirty recordings has upward of a hundred analyses — the
  // same Meeting seen through several Cookbooks is the point of the product — so
  // an unfiltered wall of cards is the default state, not the edge case.
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('recent')
  const needle = search.trim().toLowerCase()
  const rows = useMemo(() => {
    const out = all.filter(a =>
      (status === 'all' || a.status === status) &&
      (!needle || `${a.name} ${a.cookbook_name}`.toLowerCase().includes(needle)))
    const by = {
      recent: (x, y) => String(y.created_at || '').localeCompare(String(x.created_at || '')),
      score: (x, y) => (y.overall_score ?? -1) - (x.overall_score ?? -1),
      name: (x, y) => x.name.localeCompare(y.name),
    }[sort]
    return out.slice().sort(by)
  }, [all, status, needle, sort])
  const counts = useMemo(() => all.reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), {}), [all])
  const heading = mode === 'reports' ? 'Reports' : meetingId ? 'Meeting analyses' : 'Analyses'
  return <div className="page">
    <div className="page-heading"><div><SectionLabel blue>{mode === 'reports' ? 'PUBLISHED OUTPUTS' : meetingId ? 'MEETING ANALYSIS HISTORY' : 'ANALYSIS LIBRARY'}</SectionLabel><h2>{heading}</h2><p>{mode === 'reports' ? 'Published outputs are immutable. Export is shown only when the report service is available.' : 'Compare Cookbook runs, integrity, confidence and evidence coverage.'}</p></div>{mode !== 'reports' && access.can('analysis.create') && <Link className="button primary" to={`/analyses/new${meetingId ? `?meeting_id=${meetingId}` : ''}`}><Plus size={15}/>New analysis</Link>}</div>
    <div className="list-toolbar">
      <div className="lib-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search analyses or cookbooks…" aria-label="Search analyses"/></div>
      <div className="note-tabs">{[['all', 'All'], ['published', 'Published'], ['draft', 'Draft'], ['stale', 'Stale']]
        .filter(([key]) => key === 'all' || counts[key]).map(([key, label]) =>
          <button key={key} className={status === key ? 'active' : ''} onClick={() => setStatus(key)}>{label}{key !== 'all' && counts[key] ? ` ${counts[key]}` : ''}</button>)}</div>
      <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort analyses">
        <option value="recent">Newest first</option><option value="score">Highest score</option><option value="name">Name</option>
      </select>
      <span className="list-count">{rows.length} of {all.length}</span>
    </div>
    {q.isLoading ? <LoadingCards/> : <div className="analysis-library">{rows.map(a => {
      const human = a.recipes?.some(r => r.kind === 'human')
      const degraded = a.modality_confidence?.overall != null && a.modality_confidence.overall < .7
      const ceiling = scoreCeiling(a)      // null unless a weighted criterion went unscored
      const missing = blockedNames(a)
      return <Card key={a.analysis_id}>
        <div className="analysis-card-head"><div><strong>{a.name}</strong><span>{a.cookbook_name} · v{a.cookbook_version}</span></div><div className="heading-status"><StatusPill status={a.status}/><DeleteButton permission="analysis.delete" label="Delete" name={a.name} note="The Meeting and its evidence are kept, so the Analysis can be re-run." onDelete={()=>analysisApi.remove(a.analysis_id)} subtle/></div></div>
        <div className="analysis-card-score"><strong>{a.overall_score ?? '—'}</strong><span>{ceiling!=null?`of ${ceiling} possible`:(a.overall_band || 'No score')}</span></div>
        <div className={`integrity-line ${a.publishable ? 'complete' : 'blocked'}`}>{a.publishable ? <ShieldCheck size={14}/> : <AlertTriangle size={14}/>}<span>{a.publishable ? 'Complete and publishable' : (missing.length?`Incomplete · no evidence for ${missing.join(', ')}`:'Incomplete · required inputs missing')}</span></div>
        <div className="analysis-card-meta"><span>{a.evidence_coverage}% evidence</span><span>{formatDuration(a.elapsed_ms)} deterministic runtime</span><span><ShieldCheck size={12}/>{a.reused_base_inference ? 'Base evidence reused' : 'Inference required'}</span></div>
        <div className="analysis-card-actions">{degraded && <Link className="button warning" to={`/analyses/${a.analysis_id}/confidence`}><AlertTriangle size={14}/>Confidence</Link>}{human && a.status !== 'published' && access.can('analysis.human_score') && <Link className="button secondary" to={`/analyses/${a.analysis_id}/human-scoring`}><SlidersHorizontal size={14}/>Human scores</Link>}{mode!=='reports'&&access.can('analysis.create')&&<Link className="button secondary" to={`/analyses/new?meeting_id=${a.meeting_id}&cookbook_id=${a.cookbook_id}`}><CopyPlus size={14}/>Clone lens</Link>}<Link className="button secondary" to={`/meetings/${a.meeting_id}?tab=Intelligence&analysis=${a.analysis_id}`}><ExternalLink size={14}/>Inspect</Link>{a.status === 'published' && access.can('report.read') && <Link className="button primary" to={`/reports/${a.analysis_id}`}><Download size={14}/>Preview</Link>}</div>
      </Card>
    })}</div>}
    {!q.isLoading && rows.length === 0 && <Card><div className="no-results">No analyses match this view.</div></Card>}
  </div>
}
