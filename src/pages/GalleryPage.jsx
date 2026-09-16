import { useState } from 'react'
import { EnlargedFace, ResolveIdentityModal } from '../components/ParticipantsView'
import { DeleteButton } from '../components/DeleteButton'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { FileUp, Link2, Mic, Plus, UserCheck, UserRound, Waves, X } from 'lucide-react'
import { galleryApi, meetingApi } from '../lib/api'
import { formatDuration, formatSourceTime } from '../lib/format'
import { usePrincipal } from '../hooks/usePrincipal'
import { Button, Card, ErrorCard, LoadingCards, Modal, SectionLabel, StatusPill, SuccessNote } from '../components/ui'

const tabs = [['faces', 'Faces'], ['voices', 'Voices'], ['mappings', 'Face ↔ Voice'], ['unresolved', 'Unresolved / Detected']]

export function GalleryPage() {
  // The tab lives in the URL, not in component state: Home's participant counts
  // link straight to a category ("26 unknown" opens the review queue), and a
  // tab that only existed in state made those destinations unreachable. It also
  // makes the view linkable and survive a refresh.
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab = tabs.some(([key]) => key === requested) ? requested : 'faces'
  const setTab = (next) => setParams(previous => {
    const merged = new URLSearchParams(previous)
    if (next === 'faces') merged.delete('tab'); else merged.set('tab', next)
    return merged
  }, { replace: true })
  const [open, setOpen] = useState(false); const [selected, setSelected] = useState(null)
  const access = usePrincipal()
  const faces = useQuery({ queryKey: ['gallery-faces'], queryFn: galleryApi.faces, enabled: access.can('gallery.read') })
  const voices = useQuery({ queryKey: ['gallery-voices'], queryFn: galleryApi.voices, enabled: access.can('gallery.read') })
  const mappings = useQuery({ queryKey: ['gallery-mappings'], queryFn: galleryApi.mappings, enabled: access.can('gallery.read') && tab === 'mappings' })
  const unresolved = useQuery({ queryKey: ['gallery-unresolved'], queryFn: () => galleryApi.unresolved(), enabled: access.can('gallery.read') && tab === 'unresolved' })
  const query = tab === 'faces' ? faces : tab === 'voices' ? voices : tab === 'mappings' ? mappings : unresolved
  if (access.isLoading) return <div className="page"><LoadingCards/></div>
  if (!access.can('gallery.read')) return <div className="page"><ErrorCard error={{ message: 'The Gallery is not available for this account.' }}/></div>
  return <div className="page">
    <div className="page-heading"><div><SectionLabel blue>IDENTITY GALLERY</SectionLabel><h2>Faces & Voices</h2><p>Review reusable identities, cross-gallery mappings, and unresolved detections.</p></div>{['faces','voices'].includes(tab) && access.can('gallery.enroll') && <Button onClick={()=>setOpen(true)}><Plus size={14}/>Enroll {tab === 'faces' ? 'face' : 'voice'}</Button>}</div>
    <div className="segmented">{tabs.map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={()=>setTab(key)}>{key === 'faces' ? <UserRound size={14}/> : key === 'voices' ? <Mic size={14}/> : key === 'mappings' ? <Link2 size={14}/> : null}{label}</button>)}</div>
    {query.isLoading ? <LoadingCards/> : query.isError ? <ErrorCard error={query.error}/> : tab === 'mappings' ? <Mappings rows={query.data}/> : tab === 'unresolved' ? <Unresolved rows={query.data}/> : <div className="gallery-grid">{query.data.map(item => <button className="gallery-card-button" onClick={()=>setSelected(item)} key={item.identity_id}><Card className="gallery-card"><div className="gallery-visual">{tab === 'faces' && item.avatar_url ? <img src={item.avatar_url} alt=""/> : tab === 'voices' ? <Waveform values={item.waveform}/> : <UserRound size={30}/>}</div><strong>{item.display_name}</strong><StatusPill status={item.identity_status}/><dl><div><dt>Samples</dt><dd>{item.sample_count}</dd></div><div><dt>Meetings</dt><dd>{item.meeting_count}</dd></div>{tab === 'voices' && <div><dt>Speech</dt><dd>{formatDuration(item.total_speech_ms,{short:true})}</dd></div>}</dl></Card></button>)}</div>}
    {open && <EnrollmentModal kind={tab} onClose={()=>setOpen(false)}/>} {selected && <IdentityDetail kind={tab} identity={selected} faces={faces.data||[]} onClose={()=>setSelected(null)}/>} 
  </div>
}

