import { PmsDashboard, MpaDashboard } from './DashboardPages.jsx'
import './dashboard-pages.css'
import { useEffect, useState } from 'react'
import { Activity, ArrowDownToLine, Bell, Building2, CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, FileText, MapPin, Pause, Play, Search, ShieldCheck, Wrench, X, Zap } from 'lucide-react'
import { CURRENT_STAFF_ID, HOUR, NOW, PRIORITY, STAFF, STATUS, TICKET_STATUS, dateText, duration, durationBetween, initialData, isOpen, timing } from './data.js'

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
function Select({ value, onChange, children, label, icon: Icon, className = '' }) {
  return <label className={cx('select', className)}>{Icon && <Icon size={15} />}<span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{children}</select><ChevronDown size={14} /></label>
}
function Avatar({ staff, size = '' }) {
  return <span className={cx('avatar', size)} style={{ '--avatar-color': staff.color }}>{staff.initials}</span>
}
function Empty({ title = 'No matching work orders', text = 'Try changing your filters or search term.' }) {
  return <div className="empty"><span><CheckCheck size={28} strokeWidth={1.5} /></span><strong>{title}</strong><p>{text}</p></div>
}
function PortalSwitch({ portal, onChange }) {
  return <div className="portal-switch" aria-label="Choose portal"><button className={portal === 'PMS' ? 'active' : ''} onClick={() => onChange('PMS')}><Building2 size={14} />PMS</button><button className={portal === 'MPA' ? 'active' : ''} onClick={() => onChange('MPA')}><Wrench size={14} />MPA</button></div>
}
function Dialog({ title, subtitle, children, onClose, wide = false }) {
  return <div className="overlay" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-label={title} className={cx('dialog', wide && 'wide')} onMouseDown={e => e.stopPropagation()}><header><div><div className="eyebrow">SMARTOS · MAINTENANCE</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton label="Close" onClick={onClose}><X size={20} /></IconButton></header><div className="dialog-body">{children}</div></section></div>
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
    {listing && <Dialog title={listing.title} subtitle={listing.subtitle} onClose={() => setListing(null)} wide>{listing.kind === 'workflow' ? <WorkflowRunList key={listing.title} listing={listing} runs={workflowRuns} works={works} tickets={tickets} onSelectWork={setSelected} notify={notify} /> : <ReportList key={listing.title} listing={listing} works={works} tickets={tickets} onSelect={setSelected} notify={notify} />}</Dialog>}

    {toast && <div className="toast" role="status"><span><Check size={18} /></span>{toast}</div>}
  </>
}

