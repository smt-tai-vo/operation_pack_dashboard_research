import { useEffect, useState } from 'react'
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCheck, ChevronRight, CircleAlert, Clock3, FileCheck2, FileText, Flag, GitBranch, Play, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { CURRENT_STAFF_ID, HOUR, LOCATIONS, NOW, PRIORITY, STAFF, STATUS, TICKET_STATUS, TYPES, dateText, duration, isOpen } from './data.js'
import { dateInputValue, timeBuckets } from './report-period.js'
import { attentionSort, completion, dashboardPeriod, dueSoon, inside, overdue, readyToResolve, sortedRows, staffRows, ticketSla, woSla, workAttention, workLocations, workScope } from './dashboard-model.js'

const rate = value => value == null ? '—' : `${value}%`
const today = dateInputValue(NOW)
function useSaved(key, fallback) {
  const [value,setValue] = useState(() => { try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback } catch { return fallback } })
  useEffect(() => { try { sessionStorage.setItem(key,JSON.stringify(value)) } catch {} },[key,value])
  return [value,setValue]
}
function Period({ value, onChange, custom = false }) {
  return <div className="d-period" aria-label="Kỳ báo cáo">{[['7', '7 ngày'], ['30', '30 ngày'], ...(custom ? [['custom', 'Tuỳ chọn']] : [])].map(([key,label]) => <button key={key} aria-pressed={key === value} onClick={() => onChange(key)}>{label}</button>)}</div>
}
function SlaValue({ metric, ticket = false }) {
  return <span className="d-sla-value"><b>{rate(metric.rate)}</b>{metric.totalCount ? <small>({metric.metCount}/{metric.totalCount})</small> : <small>Chưa có {ticket ? 'ticket' : 'WO'} trong kỳ</small>}</span>
}
function Signal({ label, items, hint, tone = 'blue', icon: Icon = Clock3, onClick }) {
  return <button className={`d-signal ${tone}`} onClick={() => onClick(items)}><span className="d-signal-icon"><Icon size={20} /></span><span><span>{label}</span><strong>{items.length}</strong>{hint && <small>{hint}</small>}</span><ArrowUpRight size={18} /></button>
}
function Row({ label, items, hint, onClick, tone = 'blue' }) {
  return <button className="d-row" onClick={() => onClick(items)}><i className={tone}/><span>{label}{hint && <small>{hint}</small>}</span><b className={tone === 'red' && items.length ? 'text-red' : ''}>{items.length}</b><ChevronRight size={14}/></button>
}
function StatusPanel({ title, items, statuses, labels, onList, children, countLabel = 'đang mở' }) {
  return <section className="d-panel"><header><h3>{title}</h3><button onClick={() => onList(`Đang mở · ${title}`, items)}>{items.length} {countLabel} <ChevronRight size={14}/></button></header><div className="d-distribution" aria-hidden="true">{statuses.map((key,i) => <i key={key} style={{flex: items.filter(x => x.status === key).length || 0.001, background: ['#88c9ff','#308cf1','#ff9d24'][i]}}/>)}</div><div className="d-statuses" aria-label={`Phân bổ trạng thái ${title}`}>{statuses.map(key => <span key={key}>{labels[key].label} <b>{items.filter(x => x.status === key).length}</b></span>)}</div>{children}</section>
}
function SlaCard({ title, metric, caption, ticket, onClick }) {
  return <button className="d-sla-card" onClick={onClick}><span>{title}</span><div><strong>{rate(metric.rate)}</strong>{metric.totalCount > 0 && <b>{metric.metCount}/{metric.totalCount} {ticket ? 'ticket' : 'WO'}</b>}</div>{metric.totalCount ? <div className="d-sla-track"><i style={{width:`${metric.rate}%`}}/><i style={{width:`${100-metric.rate}%`}}/></div> : <small>Chưa có {ticket ? 'ticket' : 'WO'} trong kỳ</small>}<p>{caption}</p></button>
}
function Trend({ title, items, finishKey, range, kind, onList }) {
  const buckets = timeBuckets(range.from, range.to).map(b => ({...b, created:items.filter(x => x.createdAt >= b.start && x.createdAt <= b.end), finished:items.filter(x => x[finishKey] != null && x[finishKey] >= b.start && x[finishKey] <= b.end)}))
  const max = Math.max(4,...buckets.flatMap(b => [b.created.length,b.finished.length]))
  const x = i => 34 + i / Math.max(1,buckets.length-1)*516
  const y = value => 190-value/max*150
  const line = key => buckets.map((b,i) => `${i?'L':'M'}${x(i)},${y(b[key].length)}`).join(' ')
  const created = items.filter(x => inside(x.createdAt,range)), finished = items.filter(x => inside(x[finishKey],range))
  return <section className="d-trend"><header><h3>{title}</h3><div><button onClick={() => onList('Tạo mới trong kỳ',created,kind)}><i/>Tạo mới <b>{created.length}</b></button><button onClick={() => onList('Hoàn thành trong kỳ',finished,kind)}><i/>{kind==='ticket'?'Resolved':'Completed'} <b>{finished.length}</b></button></div></header><svg viewBox="0 0 580 225" role="img" aria-label={`${title}: ${created.length} tạo mới, ${finished.length} hoàn thành`}>
    {[0,1,2,3].map(i => <g key={i}><line x1="34" x2="550" y1={y(max*i/3)} y2={y(max*i/3)} stroke="#e9ebef"/><text x="25" y={y(max*i/3)+4} textAnchor="end">{Math.round(max*i/3)}</text></g>)}
    {['created','finished'].map(key => <g key={key}><path d={line(key)} fill="none" stroke={key==='created'?'#1976ed':'#ac6512'} strokeWidth="2.5" strokeDasharray={key==='finished'?'6 4':undefined}/>{buckets.map((b,i) => <g key={b.start} role="button" tabIndex={0} aria-label={`${b.label}: ${b[key].length} ${key==='created'?'tạo mới':'hoàn thành'}`} onClick={() => onList(`${title} · ${b.label}`,b[key],kind)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onList(`${title} · ${b.label}`,b[key],kind)}}}><circle cx={x(i)} cy={y(b[key].length)} r="7" fill="transparent"/><circle cx={x(i)} cy={y(b[key].length)} r="3.5" fill={key==='created'?'#1976ed':'#ac6512'}/><title>{b.label}: Tạo mới {b.created.length} · Hoàn thành {b.finished.length}</title></g>)}</g>)}
    {buckets.map((b,i) => (i%Math.max(1,Math.ceil(buckets.length/7))===0||i===buckets.length-1) && <text key={b.start} x={x(i)} y="215" textAnchor="middle">{b.label}</text>)}
  </svg><details className="d-chart-data"><summary>Số liệu theo ngày</summary><ul>{buckets.map(b=><li key={b.start}>{b.label}: Tạo mới {b.created.length} · Hoàn thành {b.finished.length}</li>)}</ul></details></section>
}
function ReportTable({ title, rows, totals, location = false, onList }) {
  const [sort,setSort] = useState({key:'late',direction:'DESC'})
  const [size,setSize] = useState(20)
  const data = sortedRows(rows,sort)
  const columns = [['name',location?'Location':'Staff'],['open',location?'Ticket mở':'Đang mở'],['late','WO trễ'],...(!location?[['completed','Completed trong kỳ'],['response','% SLA phản hồi']]:[]),['resolution','% SLA xử lý WO'],...(location?[['ticketResolution','% Ticket đúng hạn']]:[])]
  const render = (row,total=false) => <tr key={row.id}>{columns.map(([key]) => <td key={key}>{key==='name' ? <><b>{total?'Tổng':row.name}</b>{!total && row.active===false && <small>Inactive</small>}</> : ['response','resolution','ticketResolution'].includes(key) ? <SlaValue metric={row[key]} ticket={key==='ticketResolution'}/> : <button className={key==='late'&&row[key].length?'text-red':''} onClick={() => onList(`${row.name} · ${columns.find(c=>c[0]===key)[1]}`,row[key],location&&key==='open'?'ticket':'work',key!=='completed')}>{row[key].length}</button>}</td>)}</tr>
  return <section className="d-report-table"><header><h3>{title}</h3><p>{location?'Ticket mở, WO trễ: hiện tại · SLA: trong kỳ':'Đang mở, trễ: hiện tại · Completed, SLA: trong kỳ'}</p></header><div className="d-table-scroll"><table><thead><tr>{columns.map(([key,label])=><th key={key} aria-sort={sort.key===key?(sort.direction==='ASC'?'ascending':'descending'):'none'}>{key==='name'?label:<button onClick={()=>{setSort({key,direction:sort.key===key&&sort.direction==='DESC'?'ASC':'DESC'});setSize(20)}}>{label} {sort.key===key?(sort.direction==='DESC'?'↓':'↑'):'↕'}</button>}{key==='response'&&<span tabIndex={0} aria-label="Tính cả WO nhận lại đã quá hạn phản hồi" title="Tính cả WO nhận lại đã quá hạn phản hồi"> ⓘ</span>}</th>)}</tr></thead><tbody>{data.slice(0,size).map(r=>render(r))}{!data.length&&<tr><td colSpan={columns.length}>Chưa có dữ liệu trong kỳ</td></tr>}</tbody><tfoot>{render(totals,true)}</tfoot></table></div>{data.length>size&&<button className="d-more" onClick={()=>setSize(size+20)}>Xem thêm ({Math.min(20,data.length-size)})</button>}<p className="d-table-note">{location?'WO nhiều location được đếm tại từng location; dòng Tổng chỉ đếm mỗi WO một lần.':'Theo staff phụ trách hiện tại của WO trong phạm vi đang chọn; đây là SLA của WO, không phải điểm đánh giá staff.'}</p></section>
}
function csvDownload(sections,filename) {
  const csv='\uFEFF'+sections.map(rows=>rows.map(row=>row.map(cell=>`"${String(cell??'').replaceAll('"','""')}"`).join(',')).join('\r\n')).join('\r\n\r\n')
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export function PmsDashboard({works,tickets,runs,onList}) {
  const [location,setLocation]=useSaved('pms-dashboard-location','all'),[type,setType]=useSaved('pms-dashboard-type','all'),[period,setPeriod]=useSaved('pms-dashboard-period','7')
  const [start,setStart]=useState(dateInputValue(NOW-6*24*HOUR)),[end,setEnd]=useState(today)
  const [updated,setUpdated]=useState(NOW)
  const range=dashboardPeriod(period,start,end)
  const ts=tickets.filter(t=>!t.deletedAt&&(location==='all'||t.location===location)&&(type==='all'||t.type===type))
  const ws=works.filter(w=>workScope(w,tickets,location,type))
  const rs=runs.filter(r=>(location==='all'||r.location===location)&&(type==='all'||r.ticketType===type))
  const openT=ts.filter(t=>!['RESOLVED','CANCELLED'].includes(t.status)),openW=ws.filter(isOpen)
  const sla=woSla(ws,range),ticketMetric=ticketSla(ts,range)
  const list=(title,items,kind='work',current=false)=>onList({title,kind,ids:items.map(x=>x.id),subtitle:`${location==='all'?'Tất cả location':location} · ${type==='all'?'Tất cả loại ticket':type} · ${current?'Hiện tại':range.rangeLabel}`})
  const staff=staffRows(ws,range)
  const names=location==='all'?[...LOCATIONS,...(ts.some(t=>!t.location)||ws.some(w=>!workLocations(w,tickets).length)?['']:[])]:[location]
  const locs=names.map(name=>{
    const localT=ts.filter(t=>name?t.location===name:!t.location),localW=ws.filter(w=>name?workLocations(w,tickets).includes(name):!workLocations(w,tickets).length)
    return {id:name||'no-location',name:name||'Không có location',open:localT.filter(t=>!['RESOLVED','CANCELLED'].includes(t.status)),late:localW.filter(w=>isOpen(w)&&overdue(w)),resolution:woSla(localW,range).resolution,ticketResolution:ticketSla(localT,range)}
  })
  const locationTotal={id:'total',name:'Tổng',open:openT,late:openW.filter(overdue),resolution:sla.resolution,ticketResolution:ticketMetric}
  const staffTotal={id:'total',name:'Tổng',open:openW,late:openW.filter(overdue),completed:sla.resolution.items,...sla}
  const exportReport=()=>{
    const metrics=[['% WO đạt SLA phản hồi',sla.response],['% WO đạt SLA xử lý',sla.resolution],['% Ticket đúng hạn',ticketMetric]]
    const tableRows=(rows,isLocation)=>rows.map(r=>[r.name,r.open.length,r.late.length,...(!isLocation?[r.completed.length,r.response.metCount,r.response.totalCount,r.response.rate]:[]),r.resolution.metCount,r.resolution.totalCount,r.resolution.rate,...(isLocation?[r.ticketResolution.metCount,r.ticketResolution.totalCount,r.ticketResolution.rate]:[])])
    csvDownload([
      [['Tổng quan',range.startDate,range.endDate],['Chỉ số','Đạt','Mẫu số','%'],...metrics.map(([name,m])=>[name,m.metCount,m.totalCount,m.rate])],
      [['Theo ngày'],['Ngày','Ticket tạo mới','Ticket Resolved','WO tạo mới','WO Completed'],...timeBuckets(range.from,range.to).map(b=>[dateInputValue(b.start),ts.filter(t=>t.createdAt>=b.start&&t.createdAt<=b.end).length,ts.filter(t=>t.resolvedAt!=null&&t.resolvedAt>=b.start&&t.resolvedAt<=b.end).length,ws.filter(w=>w.createdAt>=b.start&&w.createdAt<=b.end).length,ws.filter(w=>w.completedAt!=null&&w.completedAt>=b.start&&w.completedAt<=b.end).length])],
      [['Theo Location'],['Location','Ticket mở','WO trễ','WO đạt','WO mẫu số','WO SLA %','Ticket đạt','Ticket mẫu số','Ticket SLA %'],...tableRows([...locs,locationTotal],true)],
      [['Theo staff'],['Staff','Đang mở','Trễ','Completed','Phản hồi đạt','Phản hồi mẫu số','Phản hồi %','Xử lý đạt','Xử lý mẫu số','Xử lý %'],...tableRows([...staff,staffTotal],false)],
    ],`bao-cao-van-hanh_${range.startDate}_${range.endDate}.csv`)
  }
  return <main className="d-dashboard"><header className="d-page-header"><h1>Dashboard vận hành</h1><div><label>Location: <select aria-label="Location" value={location} onChange={e=>setLocation(e.target.value)}><option value="all">Tất cả ({LOCATIONS.length})</option>{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select></label><label>Loại ticket: <select aria-label="Ticket type" value={type} onChange={e=>setType(e.target.value)}><option value="all">Tất cả</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label><span>Dữ liệu mẫu · {dateText(updated)}</span><button className="d-refresh" aria-label="Tải lại dashboard" onClick={()=>setUpdated(NOW)}><RefreshCw size={20}/></button></div></header>
    <h2>Cần xử lý ngay</h2><section className="d-action-grid" aria-label="Cần xử lý ngay">
      <Signal label="Ticket chờ duyệt" items={ts.filter(t=>t.status==='SUBMITTED')} hint={`${ts.filter(t=>t.status==='SUBMITTED'&&NOW-t.createdAt>24*HOUR).length} chờ > 24 giờ`} icon={FileText} onClick={x=>list('Ticket chờ duyệt',x,'ticket',true)}/>
      <Signal label="Đủ điều kiện hoàn tất" items={ts.filter(t=>readyToResolve(t,works))} hint="Ticket thủ công · WO liên kết đã xong" tone="green" icon={FileCheck2} onClick={x=>list('Ticket đủ điều kiện hoàn tất',x,'ticket',true)}/>
      <Signal label="WO trễ" items={openW.filter(overdue)} hint="SLA phản hồi / xử lý / hạn hoàn thành · Không đếm trùng" tone="red" onClick={x=>list('WO đang trễ',x,'work',true)}/>
      <Signal label="WO sắp đến hạn" items={openW.filter(dueSoon)} hint="Phản hồi: còn ≤ 25% · Xử lý / hạn: ≤ 4 giờ" tone="amber" onClick={x=>list('WO sắp đến hạn',x,'work',true)}/>
      <Signal label="Run lỗi" items={rs.filter(r=>r.status==='FAILED')} hint="Mở danh sách để xử lý bước lỗi" tone="violet" icon={GitBranch} onClick={x=>list('Run lỗi',x,'workflow',true)}/>
    </section>
    <h2>Cần theo dõi</h2><section className="d-monitor-grid">
      <StatusPanel title="Ticket" items={openT} statuses={['SUBMITTED','APPROVED','IN_PROGRESS']} labels={TICKET_STATUS} onList={(title,x)=>list(title,x,'ticket',true)}>
        <Row label="Ticket trễ" hint="Quá Time to resolve" items={openT.filter(t=>t.resolveDueAt<NOW)} tone="red" onClick={x=>list('Ticket trễ',x,'ticket',true)}/>
        <Row label="Ticket sắp đến hạn" hint="4 giờ tới" items={openT.filter(t=>t.resolveDueAt>=NOW&&t.resolveDueAt<=NOW+4*HOUR)} tone="amber" onClick={x=>list('Ticket sắp đến hạn',x,'ticket',true)}/>
        <Row label="Approved chưa có WO đang mở" items={ts.filter(t=>t.status==='APPROVED'&&!works.some(w=>w.ticketIds.includes(t.id)&&isOpen(w)))} onClick={x=>list('Ticket cần giao việc',x,'ticket',true)}/>
      </StatusPanel>
      <StatusPanel title="Work order" items={openW} statuses={['TO_DO','IN_PROGRESS','PAUSED']} labels={STATUS} onList={(title,x)=>list(title,x,'work',true)}>
        <Row label="WO Paused > 24 giờ" hint="Từ lần tạm dừng gần nhất" tone="amber" items={openW.filter(w=>w.status==='PAUSED'&&Number.isFinite(w.pausedAt)&&NOW-w.pausedAt>24*HOUR)} onClick={x=>list('WO tạm dừng lâu',x,'work',true)}/>
        <Row label="WO In progress" items={openW.filter(w=>w.status==='IN_PROGRESS')} onClick={x=>list('WO In progress',x,'work',true)}/>
        <Row label="WO To do" hint={`Gồm ${openW.filter(w=>w.status==='TO_DO'&&w.startedAt==null&&w.responseDueAt<NOW).length} WO To do quá lâu · Quá SLA phản hồi`} items={openW.filter(w=>w.status==='TO_DO')} onClick={x=>list('WO To do',x,'work',true)}/>
        <p className="d-panel-note">WO trễ và sắp đến hạn nằm ở “Cần xử lý ngay”.</p>
      </StatusPanel>
      <StatusPanel title="Quy trình" countLabel="đang hoạt động" items={rs.filter(r=>['RUNNING','WAITING_APPROVAL','WAITING_WORK_ORDER'].includes(r.status))} statuses={['RUNNING','WAITING_APPROVAL','WAITING_WORK_ORDER']} labels={{RUNNING:{label:'Đang chạy'},WAITING_APPROVAL:{label:'Chờ duyệt'},WAITING_WORK_ORDER:{label:'Chờ WO'}}} onList={(_title,x)=>list('Run đang hoạt động',x,'workflow',true)}>
        <p className="d-panel-note">Độc lập với SLA của WO</p>
        <Row label="Run đang chạy" items={rs.filter(r=>r.status==='RUNNING')} onClick={x=>list('Run đang chạy',x,'workflow',true)}/>
        <Row label="Run chờ duyệt" hint={rs.some(r=>r.status==='WAITING_APPROVAL'&&r.waitingSince!=null&&NOW-r.waitingSince>24*HOUR)?<span className="d-wait-warning"><CircleAlert size={13}/>{rs.filter(r=>r.status==='WAITING_APPROVAL'&&r.waitingSince!=null&&NOW-r.waitingSince>24*HOUR).length} run chờ &gt; 24 giờ</span>:'Không có run chờ quá 24 giờ'} items={rs.filter(r=>r.status==='WAITING_APPROVAL')} tone="violet" onClick={x=>list('Run chờ duyệt',x,'workflow',true)}/>

      </StatusPanel>
    </section>
    <section className="d-report" id="performance"><header className="d-report-header"><div><h2>Báo cáo theo kỳ</h2><p>{range.rangeLabel}{range.partial?' · Hôm nay tính tới 10:30':''} · UTC+7</p></div><div><Period value={period} onChange={setPeriod} custom/><button className="d-export" disabled={!range.valid} onClick={exportReport}>Xuất CSV</button></div></header>
      {period==='custom'&&<div className="d-dates"><label>Từ ngày<input aria-label="Từ ngày" type="date" value={start} max={end||today} onChange={e=>setStart(e.target.value)}/></label><label>Đến ngày<input aria-label="Đến ngày" type="date" value={end} min={start} max={today} onChange={e=>setEnd(e.target.value)}/></label></div>}
      {!range.valid?<p className="d-error" role="alert">Khoảng thời gian tối đa 90 ngày, không chọn ngày trong tương lai</p>:<><div className="d-report-charts"><div className="d-sla-stack"><SlaCard title="% WO đạt SLA phản hồi" metric={sla.response} caption="Bắt đầu lần đầu trong kỳ; hoặc hạn phản hồi trong kỳ và chưa bắt đầu tới cuối kỳ." onClick={()=>list('SLA phản hồi WO',sla.response.items)}/><SlaCard title="% WO đạt SLA xử lý" metric={sla.resolution} caption="WO Completed trong kỳ, gồm đã lưu trữ; tính cả thời gian Paused." onClick={()=>list('SLA xử lý WO',sla.resolution.items)}/><SlaCard title="% Ticket Resolved đúng hạn" metric={ticketMetric} ticket caption="Resolved trong kỳ, so với thời điểm tạo + Time to resolve." onClick={()=>list('Ticket Resolved đúng hạn',ticketMetric.items,'ticket')}/></div><Trend title="Ticket theo ngày" items={ts} finishKey="resolvedAt" range={range} kind="ticket" onList={list}/><Trend title="WO theo ngày" items={ws} finishKey="completedAt" range={range} kind="work" onList={list}/></div>
      <div className="d-report-tables"><ReportTable title="Theo Location" rows={locs} totals={locationTotal} location onList={list}/><ReportTable title="Tải việc theo staff" rows={staff} totals={staffTotal} onList={list}/></div></>}
    </section><p className="d-demo-note">Dữ liệu mẫu · SmartOS Operation Pack</p>
  </main>
}

export function MpaDashboard({works,tickets,onSelect,onList,onUpdate}) {
  const [period,setPeriod]=useSaved('mpa-dashboard-period','7'),[action,setAction]=useState(null),[reason,setReason]=useState('')
  useEffect(() => { if (!action) return; const before=document.body.style.overflow; document.body.style.overflow='hidden'; const escape=e=>{if(e.key==='Escape')setAction(null)}; document.addEventListener('keydown',escape); return ()=>{document.body.style.overflow=before;document.removeEventListener('keydown',escape)} },[action])
  const range=dashboardPeriod(period),mine=works.filter(w=>w.staffId===CURRENT_STAFF_ID&&!w.deletedAt),open=mine.filter(isOpen),late=open.filter(overdue),result=completion(mine,range),sla=woSla(mine,range)
  const needs=open.slice().sort(attentionSort).slice(0,5),staff=STAFF.find(s=>s.id===CURRENT_STAFF_ID)
  const list=(title,items,current=true)=>onList({title,kind:'work',ids:items.map(w=>w.id),subtitle:current?'Đang phụ trách · Hiện tại':`Được giao trong kỳ · Completed · ${range.rangeLabel}`})
  const change=(w,status,extra={})=>onUpdate(w.id,{status,...extra},`${status==='COMPLETED'?'Đã hoàn thành':status==='PAUSED'?'Đã tạm dừng':w.status==='PAUSED'?'Đã tiếp tục':'Đã bắt đầu'} ${w.code}`)
  const start=w=>change(w,'IN_PROGRESS',{startedAt:w.startedAt??NOW,startedByStaffId:w.startedByStaffId??CURRENT_STAFF_ID,resolveDueAt:w.resolveDueAt??NOW+w.resolveHours*HOUR,pauseReason:null,pausedAt:null})
  const modalWork=mine.find(w=>w.id===action?.id)
  return <main className="d-mpa"><header className="d-mpa-greeting"><span>Xin chào<h1>{staff.name}</h1></span></header><h2>Tổng quan</h2><div className="d-current"><button onClick={()=>list('WO đang phụ trách',open)}><span><BriefcaseBusiness size={20}/>Đang phụ trách<ChevronRight size={18}/></span><strong>{open.length}</strong></button><button className={late.length?'d-late':''} onClick={()=>list('WO đang trễ',late)}><span><Clock3 size={20}/>Đang trễ<ChevronRight size={18}/></span><strong>{late.length}</strong></button></div>
    <section className="d-personal-period"><Period value={period} onChange={setPeriod}/><div className="d-period-metrics"><button className="d-completion" aria-label={`Hoàn thành ${result.completed.length} trên ${result.assigned.length} WO được giao trong kỳ`} onClick={()=>list('WO được giao trong kỳ đã Completed',result.completed,false)}><span><CheckCheck size={20}/>Hoàn thành<ChevronRight size={18}/></span><strong>{result.completed.length}<small>/{result.assigned.length}</small></strong></button><div className="d-personal-sla"><span><ShieldCheck size={20}/>% đạt SLA</span><div>Phản hồi <b>{rate(sla.response.rate)}</b></div><div>Xử lý <b>{rate(sla.resolution.rate)}</b></div>{(!sla.response.totalCount||!sla.resolution.totalCount)&&<small>—: Chưa có WO trong kỳ</small>}</div></div></section>
    <header className="d-work-heading"><h2>WO cần làm</h2>{open.length>5&&<button onClick={()=>list('WO đang phụ trách',open)}>Xem tất cả ({open.length}) <ChevronRight size={16}/></button>}</header>
    <section className="d-work-list">{needs.map(w=>{
      const a=workAttention(w),checked=w.checklist.filter(c=>c.checked).length,locations=[...new Set(w.ticketIds.map(id=>tickets.find(t=>t.id===id)).filter(Boolean).map(t=>`${t.location} · ${t.area}`))],position=locations[0]||[w.location,w.area].filter(Boolean).join(' · ')
      return <article className={`d-work-card ${a.late.length?'d-work-late':''}`} key={w.id} data-work-id={w.id}><button className="d-work-body" onClick={()=>onSelect(w.id)}><div className="d-work-top"><b>{w.code}</b><span className={`badge ${STATUS[w.status].tone}`}>{STATUS[w.status].label}</span><Flag size={18} fill="currentColor" style={{color:{URGENT:'#e63e35',HIGH:'#f59b23',MEDIUM:'#3171cf',LOW:'#92989e'}[w.priority]}} aria-label={PRIORITY[w.priority].label}/><ChevronRight size={18}/></div><h3 title={w.title}>{w.title}</h3><p className="d-work-location" title={position}>{position||'—'}{locations.length>1?` · +${locations.length-1} vị trí`:''}</p><div className="d-work-timing"><div>{a.late.length?a.late.map(d=><span className="text-red" key={d.key}>{d.key==='dueDate'?<CalendarDays size={16}/>:d.key==='response'?<Play size={16}/>:<Clock3 size={16}/>} {d.key==='dueDate'?'Quá hạn':`Quá ${d.label}`} {duration(NOW-d.due)}</span>):a.next?<span className={a.soon?'text-amber':'muted'}><Clock3 size={16}/>Còn {duration(a.next.due-NOW)} · {a.next.label}</span>:<span>Chưa có hạn</span>}</div>{w.checklist.length>0&&<div className={`d-check-count ${checked===w.checklist.length?'done':''}`}><i><i style={{width:`${checked/w.checklist.length*100}%`}}/></i><b>{checked}/{w.checklist.length}</b></div>}</div></button><div className="d-work-actions">{w.status==='TO_DO'?<button className="d-primary" onClick={()=>start(w)}>Bắt đầu</button>:w.status==='PAUSED'?<button className="d-primary" onClick={()=>start(w)}>Tiếp tục</button>:<><button onClick={()=>{setReason('');setAction({id:w.id,type:'pause'})}}>Tạm dừng</button><button className={checked===w.checklist.length?'d-primary':'d-incomplete'} onClick={()=>setAction({id:w.id,type:checked===w.checklist.length?'complete':'checklist'})}>Hoàn thành{checked<w.checklist.length&&<small>Còn {w.checklist.length-checked}/{w.checklist.length} bước</small>}</button></>}</div></article>
    })}{!needs.length&&<div className="d-empty"><CheckCheck size={32}/><h3>Chưa có WO cần làm</h3><p>Công việc được giao sẽ xuất hiện tại đây.</p></div>}</section>
    <p className="d-demo-note">SLA của WO đang phụ trách · Dữ liệu mẫu · {range.rangeLabel}</p>
    {modalWork&&<div className="d-sheet-backdrop" onMouseDown={()=>setAction(null)}><section className="d-action-sheet" role="dialog" aria-modal="true" aria-label={`${action.type} ${modalWork.code}`} onMouseDown={e=>e.stopPropagation()}><header><h2>{action.type==='pause'?'Tạm dừng':action.type==='complete'?'Hoàn thành':'Checklist'} {modalWork.code}</h2><button aria-label="Đóng" onClick={()=>setAction(null)}><X size={22}/></button></header>{action.type==='pause'?<><label>Lý do tạm dừng *<textarea autoFocus maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label><small>{reason.length}/500</small><button className="d-primary" disabled={!reason.trim()} onClick={()=>{change(modalWork,'PAUSED',{pauseReason:reason.trim(),pausedAt:NOW});setAction(null)}}>Tạm dừng</button></>:action.type==='complete'?<><p>Sau khi hoàn thành, công việc không quay lại trạng thái trước.</p><button className="d-primary" onClick={()=>{change(modalWork,'COMPLETED',{completedAt:NOW,completedByStaffId:CURRENT_STAFF_ID});setAction(null)}}>Hoàn thành</button></>:<><p>{modalWork.checklist.filter(c=>c.checked).length}/{modalWork.checklist.length} bước đã xong</p>{modalWork.checklist.map(c=><label className="d-sheet-check" key={c.id}><input type="checkbox" checked={c.checked} onChange={()=>onUpdate(modalWork.id,{checklist:modalWork.checklist.map(x=>x.id===c.id?{...x,checked:!x.checked}:x)},'Đã cập nhật checklist')}/>{c.text}</label>)}<button className="d-primary" disabled={modalWork.checklist.some(c=>!c.checked)} onClick={()=>setAction({...action,type:'complete'})}>Tiếp tục hoàn thành</button></>}</section></div>}
  </main>
}