function Mappings({ rows }) { return <Card className="library-card"><div className="table-scroll"><table><thead><tr><th>Identity</th><th>Face identity</th><th>Voice identity</th><th>Similarity</th><th>Band</th><th>Source</th><th>Meetings</th></tr></thead><tbody>{rows.map((row,index)=><tr key={`${row.face_identity_id}-${row.voice_identity_id}-${index}`}><td><strong>{row.display_name}</strong></td><td>{row.face_identity_id||'Unpaired'}</td><td>{row.voice_identity_id||'Unpaired'}</td><td>{row.similarity == null ? 'Not measured' : `${Math.round(row.similarity*100)}%`}</td><td><StatusPill status={row.band}/></td><td>{row.source.replaceAll('_',' ')}</td><td>{row.meeting_count??0}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="no-results">No gallery mappings are available.</div>}</div></Card> }

function Unresolved({ rows }) {
  const [resolving, setResolving] = useState(null)
  const [enlarged, setEnlarged] = useState(null)
  // A blank tab reads as broken. It was blank for a different reason -- the
  // repo method was delegated and always returned [] -- but an empty queue is
  // also a real state, and it should say so.
  if (!rows?.length) return <Card className="planned-tab"><UserRound size={26}/><h3>Nothing waiting for review</h3><p>Every detected face and voice in the current meetings has been matched to an identity, or there are no meetings ingested yet.</p></Card>
  return <>
    <div className="gallery-grid">{rows.map(row => <Card className="gallery-card" key={row.unresolved_id}><div className="gallery-visual">{row.kind === 'face' && row.sample_url
      /* Clickable, like a known identity's photograph. An UNKNOWN face is the one
         most worth looking at closely: the queue asks who this was, and a 90px
         thumbnail is not enough to answer it. */
      ? <button className="face-sample-button" onClick={()=>setEnlarged(row)} aria-label="Enlarge this face"><img className="face-sample" src={row.sample_url} alt="Unresolved face sample"/></button>
      : row.kind === 'voice' && row.sample_url ? <audio controls preload="none" src={row.sample_url}/>
      : row.kind === 'voice' ? <Mic size={28}/> : <UserRound size={28}/>}</div><strong>{row.meeting_label||'Unresolved participant'}</strong><StatusPill status="unresolved"/><dl><div><dt>Kind</dt><dd>{row.kind}</dd></div><div><dt>First seen</dt><dd>{formatSourceTime(row.first_seen_ms)}</dd></div><div><dt>Occurrences</dt><dd>{row.occurrences}</dd></div><div><dt>Best similarity</dt><dd>{row.best_similarity == null ? 'No match' : `${Math.round(row.best_similarity*100)}%`}</dd></div></dl><Button variant="secondary" onClick={()=>setResolving(row)}><UserCheck size={14}/>Resolve</Button></Card>)}</div>
    {resolving && <ResolveFromQueue row={resolving} onClose={()=>setResolving(null)}/>}
    {enlarged && <EnlargedFace url={enlarged.sample_url} onClose={()=>setEnlarged(null)}
      person={{display_name: enlarged.meeting_label ? `Unresolved face · ${enlarged.meeting_label}` : 'Unresolved face',
               face_crop_url: enlarged.sample_url}}/>}
  </>
}

/* Resolve an unresolved face or voice without leaving the queue.
 *
 * The queue row carries a `participant_id` but not the participant itself, and the
 * modal needs the real record: its display name for the title, and its face tracks
 * for the sentence that says what a merge would move. Passing a stub would make
 * that sentence say "0 face tracks" for somebody who has eight, which is worse than
 * asking the server.
 */
function ResolveFromQueue({ row, onClose }) {
  const participants = useQuery({
    queryKey: ['participants', row.meeting_id],
    queryFn: () => meetingApi.participants(row.meeting_id),
  })
  const person = (participants.data || []).find(p => p.participant_id === row.participant_id)
  if (participants.isLoading) return <Modal title="Resolve" onClose={onClose}><LoadingCards/></Modal>
  // The queue is built from participants, so a row whose participant has gone means
  // somebody resolved or merged it elsewhere. Say that rather than opening an empty
  // form against an id that no longer exists.
  if (!person) return <Modal title="Resolve" onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
    <div className="no-results">This participant has already been resolved or merged, so there is nothing left to review here.</div>
  </Modal>
  return <ResolveIdentityModal participant={person} meetingId={row.meeting_id}
                               onClose={onClose} onResolved={onClose}/>
}

function IdentityDetail({kind,identity,faces,onClose}){const linked=kind==='voices'?faces.find(face=>face.identity_id===identity.linked_face_identity_id):null;return <Modal title={identity.display_name} onClose={onClose} footer={<><DeleteButton permission="gallery.delete" label="Delete identity" name={identity.display_name} note="The enrolled samples are removed from the gallery, so this person will no longer be recognised in future meetings." onDelete={()=>galleryApi.remove(kind,identity.identity_id)} onDone={onClose}/><Button variant="secondary" onClick={onClose}>Close</Button></>}><div className="identity-detail-head"><div className="participant-avatar">{kind==='faces'&&identity.avatar_url?<img src={identity.avatar_url} alt=""/>:kind==='voices'?<Mic size={22}/>:<UserRound size={22}/>}</div><div><strong>{identity.identity_id}</strong><StatusPill status={identity.identity_status}/></div></div><dl className="trace-dl"><div><dt>Samples</dt><dd>{identity.sample_count}</dd></div><div><dt>Meetings</dt><dd>{identity.meeting_count}</dd></div>{identity.total_speech_ms!=null&&<div><dt>Total speech</dt><dd>{formatDuration(identity.total_speech_ms)}</dd></div>}{kind==='voices'&&<div><dt>Linked face</dt><dd>{linked?`${linked.display_name} · ${linked.identity_id}`:identity.linked_face_identity_id||'Unlinked'}</dd></div>}</dl>{kind==='faces'&&<><SectionLabel>ENROLLMENT SAMPLES</SectionLabel>{identity.sample_urls?.length?<div className="identity-samples">{identity.sample_urls.map(url=><img src={url} alt="Enrollment sample" key={url}/>)}</div>:<div className="no-results">Sample thumbnails are not available.</div>}</>}{kind==='voices'&&<><SectionLabel>VOICE PROFILE</SectionLabel>{identity.sample_url?<audio className="voice-player" controls preload="none" src={identity.sample_url}/>:<Waveform values={identity.waveform}/>}</>}</Modal>}

function EnrollmentModal({kind,onClose}){const qc=useQueryClient();const [name,setName]=useState('');const [mode,setMode]=useState('upload');const [files,setFiles]=useState([]);const [urls,setUrls]=useState('');const enroll=useMutation({mutationFn:()=>mode==='upload'?galleryApi.upload(kind,name.trim(),files):galleryApi.enroll(kind,{display_name:name.trim(),sample_urls:urls.split(/[\n,]/).map(v=>v.trim()).filter(Boolean)}),onSuccess:()=>qc.invalidateQueries({queryKey:[`gallery-${kind}`]})});const accept=kind==='faces'?'image/*':'audio/*';const removeFile=index=>setFiles(current=>current.filter((_,itemIndex)=>itemIndex!==index));const canSubmit=name.trim()&&(mode==='url'||files.length>0);return <Modal title={`Enroll ${kind==='faces'?'face':'voice'} identity`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button disabled={!canSubmit||enroll.isPending||enroll.isSuccess} onClick={()=>enroll.mutate()}><FileUp size={14}/>{enroll.isPending?'Uploading…':mode==='upload'?'Upload & enroll':'Enroll'}</Button></>}>{enroll.isSuccess?<SuccessNote>{enroll.data.display_name} enrolled with {enroll.data.sample_count} accepted sample{enroll.data.sample_count===1?'':'s'}. {enroll.data.requires_compute?'Embeddings were generated by Remote Compute.':'No Remote Compute required.'}</SuccessNote>:<><label className="field-label">Display name<input value={name} onChange={e=>setName(e.target.value)}/></label><div className="segmented enrollment-mode" aria-label="Enrollment sample source"><button className={mode==='upload'?'active':''} onClick={()=>setMode('upload')}><FileUp size={13}/>Upload files</button><button className={mode==='url'?'active':''} onClick={()=>setMode('url')}><Link2 size={13}/>Server URLs</button></div>{mode==='upload'?<><label className="gallery-upload-picker"><input type="file" multiple accept={accept} onChange={event=>setFiles(Array.from(event.target.files||[]))}/><FileUp size={23}/><strong>Choose {kind==='faces'?'photos':'audio recordings'}</strong><span>{kind==='faces'?'JPG, PNG, WEBP or other browser-supported images':'WAV, MP3, M4A or other browser-supported audio'} · multiple files allowed</span></label>{files.length>0&&<div className="gallery-upload-files">{files.map((file,index)=><div key={`${file.name}-${file.lastModified}`}><span><strong>{file.name}</strong><small>{(file.size/1024/1024).toFixed(2)} MB</small></span><button onClick={()=>removeFile(index)} aria-label={`Remove ${file.name}`}><X size={13}/></button></div>)}</div>}<p className="modal-help">Files upload directly to the governed gallery endpoint. Only samples that produce usable embeddings count toward enrollment.</p></>:<><label className="field-label">Server-accessible sample URLs (optional)<textarea value={urls} onChange={e=>setUrls(e.target.value)} placeholder="One media URL per line"/></label><p className="modal-help">Use this only for media the server can already reach. Leaving it empty creates a name-only identity.</p></>}{enroll.isError&&<div className="warning-callout" role="alert"><p>{enroll.error.message}</p></div>}</>}</Modal>}
function Waveform({values=[]}){return <div className="waveform"><Waves size={22}/>{values.slice(0,30).map((v,i)=><i key={i} style={{height:`${Math.max(4,v*35)}px`}}/>)}</div>}
