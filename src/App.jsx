import React, { useEffect, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, Building2, CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, FileCheck2, FileText, LayoutDashboard, ListChecks, MapPin, Pause, Play, Search, ShieldCheck, Sparkles, TrendingUp, Users, Wrench, X, Zap } from 'lucide-react'
import { CURRENT_STAFF_ID, DAY, HOUR, LOCATIONS, NOW, PRIORITY, STAFF, STATUS, TICKET_STATUS, TYPES, dateText, dayText, duration, initialData, isFinished, isOpen, percentage, slaStats, staffStats, timing } from './data.js'

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
function Avatar({ staff, size = '' }) {
  return <span className={cx('avatar', size)} style={{ '--avatar-color': staff.color }}>{staff.initials}</span>
}
function Empty({ title = 'Không có công việc phù hợp', text = 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' }) {
  return <div className="empty"><span><CheckCheck size={28} strokeWidth={1.5} /></span><strong>{title}</strong><p>{text}</p></div>
}
function PortalSwitch({ portal, onChange }) {
  return <div className="portal-switch" aria-label="Chọn portal"><button className={portal === 'PMS' ? 'active' : ''} onClick={() => onChange('PMS')}><Building2 size={14} />PMS</button><button className={portal === 'MPA' ? 'active' : ''} onClick={() => onChange('MPA')}><Wrench size={14} />MPA</button></div>
}
function Dialog({ title, subtitle, children, onClose, wide = false }) {
  return <div className="overlay" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-label={title} className={cx('dialog', wide && 'wide')} onMouseDown={e => e.stopPropagation()}><header><div><div className="eyebrow">SMARTOS · BẢO TRÌ</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton label="Đóng" onClick={onClose}><X size={20} /></IconButton></header><div className="dialog-body">{children}</div></section></div>
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
    <span className="demo-label"><span />BẢN XEM THỬ</span>
    <PortalSwitch portal={portal} onChange={switchPortal} />
    <div className="topbar-divider" />
    <div className="notification-wrap"><IconButton label="Thông báo" className="bell-button" onClick={() => setNotifications(!notifications)}><Bell size={19} />{myNotifications.length > 0 && <i />}</IconButton>{notifications && <div className="notifications"><strong>Công việc cần chú ý</strong>{myNotifications.map(w => <button key={w.id} onClick={() => { setSelected(w.id); setNotifications(false) }}><span className="notification-icon"><Clock3 size={17} /></span><span><b>{w.code}</b><small>{w.title}</small><em>{timing(w).label}</em></span><ChevronRight size={16} /></button>)}{!myNotifications.length && <p>Bạn đã xử lý hết việc cần chú ý.</p>}</div>}</div>
    <Avatar staff={portal === 'MPA' ? STAFF[0] : { initials: 'LH', color: '#83919d' }} size="small" />
  </>
  return <>
    {portal === 'PMS' ? <div className="app-shell">
      <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span className="brand-symbol"><Zap size={22} fill="currentColor" /></span><strong>smart<span>os</span><i /></strong></a><div className="workspace"><span className="workspace-icon"><Building2 size={18} /></span><div><b>Enouvo Workspace</b><small>Không gian làm việc</small></div><ChevronDown size={14} /></div><div className="nav-label">KHÔNG GIAN QUẢN LÝ</div><nav>
        <button className={pmsPage === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard size={18} />Dashboard{pmsPage === 'dashboard' && <span className="nav-active-dot" />}</button>
        <button className={pmsPage === 'reports' ? 'active' : ''} onClick={() => navigate('reports')}><TrendingUp size={18} />Báo cáo{pmsPage === 'reports' && <span className="nav-active-dot" />}</button>
      </nav><div className="sidebar-bottom"><div className="sidebar-tip"><span><Sparkles size={17} /></span><strong>Mọi việc trong tầm tay.</strong><p>Theo dõi, điều phối và nâng cao chất lượng vận hành.</p></div><button className="help-link" onClick={() => setHelp(true)}><CircleHelp size={17} />Hướng dẫn sử dụng<ArrowUpRight size={14} /></button><div className="sidebar-user"><Avatar staff={{ initials: 'LH', color: '#8d9c9c' }} /><div><b>Linh Hoàng</b><small>Quản lý vận hành</small></div><ShieldCheck size={16} /></div></div></aside>
      <div className="main-shell"><header className="topbar"><div className="breadcrumb"><Building2 size={15} /><span>Vận hành</span><ChevronRight size={13} /><strong>{pmsPage === 'reports' ? 'Báo cáo' : 'Dashboard'}</strong></div><div className="top-actions">{topbar}</div></header><nav className="mobile-page-nav" aria-label="Trang vận hành"><button className={pmsPage === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard size={14} />Dashboard</button><button className={pmsPage === 'reports' ? 'active' : ''} onClick={() => navigate('reports')}><TrendingUp size={14} />Báo cáo</button></nav><PmsPages works={works} tickets={tickets} runs={workflowRuns} onList={setListing} page={pmsPage} onNavigate={navigate} /></div>
    </div> : <div className="mpa-shell"><header className="mpa-header"><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-symbol"><Zap size={19} fill="currentColor" /></span><strong>smart<span>os</span><i /></strong><span className="staff-portal-label">STAFF PORTAL</span></a><div className="top-actions">{topbar}</div></header><Mpa works={works} onSelect={setSelected} /></div>}
    {activeWork && <WorkDetail work={activeWork} tickets={tickets} mpa={portal === 'MPA'} onClose={() => setSelected(null)} onUpdate={updateWork} />}
    {listing && <Dialog title={listing.title} subtitle={listing.subtitle} onClose={() => setListing(null)} wide>{listing.kind === 'workflow' ? <WorkflowRunList key={listing.title} listing={listing} runs={workflowRuns} works={works} tickets={tickets} onSelectWork={setSelected} notify={notify} /> : <ReportList key={listing.title} listing={listing} works={works} tickets={tickets} onSelect={setSelected} notify={notify} />}</Dialog>}
    {help && <Dialog title="Khám phá dashboard" onClose={() => setHelp(false)}><div className="help-content"><p><b>PMS:</b> trang Dashboard theo dõi hiện tại; trang Báo cáo xem kết quả theo kỳ, SLA và nhân viên. Bấm số liệu hoặc từng dòng để mở danh sách, tìm kiếm, lọc thêm và xuất CSV. Workflow có biểu đồ kết quả theo ngày, nhóm lượt chạy chờ/lỗi và chi tiết ticket/WO liên quan.</p><p><b>MPA:</b> chuyển portal để xem dashboard kết quả của An, số việc đang phụ trách và SLA cá nhân theo kỳ. Mục WO cần làm ưu tiên tối đa 4 việc đang mở; bấm để xem checklist và thao tác.</p><p><b>SLA nhân viên:</b> kết quả WO được ghi nhận theo người được giao lúc hoàn thành. SLA xử lý tính từ lần bắt đầu đầu tiên; thời gian chờ hiển thị riêng.</p><p>Dữ liệu là ví dụ tại ngày 22/10/2026. Tải lại trang để đặt lại các thao tác thử.</p></div></Dialog>}
    {toast && <div className="toast" role="status"><span><Check size={18} /></span>{toast}</div>}
  </>
}

function PmsPages({ works, tickets, runs, onList, page, onNavigate }) {
  const isReport = page === 'reports'
  const [location, setLocation] = useState('all')
  const [ticketType, setTicketType] = useState('all')
  const [period, setPeriod] = useState(7)
  const [startDate, setStartDate] = useState('2026-10-16')
  const [endDate, setEndDate] = useState('2026-10-22')
  const [slaKind, setSlaKind] = useState('work')
  const [showStaff, setShowStaff] = useState(false)
  const from = period === 'custom' ? Date.parse(`${startDate}T00:00:00+07:00`) : Date.parse('2026-10-22T00:00:00+07:00') - (period - 1) * DAY
  const to = period === 'custom' ? Math.min(NOW, Date.parse(`${endDate}T23:59:59.999+07:00`)) : NOW
  const validRange = Number.isFinite(from) && Number.isFinite(to) && from <= to
  const inRange = at => validRange && at != null && at >= from && at <= to
  const visibleTickets = tickets.filter(t => (location === 'all' || t.location === location) && (ticketType === 'all' || t.type === ticketType))
  const ticketIds = new Set(visibleTickets.map(t => t.id))
  const visibleWorks = works.filter(w => (location === 'all' || w.location === location) && (ticketType === 'all' || w.ticketIds.some(id => ticketIds.has(id))))
  const visibleRuns = runs.filter(run => (location === 'all' || run.location === location) && (ticketType === 'all' || run.ticketType === ticketType))
  const newTickets = visibleTickets.filter(t => inRange(t.createdAt))
  const resolved = visibleTickets.filter(t => inRange(t.resolvedAt))
  const newWorks = visibleWorks.filter(w => inRange(w.createdAt))
  const completed = visibleWorks.filter(w => isFinished(w) && inRange(w.completedAt))
  const openTickets = visibleTickets.filter(t => !['RESOLVED', 'CANCELLED'].includes(t.status))
  const openWorks = visibleWorks.filter(isOpen)
  const pending = openTickets.filter(t => t.status === 'SUBMITTED')
  const approved = openTickets.filter(t => t.status === 'APPROVED')
  const ready = visibleTickets.filter(t => t.status === 'IN_PROGRESS' && t.ready)
  const lateTickets = openTickets.filter(t => t.resolveDueAt < NOW)
  const soonTickets = openTickets.filter(t => t.resolveDueAt >= NOW && t.resolveDueAt <= NOW + 4 * HOUR)
  const lateWorks = openWorks.filter(w => timing(w).tone === 'red')
  const soonWorks = openWorks.filter(w => timing(w).tone === 'amber')
  const paused = openWorks.filter(w => w.status === 'PAUSED')
  const todo = openWorks.filter(w => w.status === 'TO_DO')
  const workSla = slaStats(completed)
  const ticketSla = slaStats(resolved, 'ticket')
  const sla = slaKind === 'work' ? workSla : ticketSla
  const finishedItems = slaKind === 'work' ? completed : resolved
  const averageResolve = completed.length ? completed.reduce((sum, w) => sum + w.completedAt - w.startedAt, 0) / completed.length : null
  const averageWait = completed.length ? completed.reduce((sum, w) => sum + w.startedAt - w.createdAt, 0) / completed.length : null
  const staff = STAFF.map(s => ({ ...s, ...staffStats(visibleWorks, s.id, from, to) }))
  const rangeLabel = validRange ? `${dayText(from)} – ${dayText(to)}/2026` : 'Khoảng ngày không hợp lệ'
  const contextLabel = `${location === 'all' ? 'Tất cả Location' : location} · ${ticketType === 'all' ? 'Tất cả loại ticket' : ticketType}`
  const list = (title, items, kind = 'work', current = false, customRange) => onList({ title, ids: items.map(x => x.id), kind, subtitle: `${contextLabel} · ${current ? 'Hiện tại · 10:30, 22/10/2026' : customRange || rangeLabel}` })
  const reportCard = (title, value, color, rows, caption) => <section className={cx('report-tile', color)}><div className="mini-ring" style={{ '--progress': `${value == null ? 0 : value}%` }}><span>{value == null ? <Clock3 size={19} /> : `${value}%`}</span></div><div className="report-tile-content"><h3>{title}</h3>{rows.map(row => <button key={row.label} onClick={row.action}><span><i />{row.label}</span><b>{row.value}</b><ChevronRight size={12} /></button>)}{caption && <small>{caption}</small>}</div></section>
  const monitorRow = (label, items, kind, icon, tone, hint) => <button className="monitor-row" onClick={() => list(label, items, kind, true)}><span className={cx('monitor-icon', tone)}>{React.createElement(icon, { size: 16 })}</span><span className="monitor-label">{label}{hint && <small>{hint}</small>}</span><strong>{items.length}</strong><ChevronRight size={15} /></button>
  return <main className="page dashboard reference-dashboard">
    <div className="dashboard-title"><div><h1>{isReport ? 'Báo cáo vận hành' : 'Dashboard'}</h1><span>Ticket · Work order · Workflow</span></div><div className="live-label"><i />Dữ liệu demo: 22/10/2026, 10:30</div></div>
    <p className="page-intro">{isReport ? 'Theo dõi kết quả theo kỳ, SLA, hiệu quả nhân viên và workflow.' : 'Nắm hiện trạng và ưu tiên ticket, công việc, workflow cần xử lý.'}</p>
    <div className="filter-bar"><div className="filter-left"><Select label="Location" icon={MapPin} value={location} onChange={setLocation}><option value="all">Tất cả Location</option>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</Select><Select label="Loại ticket" value={ticketType} onChange={setTicketType}><option value="all">Tất cả loại ticket</option>{TYPES.map(t => <option key={t}>{t}</option>)}</Select>{(location !== 'all' || ticketType !== 'all') && <button className="reset-link" onClick={() => { setLocation('all'); setTicketType('all') }}>Đặt lại<X size={12} /></button>}</div>{isReport ? <div className="filter-right"><span>Kỳ báo cáo</span><Select label="Kỳ báo cáo" icon={CalendarDays} value={period} onChange={v => setPeriod(v === 'custom' ? v : Number(v))}><option value="7">7 ngày gần nhất</option><option value="30">30 ngày gần nhất</option><option value="custom">Tùy chọn ngày</option></Select></div> : <Button variant="secondary" icon={TrendingUp} onClick={() => onNavigate('reports')}>Xem báo cáo</Button>}</div>
    {isReport && period === 'custom' && <div className="custom-dates"><label>Từ<input aria-label="Từ ngày" type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} /></label><span>→</span><label>Đến<input aria-label="Đến ngày" type="date" value={endDate} min={startDate} max="2026-10-22" onChange={e => setEndDate(e.target.value)} /></label>{!validRange && <span className="text-red">Chọn khoảng ngày hợp lệ</span>}</div>}
    {isReport ? <section id="performance" className="report-section" aria-label="Báo cáo vận hành">
      <div className="section-caption"><span><TrendingUp size={14} />BÁO CÁO VẬN HÀNH</span><small>{rangeLabel}</small></div>
      <div className="report-tiles">
        {reportCard('Ticket request', percentage(resolved, t => t.resolvedAt <= t.resolveDueAt), 'blue', [
          { label: 'Ticket tạo mới', value: newTickets.length, action: () => list('Ticket tạo mới trong kỳ', newTickets, 'ticket') },
          { label: 'Ticket đã xử lý', value: resolved.length, action: () => list('Ticket đã xử lý trong kỳ', resolved, 'ticket') },
        ], 'Vòng tròn: tỷ lệ xử lý đúng SLA')}
        {reportCard('Work order', workSla.resolve, 'teal', [
          { label: 'WO tạo mới', value: newWorks.length, action: () => list('WO tạo mới trong kỳ', newWorks) },
          { label: 'WO hoàn thành', value: completed.length, action: () => list('WO hoàn thành trong kỳ', completed) },
        ], 'Hoàn thành tính theo Completed')}
        {reportCard('SLA xử lý WO', workSla.resolve, 'amber', [
          { label: 'Hoàn thành đúng hạn', value: completed.filter(w => w.completedAt <= w.resolveDueAt).length, action: () => list('WO hoàn thành đúng SLA', completed.filter(w => w.completedAt <= w.resolveDueAt)) },
          { label: 'Hoàn thành trễ hạn', value: completed.filter(w => w.completedAt > w.resolveDueAt).length, action: () => list('WO hoàn thành trễ SLA', completed.filter(w => w.completedAt > w.resolveDueAt)) },
        ], 'Loại WO hủy khỏi tỷ lệ')}
        {reportCard('Thời gian trung bình', null, 'green', [
          { label: 'Chờ bắt đầu', value: averageWait == null ? '—' : duration(averageWait), action: () => list('Thời gian chờ của WO hoàn thành', completed) },
          { label: 'Thực hiện WO', value: averageResolve == null ? '—' : duration(averageResolve), action: () => list('Thời gian thực hiện WO hoàn thành', completed) },
        ], `Tính trên ${completed.length} WO hoàn thành trong kỳ`)}
      </div>
      <div className="charts-grid">
        <section className="card trend-card"><div className="section-heading"><div><h2>Tiếp nhận & xử lý ticket</h2><p>{rangeLabel} · Bấm điểm trên biểu đồ để xem danh sách</p></div><TrendingUp size={17} className="muted" /></div><TrendChart tickets={visibleTickets} from={validRange ? from : NOW} to={validRange ? to : NOW} onPoint={(start, end, key) => list(key === 'created' ? 'Ticket tạo mới theo ngày' : 'Ticket đã xử lý theo ngày', visibleTickets.filter(t => { const at = key === 'created' ? t.createdAt : t.resolvedAt; return at != null && at >= start && at <= end }), 'ticket', false, `${dayText(start)} – ${dayText(end)}/2026`)} /><div className="chart-legend"><span><i className="blue" />Ticket tạo mới</span><span><i className="green" />Ticket đã xử lý</span></div></section>
        <section className="card sla-card"><div className="section-heading"><div><h2>Tuân thủ SLA xử lý</h2><p>Kết quả hoàn tất trong kỳ</p></div><Select label="Đối tượng SLA" value={slaKind} onChange={setSlaKind}><option value="work">Work order</option><option value="ticket">Ticket request</option></Select></div><button className="sla-drilldown" onClick={() => list(slaKind === 'work' ? 'Kết quả SLA work order' : 'Kết quả SLA ticket', finishedItems, slaKind)} aria-label="Xem các kết quả SLA"><SlaRing value={sla.resolve} /></button><div className="sla-breakdown"><button onClick={() => list('Hoàn tất đúng SLA', finishedItems.filter(x => (slaKind === 'work' ? x.completedAt : x.resolvedAt) <= x.resolveDueAt), slaKind)}><i className="green" />Đúng hạn<strong>{finishedItems.filter(x => (slaKind === 'work' ? x.completedAt : x.resolvedAt) <= x.resolveDueAt).length}</strong><ChevronRight size={13} /></button><button onClick={() => list('Hoàn tất trễ SLA', finishedItems.filter(x => (slaKind === 'work' ? x.completedAt : x.resolvedAt) > x.resolveDueAt), slaKind)}><i className="red" />Trễ hạn<strong>{finishedItems.filter(x => (slaKind === 'work' ? x.completedAt : x.resolvedAt) > x.resolveDueAt).length}</strong><ChevronRight size={13} /></button></div><div className="sla-note"><CircleHelp size={13} /><span>{slaKind === 'work' ? 'WO: từ lần bắt đầu đầu tiên đến hoàn thành, gồm tạm dừng.' : 'Ticket: từ lúc tạo đến khi xử lý xong.'}</span></div></section>
      </div>
      <WorkflowSection runs={visibleRuns} works={works} report from={from} to={to} scopeLabel={contextLabel} rangeLabel={rangeLabel} onList={onList} />
      <section className="card staff-report" id="staff"><button className="staff-report-toggle" aria-expanded={showStaff} onClick={() => setShowStaff(!showStaff)}><span className="summary-icon blue"><Users size={18} /></span><span><b>Nhân viên & hiệu quả SLA</b><small>{STAFF.length} nhân viên · Tải hiện tại, kết quả hoàn thành trong kỳ</small></span><span className="staff-preview">{completed.length} WO hoàn thành</span><ChevronDown size={17} className={showStaff ? 'rotated' : ''} /></button>{showStaff && <><div className="table-scroll"><table className="staff-table"><thead><tr><th>NHÂN VIÊN</th><th>ĐANG PHỤ TRÁCH</th><th>WO QUÁ HẠN</th><th>HOÀN THÀNH TRONG KỲ</th><th>SLA XỬ LÝ</th><th>THỰC HIỆN TB</th></tr></thead><tbody>{staff.map(s => <tr key={s.id}><td><span className="person"><Avatar staff={s} size="tiny" />{s.name}</span></td><td><button className="metric-link" onClick={() => list(`WO đang phụ trách · ${s.name}`, s.open, 'work', true)}>{s.open.length}</button></td><td><button className="metric-link text-red" onClick={() => list(`WO quá hạn · ${s.name}`, s.open.filter(w => timing(w).tone === 'red'), 'work', true)}>{s.open.filter(w => timing(w).tone === 'red').length}</button></td><td><button className="metric-link" onClick={() => list(`WO hoàn thành · ${s.name}`, s.completed)}>{s.completed.length}</button></td><td><button className="sla-result-link" onClick={() => list(`Kết quả SLA · ${s.name}`, s.completed)}><SlaCell value={s.resolve} n={s.resolveN} /></button></td><td>{s.resolveTime == null ? '—' : duration(s.resolveTime)}</td></tr>)}</tbody></table></div><div className="sla-note"><CircleHelp size={13} /><span>Ghi nhận cho staff được giao lúc hoàn thành. SLA là kết quả WO; chưa phải thống kê từng lượt đổi người.</span></div></>}</section>
    </section> : <>
    <div className="section-caption"><span><span className="live-small" />HIỆN TRẠNG VẬN HÀNH</span><small>Trong phạm vi bộ lọc đang chọn</small></div>
    <div className="kpi-grid current-kpis">
      <Kpi label="Ticket chưa kết thúc" value={openTickets.length} note={`${pending.length} ticket đang chờ duyệt`} icon={FileText} color="blue" onClick={() => list('Ticket chưa kết thúc', openTickets, 'ticket', true)} />
      <Kpi label="WO đang mở" value={openWorks.length} note={`${todo.length} WO chưa bắt đầu`} icon={Wrench} color="violet" onClick={() => list('Work order chưa kết thúc', openWorks, 'work', true)} />
      <Kpi label="Ticket quá hạn xử lý" value={lateTickets.length} note="Ưu tiên rà soát ngay" icon={Clock3} color="red" onClick={() => list('Ticket quá hạn xử lý', lateTickets, 'ticket', true)} />
      <Kpi label="WO quá hạn xử lý" value={lateWorks.length} note="Đã vượt hạn SLA xử lý" icon={Clock3} color="amber" onClick={() => list('WO quá hạn xử lý', lateWorks, 'work', true)} />
    </div>
    <div className="status-overview-grid">{[
      { title: 'Tiến độ ticket đang mở', items: openTickets, groups: ['SUBMITTED', 'APPROVED', 'IN_PROGRESS'], labels: TICKET_STATUS, kind: 'ticket', colors: ['#e5b85b', '#74a1ef', '#5394e5'] },
      { title: 'Tiến độ WO đang mở', items: openWorks, groups: ['TO_DO', 'IN_PROGRESS', 'PAUSED'], labels: STATUS, kind: 'work', colors: ['#a9b4c5', '#76a2ef', '#e6b45a'] },
    ].map(group => <section className="card status-overview" key={group.kind}><h2>{group.title}<span>{group.items.length}</span></h2><div className="status-stack">{group.groups.map((key, i) => { const count = group.items.filter(x => x.status === key).length; return count ? <button key={key} style={{ flex: count, background: group.colors[i] }} title={`${group.labels[key].label}: ${count}`} aria-label={`${group.labels[key].label}: ${count}`} onClick={() => list(group.labels[key].label, group.items.filter(x => x.status === key), group.kind, true)} /> : null })}</div><div className="status-legend">{group.groups.map((key, i) => <button key={key} onClick={() => list(group.labels[key].label, group.items.filter(x => x.status === key), group.kind, true)}><i style={{ background: group.colors[i] }} />{group.labels[key].label}<b>{group.items.filter(x => x.status === key).length}</b></button>)}</div></section>)}</div>
    <section className="monitor-section" id="attention" aria-label="Dashboard cần theo dõi"><div className="section-caption"><span><LayoutDashboard size={14} />CẦN THEO DÕI</span><small><i className="live-small" /> Hiện tại · Không phụ thuộc kỳ báo cáo</small></div><div className="monitor-grid"><section className="monitor-group"><div className="monitor-heading"><h2>Ticket request</h2><button onClick={() => list('Ticket chưa kết thúc', openTickets, 'ticket', true)}>{openTickets.length} đang mở<ChevronRight size={13} /></button></div>
      {monitorRow('Ticket chờ duyệt', pending, 'ticket', FileText, 'blue')}
      {monitorRow('Ticket đã duyệt, chưa xử lý', approved, 'ticket', Play, 'blue')}
      {monitorRow('Ticket quá hạn xử lý', lateTickets, 'ticket', Clock3, 'red')}
      {monitorRow('Ticket sắp đến hạn', soonTickets, 'ticket', Clock3, 'amber', 'Trong 4 giờ tới')}
      {monitorRow('Ticket chờ xác nhận hoàn tất', ready, 'ticket', FileCheck2, 'green')}
    </section><section className="monitor-group"><div className="monitor-heading"><h2>Work order</h2><button onClick={() => list('Work order chưa kết thúc', openWorks, 'work', true)}>{openWorks.length} đang mở<ChevronRight size={13} /></button></div>
      {monitorRow('WO quá hạn xử lý', lateWorks, 'work', Clock3, 'red')}
      {monitorRow('WO sắp đến hạn', soonWorks, 'work', Clock3, 'amber', 'Trong 4 giờ tới')}
      {monitorRow('WO chưa bắt đầu', todo, 'work', Play, 'blue')}
      {monitorRow('WO đang tạm dừng', paused, 'work', Pause, 'amber')}
      {monitorRow('WO đang thực hiện', openWorks.filter(w => w.status === 'IN_PROGRESS'), 'work', Wrench, 'green')}
    </section></div><p className="monitor-hint"><CircleHelp size={13} />Bấm một dòng để xem danh sách, lọc thêm và xuất CSV. Phạm vi theo Location và loại ticket ở trên.</p></section>
    <WorkflowSection runs={visibleRuns} works={works} report={false} from={from} to={to} scopeLabel={contextLabel} rangeLabel={rangeLabel} onList={onList} />
    </>}
    <footer className="page-footer"><span>SmartOS · Operation Pack</span><span>Prototype · Dữ liệu minh họa</span></footer>
  </main>
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
    const heading = isTicket ? ['Mã ticket', 'Loại ticket', 'Location', 'Area', 'Trạng thái', 'Ngày tạo', 'Ngày xử lý xong', 'Hạn SLA xử lý', 'Kết quả SLA'] : ['Mã WO', 'Tên công việc', 'Location', 'Area', 'Người phụ trách hiện tại', 'Người được giao lúc hoàn thành', 'Trạng thái', 'Ngày tạo', 'Bắt đầu lần đầu', 'Ngày hoàn thành', 'Hạn SLA xử lý', 'Due date', 'Chờ bắt đầu (phút)', 'Thực hiện (phút)', 'Kết quả SLA']
    const outcome = x => {
      const at = isTicket ? x.resolvedAt : x.completedAt
      if (isTicket ? x.status === 'CANCELLED' : x.cancelled) return 'Không đánh giá (hủy)'
      if (at != null && x.resolveDueAt != null) return at <= x.resolveDueAt ? 'Đúng hạn' : 'Trễ hạn'
      return x.resolveDueAt != null && x.resolveDueAt < NOW ? 'Đang quá hạn' : 'Chưa có kết quả'
    }
    const rows = [heading, ...items.map(x => isTicket ? [x.code, x.type, x.location, x.area, TICKET_STATUS[x.status].label, dateText(x.createdAt), dateText(x.resolvedAt), dateText(x.resolveDueAt), outcome(x)] : [x.code, x.title, x.location, x.area, pickStaff(x.staffId).name, pickStaff(x.completedByStaffId)?.name || '', STATUS[x.status].label, dateText(x.createdAt), dateText(x.startedAt), dateText(x.completedAt), dateText(x.resolveDueAt), dateText(x.dueDate), x.startedAt ? (x.startedAt - x.createdAt) / 60000 : '', x.completedAt ? (x.completedAt - x.startedAt) / 60000 : '', outcome(x)])]
    const csv = '\uFEFF' + rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a'); link.href = url; link.download = `smartos-${isTicket ? 'ticket' : 'wo'}-report.csv`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    notify(`Đã xuất ${items.length} kết quả đang lọc`)
  }
  return <><div className="report-toolbar"><label className="search-input"><Search size={15} /><input aria-label="Tìm trong báo cáo" placeholder="Tìm mã, tên, vị trí..." value={search} onChange={e => resetPage(setSearch)(e.target.value)} />{search && <button aria-label="Xóa tìm kiếm" onClick={() => resetPage(setSearch)('')}><X size={13} /></button>}</label><Select label="Trạng thái báo cáo" value={status} onChange={resetPage(setStatus)}><option value="all">Tất cả trạng thái</option>{Object.entries(isTicket ? TICKET_STATUS : STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</Select>{!isTicket && <Select label="Nhân viên báo cáo" value={staff} onChange={resetPage(setStaff)}><option value="all">Tất cả nhân viên</option>{STAFF.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}<Select label="Mức ưu tiên báo cáo" value={priority} onChange={resetPage(setPriority)}><option value="all">Tất cả ưu tiên</option>{Object.entries(PRIORITY).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</Select><Button variant="secondary" icon={ArrowDownToLine} disabled={!items.length} onClick={exportCsv}>Xuất CSV ({items.length})</Button></div><div className="report-result-count"><b>{items.length}</b> / {base.length} kết quả{(search || status !== 'all' || staff !== 'all' || priority !== 'all') && <button onClick={() => { setSearch(''); setStatus('all'); setStaff('all'); setPriority('all'); setPage(1) }}>Xóa bộ lọc</button>}<span>Xuất toàn bộ kết quả đang lọc, gồm các trang</span></div>{isTicket ? <TicketList items={shown} /> : <WorkTable works={shown} onSelect={onSelect} />}<div className="report-milestone-note"><CalendarDays size={14} />{isTicket ? 'Ngày tạo và hạn SLA xử lý hiển thị theo từng ticket.' : 'SLA xử lý tính từ lần Start đầu tiên; Due date riêng không thay đổi SLA.'}</div><div className="table-footer"><span>{items.length ? `${(current - 1) * 8 + 1}–${Math.min(current * 8, items.length)}` : '0'} / {items.length} kết quả</span><div className="pagination"><IconButton label="Trang trước" disabled={current === 1} onClick={() => setPage(Math.max(1, current - 1))}><ChevronLeft size={16} /></IconButton><span>{current} / {pages}</span><IconButton label="Trang sau" disabled={current === pages} onClick={() => setPage(Math.min(pages, current + 1))}><ChevronRight size={16} /></IconButton></div></div></>
}

function Kpi({ label, value, note, icon: Icon, color, onClick }) {
  return <button className={cx('kpi-card', color)} onClick={onClick}><div className="kpi-card-top"><span className={cx('kpi-icon', color)}><Icon size={19} strokeWidth={1.7} /></span><ArrowUpRight size={17} className="kpi-arrow" /></div><span className="kpi-label">{label}</span><div className="kpi-number">{String(value).padStart(2, '0')}<span>↗</span></div><div className="kpi-note"><i />{note}</div></button>
}
function WorkTable({ works, onSelect }) {
  if (!works.length) return <Empty />
  return <div className="table-scroll"><table className="work-table"><thead><tr><th>CÔNG VIỆC</th><th>VỊ TRÍ</th><th>ƯU TIÊN</th><th>PHỤ TRÁCH</th><th>TRẠNG THÁI</th><th>SLA XỬ LÝ</th><th>THỜI GIAN</th><th /></tr></thead><tbody>{works.map(w => { const t = timing(w); const s = pickStaff(w.staffId); return <tr key={w.id} onClick={() => onSelect(w.id)}><td><button className="code table-link">{w.code}</button><span className="work-title">{w.title}</span></td><td><span className="location-name">{w.location}</span><small className="block muted">{w.area}</small></td><td><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge></td><td><div className="person"><Avatar staff={s} size="tiny" /><span>{s.name.split(' ').slice(-2).join(' ')}</span></div></td><td><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge></td><td><div className={cx('deadline', `text-${t.tone}`)}><Clock3 size={13} />{t.label}</div><small className="block muted">{w.completedAt ? (w.cancelled ? 'Không đánh giá' : w.completedAt <= w.resolveDueAt ? 'Đúng SLA xử lý' : 'Trễ SLA xử lý') : t.due ? dateText(t.due) : t.detail}</small></td><td className="report-duration-cell"><small>Tạo: {dateText(w.createdAt)}</small><small>Bắt đầu: {dateText(w.startedAt)}</small><small>Hoàn thành: {dateText(w.completedAt)}</small>{w.completedAt && <b>Thực hiện: {duration(w.completedAt - w.startedAt)}</b>}</td><td><ChevronRight size={15} className="muted" /></td></tr> })}</tbody></table></div>
}
function TicketList({ items }) {
  if (!items.length) return <Empty title="Không có ticket phù hợp" />
  return <div className="table-scroll"><table className="ticket-table"><thead><tr><th>MÃ TICKET</th><th>LOẠI TICKET</th><th>VỊ TRÍ</th><th>NỘI DUNG</th><th>TRẠNG THÁI</th><th>NGÀY TẠO / SLA XỬ LÝ</th></tr></thead><tbody>{items.map(t => <tr key={t.id}><td><b className="code">{t.code}</b></td><td>{t.type}</td><td>{t.location}<small className="block muted">{t.area}</small></td><td className="ticket-note-cell">{t.note}</td><td><Badge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge></td><td><span>{dateText(t.createdAt)}</span><small className={cx('block', !['RESOLVED', 'CANCELLED'].includes(t.status) && t.resolveDueAt < NOW ? 'text-red' : 'muted')}>{t.status === 'CANCELLED' ? 'Không đánh giá SLA' : `Hạn: ${dateText(t.resolveDueAt)}`}</small></td></tr>)}</tbody></table></div>
}
function TrendChart({ tickets, from, to, onPoint }) {
  const totalDays = Math.max(1, Math.ceil((to - from + 1) / DAY))
  const bucketDays = Math.max(1, Math.ceil(totalDays / 31))
  const days = Math.ceil(totalDays / bucketDays)
  const points = Array.from({ length: days }, (_, i) => {
    const start = from + i * bucketDays * DAY, end = Math.min(start + bucketDays * DAY, to + 1)
    return { date: start, end: end - 1, created: tickets.filter(t => t.createdAt >= start && t.createdAt < end).length, resolved: tickets.filter(t => t.resolvedAt && t.resolvedAt >= start && t.resolvedAt < end).length }
  })
  const max = Math.max(4, ...points.map(p => Math.max(p.created, p.resolved)))
  const px = i => 45 + i / Math.max(1, days - 1) * 635
  const py = n => 175 - n / max * 140
  const line = key => points.map((p, i) => `${i ? 'L' : 'M'}${px(i)},${py(p[key])}`).join(' ')
  return <div className="trend-chart"><svg viewBox="0 0 710 215" role="img" aria-label="Biểu đồ số ticket tạo mới và đã xử lý theo ngày"><defs><linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#547ce4" stopOpacity=".16" /><stop offset="1" stopColor="#547ce4" stopOpacity="0" /></linearGradient></defs>{[0, 1, 2, 3].map(i => <g key={i}><line x1="45" x2="680" y1={py(i * max / 3)} y2={py(i * max / 3)} stroke="#edf0f5" strokeDasharray="4 4" /><text x="24" y={py(i * max / 3) + 4} textAnchor="end">{Math.round(i * max / 3)}</text></g>)}<path d={`${line('created')} L${px(days - 1)},175 L45,175Z`} fill="url(#trendGradient)" /><path d={line('created')} fill="none" stroke="#5078df" strokeWidth="2.7" strokeLinejoin="round" /><path d={line('resolved')} fill="none" stroke="#26a28f" strokeWidth="2.7" strokeLinejoin="round" />{points.map((p, i) => <g key={i}>{['created', 'resolved'].map(key => <g key={key} role="button" tabIndex={0} aria-label={`${dayText(p.date)}: ${p[key]} ticket ${key === 'created' ? 'tạo mới' : 'đã xử lý'}`} onClick={() => onPoint?.(p.date, p.end, key)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPoint?.(p.date, p.end, key) } }} className="chart-point"><circle cx={px(i)} cy={py(p[key])} r="9" fill="transparent" /><circle cx={px(i)} cy={py(p[key])} r={days <= 7 ? 3.5 : 2.3} fill="#fff" stroke={key === 'created' ? '#5078df' : '#26a28f'} strokeWidth="2" pointerEvents="none" /><title>{dayText(p.date)}: {p[key]} ticket {key === 'created' ? 'tạo mới' : 'đã xử lý'}</title></g>)}{(i % Math.max(1, Math.ceil(days / 7)) === 0 || i === days - 1) && <text x={px(i)} y="205" textAnchor="middle">{dayText(p.date)}</text>}</g>)}</svg></div>
}
function SlaRing({ value }) {
  const radius = 54, circumference = 2 * Math.PI * radius
  return <div className="sla-ring"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r={radius} fill="none" stroke="#eff3f7" strokeWidth="12" /><circle cx="70" cy="70" r={radius} fill="none" stroke="#28a38e" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(value || 0) / 100 * circumference} ${circumference}`} transform="rotate(-90 70 70)" /></svg><div><strong>{percent(value)}</strong><small>Xử lý đúng hạn</small></div></div>
}
function SlaLine({ label, value, n, color }) {
  return <div className="sla-line"><span><i className={color} />{label}</span><div><b>{percent(value)}</b><small>{n} kết quả được đánh giá</small></div></div>
}
function SlaCell({ value, n }) {
  return <div className="sla-cell"><div><strong className={value == null ? 'muted' : value >= 80 ? 'text-green' : value >= 60 ? 'text-amber' : 'text-red'}>{percent(value)}</strong><small>{n} lượt</small></div><i><span className={value >= 80 ? 'green' : value >= 60 ? 'amber' : 'red'} style={{ width: `${value || 0}%` }} /></i></div>
}

function Mpa({ works, onSelect }) {
  const [days, setDays] = useState(7)
  const from = Date.parse('2026-10-22T00:00:00+07:00') - (days - 1) * DAY
  const stats = staffStats(works, CURRENT_STAFF_ID, from, NOW)
  const priorityRank = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const needsAttention = stats.open.slice().sort((a, b) => {
    const urgencyRank = w => ({ red: 0, amber: 1 }[timing(w).tone] ?? 2)
    return urgencyRank(a) - urgencyRank(b) || priorityRank[a.priority] - priorityRank[b.priority] || timing(a).due - timing(b).due
  }).slice(0, 4)
  return <main className="mpa-page">
    <div className="mpa-greeting"><div><div className="eyebrow">TỔNG QUAN CÁ NHÂN</div><h1>Kết quả của tôi<span className="heading-dot">.</span></h1><p>Theo dõi công việc và hiệu quả SLA của bạn.</p></div><div className="segmented" aria-label="Kỳ báo cáo cá nhân">{[7, 30].map(n => <button key={n} className={days === n ? 'active' : ''} onClick={() => setDays(n)}>{n} ngày</button>)}</div></div>
      <div className="personal-summary"><span><CalendarDays size={15} />{dayText(from)} – {dayText(NOW)}/2026</span><Badge tone="blue">{STAFF[0].name}</Badge></div>
      <section className="mpa-attention"><div className="mobile-section-heading"><div><h2>WO cần làm<span className="count-pill">{stats.open.length}</span></h2><p>Ưu tiên quá hạn, sắp đến hạn và khẩn cấp · Hiện {needsAttention.length}/{stats.open.length} WO đang phụ trách.</p></div><Zap size={18} className="text-amber" /></div><div className="priority-work-grid">{needsAttention.map(w => <WorkCard key={w.id} work={w} onClick={() => onSelect(w.id)} urgent />)}</div>{!needsAttention.length && <Empty title="Bạn đã xử lý hết công việc" text="Các công việc mới được giao sẽ xuất hiện tại đây." />}</section>
      <div className="personal-kpis"><div className="card"><small>Lượt được giao</small><strong>{stats.assigned.length}</strong><span>Thời điểm giao trong kỳ</span></div><div className="card"><small>Đã hoàn thành</small><strong className="text-green">{stats.completed.length}</strong><span>Thời điểm hoàn thành trong kỳ</span></div><div className="card"><small>Đang phụ trách</small><strong>{stats.open.length}</strong><span>Công việc chưa kết thúc hiện tại</span></div></div>
      <section className="card personal-sla"><div className="section-heading"><div><h2>Hiệu quả xử lý công việc</h2><p>SLA xử lý từ lần bắt đầu đầu tiên đến hoàn thành.</p></div><ShieldCheck size={21} className="text-green" /></div><div className="personal-sla-grid"><div><span className="personal-reference">Thời gian chờ bắt đầu · tham khảo</span><small>Từ khi tạo đến lần bắt đầu đầu tiên</small><strong>{stats.responseTime == null ? '—' : duration(stats.responseTime)}</strong></div><div><SlaLine label="SLA xử lý" value={stats.resolve} n={stats.resolveN} color="green" /><small>Thời gian thực hiện trung bình</small><strong>{stats.resolveTime == null ? '—' : duration(stats.resolveTime)}</strong></div></div><div className="sla-note"><CircleHelp size={14} />Loại công việc hủy; thời gian tạm dừng vẫn được tính.</div></section>

    <footer className="page-footer"><span>SmartOS · Staff Portal</span><span>Dữ liệu minh họa</span></footer>
  </main>
}
function WorkCard({ work: w, onClick, urgent }) {
  const t = timing(w), done = w.checklist.filter(x => x.checked).length
  return <button className={cx('work-card', urgent && 'urgent', t.tone === 'red' && urgent && 'overdue-card')} onClick={onClick}><div className="work-card-header"><span className="code">{w.code}</span><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge></div><h3>{w.title}</h3><div className="card-location"><MapPin size={14} /><span>{w.location}<small>{w.area}</small></span>{w.ticketIds.length > 1 && <b>{w.ticketIds.length} ticket</b>}</div><div className="work-card-tags"><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge><span className={cx('deadline', `text-${t.tone}`)}><Clock3 size={13} />{t.label}</span></div><div className="check-progress"><div><span>Checklist</span><b>{done}/{w.checklist.length} bước</b></div><i><span style={{ width: `${w.checklist.length ? done / w.checklist.length * 100 : 0}%` }} /></i></div><div className="work-card-bottom"><span>Được giao {dateText(w.assignedAt)}</span><ArrowRight size={15} /></div></button>
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
  return <div className="drawer-overlay" onMouseDown={onClose}><aside className={cx('detail-drawer', mpa && 'mpa-detail')} role="dialog" aria-modal="true" aria-label={`Chi tiết ${w.code}`} onMouseDown={e => e.stopPropagation()}><header className="drawer-header"><div><span className="eyebrow">CHI TIẾT WORK ORDER</span><span className="drawer-code">{w.code}</span></div><IconButton label="Đóng chi tiết" onClick={onClose}><X size={20} /></IconButton></header><div className="drawer-content"><div className="detail-badges"><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge></div><h2>{w.title}</h2><div className="detail-location"><MapPin size={15} />{w.location} · {w.area}</div><div className={cx('deadline-banner', t.tone)}><Clock3 size={17} /><div><b>{t.label}</b><span>{t.due ? `Hạn ${t.detail.toLowerCase()}: ${dateText(t.due)}` : t.detail || dateText(w.completedAt)}</span></div></div>
      {w.status === 'CLOSED' && <div className="close-reason"><strong>Lý do đóng</strong><p>{w.closeReason === 'ARCHIVED' ? 'Lưu trữ công việc đã hoàn thành.' : w.closeReason === 'TICKET_CANCELLED' ? 'Tất cả ticket liên kết đã bị hủy.' : 'PMS hủy: thay đổi kế hoạch bảo trì.'}</p></div>}
      <div className="detail-tabs tabs"><button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Thông tin & checklist</button><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Lịch sử<span>{w.history.length}</span></button></div>
      {tab === 'details' ? <>
        <div className="detail-info"><div><small>NGƯỜI PHỤ TRÁCH</small><span className="person"><Avatar staff={staff} size="tiny" />{staff.name}</span></div><div><small>THỜI GIAN GIAO</small><b>{dateText(w.assignedAt)}</b></div><div><small>HẠN PHẢN HỒI</small><b>{dateText(w.responseDueAt)}</b></div><div><small>HẠN SLA XỬ LÝ</small><b>{w.startedAt ? dateText(w.resolveDueAt) : 'Chưa bắt đầu'}</b></div><div><small>DUE DATE</small><b>{w.dueDate ? dateText(w.dueDate) : 'Không đặt'}</b></div><div><small>THỜI GIAN XỬ LÝ MỤC TIÊU</small><b>{w.resolveHours} giờ từ lần bắt đầu đầu tiên</b></div></div>
        <div className="detail-section"><h3>Ghi chú</h3><p className="note-box">{w.note}</p><div className="media-grid"><button onClick={() => setMedia('Ảnh hiện trạng')}><span className="fake-image"><Wrench size={28} strokeWidth={1.2} /></span><small>Ảnh hiện trạng</small></button><button onClick={() => setMedia('Video kiểm tra')}><span className="fake-image video"><Play size={24} fill="currentColor" /></span><small>Video kiểm tra</small></button></div></div>
        {w.pauseReason && <div className="pause-note"><Pause size={16} /><div><strong>Lý do tạm dừng</strong><p>{w.pauseReason}</p></div></div>}
        <div className="detail-section"><div className="section-inline"><h3>Checklist công việc</h3><span>{done}/{w.checklist.length} bước</span></div><div className="detail-progress"><span style={{ width: `${w.checklist.length ? done / w.checklist.length * 100 : 100}%` }} /></div>{w.checklist.length ? <div className="checklist">{w.checklist.map(item => <label key={item.id} className={item.checked ? 'checked' : ''}><input type="checkbox" checked={item.checked} disabled={!canAct} onChange={() => onUpdate(w.id, { checklist: w.checklist.map(x => x.id === item.id ? { ...x, checked: !x.checked } : x) }, item.checked ? 'Đã bỏ đánh dấu checklist' : 'Đã hoàn tất một bước checklist')} /><span className="checkbox-visual">{item.checked && <Check size={13} strokeWidth={3} />}</span><span>{item.text}</span></label>)}</div> : <p className="muted">Công việc này không có checklist.</p>}{canAct && done < w.checklist.length && <p className="checklist-hint"><CircleHelp size={13} />Tick đủ checklist để có thể hoàn thành công việc.</p>}</div>
        <div className="detail-section"><div className="section-inline"><h3>Ticket liên kết</h3><span>{linked.length} ticket</span></div>{linked.length ? linked.map(ticket => <div className="linked-ticket" key={ticket.id}><div><b className="code">{ticket.code}</b><Badge tone={TICKET_STATUS[ticket.status].tone}>{TICKET_STATUS[ticket.status].label}</Badge></div><strong>{ticket.type}</strong><p>{ticket.note}</p><small><MapPin size={12} />{ticket.location} · {ticket.area}</small></div>) : <div className="no-linked-ticket"><FileText size={22} /><strong>Công việc không gắn ticket</strong><p>Thực hiện theo vị trí, ghi chú và checklist của WO.</p></div>}</div>
      </> : <div className="timeline">{w.history.map((h, i) => <div key={`${h.at}-${i}`}><span className={i === 0 ? 'blue' : ''}>{i === 0 ? <Activity size={13} /> : <i />}</span><div><strong>{h.text}</strong><small>{dateText(h.at)}</small></div></div>)}</div>}
    </div><footer className="drawer-footer">{canAct ? w.status === 'TO_DO' ? <Button className="full" icon={Play} onClick={() => transition('IN_PROGRESS', 'Đã bắt đầu công việc', { startedAt: w.startedAt || NOW, resolveDueAt: w.resolveDueAt || NOW + w.resolveHours * HOUR, assignmentStartedAt: w.assignmentStartedAt || NOW })}>Bắt đầu công việc</Button> : w.status === 'PAUSED' ? <Button className="full" icon={Play} onClick={() => transition('IN_PROGRESS', 'Đã tiếp tục công việc', { pauseReason: null, assignmentStartedAt: w.assignmentStartedAt || NOW })}>Tiếp tục công việc</Button> : <><Button variant="secondary" icon={Pause} onClick={() => { setPause(true); setReason('') }}>Tạm dừng</Button><Button icon={CheckCheck} disabled={done < w.checklist.length} onClick={() => transition('COMPLETED', 'Đã hoàn thành công việc', { completedAt: NOW, completedByStaffId: CURRENT_STAFF_ID, assignmentCompletedAt: NOW })}>Hoàn thành</Button></> : <><span className="read-only-label"><ShieldCheck size={15} />{mpa ? 'Công việc đã kết thúc' : 'Chế độ xem nhanh'}</span><Button variant="secondary" onClick={onClose}>Đóng</Button></>}</footer>
      {pause && <div className="inner-modal"><div className="pause-dialog"><span className="pause-dialog-icon"><Pause size={24} /></span><h2>Tạm dừng công việc?</h2><p>Cho quản lý biết lý do để hỗ trợ bạn tốt hơn.</p><label>Lý do tạm dừng <span>*</span><textarea autoFocus placeholder="Ví dụ: Đang chờ vật tư thay thế..." maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><small className="char-count">{reason.length}/500</small><div><Button variant="secondary" onClick={() => setPause(false)}>Quay lại</Button><Button disabled={!reason.trim()} onClick={() => { transition('PAUSED', 'Đã tạm dừng công việc', { pauseReason: reason.trim() }); setPause(false) }}>Xác nhận tạm dừng</Button></div></div></div>}
      {media && <div className="inner-modal" onClick={() => setMedia(null)}><div className="media-preview"><IconButton label="Đóng ảnh minh họa" onClick={() => setMedia(null)}><X /></IconButton><Wrench size={60} strokeWidth={1} /><h3>{media}</h3><p>Ảnh/video minh họa cho prototype</p></div></div>}
    </aside></div>
}
