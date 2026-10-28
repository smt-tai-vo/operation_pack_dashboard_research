import React, { useEffect, useRef, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, Building2, CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, FileCheck2, FileText, LayoutDashboard, ListChecks, MapPin, Pause, Play, Search, ShieldCheck, Sparkles, TrendingUp, Users, Wrench, X, Zap } from 'lucide-react'
import { CURRENT_STAFF_ID, HOUR, LOCATIONS, NOW, PRIORITY, STAFF, STATUS, TICKET_STATUS, TYPES, dateText, duration, durationBetween, durationStats, initialData, isFinished, isOpen, slaStats, staffStats, timing } from './data.js'

import TicketInsights from './TicketInsights.jsx'
import { REPORT_PERIODS, dateInputValue, granularityLabel, rangeText, reportPeriod, timeBuckets } from './report-period.js'
import { WorkflowRunList, WorkflowSection } from './Workflow.jsx'
import { initialWorkflowRuns } from './workflow-data.js'

const demo = initialData()
const workflowRuns = initialWorkflowRuns(demo.works, demo.tickets)
const cx = (...names) => names.filter(Boolean).join(' ')
const percent = n => n == null ? '—' : `${n}%`
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
function ReportPeriodSelect({ value, onChange, label = 'Reporting period' }) {
  return <Select label={label} icon={CalendarDays} value={value} onChange={onChange}>{REPORT_PERIODS.map(period => <option key={period.value} value={period.value}>{period.label}</option>)}</Select>
}
function CustomDates({ startDate, endDate, setStartDate, setEndDate, valid }) {
  return <div className="custom-dates"><label>From<input aria-label="Start date" type="date" value={startDate} max={endDate || dateInputValue(NOW)} onChange={event => setStartDate(event.target.value)} /></label><span>→</span><label>To<input aria-label="End date" type="date" value={endDate} min={startDate} max={dateInputValue(NOW)} onChange={event => setEndDate(event.target.value)} /></label>{!valid && <span className="text-red" role="alert">Choose a valid date range</span>}</div>
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
  const [pmsPage, setPmsPage] = useState(window.location.hash === '#reports' ? 'reports' : 'dashboard')
  const [works, setWorks] = useState(demo.works)
  const tickets = demo.tickets
  const [selected, setSelected] = useState(null)
  const [listing, setListing] = useState(null)
  const [toast, setToast] = useState('')
  const [notifications, setNotifications] = useState(false)
  const [help, setHelp] = useState(false)
  const notify = message => { setToast(message); window.setTimeout(() => setToast(''), 3400) }
  const navigate = page => { setPmsPage(page); window.location.hash = page; setSelected(null); setListing(null); window.scrollTo(0, 0) }
  const switchPortal = next => { setPortal(next); window.location.hash = next === 'MPA' ? 'mpa' : pmsPage; setSelected(null); setListing(null); setNotifications(false) }
  useEffect(() => {
    const onHash = () => {
      const page = window.location.hash.slice(1)
      setPortal(page === 'mpa' ? 'MPA' : 'PMS')
      if (page === 'dashboard' || page === 'reports') setPmsPage(page)
      setSelected(null); setListing(null)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { if (selected) setSelected(null); else if (listing) setListing(null); else { setNotifications(false); setHelp(false) } } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, listing])
  useEffect(() => {
    document.body.style.overflow = selected || listing || help ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected, listing, help])
  const updateWork = (id, changes, message) => {
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
      <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span className="brand-symbol"><Zap size={22} fill="currentColor" /></span><strong>smart<span>os</span><i /></strong></a><div className="workspace"><span className="workspace-icon"><Building2 size={18} /></span><div><b>Enouvo Workspace</b><small>Workspace</small></div><ChevronDown size={14} /></div><div className="nav-label">MANAGEMENT</div><nav>
        <button className={pmsPage === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard size={18} />Dashboard{pmsPage === 'dashboard' && <span className="nav-active-dot" />}</button>
        <button className={pmsPage === 'reports' ? 'active' : ''} onClick={() => navigate('reports')}><TrendingUp size={18} />Reports{pmsPage === 'reports' && <span className="nav-active-dot" />}</button>
      </nav><div className="sidebar-bottom"><div className="sidebar-tip"><span><Sparkles size={17} /></span><strong>Operations at a glance.</strong><p>Monitor, coordinate and improve your operations.</p></div><button className="help-link" onClick={() => setHelp(true)}><CircleHelp size={17} />Help & guide<ArrowUpRight size={14} /></button><div className="sidebar-user"><Avatar staff={{ initials: 'LH', color: '#8d9c9c' }} /><div><b>Linh Hoang</b><small>Operations manager</small></div><ShieldCheck size={16} /></div></div></aside>
      <div className="main-shell"><header className="topbar"><div className="breadcrumb"><Building2 size={15} /><span>Operations</span><ChevronRight size={13} /><strong>{pmsPage === 'reports' ? 'Reports' : 'Dashboard'}</strong></div><div className="top-actions">{topbar}</div></header><nav className="mobile-page-nav" aria-label="Operations pages"><button className={pmsPage === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard size={14} />Dashboard</button><button className={pmsPage === 'reports' ? 'active' : ''} onClick={() => navigate('reports')}><TrendingUp size={14} />Reports</button></nav><PmsPages works={works} tickets={tickets} runs={workflowRuns} onList={setListing} page={pmsPage} onNavigate={navigate} /></div>
    </div> : <div className="mpa-shell"><header className="mpa-header"><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-symbol"><Zap size={19} fill="currentColor" /></span><strong>smart<span>os</span><i /></strong><span className="staff-portal-label">STAFF PORTAL</span></a><div className="top-actions">{topbar}</div></header><Mpa works={works} onSelect={setSelected} /></div>}
    {activeWork && <WorkDetail work={activeWork} tickets={tickets} mpa={portal === 'MPA'} onClose={() => setSelected(null)} onUpdate={updateWork} />}
    {listing && <Dialog title={listing.title} subtitle={listing.subtitle} onClose={() => setListing(null)} wide>{listing.kind === 'workflow' ? <WorkflowRunList key={listing.title} listing={listing} runs={workflowRuns} works={works} tickets={tickets} onSelectWork={setSelected} notify={notify} /> : <ReportList key={listing.title} listing={listing} works={works} tickets={tickets} onSelect={setSelected} notify={notify} />}</Dialog>}
    {help && <Dialog title="Explore the dashboard" onClose={() => setHelp(false)}><div className="help-content"><p><b>PMS:</b> Dashboard shows current operations. Reports show period volume, SLA, response and resolution times, ticket types, locations, workflows and staff performance. Select a metric or chart point to open records, refine filters and export CSV. Expand detail tables when needed.</p><p><b>Reporting periods:</b> Calendar weeks start on Monday. Months, quarters and years follow the business calendar in UTC+7. Current periods end at the demo timestamp and compare with the same elapsed time in the previous period, capped at its end. Completed periods compare with the full previous calendar period; custom dates use an immediately preceding interval of equal length.</p><p><b>MPA:</b> Staff see their current priority work and personal results by period. Work to do shows up to four open WOs. Open a WO to view its checklist or update progress.</p><p><b>Staff attribution:</b> Response time belongs to the first technician to start. Resolution time and SLA belong to the assignee at completion. These are WO durations, not per-assignment times.</p><p>All data is a static demo as of 22 Oct 2026, 10:30 (UTC+7). Refresh to reset trial actions.</p></div></Dialog>}

    {toast && <div className="toast" role="status"><span><Check size={18} /></span>{toast}</div>}
  </>
}

function PmsPages({ works, tickets, runs, onList, page, onNavigate }) {
  const isReport = page === 'reports'
  const [location, setLocation] = useState('all')
  const [ticketType, setTicketType] = useState('all')
  const [period, setPeriod] = useState('this-month')
  const [startDate, setStartDate] = useState('2026-10-01')
  const [endDate, setEndDate] = useState('2026-10-22')
  const [showStaff, setShowStaff] = useState(false)
  const report = reportPeriod(period, { startDate, endDate, now: NOW })
  const { from, to, valid: validRange, previousFrom, previousTo, granularity, rangeLabel } = report
  const inRange = at => validRange && at != null && at >= from && at <= to
  const visibleTickets = tickets.filter(t => (location === 'all' || t.location === location) && (ticketType === 'all' || t.type === ticketType))
  const ticketIds = new Set(visibleTickets.map(t => t.id))
  const visibleWorks = works.filter(w => (location === 'all' || w.location === location) && (ticketType === 'all' || w.ticketIds.some(id => ticketIds.has(id))))
  const visibleRuns = runs.filter(run => (location === 'all' || run.location === location) && (ticketType === 'all' || run.ticketType === ticketType))
  const newTickets = visibleTickets.filter(t => inRange(t.createdAt))
  const ticketTimes = durationStats(visibleTickets, 'ticket', from, to)
  const workTimes = durationStats(visibleWorks, 'work', from, to)
  const resolved = ticketTimes.resolves
  const newWorks = visibleWorks.filter(w => inRange(w.createdAt))
  const completed = workTimes.resolves
  const openTickets = visibleTickets.filter(t => !['RESOLVED', 'CANCELLED'].includes(t.status))
  const openWorks = visibleWorks.filter(isOpen)
  const ready = visibleTickets.filter(t => t.status === 'IN_PROGRESS' && t.ready)
  const lateTickets = openTickets.filter(t => t.resolveDueAt != null && t.resolveDueAt < NOW)
  const soonTickets = openTickets.filter(t => t.resolveDueAt != null && t.resolveDueAt >= NOW && t.resolveDueAt <= NOW + 4 * HOUR)
  const lateWorks = openWorks.filter(w => timing(w).tone === 'red')
  const soonWorks = openWorks.filter(w => timing(w).tone === 'amber')
  const workSla = slaStats(completed)
  const ticketSla = slaStats(resolved, 'ticket')
  const staff = STAFF.map(s => ({ ...s, ...staffStats(visibleWorks, s.id, from, to) }))
  const contextLabel = `${location === 'all' ? 'All locations' : location} · ${ticketType === 'all' ? 'All ticket types' : ticketType}`
  const list = (title, items, kind = 'work', current = false, customRange) => onList({ title, ids: items.map(x => x.id), kind, subtitle: `${contextLabel} · ${current ? 'Current · 22 Oct 2026, 10:30' : customRange || rangeLabel}` })
  const previousTickets = visibleTickets.filter(t => validRange && t.createdAt >= previousFrom && t.createdAt <= previousTo)
  const previousWorks = visibleWorks.filter(w => validRange && w.createdAt >= previousFrom && w.createdAt <= previousTo)
  const monitorRow = (label, items, kind, icon, tone, hint, title = label) => <button className="monitor-row" onClick={() => list(title, items, kind, true)}><span className={cx('monitor-icon', tone)}>{React.createElement(icon, { size: 16 })}</span><span className="monitor-label">{label}{hint && <small>{hint}</small>}</span><strong>{items.length}</strong><ChevronRight size={15} /></button>
  return <main className="page dashboard reference-dashboard">
    <div className="dashboard-title"><div><h1>{isReport ? 'Operations reports' : 'Dashboard'}</h1><span>Ticket · Work order · Workflow</span></div><div className="live-label"><i />Demo as of 22 Oct 2026, 10:30 · UTC+7</div></div>
    <p className="page-intro">{isReport ? 'Review volume, SLA, staff performance and workflow results by period.' : 'See current operations and prioritize tickets, work orders and workflows.'}</p>
    <div className="filter-bar"><div className="filter-left"><Select label="Location" icon={MapPin} value={location} onChange={setLocation}><option value="all">All locations</option>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</Select><Select label="Ticket type" value={ticketType} onChange={setTicketType}><option value="all">All ticket types</option>{TYPES.map(t => <option key={t}>{t}</option>)}</Select>{(location !== 'all' || ticketType !== 'all') && <button className="reset-link" onClick={() => { setLocation('all'); setTicketType('all') }}>Reset<X size={12} /></button>}</div>{isReport ? <div className="filter-right"><span>Reporting period</span><ReportPeriodSelect value={period} onChange={setPeriod} /></div> : <Button variant="secondary" icon={TrendingUp} onClick={() => onNavigate('reports')}>View reports</Button>}</div>
    {isReport && period === 'custom' && <CustomDates startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} valid={validRange} />}

    {isReport ? <section id="performance" className="report-section" aria-label="Operations reports">
      <div className="section-caption"><span><TrendingUp size={14} />PERIOD PERFORMANCE</span><small title={report.comparisonLabel}>{rangeLabel}{report.partial ? ' · To date' : ''} · UTC+7</small></div>
      <div className="report-overview-grid">
        <ReportOverview title="Ticket request" kind="ticket" created={newTickets} stats={ticketTimes} sla={ticketSla} onList={list} comparison={{ previous: previousTickets, from: previousFrom, to: previousTo, valid: validRange, label: report.comparisonLabel }} />
        <ReportOverview title="Work order" kind="work" created={newWorks} stats={workTimes} sla={workSla} onList={list} comparison={{ previous: previousWorks, from: previousFrom, to: previousTo, valid: validRange, label: report.comparisonLabel }} />
      </div>
      <div className="report-trend">
        <section className="card trend-card"><div className="section-heading"><div><h2>Tickets received & resolved</h2><p>{granularityLabel(granularity)} · Select a chart point to view tickets</p></div><TrendingUp size={17} className="muted" /></div><TrendChart tickets={visibleTickets} from={from} to={to} granularity={granularity} onPoint={(start, end, key) => list(key === 'created' ? 'New tickets by interval' : 'Resolved tickets by interval', (key === 'created' ? visibleTickets : resolved).filter(t => { const at = key === 'created' ? t.createdAt : t.resolvedAt; return at != null && at >= start && at <= end }), 'ticket', false, rangeText(start, end))} /><div className="chart-legend"><span><i className="blue" />New tickets</span><span><i className="green" />Resolved tickets</span></div></section>

      </div>
      <TicketInsights tickets={visibleTickets} from={from} to={to} scopeLabel={contextLabel} rangeLabel={rangeLabel} comparison={report} onList={onList} />
      <WorkflowSection runs={visibleRuns} works={works} report from={from} to={to} granularity={granularity} scopeLabel={contextLabel} rangeLabel={rangeLabel} onList={onList} />
      <section className="card staff-report" id="staff"><button className="staff-report-toggle" aria-expanded={showStaff} onClick={() => setShowStaff(!showStaff)}><span className="summary-icon blue"><Users size={18} /></span><span><b>Staff performance</b><small>{STAFF.length} staff · Current workload and completed work in period</small></span><span className="staff-preview">{completed.length} completed WOs</span><ChevronDown size={17} className={showStaff ? 'rotated' : ''} /></button>{showStaff && <><div className="table-scroll"><table className="staff-table"><thead><tr><th>STAFF</th><th>ASSIGNED OPEN</th><th>OVERDUE WOs</th><th>COMPLETED IN PERIOD</th><th>RESOLUTION SLA</th><th>AVG RESPONSE</th><th>AVG RESOLUTION</th></tr></thead><tbody>{staff.map(s => <tr key={s.id}><td><span className="person"><Avatar staff={s} size="tiny" />{s.name}</span></td><td><button className="metric-link" onClick={() => list(`Assigned open WOs · ${s.name}`, s.open, 'work', true)}>{s.open.length}</button></td><td><button className="metric-link text-red" onClick={() => list(`Overdue WOs · ${s.name}`, s.open.filter(w => timing(w).tone === 'red'), 'work', true)}>{s.open.filter(w => timing(w).tone === 'red').length}</button></td><td><button className="metric-link" onClick={() => list(`completed WOs · ${s.name}`, s.completed)}>{s.completed.length}</button></td><td><button className="sla-result-link" onClick={() => list(`SLA results · ${s.name}`, s.completed)}><SlaCell value={s.resolve} n={s.resolveN} /></button></td><td><button className="staff-time-link" onClick={() => list(`Response time · ${s.name}`, s.responses)}>{s.responseTime == null ? '—' : duration(s.responseTime)}<small>{s.responses.length} WOs first started in period</small></button></td><td><button className="staff-time-link" onClick={() => list(`Resolution time · ${s.name}`, s.completed)}>{s.resolveTime == null ? '—' : duration(s.resolveTime)}<small>{s.completed.length} completed WOs in period</small></button></td></tr>)}</tbody></table></div><div className="sla-note"><CircleHelp size={13} /><span>Response is attributed to the first technician to start; resolution and SLA to the assignee at completion. These are WO durations, not time per assignment.</span></div></>}</section>
    </section> : <>
    <div className="section-caption"><span><span className="live-small" />CURRENT OPERATIONS</span><small>Within the selected location and ticket type</small></div>
    <div className="dashboard-block-grid" id="attention">
      {[
        { title: 'Ticket requests', items: openTickets, groups: ['SUBMITTED', 'APPROVED', 'IN_PROGRESS'], labels: TICKET_STATUS, kind: 'ticket', icon: FileText, tone: 'blue', listTitle: 'Open tickets' },
        { title: 'Work orders', items: openWorks, groups: ['TO_DO', 'IN_PROGRESS', 'PAUSED'], labels: STATUS, kind: 'work', icon: Wrench, tone: 'violet', listTitle: 'Open work orders' },
      ].map(group => <section className="card dashboard-block" key={group.kind} aria-label={group.title}>
        <header className="dashboard-block-heading"><span className={cx('monitor-icon', group.tone)}><group.icon size={18} /></span><h2>{group.title}</h2><button className="dashboard-total" aria-label={`${group.listTitle}: ${group.items.length}`} onClick={() => list(group.listTitle, group.items, group.kind, true)}><span>Open</span><strong>{group.items.length}</strong><ChevronRight size={16} /></button></header>
        <div className="dashboard-status-row" aria-label={`${group.title} by status`}>{group.groups.map(key => {
          const items = group.items.filter(item => item.status === key)
          return <button key={key} onClick={() => list(`${group.title} · ${group.labels[key].label}`, items, group.kind, true)}><span><i className={group.labels[key].tone} />{group.labels[key].label}</span><strong>{items.length}</strong></button>
        })}</div>
        <div className="dashboard-priorities">{group.kind === 'ticket' ? <>
          {monitorRow('Overdue', lateTickets, 'ticket', Clock3, 'red', null, 'Overdue tickets')}
          {monitorRow('Due soon', soonTickets, 'ticket', Clock3, 'amber', 'Next 4 hours', 'Tickets due soon')}
          {monitorRow('Ready to resolve', ready, 'ticket', FileCheck2, 'green', null, 'Tickets ready to resolve')}
        </> : <>
          {monitorRow('Overdue', lateWorks, 'work', Clock3, 'red', null, 'Overdue WOs')}
          {monitorRow('Due soon', soonWorks, 'work', Clock3, 'amber', 'Next 4 hours', 'WOs due soon')}
        </>}</div>
      </section>)}
    </div>
    <WorkflowSection runs={visibleRuns} works={works} report={false} from={from} to={to} scopeLabel={contextLabel} rangeLabel={rangeLabel} onList={onList} />
    </>}
    <footer className="page-footer"><span>SmartOS · Operation Pack</span><span>Prototype · Demo data</span></footer>
  </main>
}

function SlaDonut({ value }) {
  return <span className="overview-sla-donut"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="#e9edf4" strokeWidth="8" /><circle cx="50" cy="50" r="42" fill="none" stroke="#299b80" strokeWidth="8" pathLength="100" strokeDasharray={`${value ?? 0} 100`} transform="rotate(-90 50 50)" /></svg><span><strong>{percent(value)}</strong><small>{value == null ? 'No data yet' : 'on time'}</small></span></span>
}

function ReportOverview({ title, kind, created, stats, sla, onList, comparison }) {
  const isTicket = kind === 'ticket'
  const createdLabel = isTicket ? 'Submitted' : 'Created'
  const completedLabel = isTicket ? 'Resolved' : 'Completed'
  const resolved = stats.resolves
  const onTime = resolved.filter(item => item.resolveDueAt != null && (isTicket ? item.resolvedAt : item.completedAt) <= item.resolveDueAt)
  const late = resolved.filter(item => item.resolveDueAt != null && (isTicket ? item.resolvedAt : item.completedAt) > item.resolveDueAt)
  const assessed = [...onTime, ...late]
  const change = comparison?.previous.length ? Math.round((created.length - comparison.previous.length) / comparison.previous.length * 100) : null
  const metrics = [
    { label: 'Avg response', value: stats.averageResponseTime, items: stats.responses, caption: isTicket ? 'Submitted → Approved' : 'Created → First start' },
    { label: 'Avg resolution', value: stats.averageResolveTime, items: resolved, caption: isTicket ? 'Approved → Resolved' : 'First start → Completed' },
  ]
  return <section className="card report-overview" aria-label={`Overview ${title}`}>
    <header><span className={cx('monitor-icon', isTicket ? 'blue' : 'violet')}>{isTicket ? <FileText size={17} /> : <Wrench size={17} />}</span><h2>{title}</h2><span>In period</span></header>
    <div className="overview-body"><div className="overview-volume">
      <div><button onClick={() => onList(`${title} ${createdLabel.toLowerCase()} in period`, created, kind)}><span>{createdLabel}<ChevronRight size={12} /></span><strong>{created.length}</strong></button>{comparison && <button className="volume-comparison" disabled={!comparison.valid} title={comparison.label} onClick={() => onList(`${title} ${createdLabel.toLowerCase()} in the previous period`, comparison.previous, kind, false, comparison.label)}>{change == null ? 'No prior data' : `${change > 0 ? '+' : ''}${change}% vs previous period`}<ChevronRight size={10} /></button>}</div>
      <div><button onClick={() => onList(`${title} ${completedLabel.toLowerCase()} in period`, resolved, kind)}><span>{completedLabel}<ChevronRight size={12} /></span><strong>{resolved.length}</strong></button></div>
    </div>
    <div className="overview-sla"><button className="overview-sla-total" aria-label={`Resolution SLA · ${title}: ${sla.resolve == null ? 'No data yet' : `${sla.resolve}% on time`}. View ${assessed.length} results`} onClick={() => onList(`Resolution SLA results · ${title}`, assessed, kind)}><span className="overview-sla-label">Resolution SLA<ChevronRight size={12} /></span><SlaDonut value={sla.resolve} /></button><div><button onClick={() => onList(`Within resolution SLA · ${title}`, onTime, kind)}><i className="green" />On time<b>{onTime.length}</b></button><button onClick={() => onList(`Outside resolution SLA · ${title}`, late, kind)}><i className="red" />Late<b>{late.length}</b></button></div></div>
    <div className="overview-times">{metrics.map(metric => <button key={metric.label} title={`${metric.label}: ${metric.caption}`} onClick={() => onList(`${metric.label} · ${title}`, metric.items, kind)}><span>{metric.label}<ChevronRight size={12} /></span><strong>{metric.value == null ? '—' : duration(metric.value)}</strong></button>)}</div></div>
    <details className="overview-definition"><summary>Metric definitions<CircleHelp size={12} /></summary><p>New volume uses the creation date; {completedLabel.toLowerCase()} and SLA use the date of {isTicket ? 'Resolved' : 'Completed'}. Average response uses {stats.responses.length} {isTicket ? 'approved tickets' : 'WOs first started'} in period; average resolution uses {resolved.length} {isTicket ? 'resolved tickets' : 'completed WOs'} in period. Cancelled records and missing or invalid timestamps are excluded. {isTicket ? 'Resolution SLA: Approved → Resolved.' : 'Resolution SLA: First start → Completed, including pauses; the due date is independent.'}</p></details>
  </section>
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
  return <div className="table-scroll"><table className="work-table"><thead><tr><th>WORK ORDER</th><th>LOCATION / AREA</th><th>PRIORITY</th><th>ASSIGNEE</th><th>STATUS</th><th>RESOLUTION SLA</th><th>TIMELINE</th><th /></tr></thead><tbody>{works.map(w => { const t = timing(w); const s = pickStaff(w.staffId); return <tr key={w.id} onClick={() => onSelect(w.id)}><td><button className="code table-link">{w.code}</button><span className="work-title">{w.title}</span></td><td><span className="location-name">{w.location}</span><small className="block muted">{w.area}</small></td><td><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge></td><td><div className="person"><Avatar staff={s} size="tiny" /><span>{s.name.split(' ').slice(-2).join(' ')}</span></div></td><td><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge></td><td><div className={cx('deadline', `text-${t.tone}`)}><Clock3 size={13} />{t.label}</div><small className="block muted">{w.completedAt ? (w.cancelled ? 'Not assessed' : w.completedAt <= w.resolveDueAt ? 'Within resolution SLA' : 'Outside resolution SLA') : t.due ? dateText(t.due) : t.detail}</small></td><td className="report-duration-cell"><small>Created: {dateText(w.createdAt)}</small><small>Started: {dateText(w.startedAt)}</small>{w.startedAt != null && <b>Response: {duration(w.startedAt - w.createdAt)}</b>}<small>Completed: {dateText(w.completedAt)}</small>{w.completedAt && <b>Resolution: {duration(w.completedAt - w.startedAt)}</b>}</td><td><ChevronRight size={15} className="muted" /></td></tr> })}</tbody></table></div>
}
function TicketList({ items }) {
  if (!items.length) return <Empty title="No matching tickets" />
  return <div className="table-scroll"><table className="ticket-table ticket-duration-table"><thead><tr><th>TICKET CODE</th><th>TICKET TYPE</th><th>LOCATION / AREA</th><th>DESCRIPTION</th><th>STATUS</th><th>SUBMITTED / APPROVED / RESOLVED</th><th>DURATION / RESOLUTION SLA</th></tr></thead><tbody>{items.map(t => { const responseTime = durationBetween(t.submittedAt, t.approvedAt); const resolveTime = durationBetween(t.approvedAt, t.resolvedAt); const overdue = !['RESOLVED', 'CANCELLED'].includes(t.status) && t.resolveDueAt != null && t.resolveDueAt < NOW; return <tr key={t.id}><td><b className="code">{t.code}</b></td><td>{t.type}</td><td>{t.location}<small className="block muted">{t.area}</small></td><td className="ticket-note-cell">{t.note}</td><td><Badge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge></td><td className="report-duration-cell"><small>Submitted: {dateText(t.submittedAt)}</small><small>Approved: {dateText(t.approvedAt)}</small><small>Resolved: {dateText(t.resolvedAt)}</small></td><td className="report-duration-cell"><b>Response: {responseTime == null ? '—' : duration(responseTime)}</b><b>Resolution: {resolveTime == null ? '—' : duration(resolveTime)}</b><small className={overdue ? 'text-red' : 'muted'}>{t.status === 'CANCELLED' ? 'SLA not assessed' : t.resolveDueAt == null ? 'Resolution SLA not started' : `Due: ${dateText(t.resolveDueAt)}`}</small></td></tr> })}</tbody></table></div>
}
function TrendChart({ tickets, from, to, granularity = 'day', onPoint }) {
  const chartRef = useRef(null)
  const [size, setSize] = useState({ width: 710, height: 215 })
  const resolved = durationStats(tickets, 'ticket', from, to).resolves
  const points = timeBuckets(from, to, granularity).map(bucket => ({
    ...bucket, created: tickets.filter(ticket => ticket.createdAt >= bucket.start && ticket.createdAt <= bucket.end).length,
    resolved: resolved.filter(ticket => ticket.resolvedAt >= bucket.start && ticket.resolvedAt <= bucket.end).length,
  }))
  const hasPoints = points.length > 0
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(chart)
    return () => observer.disconnect()
  }, [hasPoints])
  if (!points.length) return <Empty title="Choose a valid reporting period" text="Set a start date on or before the end date." />
  const max = Math.max(4, ...points.map(point => Math.max(point.created, point.resolved)))
  const baseline = size.height - 40
  const labelStep = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor((size.width - 75) / 90))))
  const px = index => 45 + index / Math.max(1, points.length - 1) * (size.width - 75)
  const py = count => baseline - count / max * (size.height - 75)
  const line = key => points.map((point, index) => `${index ? 'L' : 'M'}${px(index)},${py(point[key])}`).join(' ')
  return <div className="trend-chart" data-granularity={granularity}><svg ref={chartRef} viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label={`${granularityLabel(granularity)} new and resolved tickets`}><defs><linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#547ce4" stopOpacity=".16" /><stop offset="1" stopColor="#547ce4" stopOpacity="0" /></linearGradient></defs>{[0, 1, 2, 3].map(index => <g key={index}><line x1="45" x2={size.width - 30} y1={py(index * max / 3)} y2={py(index * max / 3)} stroke="#edf0f5" strokeDasharray="4 4" /><text x="24" y={py(index * max / 3) + 4} textAnchor="end">{Math.round(index * max / 3)}</text></g>)}<path d={`${line('created')} L${px(points.length - 1)},${baseline} L45,${baseline}Z`} fill="url(#trendGradient)" /><path d={line('created')} fill="none" stroke="#5078df" strokeWidth="2.7" strokeLinejoin="round" /><path d={line('resolved')} fill="none" stroke="#26a28f" strokeWidth="2.7" strokeLinejoin="round" />{points.map((point, index) => <g key={point.start}>{['created', 'resolved'].map(key => <g key={key} role="button" tabIndex={0} aria-label={`${rangeText(point.start, point.end)}: ${point[key]} ${key === 'created' ? 'new' : 'resolved'} tickets`} onClick={() => onPoint?.(point.start, point.end, key)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPoint?.(point.start, point.end, key) } }} className="chart-point"><circle cx={px(index)} cy={py(point[key])} r="9" fill="transparent" /><circle cx={px(index)} cy={py(point[key])} r={points.length <= 7 ? 3.5 : 2.3} fill="#fff" stroke={key === 'created' ? '#5078df' : '#26a28f'} strokeWidth="2" pointerEvents="none" /><title>{rangeText(point.start, point.end)}: {point[key]} {key === 'created' ? 'new' : 'resolved'} tickets</title></g>)}{(index === points.length - 1 || (index % labelStep === 0 && points.length - 1 - index >= labelStep / 2)) && <text x={px(index)} y={size.height - 10} textAnchor="middle">{point.label}</text>}</g>)}</svg></div>
}

