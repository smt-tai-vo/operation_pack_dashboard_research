import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownToLine, ArrowDownUp, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, Eye, FileText, Filter, MapPin, MoreVertical, Pause, Play, Check, CheckCheck, Search, Settings2, ShieldCheck, X } from 'lucide-react'
import { CURRENT_STAFF_ID, HOUR, NOW, PRIORITY, STAFF, STATUS, TICKET_STATUS, dateText } from './data.js'
import { workAttention } from './dashboard-model.js'
import './operation-list.css'
const normalize = text => String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase()
function StatusBadge({status,ticket}) {const item=(ticket?TICKET_STATUS:STATUS)[status];return <span className={`ol-status ${item.tone}`}>{item.label}</span>}
function PriorityBadge({priority}){const item=PRIORITY[priority];return <span className={`ol-priority ${item.tone}`}><i/>{item.label}</span>}
function SlaStatus({item,ticket}) {
 let tone='neutral',text='Chưa bắt đầu SLA xử lý'
 if(ticket){
  if(item.status==='CANCELLED')text='Đã huỷ · Không đánh giá SLA'
  else if(item.resolvedAt!=null){tone=item.resolvedAt<=item.resolveDueAt?'green':'red';text=tone==='green'?'Resolved đúng hạn':'Resolved quá hạn'}
  else if(item.resolveDueAt!=null){tone=item.resolveDueAt<NOW?'red':'blue';text=`${tone==='red'?'Quá hạn xử lý':'Hạn xử lý'}: ${dateText(item.resolveDueAt)}`}
 }else if(item.cancelled){text='Đã huỷ · Không đánh giá SLA'}
 else if(item.completedAt!=null){tone=item.completedAt<=item.resolveDueAt?'green':'red';text=tone==='green'?'Completed đạt SLA xử lý':'Completed quá SLA xử lý'}
 else {const a=workAttention(item);tone=a.late.length?'red':a.soon?'amber':'blue';text=a.late.length?a.late.map(d=>d.key==='dueDate'?'Quá hạn hoàn thành':`Quá ${d.label}`).join(' · '):a.next?`${a.next.label}: ${dateText(a.next.due)}`:'Chưa có hạn'}
 const Icon=tone==='red'?CircleAlert:tone==='green'?ShieldCheck:Clock3
 return <span className={`ol-sla ${tone}`} title={text} aria-label={text}><Icon size={18}/><span className="sr-only">{text}</span></span>
}
function Person({id}) {const s=STAFF.find(x=>x.id===id);return s?<span className="ol-person"><i style={{background:s.color+'18',color:s.color}}>{s.initials}</i><b>{s.name}</b></span>:<span>—</span>}
function RowActions({item,onView,actions=[]}) {
 const trigger=useRef(null),menu=useRef(null),[position,setPosition]=useState(null)
 const close=()=>setPosition(null)
 useEffect(()=>{
  if(!position)return
  const outside=e=>{if(!trigger.current?.contains(e.target)&&!menu.current?.contains(e.target))close()}
  const escape=e=>{if(e.key==='Escape'){e.stopImmediatePropagation();close();trigger.current?.focus()}}
  const scroll=e=>{if(!menu.current?.contains(e.target))close()}
  document.addEventListener('pointerdown',outside)
  document.addEventListener('keydown',escape,true)
  window.addEventListener('resize',close)
  document.addEventListener('scroll',scroll,true)
  menu.current?.querySelector('button')?.focus()
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);window.removeEventListener('resize',close);document.removeEventListener('scroll',scroll,true)}
 },[position])
 const toggle=()=>{if(position)return close();const r=trigger.current.getBoundingClientRect();setPosition({top:r.bottom+6,left:Math.max(8,Math.min(r.right-180,window.innerWidth-188))})}
 return <><button ref={trigger} className="ol-action-trigger" title="Thao tác" aria-label={`Thao tác ${item.code}`} aria-haspopup="menu" aria-expanded={!!position} onClick={toggle}><MoreVertical size={20}/></button>{position&&createPortal(<div ref={menu} className="ol-action-menu" role="menu" aria-label={`Thao tác ${item.code}`} style={position}><button role="menuitem" onClick={()=>{close();onView(item)}}><Eye size={16}/>Xem chi tiết</button>{actions.map(({label,icon:Icon,run})=><button key={label} role="menuitem" onClick={()=>{close();run()}}><Icon size={16}/>{label}</button>)}</div>,document.body)}</>
}
export default function OperationList({listing,works,tickets,onSelect,notify,onUpdate,onUpdateTicket,mpa=false}) {
 const [action,setAction]=useState(null)
 const ticket=listing.kind==='ticket',labels=ticket?TICKET_STATUS:STATUS
 const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[priority,setPriority]=useState('all'),[staff,setStaff]=useState('all'),[type,setType]=useState('all'),[location,setLocation]=useState('all')
 const [page,setPage]=useState(1),[size,setSize]=useState(10),[sort,setSort]=useState('DESC'),[advanced,setAdvanced]=useState(false),[columnsOpen,setColumnsOpen]=useState(false),[detail,setDetail]=useState(null)
 useEffect(()=>{if(!detail&&!columnsOpen)return;const close=e=>{if(e.key==='Escape'){e.stopImmediatePropagation();detail?setDetail(null):setColumnsOpen(false)}};document.addEventListener('keydown',close,true);return()=>document.removeEventListener('keydown',close,true)},[detail,columnsOpen])
 const viewWork=id=>{setColumnsOpen(false);setDetail(null);onSelect(id)}
 const columns=[['code',ticket?'Mã ticket':'Mã WO'],...(ticket?[['type','Loại ticket']]:[['title','Tên công việc']]),['status','Trạng thái'],['sla','SLA'],['priority','Ưu tiên'],...(ticket?[['works','Work order']]:[['staff','Staff phụ trách'],['tickets','Ticket liên kết']]),['location','Location'],['area','Khu vực'],['created','Ngày tạo'],['actions','']]
 const [hidden,setHidden]=useState([])
 const ids=new Set(listing.ids),base=(ticket?tickets:works).filter(x=>ids.has(x.id))
 const items=base.filter(x=>(status==='all'||x.status===status)&&(priority==='all'||x.priority===priority)&&(staff==='all'||x.staffId===staff)&&(type==='all'||x.type===type)&&(location==='all'||x.location===location)&&normalize([x.code,x.title,x.type,x.location,x.area,STAFF.find(s=>s.id===x.staffId)?.name].join(' ')).includes(normalize(search))).sort((a,b)=>(a.createdAt-b.createdAt)*(sort==='ASC'?1:-1)||a.id.localeCompare(b.id))
 const totalPages=Math.max(1,Math.ceil(items.length/size)),current=Math.min(page,totalPages),shown=items.slice((current-1)*size,current*size)
 const filtered=search||status!=='all'||priority!=='all'||staff!=='all'||type!=='all'||location!=='all'
 const change=setter=>value=>{setter(value);setPage(1)}
 const clear=()=>{setSearch('');setStatus('all');setPriority('all');setStaff('all');setType('all');setLocation('all');setPage(1)}
 const exportCsv=()=>{
  const rows=[['Mã',ticket?'Loại ticket':'Tên công việc','Trạng thái','Ưu tiên','Location','Khu vực','Ngày tạo'],...items.map(x=>[x.code,ticket?x.type:x.title,labels[x.status].label,PRIORITY[x.priority].label,x.location,x.area,dateText(x.createdAt)])]
  const csv='\uFEFF'+rows.map(row=>row.map(c=>`"${String(c??'').replaceAll('"','""')}"`).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=ticket?'ticket-requests.csv':'work-orders.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`Đã xuất ${items.length} ${ticket?'ticket':'WO'}`)
 }
 const open=x=>{setColumnsOpen(false);ticket?setDetail(x.id):viewWork(x.id)}
 const activeColumns=columns.filter(([key])=>!hidden.includes(key))
 const cell=(key,x)=>{
  if(key==='code')return <button className="ol-code" onClick={()=>open(x)}>#{x.code}</button>
  if(key==='type')return <span className="ol-type"><FileText size={17}/><b>{x.type}</b></span>
  if(key==='title')return <span className="ol-title" title={x.title}>{x.title}</span>
  if(key==='status')return <StatusBadge status={x.status} ticket={ticket}/>
  if(key==='sla')return <SlaStatus item={x} ticket={ticket}/>
  if(key==='priority')return <PriorityBadge priority={x.priority}/>
  if(key==='staff')return <Person id={x.staffId}/>
  if(key==='works'){const linked=works.filter(w=>w.ticketIds.includes(x.id));return linked.length?<span className="ol-links"><button onClick={()=>viewWork(linked[0].id)}>#{linked[0].code}</button>{linked.length>1&&<span title={linked.map(w=>w.code).join(', ')}>+{linked.length-1}</span>}</span>:'—'}
  if(key==='tickets'){const linked=x.ticketIds.map(id=>tickets.find(t=>t.id===id)).filter(Boolean);return linked.length?<span className="ol-links"><span title={linked.map(t=>t.code).join(', ')}>#{linked[0].code}</span>{linked.length>1&&<span>+{linked.length-1}</span>}</span>:'—'}
  if(key==='location')return x.location||'—'
  if(key==='area')return <span className="ol-area" title={x.area}>{x.area||'—'}</span>
  if(key==='created')return dateText(x.createdAt)
  const canAct=!ticket&&['TO_DO','IN_PROGRESS','PAUSED'].includes(x.status)&&(!mpa||x.staffId===CURRENT_STAFF_ID)
  const actions=ticket&&!mpa?[...(x.status==='SUBMITTED'?[{label:'Duyệt',icon:Check,run:()=>setAction({id:x.id,type:'approve'})}]:[]),...(x.status==='APPROVED'?[{label:'Bắt đầu',icon:Play,run:()=>setAction({id:x.id,type:'ticketStart'})}]:[]),...(x.status==='IN_PROGRESS'&&works.filter(w=>w.ticketIds.includes(x.id)).every(w=>['COMPLETED','CLOSED'].includes(w.status))?[{label:'Hoàn thành',icon:CheckCheck,run:()=>setAction({id:x.id,type:'resolve'})}]:[]),...(['SUBMITTED','APPROVED','IN_PROGRESS'].includes(x.status)?[{label:'Huỷ ticket',icon:X,run:()=>setAction({id:x.id,type:'cancel'})}]:[])]:canAct?(x.status==='TO_DO'?[{label:'Bắt đầu',icon:Play,run:()=>setAction({id:x.id,type:'start'})}]:x.status==='PAUSED'?[{label:'Tiếp tục',icon:Play,run:()=>setAction({id:x.id,type:'resume'})}]:[{label:'Tạm dừng',icon:Pause,run:()=>setAction({id:x.id,type:'pause'})},{label:'Hoàn thành',icon:CheckCheck,run:()=>setAction({id:x.id,type:'complete'})}]):[]
  return <RowActions item={x} onView={open} actions={actions}/>
 }
 const detailTicket=tickets.find(t=>t.id===detail)
 const actionWork=!ticket&&works.find(w=>w.id===action?.id)
 const actionTicket=ticket&&tickets.find(t=>t.id===action?.id)
 return <div className="operation-list">{actionTicket&&<TicketActionSheet key={`${action.id}-${action.type}`} ticket={actionTicket} works={works} type={action.type} onClose={()=>setAction(null)} onUpdate={onUpdateTicket}/>} {actionWork&&<WorkActionSheet key={`${action.id}-${action.type}`} work={actionWork} type={action.type} onClose={()=>setAction(null)} onUpdate={onUpdate}/> }<div className="ol-heading"><div><h3>{ticket?'Ticket request':'Work order'} <span>{base.length}</span></h3><p>Danh sách theo điều kiện đã chọn trên dashboard</p></div><button className="ol-export" disabled={!items.length} onClick={exportCsv}><ArrowDownToLine size={16}/>Xuất CSV</button></div>
  <div className="ol-toolbar"><label className="ol-search"><Search size={17}/><input aria-label="Search report" placeholder={ticket?'Tìm theo mã ticket, loại ticket...':'Tìm mã WO, tên công việc, staff...'} value={search} onChange={e=>change(setSearch)(e.target.value)}/>{search&&<button aria-label="Xoá tìm kiếm" onClick={()=>change(setSearch)('')}><X size={14}/></button>}</label>
   <label className="ol-select"><span className="sr-only">{ticket?'Loại ticket':'Staff phụ trách'}</span><select aria-label={ticket?'Report ticket type':'Report staff'} value={ticket?type:staff} onChange={e=>change(ticket?setType:setStaff)(e.target.value)}><option value="all">{ticket?'Loại ticket':'Staff phụ trách'}</option>{ticket?[...new Set(base.map(x=>x.type))].map(t=><option key={t}>{t}</option>):STAFF.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><ChevronDown size={14}/></label>
   <label className="ol-select"><select aria-label="Report status" value={status} onChange={e=>change(setStatus)(e.target.value)}><option value="all">Trạng thái</option>{Object.entries(labels).map(([key,v])=><option key={key} value={key}>{v.label}</option>)}</select><ChevronDown size={14}/></label>
   <button className={`ol-filter ${advanced?'active':''}`} aria-expanded={advanced} onClick={()=>setAdvanced(!advanced)}><Filter size={17}/>Bộ lọc{(priority!=='all'||location!=='all')&&<i/>}</button>{filtered&&<button className="ol-clear" onClick={clear}>Xoá bộ lọc</button>}
  </div>{advanced&&<div className="ol-advanced"><label>Ưu tiên<select aria-label="Report priority" value={priority} onChange={e=>change(setPriority)(e.target.value)}><option value="all">Tất cả ưu tiên</option>{Object.entries(PRIORITY).map(([key,v])=><option key={key} value={key}>{v.label}</option>)}</select></label><label>Location<select aria-label="Report location" value={location} onChange={e=>change(setLocation)(e.target.value)}><option value="all">Tất cả location trong phạm vi</option>{[...new Set(base.map(x=>x.location).filter(Boolean))].map(l=><option key={l}>{l}</option>)}</select></label></div>}
  <div className="ol-context"><span className="ol-context-tag"><Filter size={12}/>{listing.title}</span><span>Phạm vi từ dashboard được giữ nguyên khi đổi bộ lọc.</span></div>
  <div className="ol-table-wrap"><table className="ol-table"><thead><tr>{activeColumns.map(([key,label])=><th key={key} className={`ol-col-${key}`}>{key==='created'?<button className="ol-sort" onClick={()=>{setSort(sort==='DESC'?'ASC':'DESC');setPage(1)}}>{label}<ArrowDownUp size={12}/><span className="sr-only">{sort}</span></button>:key==='actions'?<div className="ol-settings-wrap"><button aria-label="Tuỳ chọn cột" aria-expanded={columnsOpen} onClick={()=>setColumnsOpen(!columnsOpen)}><Settings2 size={17}/></button>{columnsOpen&&<div className="ol-columns" role="group" aria-label="Các cột hiển thị"><b>Hiển thị cột</b>{columns.filter(([k])=>!['code','actions'].includes(k)).map(([k,name])=><label key={k}><input type="checkbox" checked={!hidden.includes(k)} onChange={()=>setHidden(hidden.includes(k)?hidden.filter(x=>x!==k):[...hidden,k])}/>{name}</label>)}<button onClick={()=>setHidden([])}>Khôi phục mặc định</button></div>}</div>:label}</th>)}</tr></thead><tbody>{shown.length?shown.map(x=><tr key={x.id}>{activeColumns.map(([key])=><td className={`ol-col-${key}`} key={key}>{cell(key,x)}</td>)}</tr>):<tr><td colSpan={activeColumns.length}><div className="ol-empty"><Search size={28}/><b>Không có kết quả phù hợp</b><span>Thử thay đổi bộ lọc trong phạm vi đã chọn.</span>{filtered&&<button onClick={clear}>Xoá bộ lọc</button>}</div></td></tr>}</tbody></table></div>
  <footer className="ol-pagination"><span className="report-result-count"><b>{items.length}</b> kết quả</span><span>{items.length?(current-1)*size+1:0}–{Math.min(current*size,items.length)} / {items.length}</span><div><button aria-label="Previous page" disabled={current===1} onClick={()=>setPage(current-1)}><ChevronLeft size={16}/></button>{Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(n=><button key={n} className={current===n?'active':''} onClick={()=>setPage(n)}>{n}</button>)}<button aria-label="Next page" disabled={current===totalPages} onClick={()=>setPage(current+1)}><ChevronRight size={16}/></button><select aria-label="Số dòng mỗi trang" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1)}}>{[10,20,50].map(n=><option key={n} value={n}>{n} / trang</option>)}</select></div></footer>
  {detailTicket&&<div className="ol-detail-backdrop" onMouseDown={()=>setDetail(null)}><aside className="ol-ticket-detail" role="dialog" aria-modal="true" aria-label={`Chi tiết ${detailTicket.code}`} onMouseDown={e=>e.stopPropagation()}><header><div><small>TICKET REQUEST</small><h2>{detailTicket.code}</h2></div><button aria-label="Đóng chi tiết ticket" onClick={()=>setDetail(null)}><X size={22}/></button></header><StatusBadge status={detailTicket.status} ticket/><h3>{detailTicket.type}</h3><p><MapPin size={16}/>{detailTicket.location} · {detailTicket.area}</p><section><h4>Nội dung yêu cầu</h4><p>{detailTicket.note}</p></section><section><h4>Thời gian & SLA</h4><dl><dt>Ngày tạo</dt><dd>{dateText(detailTicket.createdAt)}</dd><dt>Ngày duyệt</dt><dd>{dateText(detailTicket.approvedAt)}</dd><dt>Ngày hoàn tất</dt><dd>{dateText(detailTicket.resolvedAt)}</dd><dt>Hạn xử lý</dt><dd>{dateText(detailTicket.resolveDueAt)}</dd></dl><SlaStatus item={detailTicket} ticket/></section><section><h4>Ghi chú kết quả</h4><p>{detailTicket.resolutionNote||'—'}</p>{detailTicket.cancellationReason&&<><h4>Lý do huỷ</h4><p>{detailTicket.cancellationReason}</p></>}</section><section><h4>Work order liên kết</h4>{works.filter(w=>w.ticketIds.includes(detailTicket.id)).map(w=><button className="ol-related" key={w.id} onClick={()=>viewWork(w.id)}><b>{w.code}</b><StatusBadge status={w.status}/><ChevronRight size={16}/></button>)}{!works.some(w=>w.ticketIds.includes(detailTicket.id))&&<p>Chưa có WO liên kết.</p>}</section></aside></div>}
 </div>
}

function WorkActionSheet({work:w,type,onClose,onUpdate}) {
 const [reason,setReason]=useState('')
 const labels={start:'Bắt đầu',resume:'Tiếp tục',pause:'Tạm dừng',complete:'Hoàn thành'}
 const remaining=w.checklist.filter(c=>!c.checked).length
 useEffect(()=>{const escape=e=>{if(e.key==='Escape'){e.stopImmediatePropagation();onClose()}};document.addEventListener('keydown',escape,true);return()=>document.removeEventListener('keydown',escape,true)},[onClose])
 const submit=()=>{
  if(type==='pause'&&!reason.trim()||type==='complete'&&remaining)return
  const changes=type==='start'||type==='resume'?{status:'IN_PROGRESS',startedAt:w.startedAt??NOW,startedByStaffId:w.startedByStaffId??w.staffId,resolveDueAt:w.resolveDueAt??NOW+w.resolveHours*HOUR,assignmentStartedAt:w.assignmentStartedAt??NOW,pauseReason:null,pausedAt:null}:type==='pause'?{status:'PAUSED',pauseReason:reason.trim(),pausedAt:NOW}:{status:'COMPLETED',completedAt:NOW,completedByStaffId:w.staffId,assignmentCompletedAt:NOW}
  onUpdate(w.id,changes,`${labels[type]} ${w.code}`);onClose()
 }
 return createPortal(<div className="d-sheet-backdrop ol-work-action" onMouseDown={onClose}><section className="d-action-sheet" role="dialog" aria-modal="true" aria-label={`${labels[type]} ${w.code}`} onMouseDown={e=>e.stopPropagation()}><header><h2>{labels[type]} {w.code}</h2><button aria-label="Đóng thao tác" onClick={onClose}><X size={22}/></button></header><p>{w.title}</p>{type==='pause'?<><label>Lý do tạm dừng *<textarea autoFocus maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label><small>{reason.length}/500</small></>:type==='complete'?<><p>Hoàn tất checklist trước khi xác nhận hoàn thành WO.</p>{w.checklist.map(c=><label className="d-sheet-check" key={c.id}><input type="checkbox" checked={c.checked} onChange={()=>onUpdate(w.id,{checklist:w.checklist.map(x=>x.id===c.id?{...x,checked:!x.checked}:x)},'Đã cập nhật checklist')}/>{c.text}</label>)}{remaining>0&&<p className="text-amber">Còn {remaining}/{w.checklist.length} bước chưa hoàn thành.</p>}<p>Sau khi hoàn thành, công việc không quay lại trạng thái trước.</p></>:<p>Xác nhận {labels[type].toLowerCase()} công việc này?</p>}<div className="ol-action-footer"><button onClick={onClose}>Quay lại</button><button className="d-primary" disabled={type==='pause'&&!reason.trim()||type==='complete'&&remaining>0} onClick={submit}>Xác nhận {labels[type].toLowerCase()}</button></div></section></div>,document.body)
}

function TicketActionSheet({ticket:t,works,type,onClose,onUpdate}) {
 const [note,setNote]=useState('')
 const labels={approve:'Duyệt',ticketStart:'Bắt đầu',resolve:'Hoàn thành',cancel:'Huỷ ticket'}
 const linked=works.filter(w=>w.ticketIds.includes(t.id))
 const noteRequired=type==='cancel'||type==='resolve'&&!linked.length
 const canResolve=type!=='resolve'||t.status==='IN_PROGRESS'&&linked.every(w=>['COMPLETED','CLOSED'].includes(w.status))
 useEffect(()=>{const escape=e=>{if(e.key==='Escape'){e.stopImmediatePropagation();onClose()}};document.addEventListener('keydown',escape,true);return()=>document.removeEventListener('keydown',escape,true)},[onClose])
 const submit=()=>{
  if(noteRequired&&!note.trim()||!canResolve)return
  const changes=type==='approve'?{status:'APPROVED',approvedAt:NOW}:type==='ticketStart'?{status:'IN_PROGRESS',startedAt:NOW}:type==='resolve'?{status:'RESOLVED',resolvedAt:NOW,resolutionNote:note.trim()||null}:{status:'CANCELLED',cancelledAt:NOW,cancellationReason:note.trim()}
  onUpdate(t.id,changes,`${labels[type]} ${t.code}`);onClose()
 }
 return createPortal(<div className="d-sheet-backdrop ol-work-action" onMouseDown={onClose}><section className="d-action-sheet" role="dialog" aria-modal="true" aria-label={`${labels[type]} ${t.code}`} onMouseDown={e=>e.stopPropagation()}><header><h2>{labels[type]} {t.code}</h2><button aria-label="Đóng thao tác ticket" onClick={onClose}><X size={22}/></button></header><p>{t.type} · {t.location}</p>{['resolve','cancel'].includes(type)?<><label>{type==='cancel'?'Lý do huỷ':'Ghi chú kết quả'}{noteRequired?' *':''}<textarea autoFocus aria-label="Ticket action note" maxLength={500} value={note} onChange={e=>setNote(e.target.value)}/></label><small>{note.length}/500</small>{type==='cancel'&&<p>WO còn mở sẽ được huỷ nếu tất cả ticket liên kết đều đã huỷ.</p>}</>:<p>Xác nhận {labels[type].toLowerCase()} ticket này?</p>}<div className="ol-action-footer"><button onClick={onClose}>Quay lại</button><button className="d-primary" disabled={noteRequired&&!note.trim()||!canResolve} onClick={submit}>Xác nhận {labels[type].toLowerCase()}</button></div></section></div>,document.body)
}
