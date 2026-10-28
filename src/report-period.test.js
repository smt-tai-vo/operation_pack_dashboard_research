import test from 'node:test'
import assert from 'node:assert/strict'
import { dateInputValue, reportPeriod, timeBuckets } from './report-period.js'
import { durationStats } from './data.js'
import { workflowBuckets } from './workflow-data.js'

const at = text => Date.parse(`${text}+07:00`)
const now = at('2026-10-22T10:30:00')
const period = (preset, options = {}) => reportPeriod(preset, { now, ...options })

test('current calendar periods stop at now and compare the same elapsed time', () => {
  for (const [preset, start, previousStart, previousEnd, granularity] of [
    ['this-week', '2026-10-19', '2026-10-12', '2026-10-15', 'day'],
    ['this-month', '2026-10-01', '2026-09-01', '2026-09-22', 'day'],
    ['this-quarter', '2026-10-01', '2026-07-01', '2026-07-22', 'week'],
    ['this-year', '2026-01-01', '2025-01-01', '2025-10-22', 'month'],
  ]) {
    const report = period(preset)
    assert.equal(report.from, at(`${start}T00:00:00`))
    assert.equal(report.to, now)
    assert.equal(report.previousFrom, at(`${previousStart}T00:00:00`))
    assert.equal(report.previousTo, at(`${previousEnd}T10:30:00`))
    assert.equal(report.granularity, granularity)
    assert.equal(report.partial, true)
  }
})

test('completed calendar periods compare full prior periods, including different month lengths', () => {
  for (const [preset, start, end, previousStart, previousEnd] of [
    ['last-week', '2026-10-12', '2026-10-18', '2026-10-05', '2026-10-11'],
    ['last-month', '2026-09-01', '2026-09-30', '2026-08-01', '2026-08-31'],
    ['last-quarter', '2026-07-01', '2026-09-30', '2026-04-01', '2026-06-30'],
    ['last-year', '2025-01-01', '2025-12-31', '2024-01-01', '2024-12-31'],
  ]) {
    const report = period(preset)
    assert.equal(report.from, at(`${start}T00:00:00`))
    assert.equal(report.to, at(`${end}T23:59:59.999`))
    assert.equal(report.previousFrom, at(`${previousStart}T00:00:00`))
    assert.equal(report.previousTo, at(`${previousEnd}T23:59:59.999`))
    assert.equal(report.partial, false)
  }
})

test('short preceding months cap comparisons, with leap days and year rollovers', () => {
  const march = reportPeriod('this-month', { now: at('2024-03-31T10:30:00') })
  assert.equal(march.previousTo, at('2024-02-29T23:59:59.999'))
  const january = reportPeriod('this-quarter', { now: at('2026-01-01T00:00:00') })
  assert.equal(january.previousFrom, at('2025-10-01T00:00:00'))
  assert.equal(january.previousTo, at('2025-10-01T00:00:00'))
  assert.equal(reportPeriod('this-week', { now: at('2026-10-19T00:00:00') }).from, at('2026-10-19T00:00:00'))
})

test('custom dates compare a preceding interval of equal length and reject invalid input', () => {
  const report = period('custom', { startDate: '2026-10-05', endDate: '2026-10-08' })
  assert.equal(report.previousTo, report.from - 1)
  assert.equal(report.to - report.from, report.previousTo - report.previousFrom)
  for (const [startDate, endDate] of [['', '2026-10-22'], ['2026-10-23', '2026-10-24'], ['2026-02-31', '2026-03-02'], ['2026-10-20', '2026-10-01']]) {
    assert.equal(period('custom', { startDate, endDate }).valid, false)
  }
  assert.equal(period('custom', { startDate: '2026-09-01', endDate: '2026-10-22' }).granularity, 'week')
  assert.equal(period('custom', { startDate: '2026-01-01', endDate: '2026-10-22' }).granularity, 'month')
})

test('buckets partition the range exactly, with business midnights and calendar boundaries', () => {
  for (const preset of ['this-week', 'this-month', 'last-month', 'this-quarter', 'last-quarter', 'this-year', 'last-year']) {
    const report = period(preset)
    const buckets = timeBuckets(report.from, report.to, report.granularity)
    assert.equal(buckets[0].start, report.from)
    assert.equal(buckets.at(-1).end, report.to)
    buckets.forEach((bucket, index) => {
      assert(bucket.start <= bucket.end)
      if (index) assert.equal(bucket.start, buckets[index - 1].end + 1)
    })
  }
  const january = reportPeriod('last-month', { now: at('2026-02-10T10:00:00') })
  assert.equal(timeBuckets(january.from, january.to, 'day').length, 31)
  const leap = reportPeriod('last-month', { now: at('2024-03-10T10:00:00') })
  assert.equal(timeBuckets(leap.from, leap.to, 'day').length, 29)
  const year = period('last-year')
  assert.equal(timeBuckets(year.from, year.to, 'month').length, 12)
  assert.equal(dateInputValue(at('2026-01-01T00:00:00')), '2026-01-01')
  assert.deepEqual(timeBuckets(NaN, now), [])
})

test('period reporting includes older records completed now and keeps workflow boundary events once', () => {
  const { from, to } = period('this-month')
  const tickets = [{ status: 'RESOLVED', createdAt: at('2026-09-30T09:00:00'), submittedAt: at('2026-09-30T09:00:00'), approvedAt: at('2026-09-30T10:00:00'), resolvedAt: at('2026-10-01T09:00:00') }]
  const stats = durationStats(tickets, 'ticket', from, to)
  assert.equal(stats.resolves.length, 1)
  assert.equal(stats.responses.length, 0)
  const runs = [{ status: 'SUCCEEDED', finishedAt: from }, { status: 'FAILED', finishedAt: at('2026-10-05T00:00:00') }, { status: 'CANCELLED', finishedAt: to }]
  const buckets = workflowBuckets(runs, from, to, 'week')
  assert.equal(buckets.reduce((sum, bucket) => sum + bucket.succeeded.length + bucket.failed.length + bucket.cancelled.length, 0), 3)
})
