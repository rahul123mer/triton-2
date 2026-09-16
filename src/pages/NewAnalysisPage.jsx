import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Layers3 } from 'lucide-react'
import { analysisApi, api, cookbookApi, videoApi } from '../lib/api'
import { meetingOrigin, meetingSubtitle } from '../lib/format'
import { Button, Card, ErrorCard, LoadingCards, SectionLabel, StatusPill } from '../components/ui'
import { usePrincipal } from '../hooks/usePrincipal'

export function NewAnalysisPage(){
  const access=usePrincipal()
  const navigate=useNavigate();const [params]=useSearchParams();const [step,setStep]=useState(1);const [meetingId,setMeetingId]=useState(params.get('meeting_id')||'');const [cookbookId,setCookbookId]=useState(params.get('cookbook_id')||'');const [name,setName]=useState('')
  const meetings=useQuery({queryKey:['meetings'],queryFn:()=>api('/meetings')});const cookbooks=useQuery({queryKey:['cookbooks'],queryFn:cookbookApi.list})
  const videos=useQuery({queryKey:['videos'],queryFn:()=>videoApi.list(),enabled:access.can('video.read')})
  const videoById=Object.fromEntries((videos.data||[]).map(v=>[v.video_id,v]))
  // "Meeting 1" three times over is not a label anyone can choose between.
  const describe=(m)=>meetingSubtitle(m,videoById[m?.video_id])
  const qualified=(m)=>m?`${m.label} · ${meetingOrigin(m,videoById[m.video_id])||'source unknown'}`:''
  const selectedMeeting=meetings.data?.find(m=>m.meeting_id===meetingId);const selectedCookbook=cookbooks.data?.find(c=>c.cookbook_id===cookbookId);const humanRecipes=selectedCookbook?.recipes.filter(r=>r.kind==='human'&&r.enabled&&r.weight>0)||[]
  const create=useMutation({mutationFn:()=>analysisApi.create({meeting_id:meetingId,cookbook_id:cookbookId,name:name||undefined}),onSuccess:r=>navigate(humanRecipes.length?`/analyses/${r.analysis_id}/human-scoring`:`/meetings/${meetingId}?tab=Intelligence&analysis=${r.analysis_id}`)})
  if(access.isLoading||meetings.isLoading||cookbooks.isLoading)return <div className="page"><LoadingCards/></div>;if(!access.can('analysis.create'))return <div className="page"><ErrorCard error={{message:'Your live permissions do not allow Analysis creation.'}}/></div>;if(meetings.isError||cookbooks.isError)return <div className="page"><ErrorCard error={meetings.error||cookbooks.error}/></div>
  return <div className="page"><div className="page-heading"><div><SectionLabel blue>NEW ANALYSIS</SectionLabel><h2>Choose meeting and Cookbook</h2><p>Apply a new business lens using precomputed Recipe results.</p></div></div>
    <div className="wizard-steps">{['Select Meeting','Select Cookbook','Analysis Settings','Confirm'].map((label,i)=><div className={step===i+1?'active':step>i+1?'done':''} key={label}><span>{step>i+1?<Check size={12}/>:i+1}</span>{label}</div>)}</div>
    <Card className="wizard-card">{step===1&&<><SectionLabel>STEP 1 · SELECT MEETING</SectionLabel><div className="choice-list">{meetings.data.map(m=><button className={meetingId===m.meeting_id?'selected':''} onClick={()=>setMeetingId(m.meeting_id)} key={m.meeting_id}><div><strong>{m.label}</strong><span>{describe(m)}</span></div><StatusPill status={m.status}/></button>)}</div></>}
      {step===2&&<><SectionLabel>STEP 2 · SELECT COOKBOOK</SectionLabel><div className="cookbook-choices">{cookbooks.data.map(c=><button className={cookbookId===c.cookbook_id?'selected':''} onClick={()=>setCookbookId(c.cookbook_id)} key={c.cookbook_id}><Layers3/><strong>{c.name}</strong><span>{c.recipes.length} fixed catalog entries · v{c.version}</span><StatusPill status={c.status}/></button>)}</div></>}
      {step===3&&<><SectionLabel>STEP 3 · ANALYSIS SETTINGS</SectionLabel><label className="field-label">Analysis name<input value={name} onChange={e=>setName(e.target.value)} placeholder={`${qualified(selectedMeeting)||'Meeting'} — ${selectedCookbook?.name||'Analysis'}`}/></label>{humanRecipes.length?<div className="human-required">This Cookbook includes {humanRecipes.length} human-scored parameter{humanRecipes.length===1?'':'s'}. Human Scoring opens immediately after the Draft is created.</div>:<div className="instant-analysis">All required AI Recipe results are already stored. Creating this Analysis will not contact Remote Compute.</div>}</>}
      {step===4&&<><SectionLabel>STEP 4 · CONFIRM</SectionLabel><div className="confirm-analysis"><div><span>Meeting</span><strong>{selectedMeeting?.label}</strong><em>{describe(selectedMeeting)}</em></div><div><span>Cookbook</span><strong>{selectedCookbook?.name}</strong></div><div><span>Compute</span><strong>No remote inference</strong></div><div><span>Human scoring</span><strong>{humanRecipes.length?`${humanRecipes.length} parameters next`:'Not required'}</strong></div></div></>}
      {create.isError&&<div className="warning-callout"><p>{create.error.message}</p></div>}<div className="wizard-actions"><Button variant="secondary" disabled={step===1||create.isPending} onClick={()=>setStep(v=>v-1)}><ArrowLeft size={14}/>Back</Button>{step<4?<Button disabled={(step===1&&!meetingId)||(step===2&&!cookbookId)} onClick={()=>setStep(v=>v+1)}>Continue<ArrowRight size={14}/></Button>:<Button disabled={create.isPending} onClick={()=>create.mutate()}><Check size={14}/>Create Draft</Button>}</div>
    </Card>
  </div>
}
