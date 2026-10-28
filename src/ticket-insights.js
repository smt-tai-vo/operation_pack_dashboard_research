import { NOW, durationStats, slaStats } from './data.js'

const inPeriod = (at, from, to) => Number.isFinite(at) && at >= from && at <= to
const byCount = (a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label, 'vi')
function grouped(items, identity, label) {
  const groups = new Map()
  for (const item of items) {
    const key = identity(item)
    if (key == null) continue
    if (!groups.has(key)) groups.set(key, { id: key, label: label(item), items: [] })
    groups.get(key).items.push(item)
  }
  return [...groups.values()].sort(byCount)
}
export function ticketInsights(tickets, from, to) {
  const created = tickets.filter(ticket => inPeriod(ticket.createdAt, from, to))
  const resolved = durationStats(tickets, 'ticket', from, to).resolves
  const periodLength = Number.isFinite(from) && Number.isFinite(to) && from <= to ? to - from + 1 : NaN
  const previousFrom = from - periodLength
  const previousTo = from - 1
  const previous = tickets.filter(ticket => inPeriod(ticket.createdAt, previousFrom, previousTo))
  const typeKey = ticket => ticket.type || 'Không rõ loại'
  const occurrenceByType = grouped(created, typeKey, typeKey)
  const resolutionByType = grouped(resolved, typeKey, typeKey)
  const locationRanking = grouped(created, ticket => ticket.location || 'Chưa xác định Location', ticket => ticket.location || 'Chưa xác định Location')
  const performance = grouped(tickets, typeKey, typeKey).map(group => {
    const times = durationStats(group.items, 'ticket', from, to)
    const createdItems = group.items.filter(ticket => inPeriod(ticket.createdAt, from, to))
    const open = group.items.filter(ticket => ticket.createdAt <= NOW && !['RESOLVED', 'CANCELLED'].includes(ticket.status))
    const overdue = open.filter(ticket => ticket.resolveDueAt != null && ticket.resolveDueAt < NOW)
    const sla = slaStats(times.resolves, 'ticket')
    return { ...group, created: createdItems, resolved: times.resolves, open, overdue, averageResolveTime: times.averageResolveTime, sla: sla.resolve, slaItems: times.resolves.filter(ticket => ticket.resolveDueAt != null) }
  })
  const leadingCount = occurrenceByType[0]?.items.length || 0
  const leadingTypes = occurrenceByType.filter(group => group.items.length === leadingCount)
  return {
    created, resolved, previous, previousFrom, previousTo,
    occurrenceByType, resolutionByType, locationRanking, performance, leadingTypes,
    volumeChange: previous.length ? Math.round((created.length - previous.length) / previous.length * 100) : null,
  }
}
