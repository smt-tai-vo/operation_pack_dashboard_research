import OperationList from './OperationList.jsx'
import { PmsDashboard, MpaDashboard } from './DashboardPages.jsx'
import './dashboard-pages.css'
import { useEffect, useState } from 'react'
import { Activity, Bell, Building2, Check, CheckCheck, ChevronRight, CircleHelp, Clock3, FileText, MapPin, Pause, Play, ShieldCheck, Wrench, X, Zap } from 'lucide-react'
import { CURRENT_STAFF_ID, HOUR, NOW, PRIORITY, STAFF, STATUS, TICKET_STATUS, dateText, initialData, isOpen, timing } from './data.js'

import { WorkflowRunList } from './Workflow.jsx'
import { initialWorkflowRuns } from './workflow-data.js'

const demo = initialData()
const workflowRuns = initialWorkflowRuns(demo.works, demo.tickets)
const cx = (...names) => names.filter(Boolean).join(' ')
const pickStaff = id => STAFF.find(s => s.id === id)

function Badge({ children, tone = 'neutral', dot = true }) {
  return <span className={cx('badge', tone)}>{dot && <i />}{children}</span>
}
function Button({ children, onClick, icon: Icon, variant = 'primary', disabled, className = '' }) {
  return <button className={cx('button', variant, className)} onClick={onClick} disabled={disabled}>{Icon && <Icon size={16} />}{children}</button>
}
function IconButton({ children, onClick, label, disabled = false, className = '' }) {
  return <button className={cx('icon-button', className)} onClick={onClick} aria-label={label} title={label} disabled={disabled}>{children}</button>
}
function Avatar({ staff, size = '' }) {
  return <span className={cx('avatar', size)} style={{ '--avatar-color': staff.color }}>{staff.initials}</span>
}
function PortalSwitch({ portal, onChange }) {
  return <div className="portal-switch" aria-label="Choose portal"><button className={portal === 'PMS' ? 'active' : ''} onClick={() => onChange('PMS')}><Building2 size={14} />PMS</button><button className={portal === 'MPA' ? 'active' : ''} onClick={() => onChange('MPA')}><Wrench size={14} />MPA</button></div>
}
function Dialog({ title, subtitle, children, onClose, wide = false, className = '' }) {
  return <div className="overlay" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-label={title} className={cx('dialog', wide && 'wide', className)} onMouseDown={e => e.stopPropagation()}><header><div><div className="eyebrow">SMARTOS · MAINTENANCE</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton label="Close" onClick={onClose}><X size={20} /></IconButton></header><div className="dialog-body">{children}</div></section></div>
}