function ReportList({ listing, works, tickets, onSelect, notify }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [staff, setStaff] = useState('all')
  const [priority, setPriority] = useState('all')
  const [page, setPage] = useState(1)
  const isTicket = listing.kind === 'ticket'
  const ids = new Set(listing.ids)
  const base = (isTicket ? tickets : works).filter(x => ids.has(x.id))
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').replaceAll('Đ', 'D').toLowerCase()
  const items = base.filter(x => (status === 'all' || x.status === status) && (priority === 'all' || x.priority === priority) && (isTicket || staff === 'all' || x.staffId === staff) && normalize([x.code, x.title, x.type, x.location, x.area, isTicket ? '' : pickStaff(x.staffId).name].filter(Boolean).join(' ')).includes(normalize(search)))
  const pages = Math.max(1, Math.ceil(items.length / 8))
  const current = Math.min(page, pages)
  const shown = items.slice((current - 1) * 8, current * 8)
  const resetPage = fn => value => { fn(value); setPage(1) }
  const exportCsv = () => {
    const heading = isTicket ? ['Ticket code', 'Ticket type', 'Location', 'Area', 'Status', 'Submitted at', 'Approved at', 'Resolved at', 'Resolution SLA deadline', 'Response (minutes)', 'Resolution (minutes)', 'SLA results'] : ['WO code', 'Work order title', 'Location', 'Area', 'Current assignee', 'Assignee at completion', 'Status', 'Created at', 'First started at', 'Completed at', 'Resolution SLA deadline', 'Due date', 'Response (minutes)', 'Resolution (minutes)', 'SLA results']
    const outcome = x => {
      const at = isTicket ? x.resolvedAt : x.completedAt
      if (isTicket ? x.status === 'CANCELLED' : x.cancelled) return 'Not assessed (cancelled)'
      if (at != null && x.resolveDueAt != null) return at <= x.resolveDueAt ? 'On time' : 'Late'
      return x.resolveDueAt != null && x.resolveDueAt < NOW ? 'Currently overdue' : 'No outcome yet'
    }
    const rows = [heading, ...items.map(x => isTicket ? [x.code, x.type, x.location, x.area, TICKET_STATUS[x.status].label, dateText(x.submittedAt), dateText(x.approvedAt), dateText(x.resolvedAt), dateText(x.resolveDueAt), durationBetween(x.submittedAt, x.approvedAt) == null ? '' : (x.approvedAt - x.submittedAt) / 60000, durationBetween(x.approvedAt, x.resolvedAt) == null ? '' : (x.resolvedAt - x.approvedAt) / 60000, outcome(x)] : [x.code, x.title, x.location, x.area, pickStaff(x.staffId).name, pickStaff(x.completedByStaffId)?.name || '', STATUS[x.status].label, dateText(x.createdAt), dateText(x.startedAt), dateText(x.completedAt), dateText(x.resolveDueAt), dateText(x.dueDate), x.startedAt ? (x.startedAt - x.createdAt) / 60000 : '', x.completedAt ? (x.completedAt - x.startedAt) / 60000 : '', outcome(x)])]
    const csv = '\uFEFF' + rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a'); link.href = url; link.download = `smartos-${isTicket ? 'ticket' : 'wo'}-report.csv`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    notify(`Exported ${items.length} filtered results`)
  }
  return <><div className="report-toolbar"><label className="search-input"><Search size={15} /><input aria-label="Search report" placeholder="Search code, title, location..." value={search} onChange={e => resetPage(setSearch)(e.target.value)} />{search && <button aria-label="Clear search" onClick={() => resetPage(setSearch)('')}><X size={13} /></button>}</label><Select label="Report status" value={status} onChange={resetPage(setStatus)}><option value="all">All statuses</option>{Object.entries(isTicket ? TICKET_STATUS : STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</Select>{!isTicket && <Select label="Report staff" value={staff} onChange={resetPage(setStaff)}><option value="all">All staff</option>{STAFF.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}<Select label="Report priority" value={priority} onChange={resetPage(setPriority)}><option value="all">All priorities</option>{Object.entries(PRIORITY).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</Select><Button variant="secondary" icon={ArrowDownToLine} disabled={!items.length} onClick={exportCsv}>Export CSV ({items.length})</Button></div><div className="report-result-count"><b>{items.length}</b> / {base.length} results{(search || status !== 'all' || staff !== 'all' || priority !== 'all') && <button onClick={() => { setSearch(''); setStatus('all'); setStaff('all'); setPriority('all'); setPage(1) }}>Clear filters</button>}<span>Export all filtered results across all pages</span></div>{isTicket ? <TicketList items={shown} /> : <WorkTable works={shown} onSelect={onSelect} />}<div className="report-milestone-note"><CalendarDays size={14} />{isTicket ? 'Ticket response: Submitted to Approved. Resolution: Approved to Resolved. The resolution SLA starts at approval.' : 'Resolution SLA starts at the first Start. The separate due date does not affect SLA.'}</div><div className="table-footer"><span>{items.length ? `${(current - 1) * 8 + 1}–${Math.min(current * 8, items.length)}` : '0'} / {items.length} results</span><div className="pagination"><IconButton label="Previous page" disabled={current === 1} onClick={() => setPage(Math.max(1, current - 1))}><ChevronLeft size={16} /></IconButton><span>{current} / {pages}</span><IconButton label="Next page" disabled={current === pages} onClick={() => setPage(Math.min(pages, current + 1))}><ChevronRight size={16} /></IconButton></div></div></>
}

function WorkTable({ works, onSelect }) {
  if (!works.length) return <Empty />
  return <div className="table-scroll"><table className="work-table"><thead><tr><th>WORK ORDER</th><th>LOCATION / AREA</th><th>PRIORITY</th><th>ASSIGNEE</th><th>STATUS</th><th>DEADLINE / SLA</th><th>TIMELINE</th><th /></tr></thead><tbody>{works.map(w => { const t = timing(w); const s = pickStaff(w.staffId); return <tr key={w.id} onClick={() => onSelect(w.id)}><td><button className="code table-link">{w.code}</button><span className="work-title">{w.title}</span></td><td><span className="location-name">{w.location}</span><small className="block muted">{w.area}</small></td><td><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge></td><td><div className="person"><Avatar staff={s} size="tiny" /><span>{s.name.split(' ').slice(-2).join(' ')}</span></div></td><td><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge></td><td><div className={cx('deadline', `text-${t.tone}`)}><Clock3 size={13} />{t.label}</div><small className="block muted">{!w.completedAt && t.due ? `${t.detail} · ` : ''}{w.completedAt ? (w.cancelled ? 'Not assessed' : w.completedAt <= w.resolveDueAt ? 'Within resolution SLA' : 'Outside resolution SLA') : t.due ? dateText(t.due) : t.detail}</small></td><td className="report-duration-cell"><small>Created: {dateText(w.createdAt)}</small><small>Started: {dateText(w.startedAt)}</small>{w.startedAt != null && <b>Response: {duration(w.startedAt - w.createdAt)}</b>}<small>Completed: {dateText(w.completedAt)}</small>{w.completedAt && <b>Resolution: {duration(w.completedAt - w.startedAt)}</b>}</td><td><ChevronRight size={15} className="muted" /></td></tr> })}</tbody></table></div>
}
function TicketList({ items }) {
  if (!items.length) return <Empty title="No matching tickets" />
  return <div className="table-scroll"><table className="ticket-table ticket-duration-table"><thead><tr><th>TICKET CODE</th><th>TICKET TYPE</th><th>LOCATION / AREA</th><th>DESCRIPTION</th><th>STATUS</th><th>SUBMITTED / APPROVED / RESOLVED</th><th>DURATION / RESOLUTION SLA</th></tr></thead><tbody>{items.map(t => { const responseTime = durationBetween(t.submittedAt, t.approvedAt); const resolveTime = durationBetween(t.approvedAt, t.resolvedAt); const overdue = !['RESOLVED', 'CANCELLED'].includes(t.status) && t.resolveDueAt != null && t.resolveDueAt < NOW; return <tr key={t.id}><td><b className="code">{t.code}</b></td><td>{t.type}</td><td>{t.location}<small className="block muted">{t.area}</small></td><td className="ticket-note-cell">{t.note}</td><td><Badge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge></td><td className="report-duration-cell"><small>Submitted: {dateText(t.submittedAt)}</small><small>Approved: {dateText(t.approvedAt)}</small><small>Resolved: {dateText(t.resolvedAt)}</small></td><td className="report-duration-cell"><b>Response: {responseTime == null ? '—' : duration(responseTime)}</b><b>Resolution: {resolveTime == null ? '—' : duration(resolveTime)}</b><small className={overdue ? 'text-red' : 'muted'}>{t.status === 'CANCELLED' ? 'SLA not assessed' : t.resolveDueAt == null ? 'Resolution SLA not started' : `Due: ${dateText(t.resolveDueAt)}`}</small></td></tr> })}</tbody></table></div>
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
