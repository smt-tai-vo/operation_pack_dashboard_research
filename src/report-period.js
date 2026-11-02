// Demo business timezone: Asia/Ho_Chi_Minh (UTC+07:00).
const DAY = 86_400_000
const OFFSET = 7 * 3_600_000
const local = at => new Date(at + OFFSET)
const midnight = at => {
  const date = local(at)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - OFFSET
}
const format = at => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'short', year: 'numeric' }).format(at)
export const dateInputValue = at => {
  const date = local(at)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
const parseDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return NaN
  const at = Date.parse(`${value}T00:00:00+07:00`)
  return Number.isFinite(at) && dateInputValue(at) === value ? at : NaN
}
export function customPeriod({ startDate, endDate, now = Date.now() }) {
  const from = parseDate(startDate), end = parseDate(endDate) + DAY - 1
  const to = Math.min(end, now)
  const valid = Number.isFinite(from) && Number.isFinite(to) && from <= to
  return { from, to, valid, partial: valid && to < end, rangeLabel: valid ? `${format(from)} – ${format(to)}` : 'Invalid date range' }
}
export function timeBuckets(from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return []
  const buckets = []
  for (let cursor = midnight(from); cursor <= to; cursor += DAY) {
    const start = Math.max(from, cursor), end = Math.min(to, cursor + DAY - 1)
    const label = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'short' }).format(start)
    buckets.push({ start, end, label })
  }
  return buckets
}