export default function App() {
  const [portal, setPortal] = useState(window.location.hash === '#mpa' ? 'MPA' : 'PMS')
  const [works, setWorks] = useState(demo.works)
  const [tickets, setTickets] = useState(demo.tickets)
  const [selected, setSelected] = useState(null)
  const [listing, setListing] = useState(null)
  const [toast, setToast] = useState('')
  const [notifications, setNotifications] = useState(false)
  const notify = message => { setToast(message); window.setTimeout(() => setToast(''), 3400) }
  const switchPortal = next => { setPortal(next); window.location.hash = next === 'MPA' ? 'mpa' : 'dashboard'; setSelected(null); setListing(null); setNotifications(false) }
  useEffect(() => {
    const onHash = () => {
      const page = window.location.hash.slice(1)
      setPortal(page === 'mpa' ? 'MPA' : 'PMS')
      setSelected(null); setListing(null)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { if (selected) setSelected(null); else if (listing) setListing(null); else { setNotifications(false) } } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, listing])
  useEffect(() => {
    document.body.style.overflow = selected || listing ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected, listing])
  const updateWork = (id, changes, message) => {
    if (changes.status === 'IN_PROGRESS') {
      const work = works.find(w => w.id === id)
      if (work?.status === 'TO_DO') setTickets(current => current.map(t => work.ticketIds.includes(t.id) && t.status === 'APPROVED' ? { ...t, status: 'IN_PROGRESS' } : t))
    }
    setWorks(current => current.map(w => w.id === id ? { ...w, ...changes, history: [{ text: message, at: NOW }, ...w.history] } : w))
    if (message) notify(message)
  }
  const updateTicket = (id,changes,message) => {
    setTickets(current=>current.map(t=>t.id===id?{...t,...changes}:t))
    if(changes.status==='CANCELLED') {
      const next=tickets.map(t=>t.id===id?{...t,...changes}:t)
      setWorks(current=>current.map(w=>w.ticketIds.includes(id)&&isOpen(w)&&w.ticketIds.every(ticketId=>next.find(t=>t.id===ticketId)?.status==='CANCELLED')?{...w,status:'CLOSED',cancelled:true,closeReason:'TICKET_CANCELLED',closedAt:NOW,history:[{text:'Huỷ do tất cả ticket liên kết đã huỷ',at:NOW},...w.history]}:w))
    }
    notify(message)
  }
  const activeWork = works.find(w => w.id === selected)
  const myNotifications = works.filter(w => w.staffId === CURRENT_STAFF_ID && isOpen(w) && timing(w).tone === 'red').slice(0, 3)
  const topbar = <>
    <span className="demo-label"><span />PREVIEW</span>
    <PortalSwitch portal={portal} onChange={switchPortal} />
    <div className="topbar-divider" />
    <div className="notification-wrap"><IconButton label="Notifications" className="bell-button" onClick={() => setNotifications(!notifications)}><Bell size={19} />{myNotifications.length > 0 && <i />}</IconButton>{notifications && <div className="notifications"><strong>Work that needs attention</strong>{myNotifications.map(w => <button key={w.id} onClick={() => { setSelected(w.id); setNotifications(false) }}><span className="notification-icon"><Clock3 size={17} /></span><span><b>{w.code}</b><small>{w.title}</small><em>{timing(w).label}</em></span><ChevronRight size={16} /></button>)}{!myNotifications.length && <p>There is no work needing your attention.</p>}</div>}</div>
    <Avatar staff={portal === 'MPA' ? STAFF[0] : { initials: 'LH', color: '#83919d' }} size="small" />
  </>
  return <>
    {portal === 'PMS' ? <div className="app-shell">
      <div className="main-shell"><header className="topbar"><div className="breadcrumb"><Building2 size={15} /><span>Operations</span><ChevronRight size={13} /><strong>Dashboard</strong></div><div className="top-actions">{topbar}</div></header><PmsDashboard works={works} tickets={tickets} runs={workflowRuns} onList={setListing} /></div>
    </div> : <div className="mpa-shell"><header className="mpa-header"><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-symbol"><Zap size={19} fill="currentColor" /></span><strong>smart<span>os</span><i /></strong><span className="staff-portal-label">STAFF PORTAL</span></a><div className="top-actions">{topbar}</div></header><MpaDashboard works={works} tickets={tickets} onUpdate={updateWork} onSelect={setSelected} onList={setListing} /></div>}
    {activeWork && <WorkDetail work={activeWork} tickets={tickets} mpa={portal === 'MPA'} onClose={() => setSelected(null)} onUpdate={updateWork} />}
    {listing && <Dialog title={listing.title} subtitle={listing.subtitle} onClose={() => setListing(null)} wide className={listing.kind==='workflow'?'':'coworking-list-dialog'}>{listing.kind === 'workflow' ? <WorkflowRunList key={listing.title} listing={listing} runs={workflowRuns} works={works} tickets={tickets} onSelectWork={setSelected} notify={notify} /> : <OperationList onUpdateTicket={updateTicket} onUpdate={updateWork} mpa={portal === 'MPA'} key={listing.title} listing={listing} works={works} tickets={tickets} onSelect={setSelected} notify={notify} />}</Dialog>}

    {toast && <div className="toast" role="status"><span><Check size={18} /></span>{toast}</div>}
  </>
}

function WorkDetail({ work: w, tickets, mpa, onClose, onUpdate }) {
  const [pause, setPause] = useState(false)
  const [reason, setReason] = useState('')
  const [tab, setTab] = useState('details')
  const [media, setMedia] = useState(null)
  const staff = pickStaff(w.staffId)
  const t = timing(w)
  const done = w.checklist.filter(x => x.checked).length
  const canAct = mpa && w.staffId === CURRENT_STAFF_ID && isOpen(w)
  const linked = w.ticketIds.map(id => tickets.find(t => t.id === id)).filter(t => t && t.status !== 'CANCELLED')
  const transition = (status, text, extra = {}) => onUpdate(w.id, { status, ...extra }, text)
  return <div className="drawer-overlay" onMouseDown={onClose}><aside className={cx('detail-drawer', mpa && 'mpa-detail')} role="dialog" aria-modal="true" aria-label={`Details ${w.code}`} onMouseDown={e => e.stopPropagation()}><header className="drawer-header"><div><span className="eyebrow">WORK ORDER DETAILS</span><span className="drawer-code">{w.code}</span></div><IconButton label="Close details" onClick={onClose}><X size={20} /></IconButton></header><div className="drawer-content"><div className="detail-badges"><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge></div><h2>{w.title}</h2><div className="detail-location"><MapPin size={15} />{w.location} · {w.area}</div><div className={cx('deadline-banner', t.tone)}><Clock3 size={17} /><div><b>{t.label}</b><span>{t.due ? `Due ${t.detail.toLowerCase()}: ${dateText(t.due)}` : t.detail || dateText(w.completedAt)}</span></div></div>
      {w.status === 'CLOSED' && <div className="close-reason"><strong>Closure reason</strong><p>{w.closeReason === 'ARCHIVED' ? 'Completed work has been archived.' : w.closeReason === 'TICKET_CANCELLED' ? 'All linked tickets were cancelled.' : 'Cancelled by PMS: maintenance plans changed.'}</p></div>}
      <div className="detail-tabs tabs"><button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Details & checklist</button><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>History<span>{w.history.length}</span></button></div>
      {tab === 'details' ? <>
        <div className="detail-info"><div><small>ASSIGNEE</small><span className="person"><Avatar staff={staff} size="tiny" />{staff.name}</span></div><div><small>ASSIGNED AT</small><b>{dateText(w.assignedAt)}</b></div><div><small>RESPONSE DEADLINE</small><b>{dateText(w.responseDueAt)}</b></div><div><small>RESOLUTION SLA DEADLINE</small><b>{w.startedAt ? dateText(w.resolveDueAt) : 'Not started'}</b></div><div><small>DUE DATE</small><b>{w.dueDate ? dateText(w.dueDate) : 'Not set'}</b></div><div><small>TARGET RESOLUTION TIME</small><b>{w.resolveHours} hours from first start</b></div></div>
        <div className="detail-section"><h3>Notes</h3><p className="note-box">{w.note}</p><div className="media-grid"><button onClick={() => setMedia('Site photo')}><span className="fake-image"><Wrench size={28} strokeWidth={1.2} /></span><small>Site photo</small></button><button onClick={() => setMedia('Inspection video')}><span className="fake-image video"><Play size={24} fill="currentColor" /></span><small>Inspection video</small></button></div></div>
        {w.pauseReason && <div className="pause-note"><Pause size={16} /><div><strong>Pause reason</strong><p>{w.pauseReason}</p></div></div>}
        <div className="detail-section"><div className="section-inline"><h3>Work checklist</h3><span>{done}/{w.checklist.length} steps</span></div><div className="detail-progress"><span style={{ width: `${w.checklist.length ? done / w.checklist.length * 100 : 100}%` }} /></div>{w.checklist.length ? <div className="checklist">{w.checklist.map(item => <label key={item.id} className={item.checked ? 'checked' : ''}><input type="checkbox" checked={item.checked} disabled={!canAct} onChange={() => onUpdate(w.id, { checklist: w.checklist.map(x => x.id === item.id ? { ...x, checked: !x.checked } : x) }, item.checked ? 'Checklist item unchecked' : 'Checklist item completed')} /><span className="checkbox-visual">{item.checked && <Check size={13} strokeWidth={3} />}</span><span>{item.text}</span></label>)}</div> : <p className="muted">This work order has no checklist.</p>}{canAct && done < w.checklist.length && <p className="checklist-hint"><CircleHelp size={13} />Complete all checklist items before completing the work order.</p>}</div>
        <div className="detail-section"><div className="section-inline"><h3>Linked tickets</h3><span>{linked.length} ticket</span></div>{linked.length ? linked.map(ticket => <div className="linked-ticket" key={ticket.id}><div><b className="code">{ticket.code}</b><Badge tone={TICKET_STATUS[ticket.status].tone}>{TICKET_STATUS[ticket.status].label}</Badge></div><strong>{ticket.type}</strong><p>{ticket.note}</p><small><MapPin size={12} />{ticket.location} · {ticket.area}</small></div>) : <div className="no-linked-ticket"><FileText size={22} /><strong>No linked tickets</strong><p>Follow the location, notes and checklist on the work order.</p></div>}</div>
      </> : <div className="timeline">{w.history.map((h, i) => <div key={`${h.at}-${i}`}><span className={i === 0 ? 'blue' : ''}>{i === 0 ? <Activity size={13} /> : <i />}</span><div><strong>{h.text}</strong><small>{dateText(h.at)}</small></div></div>)}</div>}
    </div><footer className="drawer-footer">{canAct ? w.status === 'TO_DO' ? <Button className="full" icon={Play} onClick={() => transition('IN_PROGRESS', 'Work started', { startedAt: w.startedAt || NOW, startedByStaffId: w.startedByStaffId || CURRENT_STAFF_ID, resolveDueAt: w.resolveDueAt || NOW + w.resolveHours * HOUR, assignmentStartedAt: w.assignmentStartedAt || NOW })}>Start work</Button> : w.status === 'PAUSED' ? <Button className="full" icon={Play} onClick={() => transition('IN_PROGRESS', 'Work resumed', { pauseReason: null, pausedAt: null, assignmentStartedAt: w.assignmentStartedAt || NOW })}>Resume work</Button> : <><Button variant="secondary" icon={Pause} onClick={() => { setPause(true); setReason('') }}>Pause</Button><Button icon={CheckCheck} disabled={done < w.checklist.length} onClick={() => transition('COMPLETED', 'Work completed', { completedAt: NOW, completedByStaffId: CURRENT_STAFF_ID, assignmentCompletedAt: NOW })}>Complete</Button></> : <><span className="read-only-label"><ShieldCheck size={15} />{mpa ? 'This work order has ended' : 'Quick view'}</span><Button variant="secondary" onClick={onClose}>Close</Button></>}</footer>
      {pause && <div className="inner-modal"><div className="pause-dialog"><span className="pause-dialog-icon"><Pause size={24} /></span><h2>Pause this work order?</h2><p>Tell your supervisor why you are pausing this work.</p><label>Pause reason <span>*</span><textarea autoFocus placeholder="For example: Waiting for replacement parts..." maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><small className="char-count">{reason.length}/500</small><div><Button variant="secondary" onClick={() => setPause(false)}>Back</Button><Button disabled={!reason.trim()} onClick={() => { transition('PAUSED', 'Work paused', { pauseReason: reason.trim(), pausedAt: NOW }); setPause(false) }}>Confirm pause</Button></div></div></div>}
      {media && <div className="inner-modal" onClick={() => setMedia(null)}><div className="media-preview"><IconButton label="Close media preview" onClick={() => setMedia(null)}><X /></IconButton><Wrench size={60} strokeWidth={1} /><h3>{media}</h3><p>Demo photo/video for this prototype</p></div></div>}
    </aside></div>
}
