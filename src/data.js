export const HOUR = 3_600_000
export const DAY = 24 * HOUR
export const NOW = Date.parse('2026-10-22T10:30:00+07:00')
export const CURRENT_STAFF_ID = 'an'
export const LOCATIONS = ['Enouvo Space', 'Enouvo Building', 'Riverside Office']
export const TYPES = ['Điều hòa', 'Điện', 'Nước', 'Chiếu sáng', 'Khác']
export const STAFF = [
  { id: 'an', name: 'Nguyễn Minh An', initials: 'MA', color: '#5c6de8', role: 'Kỹ thuật viên' },
  { id: 'bao', name: 'Trần Quốc Bảo', initials: 'QB', color: '#189e93', role: 'Kỹ thuật viên' },
  { id: 'nam', name: 'Lê Hoàng Nam', initials: 'HN', color: '#bd7c3e', role: 'Kỹ thuật viên' },
  { id: 'huy', name: 'Phạm Gia Huy', initials: 'GH', color: '#b665a2', role: 'Kỹ thuật viên' },
]
export const STATUS = {
  TO_DO: { label: 'Chưa bắt đầu', tone: 'neutral' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'blue' },
  PAUSED: { label: 'Tạm dừng', tone: 'amber' },
  COMPLETED: { label: 'Hoàn thành', tone: 'green' },
  CLOSED: { label: 'Đã đóng', tone: 'neutral' },
}
export const TICKET_STATUS = {
  SUBMITTED: { label: 'Chờ duyệt', tone: 'amber' },
  APPROVED: { label: 'Đã duyệt', tone: 'blue' },
  IN_PROGRESS: { label: 'Đang xử lý', tone: 'blue' },
  RESOLVED: { label: 'Đã xử lý', tone: 'green' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
}
export const PRIORITY = {
  URGENT: { label: 'Khẩn cấp', tone: 'red' },
  HIGH: { label: 'Cao', tone: 'amber' },
  MEDIUM: { label: 'Trung bình', tone: 'blue' },
  LOW: { label: 'Thấp', tone: 'neutral' },
}
const titles = ['Sửa máy lạnh phòng họp Lotus', 'Kiểm tra tủ điện tầng 2', 'Xử lý rò nước khu vực pantry', 'Thay đèn hành lang phía Đông', 'Bảo dưỡng máy lạnh định kỳ', 'Kiểm tra ổ cắm khu vực lễ tân', 'Vệ sinh hệ thống cấp nước', 'Kiểm tra hệ thống thông gió']
const checklistText = ['Kiểm tra hiện trạng và xác định nguyên nhân', 'Ngắt nguồn, bảo đảm an toàn khu vực', 'Thực hiện sửa chữa hoặc thay vật tư', 'Chạy thử và kiểm tra kết quả', 'Vệ sinh khu vực, bàn giao công việc']
const phaseStatuses = ['IN_PROGRESS', 'TO_DO', 'PAUSED', 'COMPLETED', 'CLOSED', 'COMPLETED', 'TO_DO', 'IN_PROGRESS', 'CLOSED', 'COMPLETED']

export function initialData() {
  const tickets = Array.from({ length: 36 }, (_, i) => {
    const status = ['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'APPROVED', 'IN_PROGRESS', 'CANCELLED'][i % 6]
    const createdAt = NOW - (i % 18) * DAY - (3 + i % 5) * HOUR
    const respondedAt = status === 'SUBMITTED' ? null : createdAt + (i % 3 === 0 ? 2.8 : 0.6) * HOUR
    const resolvedAt = status === 'RESOLVED' ? Math.min(NOW - HOUR, createdAt + (i % 4 === 0 ? 30 : 9) * HOUR) : null
    return {
      id: `t${i}`, code: `TIC-${String(4289 - i).padStart(6, '0')}`, type: TYPES[i % 5],
      location: LOCATIONS[Math.floor(i / 2) % 3], area: `Tầng ${i % 5 + 1} · ${['Phòng họp Lotus', 'Pantry', 'Khu làm việc', 'Lễ tân'][i % 4]}`,
      status, createdAt, respondedAt, resolvedAt, responseDueAt: createdAt + 2 * HOUR, resolveDueAt: createdAt + 24 * HOUR,
      priority: ['HIGH', 'MEDIUM', 'URGENT', 'LOW'][i % 4],
      note: ['Máy lạnh có tiếng ồn và làm mát yếu. Vui lòng kiểm tra giúp.', 'Ổ cắm tại khu vực làm việc chập chờn.', 'Nước bị rò tại khớp nối dưới bồn rửa.', 'Đèn nhấp nháy, cần kiểm tra và thay thế.'][i % 4],
      ready: status === 'IN_PROGRESS' && i % 2 === 0,
    }
  })
  const works = Array.from({ length: 40 }, (_, i) => {
    const staff = STAFF[i % 4]
    const status = phaseStatuses[Math.floor(i / 4)]
    const assignedAt = NOW - (Math.floor(i / 4) * 2 + i % 2) * DAY - (2 + i % 3) * HOUR
    const createdAt = assignedAt - HOUR
    const responseHours = i % 3 === 0 ? 1 : 2
    const resolveHours = i === 0 ? 6 : i % 3 === 0 ? 12 : 24
    const startedAt = status === 'TO_DO' ? null : Math.min(NOW - HOUR / 2, assignedAt + responseHours * (i % 3 === 0 ? 1.4 : 0.45) * HOUR)
    const closeReason = status === 'CLOSED' ? (i % 3 === 0 ? 'CANCELLED' : i % 3 === 1 ? 'TICKET_CANCELLED' : 'ARCHIVED') : null
    const cancelled = ['CANCELLED', 'TICKET_CANCELLED'].includes(closeReason)
    const finished = status === 'COMPLETED' || closeReason === 'ARCHIVED'
    const completedAt = finished ? Math.min(NOW - HOUR / 3, assignedAt + resolveHours * (i % 3 === 0 ? 1.3 : 0.65) * HOUR) : null
    const checklist = i % 7 === 6 ? [] : checklistText.slice(0, 3 + i % 3).map((text, j) => ({ id: `${i}-${j}`, text, checked: finished || (status !== 'TO_DO' && j < i % 3 + 1) }))
    const candidates = tickets.filter(t => t.location === LOCATIONS[i % 3] && t.createdAt <= createdAt && (cancelled ? false : finished ? ['IN_PROGRESS', 'RESOLVED'].includes(t.status) : ['APPROVED', 'IN_PROGRESS'].includes(t.status)))
    const linked = i % 4 === 3 || !candidates.length ? [] : [candidates[i % candidates.length]]
    return {
      id: `w${i}`, code: `WO-${String(142 - i).padStart(6, '0')}`, title: titles[i % titles.length],
      staffId: staff.id, location: LOCATIONS[i % 3], area: `Tầng ${i % 5 + 1} · ${['Phòng họp Lotus', 'Pantry', 'Hành lang Đông', 'Lễ tân'][i % 4]}`,
      status, priority: ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'HIGH'][i % 5],
      createdAt, assignedAt, startedAt, completedAt, responseHours, resolveHours,
      responseDueAt: createdAt + responseHours * HOUR, resolveDueAt: createdAt + resolveHours * HOUR,
      assignmentStartedAt: startedAt, assignmentCompletedAt: completedAt,
      closeReason, cancelled, checklist, ticketIds: linked.map(t => t.id),
      note: 'Kiểm tra hiện trạng, bảo đảm an toàn trước khi thực hiện. Báo quản lý nếu cần bổ sung vật tư.',
      pauseReason: status === 'PAUSED' ? 'Đang chờ vật tư thay thế từ nhà cung cấp.' : null,
      history: [
        ...(finished ? [{ text: `${staff.name} đã hoàn thành công việc`, at: completedAt }] : []),
        ...(status === 'PAUSED' ? [{ text: `${staff.name} đã tạm dừng để chờ vật tư`, at: NOW - 3 * HOUR }] : []),
        ...(startedAt ? [{ text: `${staff.name} đã bắt đầu công việc`, at: startedAt }] : []),
        { text: `Đã giao công việc cho ${staff.name}`, at: assignedAt },
      ],
    }
  })
  for (const ticket of tickets) {
    const linked = works.filter(w => w.ticketIds.includes(ticket.id))
    ticket.ready = ticket.status === 'IN_PROGRESS' && linked.length > 0 && linked.every(w => ['COMPLETED', 'CLOSED'].includes(w.status))
  }
  return { tickets, works }
}

export const isOpen = w => ['TO_DO', 'IN_PROGRESS', 'PAUSED'].includes(w.status)
export const isFinished = w => Boolean(w.completedAt) && !w.cancelled
export const dateText = at => at ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at) : '—'
export const dayText = at => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }).format(at)
export const duration = ms => {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes < 60) return `${minutes} phút`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ ${minutes % 60 ? `${minutes % 60} phút` : ''}`.trim()
  return `${Math.floor(minutes / 1440)} ngày ${Math.floor(minutes % 1440 / 60)} giờ`
}
export function timing(w) {
  if (w.status === 'CLOSED') return { label: w.closeReason === 'ARCHIVED' ? 'Đã lưu trữ' : 'Đã hủy', tone: 'neutral' }
  if (w.status === 'COMPLETED') return { label: 'Đã hoàn thành', tone: 'green' }
  const response = !w.startedAt
  const due = response ? w.responseDueAt : w.resolveDueAt
  const delta = due - NOW
  return { label: delta < 0 ? `Quá hạn ${duration(-delta)}` : `Còn ${duration(delta)}`, detail: response ? 'Phản hồi' : 'Hoàn thành', tone: delta < 0 ? 'red' : delta < 4 * HOUR ? 'amber' : 'muted', due }
}
export function percentage(items, test) {
  return items.length ? Math.round(items.filter(test).length / items.length * 100) : null
}
export function slaStats(items, kind = 'work') {
  const valid = items.filter(x => kind === 'ticket' ? x.status !== 'CANCELLED' : !x.cancelled)
  const responses = valid.filter(x => kind === 'ticket' ? x.respondedAt : x.startedAt)
  const resolves = valid.filter(x => kind === 'ticket' ? x.resolvedAt : x.completedAt)
  return {
    response: percentage(responses, x => (kind === 'ticket' ? x.respondedAt : x.startedAt) <= x.responseDueAt),
    resolve: percentage(resolves, x => (kind === 'ticket' ? x.resolvedAt : x.completedAt) <= x.resolveDueAt),
    responseN: responses.length, resolveN: resolves.length,
  }
}
export function staffStats(works, staffId, from, to) {
  const all = works.filter(w => w.staffId === staffId)
  const assigned = all.filter(w => w.assignedAt >= from && w.assignedAt <= to)
  const responses = all.filter(w => !w.cancelled && w.assignmentStartedAt >= from && w.assignmentStartedAt <= to && w.assignmentStartedAt != null)
  const completed = all.filter(w => isFinished(w) && w.assignmentCompletedAt >= from && w.assignmentCompletedAt <= to)
  return {
    open: all.filter(isOpen), assigned, completed,
    response: percentage(responses, w => w.assignmentStartedAt <= w.assignedAt + w.responseHours * HOUR),
    resolve: percentage(completed, w => w.assignmentCompletedAt <= w.assignedAt + w.resolveHours * HOUR),
    responseN: responses.length, resolveN: completed.length,
    responseTime: responses.length ? responses.reduce((n, w) => n + w.assignmentStartedAt - w.assignedAt, 0) / responses.length : null,
    resolveTime: completed.length ? completed.reduce((n, w) => n + w.assignmentCompletedAt - w.assignedAt, 0) / completed.length : null,
  }
}
