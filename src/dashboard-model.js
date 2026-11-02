import { NOW, HOUR, STAFF, isOpen, isFinished } from './data.js'
import { dateInputValue, customPeriod } from './report-period.js'
export const DAY = 24 * HOUR
export function dashboardPeriod(period, startDate, endDate, now = NOW) {
  const today = dateInputValue(now)
  const end = period === 'custom' ? endDate : today
  const start = period === 'custom' ? startDate : dateInputValue(now - (Number(period) - 1) * DAY)
  const calendarDays = (Date.parse(`${end}T00:00:00+07:00`) - Date.parse(`${start}T00:00:00+07:00`)) / DAY + 1
  const range = customPeriod({ startDate: start, endDate: end, now })
  return { ...range, valid: range.valid && calendarDays >= 1 && calendarDays <= 90 && end <= today, startDate: start, endDate: end }
}
export const inside = (at, range) => range.valid && Number.isFinite(at) && at >= range.from && at <= range.to
export const validWork = w => !w.deletedAt && !w.cancelled && !['CANCELLED', 'TICKET_CANCELLED'].includes(w.closeReason)
export function deadlines(w) {
  if (!isOpen(w)) return []
  return [
    ...(!w.startedAt ? [{ key: 'response', label: 'SLA phản hồi', due: w.responseDueAt, threshold: w.responseHours * HOUR / 4 }] : []),
    ...(w.startedAt ? [{ key: 'resolution', label: 'SLA xử lý', due: w.resolveDueAt, threshold: 4 * HOUR }] : []),
    ...(w.dueDate ? [{ key: 'dueDate', label: 'Hạn hoàn thành', due: w.dueDate, threshold: 4 * HOUR }] : []),
  ].filter(d => Number.isFinite(d.due)).sort((a, b) => a.due - b.due)
}
export function workAttention(w, now = NOW) {
  const all = deadlines(w)
  const late = all.filter(d => d.due < now)
  const display = all.filter(d => !w.startedAt || !w.dueDate || d.key !== 'resolution')
  const next = display[0]
  const soon = !late.length && display.some(d => d.due - now <= d.threshold)
  return { late, next, soon, due: late[0]?.due ?? display.find(d => d.due - now <= d.threshold)?.due ?? next?.due ?? Infinity }
}
export const overdue = w => workAttention(w).late.length > 0
export const dueSoon = w => workAttention(w).soon
export function attentionSort(a, b) {
  const rank = w => overdue(w) ? 0 : dueSoon(w) ? 1 : w.priority === 'URGENT' ? 2 : w.status === 'TO_DO' ? 3 : 4
  const priority = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  return rank(a) - rank(b) || (rank(a) <= 1 ? workAttention(a).due - workAttention(b).due : 0) || priority[a.priority] - priority[b.priority] || a.assignedAt - b.assignedAt || a.id.localeCompare(b.id)
}
export function ratio(items, predicate) {
  const met = items.filter(predicate)
  return { items, met, breached: items.filter(x => !predicate(x)), metCount: met.length, totalCount: items.length, rate: items.length ? Math.round(met.length / items.length * 100) : null }
}
export function woSla(works, range) {
  const valid = works.filter(validWork)
  const response = valid.filter(w => inside(w.startedAt, range) || (inside(w.responseDueAt, range) && (w.startedAt == null || w.startedAt > range.to)))
  const resolution = valid.filter(w => inside(w.completedAt, range) && Number.isFinite(w.startedAt))
  return { response: ratio(response, w => w.startedAt != null && w.startedAt <= w.responseDueAt), resolution: ratio(resolution, w => w.completedAt <= w.resolveDueAt) }
}
export const ticketSla = (tickets, range) => ratio(tickets.filter(t => !t.deletedAt && t.status !== 'CANCELLED' && inside(t.resolvedAt, range)), t => t.resolvedAt <= t.resolveDueAt)
export function completion(works, range) {
  const assigned = works.filter(w => validWork(w) && inside(w.assignedAt, range))
  return { assigned, completed: assigned.filter(isFinished) }
}
export function workLocations(w, tickets) {
  const linked = tickets.filter(t => !t.deletedAt && w.ticketIds.includes(t.id))
  return [...new Set(linked.length ? linked.map(t => t.location).filter(Boolean) : [w.location].filter(Boolean))]
}
export function workScope(w, tickets, location, type) {
  return !w.deletedAt && (location === 'all' || workLocations(w, tickets).includes(location)) && (type === 'all' || tickets.some(t => !t.deletedAt && w.ticketIds.includes(t.id) && t.type === type))
}
export function readyToResolve(ticket, works) {
  const linked = works.filter(w => !w.deletedAt && w.ticketIds.includes(ticket.id))
  return ticket.workflowMode !== 'workflow' && !ticket.workflowRunId && ticket.status === 'IN_PROGRESS' && linked.length > 0 && linked.every(w => ['COMPLETED', 'CLOSED'].includes(w.status))
}
export function staffRows(works, range) {
  return STAFF.map(s => {
    const items = works.filter(w => w.staffId === s.id)
    const sla = woSla(items, range)
    return { id: s.id, name: s.name, active: s.active !== false, open: items.filter(isOpen), late: items.filter(w => isOpen(w) && overdue(w)), completed: sla.resolution.items, ...sla }
  }).filter(s => s.open.length || s.response.totalCount || s.resolution.totalCount)
}
export function sortedRows(rows, sort) {
  const number = row => sort.key === 'response' || sort.key === 'resolution' || sort.key === 'ticketResolution' ? row[sort.key].rate : row[sort.key]?.length
  return rows.slice().sort((a,b) => {
    const av = number(a), bv = number(b)
    return (av == null) - (bv == null) || (av !== bv ? (av - bv) * (sort.direction === 'ASC' ? 1 : -1) : b.late.length - a.late.length || b.open.length - a.open.length || a.name.localeCompare(b.name))
  })
}
