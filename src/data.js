export const HOUR = 3_600_000
export const DAY = 24 * HOUR
export const NOW = Date.parse('2026-10-22T10:30:00+07:00')
export const CURRENT_STAFF_ID = 'an'
export const LOCATIONS = ['Enouvo Space', 'Enouvo Building', 'Riverside Office']
export const TYPES = ['Air conditioning', 'Electrical', 'Plumbing', 'Lighting', 'Other']
export const STAFF = [
  { id: 'an', name: 'Minh An Nguyen', initials: 'MA', color: '#5c6de8', role: 'Technician' },
  { id: 'bao', name: 'Quoc Bao Tran', initials: 'QB', color: '#189e93', role: 'Technician' },
  { id: 'nam', name: 'Hoang Nam Le', initials: 'HN', color: '#bd7c3e', role: 'Technician' },
  { id: 'huy', name: 'Gia Huy Pham', initials: 'GH', color: '#b665a2', role: 'Technician' },
]
export const STATUS = {
  TO_DO: { label: 'To do', tone: 'neutral' },
  IN_PROGRESS: { label: 'In progress', tone: 'blue' },
  PAUSED: { label: 'Paused', tone: 'amber' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
}
export const TICKET_STATUS = {
  SUBMITTED: { label: 'Submitted', tone: 'amber' },
  APPROVED: { label: 'Approved', tone: 'blue' },
  IN_PROGRESS: { label: 'In progress', tone: 'blue' },
  RESOLVED: { label: 'Resolved', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
}
export const PRIORITY = {
  URGENT: { label: 'Urgent', tone: 'red' },
  HIGH: { label: 'High', tone: 'amber' },
  MEDIUM: { label: 'Medium', tone: 'blue' },
  LOW: { label: 'Low', tone: 'neutral' },
}
const titles = ['Repair the air conditioner in Lotus meeting room', 'Inspect the electrical panel on Floor 2', 'Fix the water leak in the pantry', 'Replace the lights in the east corridor', 'Scheduled air conditioner maintenance', 'Inspect power outlets at reception', 'Clean the water supply system', 'Inspect the ventilation system']
const checklistText = ['Inspect the site and identify the cause', 'Isolate the power and secure the area', 'Repair or replace the required parts', 'Test the system and verify the result', 'Clean the area and hand over the work']
const phaseStatuses = ['IN_PROGRESS', 'TO_DO', 'PAUSED', 'COMPLETED', 'CLOSED', 'COMPLETED', 'TO_DO', 'IN_PROGRESS', 'CLOSED', 'COMPLETED']

export function initialData() {
  const tickets = Array.from({ length: 36 }, (_, i) => {
    const status = ['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'APPROVED', 'IN_PROGRESS', 'CANCELLED'][i % 6]
    const createdAt = NOW - (i % 18) * DAY - (3 + i % 5) * HOUR
    const submittedAt = createdAt
    const approvedAt = status === 'SUBMITTED' || (status === 'CANCELLED' && i % 12 === 5) ? null : submittedAt + (i % 3 === 0 ? 2.8 : 0.6) * HOUR
    const resolveHours = i === 1 ? 28 : 24
    const resolvedAt = status === 'RESOLVED' ? Math.min(NOW - HOUR, createdAt + (i % 4 === 0 ? 30 : 9) * HOUR) : null
    return {
      id: `t${i}`, code: `TIC-${String(4289 - i).padStart(6, '0')}`, type: TYPES[i % 5],
      location: LOCATIONS[Math.floor(i / 2) % 3], area: `Floor ${i % 5 + 1} · ${['Lotus meeting room', 'Pantry', 'Workspace', 'Reception'][i % 4]}`,
      status, createdAt, submittedAt, approvedAt, resolvedAt, cancelledAt: status === 'CANCELLED' ? Math.min(NOW, createdAt + 4 * HOUR) : null,
      responseDueAt: submittedAt + 2 * HOUR, resolveDueAt: createdAt + resolveHours * HOUR,
      priority: ['HIGH', 'MEDIUM', 'URGENT', 'LOW'][i % 4],
      note: ['The air conditioner is noisy and is not cooling well. Please inspect it.', 'The power outlet in the workspace is intermittent.', 'Water is leaking from the pipe joint under the sink.', 'The light is flickering and needs inspection or replacement.'][i % 4],
      workflowMode: i % 3 === 0 ? 'workflow' : 'manual',
    }
  })
  const works = Array.from({ length: 40 }, (_, i) => {
    const staff = STAFF[i % 4]
    const status = phaseStatuses[Math.floor(i / 4)]
    const assignedAt = NOW - (Math.floor(i / 4) * 2 + i % 2) * DAY - (2 + i % 3) * HOUR
    const createdAt = assignedAt - HOUR
    const responseHours = i % 3 === 0 ? 1 : 2
    const resolveHours = i === 0 ? 3 : i === 2 ? 6 : i % 3 === 0 ? 12 : 24
    const startedAt = status === 'TO_DO' ? null : Math.min(NOW - HOUR / 2, assignedAt + responseHours * (i % 3 === 0 ? 1.4 : 0.45) * HOUR)
    const closeReason = status === 'CLOSED' ? (i % 3 === 0 ? 'CANCELLED' : i % 3 === 1 ? 'TICKET_CANCELLED' : 'ARCHIVED') : null
    const cancelled = ['CANCELLED', 'TICKET_CANCELLED'].includes(closeReason)
    const finished = status === 'COMPLETED' || closeReason === 'ARCHIVED'
    const completedAt = finished ? Math.min(NOW - HOUR / 3, startedAt + resolveHours * (i % 3 === 0 ? 1.3 : 0.65) * HOUR) : null
    const checklist = i % 7 === 6 ? [] : checklistText.slice(0, 3 + i % 3).map((text, j) => ({ id: `${i}-${j}`, text, checked: finished || (status !== 'TO_DO' && j < i % 3 + 1) }))
    const candidates = tickets.filter(t => t.location === LOCATIONS[i % 3] && t.createdAt <= createdAt && (cancelled ? false : finished ? ['IN_PROGRESS', 'RESOLVED'].includes(t.status) : ['APPROVED', 'IN_PROGRESS'].includes(t.status)))
    const linked = i % 4 === 3 || !candidates.length ? [] : [candidates[i % candidates.length]]
    return {
      id: `w${i}`, code: `WO-${String(142 - i).padStart(6, '0')}`, title: titles[i % titles.length],
      staffId: staff.id, location: LOCATIONS[i % 3], area: `Floor ${i % 5 + 1} · ${['Lotus meeting room', 'Pantry', 'East corridor', 'Reception'][i % 4]}`,
      status, priority: ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'HIGH'][i % 5],
      createdAt, assignedAt, startedAt, completedAt, responseHours, resolveHours,
      responseDueAt: createdAt + responseHours * HOUR, resolveDueAt: startedAt ? startedAt + resolveHours * HOUR : null,
      dueDate: i % 3 === 0 ? createdAt + 3 * DAY : null,
      closedAt: status === 'CLOSED' ? (completedAt ? completedAt + HOUR : createdAt + 5 * HOUR) : null,
      startedByStaffId: startedAt == null ? null : staff.id,
      completedByStaffId: completedAt ? staff.id : null,
      assignmentStartedAt: startedAt, assignmentCompletedAt: completedAt,
      closeReason, cancelled, checklist, ticketIds: linked.map(t => t.id),
      note: 'Inspect the site and make it safe before starting. Notify your supervisor if additional materials are needed.',
      pausedAt: status === 'PAUSED' ? NOW - (i % 2 ? 30 : 3) * HOUR : null,
      pauseReason: status === 'PAUSED' ? 'Waiting for replacement parts from the supplier.' : null,
      history: [
        ...(finished ? [{ text: `${staff.name} completed the work order`, at: completedAt }] : []),
        ...(status === 'PAUSED' ? [{ text: `${staff.name} paused work while waiting for parts`, at: NOW - 3 * HOUR }] : []),
        ...(startedAt ? [{ text: `${staff.name} started the work order`, at: startedAt }] : []),
        { text: `Work assigned to ${staff.name}`, at: assignedAt },
      ],
    }
  })
  return { tickets, works }
}

export const isOpen = w => ['TO_DO', 'IN_PROGRESS', 'PAUSED'].includes(w.status)
export const isFinished = w => Boolean(w.completedAt) && !w.cancelled
export const dateText = at => at ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at) : '—'
export const dayText = at => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: 'short' }).format(at)
export const duration = ms => {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ${minutes % 60 ? `${minutes % 60} min` : ''}`.trim()
  return `${Math.floor(minutes / 1440)} ${minutes < 2880 ? 'day' : 'days'} ${Math.floor(minutes % 1440 / 60)} hr`
}
export function timing(w) {
  if (w.status === 'CLOSED') return { label: w.closeReason === 'ARCHIVED' ? 'Archived' : 'Cancelled', tone: 'neutral' }
  if (w.status === 'COMPLETED') return { label: 'Completed', tone: 'green' }
  const milestones = [
    ...(!w.startedAt ? [{ due: w.responseDueAt, detail: 'Response SLA', threshold: w.responseHours * HOUR * 0.25 }] : []),
    ...(w.startedAt ? [{ due: w.resolveDueAt, detail: 'Resolution SLA', threshold: 4 * HOUR }] : []),
    ...(w.dueDate ? [{ due: w.dueDate, detail: 'Due date', threshold: 4 * HOUR }] : []),
  ].filter(item => Number.isFinite(item.due)).sort((a, b) => a.due - b.due)
  const milestone = milestones.find(item => item.due < NOW) || milestones.find(item => item.due - NOW <= item.threshold) || milestones[0]
  if (!milestone) return { label: STATUS[w.status].label, detail: 'No deadline', tone: 'neutral', due: null }
  const delta = milestone.due - NOW
  return { label: delta < 0 ? `Overdue ${duration(-delta)}` : `Remaining ${duration(delta)}`, detail: milestone.detail, tone: delta < 0 ? 'red' : delta <= milestone.threshold ? 'amber' : 'muted', due: milestone.due }

}
export function durationBetween(start, end) {
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : null
}
