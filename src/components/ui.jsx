import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SectionLabel({ children, blue = false }) { return <div className={blue ? 'section-label blue' : 'section-label'}>{children}</div> }
export function Card({ children, className = '', ...props }) { return <section className={`card ${className}`} {...props}>{children}</section> }
export function Button({ children, variant = 'primary', className = '', ...props }) { return <button className={`button ${variant} ${className}`} {...props}>{children}</button> }
export function StatusPill({ status }) { return <span className={`status-pill status-${status}`}>{status}</span> }
export function EmptyState({ title, detail }) { return <div className="empty-state"><AlertCircle size={22} /><strong>{title}</strong><span>{detail}</span></div> }
export function LoadingCards() { return <div className="skeleton-grid">{[1,2,3].map(i => <div className="card skeleton-card" key={i}><div/><div/><div/></div>)}</div> }
export function ErrorCard({ error }) { return <Card className="error-card"><AlertCircle /><div><strong>Couldn’t load this section</strong><p>{error?.message || 'Please try again.'}</p></div></Card> }
export function Modal({ title, children, onClose, footer }) { return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div><div className="modal-body">{children}</div><div className="modal-footer">{footer}</div></div></div> }
export function Progress({ value, label }) { return <div className="progress-wrap"><div className="progress-meta"><span>{label}</span><strong>{value}%</strong></div><div className="progress"><span style={{width:`${value}%`}} /></div></div> }
export function SuccessNote({ children }) { return <div className="success-note"><CheckCircle2 size={17}/>{children}</div> }
export function Spinner() { return <LoaderCircle className="spin" size={18}/> }

/* Back, and only Back.
 *
 * Every page here carried a link reading "Back to <somewhere>" that went to a
 * FIXED destination -- the meeting workspace's went to its source video. That is a
 * hierarchical up-link, and it is right when you arrived from above and wrong
 * otherwise: nine routes reach a meeting workspace and one of them comes from the
 * source video, so the control was correct about one time in nine while promising,
 * by the word "Back", to be correct always.
 *
 * It now goes back, and appears only when there is somewhere to go. A deep link
 * has no history behind it, and a Back button that does nothing is the thing being
 * fixed; the sidebar is always there for getting somewhere else.
 */
export function PageNav() {
  const navigate = useNavigate()
  // react-router records its position in history.state.idx. Above zero means this
  // session has a previous entry; undefined means we cannot tell, and the button
  // is hidden rather than shown and dead.
  const idx = typeof window !== 'undefined' ? window.history.state?.idx : undefined
  if (typeof idx !== 'number' || idx <= 0) return null
  return <div className="page-nav">
    <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={15}/> Back</button>
  </div>
}
