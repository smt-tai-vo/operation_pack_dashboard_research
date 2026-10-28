// Calendar reporting follows the demo business timezone (UTC+07:00).
// Calendar arithmetic uses UTC fields so browser/system timezones cannot shift a report.
const DAY = 86_400_000
const OFFSET = 7 * 3_600_000
export const REPORT_PERIODS = [
  { value: 'this-week', label: 'This week' },
  { value: 'last-week', label: 'Last week' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'this-quarter', label: 'This quarter' },
  { value: 'last-quarter', label: 'Last quarter' },
  { value: 'this-year', label: 'This year' },
  { value: 'last-year', label: 'Last year' },
  { value: 'custom', label: 'Custom dates' },
]
const local = at => new Date(at + OFFSET)
const midnight = at => {
  const date = local(at)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - OFFSET
}
const monthStart = (at, shift = 0) => {
  const date = local(at)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + shift, 1) - OFFSET
}
const monday = at => midnight(at) - ((local(at).getUTCDay() + 6) % 7) * DAY
const format = (at, options) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', ...options }).format(at)
export const dateInputValue = at => {
  const date = local(at)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
export const rangeText = (from, to, time = false) => Number.isFinite(from) && Number.isFinite(to) && from <= to
  ? `${format(from, { day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}) })} – ${format(to, { day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}) })}`
  : 'Invalid date range'
const parseDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return NaN
  const at = Date.parse(`${value}T00:00:00+07:00`)
  return Number.isFinite(at) && dateInputValue(at) === value ? at : NaN
}
export function reportPeriod(preset, { startDate, endDate, now = Date.now() } = {}) {
  const months = preset.includes('year') ? 12 : preset.includes('quarter') ? 3 : 1
  const date = local(now)
  let from, end, previousFrom, previousEnd
  if (preset === 'custom') {
    from = parseDate(startDate)
    end = parseDate(endDate) + DAY - 1
  } else if (preset.includes('week')) {
    from = monday(now) - (preset === 'last-week' ? 7 * DAY : 0)
    end = from + 7 * DAY - 1
    previousFrom = from - 7 * DAY
    previousEnd = from - 1
  } else if (REPORT_PERIODS.some(item => item.value === preset)) {
    const startMonth = months === 12 ? 0 : months === 3 ? Math.floor(date.getUTCMonth() / 3) * 3 : date.getUTCMonth()
    from = Date.UTC(date.getUTCFullYear(), startMonth - (preset.startsWith('last-') ? months : 0), 1) - OFFSET
    end = monthStart(from, months) - 1
    previousFrom = monthStart(from, -months)
    previousEnd = from - 1
  } else {
    from = NaN; end = NaN
  }
  const to = Math.min(end, now)
  const valid = Number.isFinite(from) && Number.isFinite(to) && from <= to
  const partial = valid && to < end
  if (preset === 'custom') {
    previousFrom = valid ? from - (to - from + 1) : NaN
    previousEnd = from - 1
  }
  const previousTo = partial && preset !== 'custom' ? Math.min(previousEnd, previousFrom + (to - from)) : previousEnd
  const days = valid ? Math.ceil((to - from + 1) / DAY) : 0
  const granularity = preset.includes('year') ? 'month' : preset.includes('quarter') ? 'week' : preset === 'custom' ? days > 120 ? 'month' : days > 31 ? 'week' : 'day' : 'day'
  return {
    from, to, valid, partial, previousFrom, previousTo, granularity,
    rangeLabel: rangeText(from, to),
    comparisonLabel: valid ? `${rangeText(previousFrom, previousTo, partial)}${partial ? ' · Same elapsed time, capped at the previous period end' : preset === 'custom' ? ' · Previous interval of equal length' : ' · Previous calendar period'}` : 'Invalid date range',
  }
}
export const granularityLabel = granularity => ({ day: 'Daily', week: 'Weekly', month: 'Monthly' }[granularity] || 'Daily')
export function timeBuckets(from, to, granularity = 'day') {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return []
  const buckets = []
  let cursor = granularity === 'month' ? monthStart(from) : granularity === 'week' ? monday(from) : midnight(from)
  while (cursor <= to) {
    const next = granularity === 'month' ? monthStart(cursor, 1) : cursor + (granularity === 'week' ? 7 : 1) * DAY
    const start = Math.max(from, cursor), end = Math.min(to, next - 1)
    const label = granularity === 'month' ? format(start, { month: 'short' }) : granularity === 'week' ? format(start, { day: 'numeric', month: 'short' }) : format(start, { day: 'numeric', month: 'short' })
    buckets.push({ start, end, label })
    cursor = next
  }
  return buckets
}