function SlaLine({ label, value, n, color }) {
  return <div className="sla-line"><span><i className={color} />{label}</span><div><b>{percent(value)}</b><small>{n} assessed results</small></div></div>
}
function SlaCell({ value, n }) {
  return <div className="sla-cell"><div><strong className={value == null ? 'muted' : value >= 80 ? 'text-green' : value >= 60 ? 'text-amber' : 'text-red'}>{percent(value)}</strong><small>{n} WOs</small></div><i><span className={value >= 80 ? 'green' : value >= 60 ? 'amber' : 'red'} style={{ width: `${value || 0}%` }} /></i></div>
}

function Mpa({ works, onSelect }) {
  const [period, setPeriod] = useState('this-month')
  const [startDate, setStartDate] = useState('2026-10-01')
  const [endDate, setEndDate] = useState(dateInputValue(NOW))
  const report = reportPeriod(period, { startDate, endDate, now: NOW })
  const stats = staffStats(works, CURRENT_STAFF_ID, report.from, report.to)
  const priorityRank = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const needsAttention = stats.open.slice().sort((a, b) => {
    const urgencyRank = w => ({ red: 0, amber: 1 }[timing(w).tone] ?? 2)
    return urgencyRank(a) - urgencyRank(b) || priorityRank[a.priority] - priorityRank[b.priority] || timing(a).due - timing(b).due
  }).slice(0, 4)
  return <main className="mpa-page">
    <div className="mpa-greeting"><div><div className="eyebrow">MY OVERVIEW</div><h1>My performance<span className="heading-dot">.</span></h1><p>Track your work and SLA performance.</p></div><ReportPeriodSelect label="Personal reporting period" value={period} onChange={setPeriod} /></div>
      {period === 'custom' && <CustomDates startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} valid={report.valid} />}
      <div className="personal-summary"><span><CalendarDays size={15} />{report.rangeLabel}{report.partial ? ' · To date' : ''}</span><Badge tone="blue">{STAFF[0].name}</Badge></div>
      <section className="mpa-attention"><div className="mobile-section-heading"><div><h2>Work to do<span className="count-pill">{stats.open.length}</span></h2><p>Overdue, due soon and urgent work first · Showing {needsAttention.length}/{stats.open.length} assigned open WOs.</p></div><Zap size={18} className="text-amber" /></div><div className="priority-work-grid">{needsAttention.map(w => <WorkCard key={w.id} work={w} onClick={() => onSelect(w.id)} urgent />)}</div>{!needsAttention.length && <Empty title="You are all caught up" text="New assignments will appear here." />}</section>
      <div className="personal-kpis"><div className="card"><small>Assignments</small><strong>{stats.assigned.length}</strong><span>Assigned during the period</span></div><div className="card"><small>Completed</small><strong className="text-green">{stats.completed.length}</strong><span>Completed during the period</span></div><div className="card"><small>Assigned open</small><strong>{stats.open.length}</strong><span>Currently open work orders</span></div></div>
      <section className="card personal-sla"><div className="section-heading"><div><h2>Work performance</h2><p>Resolution SLA runs from first start to completion.</p></div><ShieldCheck size={21} className="text-green" /></div><div className="personal-sla-grid"><div><span className="personal-reference">Average response time</span><small>Created to first start</small><strong>{stats.responseTime == null ? '—' : duration(stats.responseTime)}</strong></div><div><SlaLine label="Resolution SLA" value={stats.resolve} n={stats.resolveN} color="green" /><small>Average resolution time</small><strong>{stats.resolveTime == null ? '—' : duration(stats.resolveTime)}</strong></div></div><div className="sla-note"><CircleHelp size={14} />Cancelled work is excluded; pauses count toward elapsed time.</div></section>

    <footer className="page-footer"><span>SmartOS · Staff Portal</span><span>Demo data</span></footer>
  </main>
}
function WorkCard({ work: w, onClick, urgent }) {
  const t = timing(w), done = w.checklist.filter(x => x.checked).length
  return <button className={cx('work-card', urgent && 'urgent', t.tone === 'red' && urgent && 'overdue-card')} onClick={onClick}><div className="work-card-header"><span className="code">{w.code}</span><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge></div><h3>{w.title}</h3><div className="card-location"><MapPin size={14} /><span>{w.location}<small>{w.area}</small></span>{w.ticketIds.length > 1 && <b>{w.ticketIds.length} ticket</b>}</div><div className="work-card-tags"><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge><span className={cx('deadline', `text-${t.tone}`)}><Clock3 size={13} />{t.label}</span></div><div className="check-progress"><div><span>Checklist</span><b>{done}/{w.checklist.length} steps</b></div><i><span style={{ width: `${w.checklist.length ? done / w.checklist.length * 100 : 0}%` }} /></i></div><div className="work-card-bottom"><span>Assigned {dateText(w.assignedAt)}</span><ArrowRight size={15} /></div></button>
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
    </div><footer className="drawer-footer">{canAct ? w.status === 'TO_DO' ? <Button className="full" icon={Play} onClick={() => transition('IN_PROGRESS', 'Work started', { startedAt: w.startedAt || NOW, startedByStaffId: w.startedByStaffId || CURRENT_STAFF_ID, resolveDueAt: w.resolveDueAt || NOW + w.resolveHours * HOUR, assignmentStartedAt: w.assignmentStartedAt || NOW })}>Start work</Button> : w.status === 'PAUSED' ? <Button className="full" icon={Play} onClick={() => transition('IN_PROGRESS', 'Work resumed', { pauseReason: null, assignmentStartedAt: w.assignmentStartedAt || NOW })}>Resume work</Button> : <><Button variant="secondary" icon={Pause} onClick={() => { setPause(true); setReason('') }}>Pause</Button><Button icon={CheckCheck} disabled={done < w.checklist.length} onClick={() => transition('COMPLETED', 'Work completed', { completedAt: NOW, completedByStaffId: CURRENT_STAFF_ID, assignmentCompletedAt: NOW })}>Complete</Button></> : <><span className="read-only-label"><ShieldCheck size={15} />{mpa ? 'This work order has ended' : 'Quick view'}</span><Button variant="secondary" onClick={onClose}>Close</Button></>}</footer>
      {pause && <div className="inner-modal"><div className="pause-dialog"><span className="pause-dialog-icon"><Pause size={24} /></span><h2>Pause this work order?</h2><p>Tell your supervisor why you are pausing this work.</p><label>Pause reason <span>*</span><textarea autoFocus placeholder="For example: Waiting for replacement parts..." maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><small className="char-count">{reason.length}/500</small><div><Button variant="secondary" onClick={() => setPause(false)}>Back</Button><Button disabled={!reason.trim()} onClick={() => { transition('PAUSED', 'Work paused', { pauseReason: reason.trim() }); setPause(false) }}>Confirm pause</Button></div></div></div>}
      {media && <div className="inner-modal" onClick={() => setMedia(null)}><div className="media-preview"><IconButton label="Close media preview" onClick={() => setMedia(null)}><X /></IconButton><Wrench size={60} strokeWidth={1} /><h3>{media}</h3><p>Demo photo/video for this prototype</p></div></div>}
    </aside></div>
}
