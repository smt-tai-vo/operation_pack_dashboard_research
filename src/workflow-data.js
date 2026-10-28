import { DAY, HOUR, NOW, TYPES, isOpen } from './data.js'

export const WORKFLOW_STATUS = {
  RUNNING: { label: 'Đang chạy', tone: 'blue' },
  WAITING_APPROVAL: { label: 'Chờ duyệt ticket', tone: 'amber' },
  WAITING_WORK_ORDER: { label: 'Chờ WO hoàn thành', tone: 'amber' },
  SUCCEEDED: { label: 'Thành công', tone: 'green' },
  FAILED: { label: 'Thất bại', tone: 'red' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
}
export const WORKFLOWS = [
  { id: 'wf-ac', name: 'Xử lý yêu cầu điều hòa', code: 'WF-001' },
  { id: 'wf-electric', name: 'Xử lý sự cố điện', code: 'WF-002' },
  { id: 'wf-water', name: 'Xử lý sự cố nước', code: 'WF-003' },
  { id: 'wf-light', name: 'Xử lý yêu cầu chiếu sáng', code: 'WF-004' },
  { id: 'wf-maintenance', name: 'Bảo trì & kiểm tra định kỳ', code: 'WF-005' },
]
export const WAIT_WARNING = 24 * HOUR
export const isActiveRun = run => ['RUNNING', 'WAITING_APPROVAL', 'WAITING_WORK_ORDER'].includes(run.status)
export const isWaitingRun = run => ['WAITING_APPROVAL', 'WAITING_WORK_ORDER'].includes(run.status)
export const isLongWaitingRun = run => isWaitingRun(run) && run.waitingSince != null && NOW - run.waitingSince > WAIT_WARNING
const inPeriod = (at, from, to) => at != null && at >= from && at <= to

export function initialWorkflowRuns(works, tickets) {
  const workRuns = works.map((work, index) => {
    const linkedTickets = tickets.filter(ticket => work.ticketIds.includes(ticket.id))
    const type = linkedTickets[0]?.type
    const definition = type ? WORKFLOWS[TYPES.indexOf(type)] : WORKFLOWS[4]
    const failed = Boolean(work.completedAt) && index % 3 === 0
    const status = work.cancelled ? 'CANCELLED' : failed ? 'FAILED' : work.completedAt ? 'SUCCEEDED' : 'WAITING_WORK_ORDER'
    const startedAt = work.createdAt - (10 + index % 6) * 60_000
    const finishedAt = isOpen(work) ? null : Math.min(NOW, (work.cancelled ? work.closedAt : work.completedAt) + 20 * 60_000)
    const waitingSince = status === 'WAITING_WORK_ORDER' ? work.createdAt + 60_000 : null
    return {
      id: `run-work-${index}`, code: `RUN-${String(801 + index).padStart(5, '0')}`,
      workflowId: definition.id, workflowName: definition.name,
      location: work.location, ticketType: type || null, status, startedAt, finishedAt, waitingSince,
      ticketIds: linkedTickets.map(ticket => ticket.id), workOrderIds: [work.id],
      currentStep: status === 'WAITING_WORK_ORDER' ? 'Chờ nhân viên hoàn thành WO' : status === 'FAILED' ? 'Gửi thông báo kết quả' : status === 'SUCCEEDED' ? 'Đã hoàn tất các bước' : 'Dừng theo yêu cầu hủy',
      error: failed ? 'Không gửi được thông báo kết quả. Cần kiểm tra kết nối dịch vụ thông báo.' : null,
    }
  })
  // Runs without WO illustrate waiting for approval and processing before task creation.
  const ticketRuns = tickets.filter(ticket => !works.some(work => work.ticketIds.includes(ticket.id))).map((ticket, index) => {
    const definition = WORKFLOWS[TYPES.indexOf(ticket.type)]
    const status = ticket.status === 'CANCELLED' ? 'CANCELLED' : ticket.status === 'RESOLVED' ? 'SUCCEEDED' : ticket.status === 'SUBMITTED' ? 'WAITING_APPROVAL' : 'RUNNING'
    return {
      id: `run-ticket-${index}`, code: `RUN-${String(901 + index).padStart(5, '0')}`,
      workflowId: definition.id, workflowName: definition.name,
      location: ticket.location, ticketType: ticket.type, status,
      startedAt: ticket.createdAt, finishedAt: status === 'SUCCEEDED' ? ticket.resolvedAt : status === 'CANCELLED' ? ticket.cancelledAt : null,
      waitingSince: status === 'WAITING_APPROVAL' ? ticket.createdAt : null,
      ticketIds: [ticket.id], workOrderIds: [],
      currentStep: status === 'WAITING_APPROVAL' ? 'Chờ PMS duyệt ticket' : status === 'RUNNING' ? 'Kiểm tra thông tin & điều phối' : status === 'SUCCEEDED' ? 'Đã hoàn tất các bước' : 'Dừng theo yêu cầu hủy',
      error: null,
    }
  })
  return [...workRuns, ...ticketRuns].sort((a, b) => b.startedAt - a.startedAt)
}

export function workflowStats(runs, works, from, to) {
  const started = runs.filter(run => inPeriod(run.startedAt, from, to))
  const ended = runs.filter(run => inPeriod(run.finishedAt, from, to))
  const succeeded = ended.filter(run => run.status === 'SUCCEEDED')
  const failed = ended.filter(run => run.status === 'FAILED')
  const cancelled = ended.filter(run => run.status === 'CANCELLED')
  const assessed = succeeded.length + failed.length
  const workIds = new Set(runs.flatMap(run => run.workOrderIds))
  const createdWorks = works.filter(work => workIds.has(work.id) && inPeriod(work.createdAt, from, to))
  return {
    started, ended, succeeded, failed, cancelled, createdWorks,
    successRate: assessed ? Math.round(succeeded.length / assessed * 100) : null,
    averageDuration: succeeded.length ? succeeded.reduce((sum, run) => sum + run.finishedAt - run.startedAt, 0) / succeeded.length : null,
  }
}

export function workflowBuckets(runs, from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return []
  const days = Math.max(1, Math.ceil((to - from + 1) / DAY))
  const bucketDays = Math.max(1, Math.ceil(days / 14))
  return Array.from({ length: Math.ceil(days / bucketDays) }, (_, index) => {
    const start = from + index * bucketDays * DAY
    const end = Math.min(to, start + bucketDays * DAY - 1)
    const ended = runs.filter(run => inPeriod(run.finishedAt, start, end))
    return { start, end, succeeded: ended.filter(run => run.status === 'SUCCEEDED'), failed: ended.filter(run => run.status === 'FAILED'), cancelled: ended.filter(run => run.status === 'CANCELLED') }
  })
}
