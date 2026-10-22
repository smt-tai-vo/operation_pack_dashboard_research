import React, { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownLeft, ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, Building2, CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Ellipsis, FileCheck2, FileText, LayoutDashboard, ListChecks, MapPin, Menu, Pause, Play, Search, ShieldCheck, Sparkles, TrendingUp, Users, Wrench, X, Zap } from 'lucide-react'
import { CURRENT_STAFF_ID, DAY, HOUR, LOCATIONS, NOW, PRIORITY, STAFF, STATUS, TICKET_STATUS, TYPES, dateText, dayText, duration, initialData, isFinished, isOpen, percentage, slaStats, staffStats, timing } from './data.js'

const demo = initialData()
const cx = (...names) => names.filter(Boolean).join(' ')
const percent = n => n == null ? '—' : `${n}%`
const pickStaff = id => STAFF.find(s => s.id === id)

function Badge({ children, tone = 'neutral', dot = true }) {
  return <span className={cx('badge', tone)}>{dot && <i />}{children}</span>
}
function Button({ children, onClick, icon: Icon, variant = 'primary', disabled, className = '' }) {
  return <button className={cx('button', variant, className)} onClick={onClick} disabled={disabled}>{Icon && <Icon size={16} />}{children}</button>
}
function IconButton({ children, onClick, label, className = '' }) {
  return <button className={cx('icon-button', className)} onClick={onClick} aria-label={label} title={label}>{children}</button>
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
  const [portal, setPortal] = useState('PMS')
  const [works, setWorks] = useState(demo.works)
  const tickets = demo.tickets
  const [selected, setSelected] = useState(null)
  const [listing, setListing] = useState(null)
  const [toast, setToast] = useState('')
  const [notifications, setNotifications] = useState(false)
  const [help, setHelp] = useState(false)
  const notify = message => { setToast(message); window.setTimeout(() => setToast(''), 3400) }
  const switchPortal = next => { setPortal(next); setSelected(null); setListing(null); setNotifications(false) }
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setSelected(null); setListing(null); setNotifications(false); setHelp(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
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
        <button className="active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><LayoutDashboard size={18} />Tổng quan<span className="nav-active-dot" /></button>
        <button onClick={() => document.getElementById('attention').scrollIntoView({ behavior: 'smooth' })}><ListChecks size={18} />Công việc cần xử lý<span className="nav-number">{works.filter(w => isOpen(w) && timing(w).tone === 'red').length}</span></button>
        <button onClick={() => document.getElementById('performance').scrollIntoView({ behavior: 'smooth' })}><TrendingUp size={18} />Kết quả vận hành</button>
        <button onClick={() => document.getElementById('staff').scrollIntoView({ behavior: 'smooth' })}><Users size={18} />Nhân viên & SLA</button>
      </nav><div className="sidebar-bottom"><div className="sidebar-tip"><span><Sparkles size={17} /></span><strong>Mọi việc trong tầm tay.</strong><p>Theo dõi, điều phối và nâng cao chất lượng vận hành.</p></div><button className="help-link" onClick={() => setHelp(true)}><CircleHelp size={17} />Hướng dẫn sử dụng<ArrowUpRight size={14} /></button><div className="sidebar-user"><Avatar staff={{ initials: 'LH', color: '#8d9c9c' }} /><div><b>Linh Hoàng</b><small>Quản lý vận hành</small></div><ShieldCheck size={16} /></div></div></aside>
      <div className="main-shell"><header className="topbar"><div className="breadcrumb"><Building2 size={15} /><span>Vận hành</span><ChevronRight size={13} /><strong>Tổng quan bảo trì</strong></div><div className="top-actions">{topbar}</div></header><Dashboard works={works} tickets={tickets} onSelect={setSelected} onList={setListing} notify={notify} /></div>
    </div> : <div className="mpa-shell"><header className="mpa-header"><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-symbol"><Zap size={19} fill="currentColor" /></span><strong>smart<span>os</span><i /></strong><span className="staff-portal-label">STAFF PORTAL</span></a><div className="top-actions">{topbar}</div></header><Mpa works={works} onSelect={setSelected} /></div>}
    {activeWork && <WorkDetail work={activeWork} tickets={tickets} mpa={portal === 'MPA'} onClose={() => setSelected(null)} onUpdate={updateWork} />}
    {listing && <Dialog title={listing.title} subtitle={listing.subtitle || `${listing.items.length} kết quả phù hợp với bộ lọc`} onClose={() => setListing(null)} wide>{listing.items.length ? listing.kind === 'ticket' ? <TicketList items={listing.items} /> : <WorkTable works={listing.items} onSelect={id => { setSelected(id); setListing(null) }} /> : <Empty />}</Dialog>}
    {help && <Dialog title="Khám phá dashboard" onClose={() => setHelp(false)}><div className="help-content"><p><b>PMS:</b> bấm KPI để xem danh sách, lọc Location, đổi kỳ báo cáo và bấm nhân viên để xem công việc.</p><p><b>MPA:</b> chuyển portal để xem dashboard kết quả của An, số việc đang phụ trách và SLA cá nhân theo kỳ. Mục WO cần làm ưu tiên tối đa 4 việc đang mở; bấm để xem checklist và thao tác.</p><p><b>SLA nhân viên:</b> được minh họa theo từng lượt phân công. Di chuột vào biểu tượng thông tin để xem cách tính.</p><p>Dữ liệu là ví dụ tại ngày 22/10/2026. Tải lại trang để đặt lại các thao tác thử.</p></div></Dialog>}
    {toast && <div className="toast" role="status"><span><Check size={18} /></span>{toast}</div>}
  </>
}

function Dashboard({ works, tickets, onSelect, onList, notify }) {
  const [location, setLocation] = useState('all')
  const [ticketType, setTicketType] = useState('all')
  const [period, setPeriod] = useState(7)
  const [startDate, setStartDate] = useState('2026-10-16')
  const [endDate, setEndDate] = useState('2026-10-22')
  const [attention, setAttention] = useState('overdue')
  const [search, setSearch] = useState('')
  const [slaKind, setSlaKind] = useState('work')
  const [staffSort, setStaffSort] = useState('workload')
  const from = period === 'custom' ? Date.parse(`${startDate}T00:00:00+07:00`) : Date.parse('2026-10-22T00:00:00+07:00') - (period - 1) * DAY
  const to = period === 'custom' ? Math.min(NOW, Date.parse(`${endDate}T23:59:59+07:00`)) : NOW
  const validRange = Number.isFinite(from) && Number.isFinite(to) && from <= to
  const safeFrom = validRange ? from : NOW
  const safeTo = validRange ? to : NOW
  const matchLocation = x => location === 'all' || x.location === location
  const visibleTickets = tickets.filter(t => matchLocation(t) && (ticketType === 'all' || t.type === ticketType))
  const ticketIds = new Set(visibleTickets.map(t => t.id))
  const visibleWorks = works.filter(w => matchLocation(w) && (ticketType === 'all' || w.ticketIds.some(id => ticketIds.has(id))))
  const inRange = t => t != null && t >= safeFrom && t <= safeTo
  const periodTickets = visibleTickets.filter(t => inRange(t.createdAt))
  const periodWorks = visibleWorks.filter(w => inRange(w.createdAt))
  const respondedTickets = visibleTickets.filter(t => inRange(t.respondedAt))
  const resolvedTickets = visibleTickets.filter(t => inRange(t.resolvedAt))
  const responseWorks = visibleWorks.filter(w => inRange(w.startedAt))
  const completedWorks = visibleWorks.filter(w => isFinished(w) && inRange(w.completedAt))
  // Each SLA denominator belongs to its milestone in the chosen period.
  const slaResponse = slaKind === 'work' ? slaStats(responseWorks).response : slaStats(respondedTickets, 'ticket').response
  const slaResolve = slaKind === 'work' ? slaStats(completedWorks).resolve : slaStats(resolvedTickets, 'ticket').resolve
  const open = visibleWorks.filter(isOpen)
  const overdue = open.filter(w => timing(w).tone === 'red')
  const soon = open.filter(w => timing(w).tone === 'amber')
  const paused = open.filter(w => w.status === 'PAUSED')
  const ready = visibleTickets.filter(t => t.ready)
  const pendingTickets = visibleTickets.filter(t => t.status === 'SUBMITTED')
  const activeTickets = visibleTickets.filter(t => t.status === 'IN_PROGRESS')
  const attentionItems = attention === 'overdue' ? overdue : attention === 'soon' ? soon : paused
  const searched = attentionItems.filter(w => `${w.code} ${w.title} ${pickStaff(w.staffId).name}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))).sort((a, b) => (timing(a).due || 0) - (timing(b).due || 0))
  const staff = STAFF.map(s => ({ ...s, ...staffStats(visibleWorks, s.id, safeFrom, safeTo) })).sort((a, b) => staffSort === 'workload' ? b.open.length - a.open.length : (b.resolve ?? -1) - (a.resolve ?? -1))
  const list = (title, items, kind = 'work', subtitle) => onList({ title, items, kind, subtitle })
  const periodLabel = period === 'custom' ? `${dayText(safeFrom)} – ${dayText(safeTo)}` : `${period} ngày gần nhất`
  const exportCsv = () => {
    const rows = [['Mã WO', 'Tên công việc', 'Location', 'Nhân viên', 'Trạng thái', 'Thời điểm giao', 'Thời điểm hoàn thành'], ...periodWorks.map(w => [w.code, w.title, w.location, pickStaff(w.staffId).name, STATUS[w.status].label, dateText(w.assignedAt), dateText(w.completedAt)])]
    const csv = '\uFEFF' + rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = 'smartos-bao-cao-bao-tri.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000)
    notify(`Đã xuất ${periodWorks.length} WO trong kỳ ra CSV`)
  }
  return <main className="page dashboard">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />KHÔNG GIAN VẬN HÀNH</div><h1>Tổng quan bảo trì<span className="heading-dot">.</span></h1><p>Mọi công việc, mọi vị trí — trong một góc nhìn.</p></div><div className="heading-right"><div className="live-label"><i />Dữ liệu demo · 10:30, 22/10/2026</div><Button variant="secondary" icon={ArrowDownToLine} onClick={exportCsv}>Xuất báo cáo</Button></div></div>
    <div className="filter-bar"><div className="filter-left"><Select label="Location" icon={MapPin} value={location} onChange={setLocation}><option value="all">Tất cả Location</option>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</Select><Select label="Loại ticket" value={ticketType} onChange={setTicketType}><option value="all">Tất cả loại ticket</option>{TYPES.map(t => <option key={t}>{t}</option>)}</Select>{(location !== 'all' || ticketType !== 'all') && <button className="reset-link" onClick={() => { setLocation('all'); setTicketType('all') }}>Đặt lại<X size={12} /></button>}</div><div className="filter-right"><span>Kết quả theo kỳ</span><div className="segmented">{[7, 30, 'custom'].map(n => <button key={n} className={period === n ? 'active' : ''} onClick={() => setPeriod(n)}>{n === 'custom' ? <><CalendarDays size={13} />Tùy chọn</> : `${n} ngày`}</button>)}</div></div></div>
    {period === 'custom' && <div className="custom-dates"><CalendarDays size={16} /><label>Từ<input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} /></label><span>→</span><label>Đến<input type="date" value={endDate} min={startDate} max="2026-10-22" onChange={e => setEndDate(e.target.value)} /></label>{!validRange && <span className="text-red">Chọn khoảng ngày hợp lệ</span>}</div>}
    <div className="section-caption"><span><span className="live-small" />HIỆN TRẠNG</span><small>Số liệu tồn đọng tại thời điểm hiện tại</small></div>
    <div className="kpi-grid">
      <Kpi label="Ticket chờ duyệt" value={pendingTickets.length} note="Cần xem xét và phê duyệt" icon={FileText} color="blue" onClick={() => list('Ticket chờ duyệt', pendingTickets, 'ticket')} />
      <Kpi label="Ticket đang xử lý" value={activeTickets.length} note="Đang được thực hiện" icon={Activity} color="violet" onClick={() => list('Ticket đang xử lý', activeTickets, 'ticket')} />
      <Kpi label="WO quá hạn" value={overdue.length} note="Ưu tiên xử lý ngay" icon={Clock3} color="red" onClick={() => list('Work order quá hạn', overdue)} />
      <Kpi label="Chờ xác nhận hoàn tất" value={ready.length} note="Các WO liên kết đã xử lý xong" icon={FileCheck2} color="amber" onClick={() => list('Ticket chờ xác nhận hoàn tất', ready, 'ticket')} />
    </div>
    <section className="card attention-card" id="attention"><div className="section-heading"><div><div className="title-with-icon"><span className="section-icon amber"><Zap size={16} /></span><h2>Cần xử lý</h2><span className="count-pill">{overdue.length + soon.length} việc</span></div><p>Tập trung vào những công việc cần bạn chú ý.</p></div><Button variant="ghost" onClick={() => list('Tất cả WO đang mở', open)}>Xem tất cả<ArrowRight size={15} /></Button></div>
      <div className="table-controls"><div className="tabs">{[['overdue', 'Quá hạn', overdue.length], ['soon', 'Sắp đến hạn', soon.length], ['paused', 'Tạm dừng', paused.length], ['ready', 'Chờ xác nhận', ready.length]].map(([key, label, count]) => <button key={key} className={attention === key ? 'active' : ''} onClick={() => { setAttention(key); setSearch('') }}>{label}<span>{count}</span></button>)}</div><label className="search-input"><Search size={15} /><input aria-label="Tìm trong công việc cần xử lý" placeholder={attention === 'ready' ? 'Tìm mã ticket...' : 'Tìm công việc...'} value={search} onChange={e => setSearch(e.target.value)} />{search && <button onClick={() => setSearch('')} aria-label="Xóa tìm kiếm"><X size={13} /></button>}</label></div>
      {attention === 'ready' ? <TicketList items={ready.filter(t => `${t.code} ${t.type}`.toLowerCase().includes(search.toLowerCase()))} /> : <WorkTable works={searched.slice(0, 5)} onSelect={onSelect} />}
      <div className="table-footer"><span>{attention === 'ready' ? `${ready.length} ticket cần xác nhận` : `Hiển thị ${Math.min(5, searched.length)} / ${searched.length} công việc`}</span><span className="footer-hint"><ShieldCheck size={13} />Trong phạm vi Location đang chọn</span></div>
    </section>
    <div className="section-caption results-caption" id="performance"><span><TrendingUp size={14} />KẾT QUẢ VẬN HÀNH</span><small>{dayText(safeFrom)} – {dayText(safeTo)}/2026</small></div>
    <div className="results-summary">
      <button onClick={() => list('Ticket tạo trong kỳ', periodTickets, 'ticket')}><span className="summary-icon blue"><FileText size={18} /></span><div><small>Ticket tạo mới</small><strong>{periodTickets.length}<span>ticket</span></strong></div><ArrowUpRight size={16} /></button>
      <button onClick={() => list('Ticket đã xử lý xong trong kỳ', resolvedTickets, 'ticket')}><span className="summary-icon green"><CheckCheck size={18} /></span><div><small>Ticket đã xử lý xong</small><strong>{resolvedTickets.length}<span>ticket</span></strong></div><ArrowUpRight size={16} /></button>
      <button onClick={() => list('WO hoàn thành trong kỳ', completedWorks)}><span className="summary-icon violet"><ListChecks size={18} /></span><div><small>WO hoàn thành</small><strong>{completedWorks.length}<span>công việc</span></strong></div><ArrowUpRight size={16} /></button>
    </div>
    <div className="charts-grid"><section className="card trend-card"><div className="section-heading"><div><h2>Nhịp độ xử lý ticket</h2><p>Tạo mới và xử lý xong · {periodLabel}</p></div><span className="chart-mini-icon"><TrendingUp size={18} /></span></div><TrendChart tickets={visibleTickets} from={safeFrom} to={safeTo} /><div className="chart-legend"><span><i className="blue" />Ticket tạo mới</span><span><i className="green" />Ticket đã xử lý</span></div></section>
      <section className="card sla-card"><div className="section-heading"><div><h2>Chất lượng SLA</h2><p>Kết quả có mốc phản hồi / hoàn tất trong kỳ</p></div></div><div className="segmented sla-switch"><button className={slaKind === 'work' ? 'active' : ''} onClick={() => setSlaKind('work')}>Work order</button><button className={slaKind === 'ticket' ? 'active' : ''} onClick={() => setSlaKind('ticket')}>Ticket</button></div><div className="sla-ring-layout"><SlaRing value={slaResolve} /><div className="sla-key"><SlaLine label="Phản hồi đúng hạn" value={slaResponse} n={slaKind === 'work' ? slaStats(responseWorks).responseN : slaStats(respondedTickets, 'ticket').responseN} color="blue" /><SlaLine label="Xử lý đúng hạn" value={slaResolve} n={slaKind === 'work' ? slaStats(completedWorks).resolveN : slaStats(resolvedTickets, 'ticket').resolveN} color="green" /></div></div><div className="sla-note"><CircleHelp size={13} /><span>Loại trường hợp hủy. Mỗi tỷ lệ dùng mẫu số riêng.</span></div></section></div>
    <section className="card staff-card" id="staff"><div className="section-heading"><div><div className="title-with-icon"><span className="section-icon blue"><Users size={17} /></span><h2>Nhân viên & hiệu quả SLA</h2><span className="count-pill">{STAFF.length} người</span></div><p>Tải công việc hiện tại và kết quả từng lượt phân công trong kỳ.</p></div><Select label="Sắp xếp nhân viên" value={staffSort} onChange={setStaffSort}><option value="workload">Theo tải công việc</option><option value="sla">Theo SLA xử lý</option></Select></div>
      <div className="staff-info-bar"><span><i className="live-small" />Tải công việc: hiện tại</span><span><CalendarDays size={13} />SLA & hoàn thành: {periodLabel}</span><span className="info-tooltip" tabIndex={0}>Cách tính SLA<CircleHelp size={14} /><span className="tooltip">Theo lượt phân công: từ lúc giao đến hành động đầu tiên / hoàn thành. Mục tiêu lấy từ WO. Tạm dừng vẫn tính thời gian. Các trường hợp hủy được loại khỏi tỷ lệ.</span></span></div>
      <div className="table-scroll"><table className="staff-table"><thead><tr><th>NHÂN VIÊN</th><th>ĐANG PHỤ TRÁCH</th><th>QUÁ HẠN</th><th>HOÀN THÀNH TRONG KỲ</th><th>SLA PHẢN HỒI</th><th>SLA XỬ LÝ</th><th /></tr></thead><tbody>{staff.map(s => <tr key={s.id} onClick={() => list(`Công việc · ${s.name}`, visibleWorks.filter(w => w.staffId === s.id), 'work', 'Công việc trong phạm vi Location đang chọn')}><td><div className="person"><Avatar staff={s} /><div><button className="table-link">{s.name}</button><small>{s.role}</small></div></div></td><td><strong className="workload-value">{s.open.length}</strong><div className="load-bar">{['TO_DO', 'IN_PROGRESS', 'PAUSED'].map((status, i) => <i key={status} className={['neutral', 'blue', 'amber'][i]} title={`${STATUS[status].label}: ${s.open.filter(w => w.status === status).length}`} style={{ flex: s.open.filter(w => w.status === status).length }} />)}</div></td><td><span className={s.open.some(w => timing(w).tone === 'red') ? 'overdue-number' : 'muted'}>{s.open.filter(w => timing(w).tone === 'red').length}</span></td><td><strong>{s.completed.length}</strong><small className="block muted">công việc</small></td><td><SlaCell value={s.response} n={s.responseN} /></td><td><SlaCell value={s.resolve} n={s.resolveN} /></td><td><ChevronRight size={16} className="muted" /></td></tr>)}</tbody></table></div>
      <div className="table-footer"><div className="load-legend"><span><i className="neutral" />Chưa bắt đầu</span><span><i className="blue" />Đang làm</span><span><i className="amber" />Tạm dừng</span></div><span className="footer-hint">Bấm nhân viên để xem công việc<ArrowRight size={13} /></span></div>
    </section><footer className="page-footer"><span>SmartOS <span className="footer-dot">·</span> Không gian vận hành hiệu quả hơn.</span><span>Prototype · Dữ liệu minh họa</span></footer>
  </main>
}

function Kpi({ label, value, note, icon: Icon, color, onClick }) {
  return <button className={cx('kpi-card', color)} onClick={onClick}><div className="kpi-card-top"><span className={cx('kpi-icon', color)}><Icon size={19} strokeWidth={1.7} /></span><ArrowUpRight size={17} className="kpi-arrow" /></div><span className="kpi-label">{label}</span><div className="kpi-number">{String(value).padStart(2, '0')}<span>↗</span></div><div className="kpi-note"><i />{note}</div></button>
}
function WorkTable({ works, onSelect }) {
  if (!works.length) return <Empty />
  return <div className="table-scroll"><table className="work-table"><thead><tr><th>CÔNG VIỆC</th><th>VỊ TRÍ</th><th>ƯU TIÊN</th><th>PHỤ TRÁCH</th><th>TRẠNG THÁI</th><th>THỜI HẠN</th><th /></tr></thead><tbody>{works.map(w => { const t = timing(w); const s = pickStaff(w.staffId); return <tr key={w.id} onClick={() => onSelect(w.id)}><td><button className="code table-link">{w.code}</button><span className="work-title">{w.title}</span></td><td><span className="location-name">{w.location}</span><small className="block muted">{w.area}</small></td><td><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge></td><td><div className="person"><Avatar staff={s} size="tiny" /><span>{s.name.split(' ').slice(-2).join(' ')}</span></div></td><td><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge></td><td><div className={cx('deadline', `text-${t.tone}`)}><Clock3 size={13} />{t.label}</div><small className="block muted">{t.detail || dateText(w.completedAt)}</small></td><td><ChevronRight size={15} className="muted" /></td></tr> })}</tbody></table></div>
}
function TicketList({ items }) {
  if (!items.length) return <Empty title="Không có ticket phù hợp" />
  return <div className="table-scroll"><table className="ticket-table"><thead><tr><th>MÃ TICKET</th><th>LOẠI TICKET</th><th>VỊ TRÍ</th><th>NỘI DUNG</th><th>TRẠNG THÁI</th></tr></thead><tbody>{items.map(t => <tr key={t.id}><td><b className="code">{t.code}</b></td><td>{t.type}</td><td>{t.location}<small className="block muted">{t.area}</small></td><td className="ticket-note-cell">{t.note}</td><td><Badge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge></td></tr>)}</tbody></table></div>
}
function TrendChart({ tickets, from, to }) {
  const days = Math.max(1, Math.min(90, Math.ceil((to - from) / DAY)))
  const points = Array.from({ length: days }, (_, i) => {
    const start = from + i * DAY, end = Math.min(start + DAY, to + 1)
    return { date: start, created: tickets.filter(t => t.createdAt >= start && t.createdAt < end).length, resolved: tickets.filter(t => t.resolvedAt && t.resolvedAt >= start && t.resolvedAt < end).length }
  })
  const max = Math.max(4, ...points.map(p => Math.max(p.created, p.resolved)))
  const px = i => 45 + i / Math.max(1, days - 1) * 635
  const py = n => 175 - n / max * 140
  const line = key => points.map((p, i) => `${i ? 'L' : 'M'}${px(i)},${py(p[key])}`).join(' ')
  return <div className="trend-chart"><svg viewBox="0 0 710 215" role="img" aria-label="Biểu đồ số ticket tạo mới và đã xử lý theo ngày"><defs><linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#547ce4" stopOpacity=".16" /><stop offset="1" stopColor="#547ce4" stopOpacity="0" /></linearGradient></defs>{[0, 1, 2, 3].map(i => <g key={i}><line x1="45" x2="680" y1={py(i * max / 3)} y2={py(i * max / 3)} stroke="#edf0f5" strokeDasharray="4 4" /><text x="24" y={py(i * max / 3) + 4} textAnchor="end">{Math.round(i * max / 3)}</text></g>)}<path d={`${line('created')} L${px(days - 1)},175 L45,175Z`} fill="url(#trendGradient)" /><path d={line('created')} fill="none" stroke="#5078df" strokeWidth="2.7" strokeLinejoin="round" /><path d={line('resolved')} fill="none" stroke="#26a28f" strokeWidth="2.7" strokeLinejoin="round" />{points.map((p, i) => <g key={i}><circle cx={px(i)} cy={py(p.created)} r={days <= 7 ? 3.5 : 2.3} fill="#fff" stroke="#5078df" strokeWidth="2"><title>{dayText(p.date)}: {p.created} ticket tạo mới, {p.resolved} đã xử lý</title></circle>{(i % Math.max(1, Math.ceil(days / 7)) === 0 || i === days - 1) && <text x={px(i)} y="205" textAnchor="middle">{dayText(p.date)}</text>}</g>)}</svg></div>
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
      <div className="personal-kpis"><div className="card"><small>Lượt được giao</small><strong>{stats.assigned.length}</strong><span>Thời điểm giao trong kỳ</span></div><div className="card"><small>Đã hoàn thành</small><strong className="text-green">{stats.completed.length}</strong><span>Thời điểm hoàn thành trong kỳ</span></div><div className="card"><small>Đang phụ trách</small><strong>{stats.open.length}</strong><span>Công việc chưa kết thúc hiện tại</span></div></div>
      <section className="card personal-sla"><div className="section-heading"><div><h2>Hiệu quả theo lượt phân công</h2><p>Tính từ thời điểm bạn được giao công việc.</p></div><ShieldCheck size={21} className="text-green" /></div><div className="personal-sla-grid"><div><SlaLine label="SLA phản hồi" value={stats.response} n={stats.responseN} color="blue" /><small>Phản hồi trung bình</small><strong>{stats.responseTime == null ? '—' : duration(stats.responseTime)}</strong></div><div><SlaLine label="SLA xử lý" value={stats.resolve} n={stats.resolveN} color="green" /><small>Xử lý trung bình</small><strong>{stats.resolveTime == null ? '—' : duration(stats.resolveTime)}</strong></div></div><div className="sla-note"><CircleHelp size={14} />Loại công việc hủy; thời gian tạm dừng vẫn được tính.</div></section>
      <section className="mpa-attention"><div className="mobile-section-heading"><div><h2>WO cần làm<span className="count-pill">{stats.open.length}</span></h2><p>Ưu tiên quá hạn, sắp đến hạn và khẩn cấp · Hiện {needsAttention.length}/{stats.open.length} WO đang phụ trách.</p></div><Zap size={18} className="text-amber" /></div><div className="priority-work-grid">{needsAttention.map(w => <WorkCard key={w.id} work={w} onClick={() => onSelect(w.id)} urgent />)}</div>{!needsAttention.length && <Empty title="Bạn đã xử lý hết công việc" text="Các công việc mới được giao sẽ xuất hiện tại đây." />}</section>
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
  return <div className="drawer-overlay" onMouseDown={onClose}><aside className={cx('detail-drawer', mpa && 'mpa-detail')} role="dialog" aria-modal="true" aria-label={`Chi tiết ${w.code}`} onMouseDown={e => e.stopPropagation()}><header className="drawer-header"><div><span className="eyebrow">CHI TIẾT WORK ORDER</span><span className="drawer-code">{w.code}</span></div><IconButton label="Đóng chi tiết" onClick={onClose}><X size={20} /></IconButton></header><div className="drawer-content"><div className="detail-badges"><Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge><Badge tone={PRIORITY[w.priority].tone}>{PRIORITY[w.priority].label}</Badge></div><h2>{w.title}</h2><div className="detail-location"><MapPin size={15} />{w.location} · {w.area}</div><div className={cx('deadline-banner', t.tone)}><Clock3 size={17} /><div><b>{t.label}</b><span>{t.detail ? `Hạn ${t.detail.toLowerCase()}: ${dateText(t.due)}` : dateText(w.completedAt)}</span></div></div>
      {w.status === 'CLOSED' && <div className="close-reason"><strong>Lý do đóng</strong><p>{w.closeReason === 'ARCHIVED' ? 'Lưu trữ công việc đã hoàn thành.' : w.closeReason === 'TICKET_CANCELLED' ? 'Tất cả ticket liên kết đã bị hủy.' : 'PMS hủy: thay đổi kế hoạch bảo trì.'}</p></div>}
      <div className="detail-tabs tabs"><button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Thông tin & checklist</button><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Lịch sử<span>{w.history.length}</span></button></div>
      {tab === 'details' ? <>
        <div className="detail-info"><div><small>NGƯỜI PHỤ TRÁCH</small><span className="person"><Avatar staff={staff} size="tiny" />{staff.name}</span></div><div><small>THỜI GIAN GIAO</small><b>{dateText(w.assignedAt)}</b></div><div><small>HẠN PHẢN HỒI</small><b>{dateText(w.responseDueAt)}</b></div><div><small>HẠN HOÀN THÀNH</small><b>{dateText(w.resolveDueAt)}</b></div></div>
        <div className="detail-section"><h3>Ghi chú</h3><p className="note-box">{w.note}</p><div className="media-grid"><button onClick={() => setMedia('Ảnh hiện trạng')}><span className="fake-image"><Wrench size={28} strokeWidth={1.2} /></span><small>Ảnh hiện trạng</small></button><button onClick={() => setMedia('Video kiểm tra')}><span className="fake-image video"><Play size={24} fill="currentColor" /></span><small>Video kiểm tra</small></button></div></div>
        {w.pauseReason && <div className="pause-note"><Pause size={16} /><div><strong>Lý do tạm dừng</strong><p>{w.pauseReason}</p></div></div>}
        <div className="detail-section"><div className="section-inline"><h3>Checklist công việc</h3><span>{done}/{w.checklist.length} bước</span></div><div className="detail-progress"><span style={{ width: `${w.checklist.length ? done / w.checklist.length * 100 : 100}%` }} /></div>{w.checklist.length ? <div className="checklist">{w.checklist.map(item => <label key={item.id} className={item.checked ? 'checked' : ''}><input type="checkbox" checked={item.checked} disabled={!canAct} onChange={() => onUpdate(w.id, { checklist: w.checklist.map(x => x.id === item.id ? { ...x, checked: !x.checked } : x) }, item.checked ? 'Đã bỏ đánh dấu checklist' : 'Đã hoàn tất một bước checklist')} /><span className="checkbox-visual">{item.checked && <Check size={13} strokeWidth={3} />}</span><span>{item.text}</span></label>)}</div> : <p className="muted">Công việc này không có checklist.</p>}{canAct && done < w.checklist.length && <p className="checklist-hint"><CircleHelp size={13} />Tick đủ checklist để có thể hoàn thành công việc.</p>}</div>
        <div className="detail-section"><div className="section-inline"><h3>Ticket liên kết</h3><span>{linked.length} ticket</span></div>{linked.length ? linked.map(ticket => <div className="linked-ticket" key={ticket.id}><div><b className="code">{ticket.code}</b><Badge tone={TICKET_STATUS[ticket.status].tone}>{TICKET_STATUS[ticket.status].label}</Badge></div><strong>{ticket.type}</strong><p>{ticket.note}</p><small><MapPin size={12} />{ticket.location} · {ticket.area}</small></div>) : <div className="no-linked-ticket"><FileText size={22} /><strong>Công việc không gắn ticket</strong><p>Thực hiện theo vị trí, ghi chú và checklist của WO.</p></div>}</div>
      </> : <div className="timeline">{w.history.map((h, i) => <div key={`${h.at}-${i}`}><span className={i === 0 ? 'blue' : ''}>{i === 0 ? <Activity size={13} /> : <i />}</span><div><strong>{h.text}</strong><small>{dateText(h.at)}</small></div></div>)}</div>}
    </div><footer className="drawer-footer">{canAct ? w.status === 'TO_DO' ? <Button className="full" icon={Play} onClick={() => transition('IN_PROGRESS', 'Đã bắt đầu công việc', { startedAt: w.startedAt || NOW, assignmentStartedAt: w.assignmentStartedAt || NOW })}>Bắt đầu công việc</Button> : w.status === 'PAUSED' ? <Button className="full" icon={Play} onClick={() => transition('IN_PROGRESS', 'Đã tiếp tục công việc', { pauseReason: null, assignmentStartedAt: w.assignmentStartedAt || NOW })}>Tiếp tục công việc</Button> : <><Button variant="secondary" icon={Pause} onClick={() => { setPause(true); setReason('') }}>Tạm dừng</Button><Button icon={CheckCheck} disabled={done < w.checklist.length} onClick={() => transition('COMPLETED', 'Đã hoàn thành công việc', { completedAt: NOW, assignmentCompletedAt: NOW })}>Hoàn thành</Button></> : <><span className="read-only-label"><ShieldCheck size={15} />{mpa ? 'Công việc đã kết thúc' : 'Chế độ xem nhanh'}</span><Button variant="secondary" onClick={onClose}>Đóng</Button></>}</footer>
      {pause && <div className="inner-modal"><div className="pause-dialog"><span className="pause-dialog-icon"><Pause size={24} /></span><h2>Tạm dừng công việc?</h2><p>Cho quản lý biết lý do để hỗ trợ bạn tốt hơn.</p><label>Lý do tạm dừng <span>*</span><textarea autoFocus placeholder="Ví dụ: Đang chờ vật tư thay thế..." maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><small className="char-count">{reason.length}/500</small><div><Button variant="secondary" onClick={() => setPause(false)}>Quay lại</Button><Button disabled={!reason.trim()} onClick={() => { transition('PAUSED', 'Đã tạm dừng công việc', { pauseReason: reason.trim() }); setPause(false) }}>Xác nhận tạm dừng</Button></div></div></div>}
      {media && <div className="inner-modal" onClick={() => setMedia(null)}><div className="media-preview"><IconButton label="Đóng ảnh minh họa" onClick={() => setMedia(null)}><X /></IconButton><Wrench size={60} strokeWidth={1} /><h3>{media}</h3><p>Ảnh/video minh họa cho prototype</p></div></div>}
    </aside></div>
}
