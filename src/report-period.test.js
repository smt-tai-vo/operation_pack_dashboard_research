import test from 'node:test'
import assert from 'node:assert/strict'
import { customPeriod, dateInputValue, timeBuckets } from './report-period.js'
const at = value => Date.parse(`${value}+07:00`)
const now = at('2026-10-22T10:30:00')
test('custom dates include both boundary dates and stop today at the report timestamp', () => {
 const past = customPeriod({startDate:'2026-10-05',endDate:'2026-10-08',now})
 assert.equal(past.from,at('2026-10-05T00:00:00'))
 assert.equal(past.to,at('2026-10-08T23:59:59.999'))
 assert.equal(past.partial,false)
 const current = customPeriod({startDate:'2026-10-20',endDate:'2026-10-22',now})
 assert.equal(current.to,now);assert.equal(current.partial,true)
 for(const [startDate,endDate] of [['','2026-10-22'],['2026-02-30','2026-03-02'],['2026-10-23','2026-10-24'],['2026-10-20','2026-10-01']]) assert.equal(customPeriod({startDate,endDate,now}).valid,false)
})
test('daily buckets partition exactly at business midnights, including year and leap-day boundaries', () => {
 for(const [from,to,count] of [['2026-12-31T20:00:00','2027-01-02T08:00:00',3],['2024-02-28T13:00:00','2024-03-01T09:00:00',3],['2026-10-22T00:00:00','2026-10-22T10:30:00',1]]){
  const buckets=timeBuckets(at(from),at(to))
  assert.equal(buckets.length,count);assert.equal(buckets[0].start,at(from));assert.equal(buckets.at(-1).end,at(to))
  buckets.forEach((bucket,i)=>{assert(bucket.start<=bucket.end);if(i)assert.equal(bucket.start,buckets[i-1].end+1)})
 }
 assert.deepEqual(timeBuckets(NaN,now),[]);assert.deepEqual(timeBuckets(now+1,now),[])
 assert.equal(dateInputValue(Date.parse('2026-12-31T18:00:00Z')),'2027-01-01')
})
