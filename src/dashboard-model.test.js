import assert from 'node:assert/strict'
import test from 'node:test'
import { NOW, HOUR } from './data.js'
import { attentionSort, completion, dashboardPeriod, dueSoon, overdue, readyToResolve, staffRows, ticketSla, woSla, workLocations, workScope } from './dashboard-model.js'
const range=dashboardPeriod('7')
const work=(id,extra={})=>({id,status:'TO_DO',priority:'HIGH',staffId:'an',ticketIds:[],createdAt:NOW-3*HOUR,assignedAt:NOW-HOUR,responseDueAt:NOW-2*HOUR,responseHours:1,...extra})
test('7/30 periods include local today, cap at now and custom range rejects >90 days and future dates',()=>{
 assert.equal(range.startDate,'2026-10-16');assert.equal(range.to,NOW)
 assert.equal(dashboardPeriod('30').startDate,'2026-09-23')
 assert.equal(dashboardPeriod('custom','2026-07-25','2026-10-22').valid,true)
 assert.equal(dashboardPeriod('custom','2026-07-24','2026-10-22').valid,false)
 assert.equal(dashboardPeriod('custom','2026-10-22','2026-10-23').valid,false)
 assert.equal(dashboardPeriod('custom','2026-10-23','2026-10-22').valid,false)
 assert.equal(dashboardPeriod('custom','2026-02-30','2026-10-22').valid,false)
})
test('response period union counts each WO once, includes unstarted breached deadlines and evaluates historical starts',()=>{
 const r=dashboardPeriod('custom','2026-10-20','2026-10-20')
 const within=r.from+2*HOUR
 const ws=[work('both',{startedAt:within,responseDueAt:within+HOUR}),work('late',{startedAt:null,responseDueAt:within}),work('after',{startedAt:r.to+HOUR,responseDueAt:within}),work('before',{startedAt:r.from-HOUR,responseDueAt:within}),work('not-in',{startedAt:null,responseDueAt:r.from-HOUR})]
 const m=woSla(ws,r).response;assert.equal(m.totalCount,3);assert.equal(m.metCount,1)
})
test('assignment completion uses assignedAt cohort, includes archived completion and excludes both cancellation reasons',()=>{
 const ws=[work('complete',{status:'COMPLETED',completedAt:NOW}),work('old',{assignedAt:range.from-1,status:'COMPLETED',completedAt:NOW}),work('archive',{status:'CLOSED',closeReason:'ARCHIVED',completedAt:NOW}),work('cancel',{status:'CLOSED',closeReason:'CANCELLED'}),work('ticket-cancel',{status:'CLOSED',closeReason:'TICKET_CANCELLED'}),work('open')]
 const m=completion(ws,range);assert.equal(m.assigned.length,3);assert.equal(m.completed.length,2)
 assert.equal(completion([work('old-data',{assignedAt:undefined})],range).assigned.length,0)
})
test('resolution SLA uses Completed timestamp and keeps archived outcomes; ticket SLA uses its resolution deadline',()=>{
 const ws=[work('a',{status:'CLOSED',closeReason:'ARCHIVED',startedAt:NOW-2*HOUR,completedAt:NOW-HOUR,resolveDueAt:NOW}),work('b',{status:'COMPLETED',startedAt:NOW-4*HOUR,completedAt:NOW-HOUR,resolveDueAt:NOW-2*HOUR}),work('c',{status:'CLOSED',closeReason:'CANCELLED',startedAt:NOW-4*HOUR,completedAt:NOW-HOUR,resolveDueAt:NOW})]
 assert.equal(woSla(ws,range).resolution.rate,50)
 assert.equal(ticketSla([{status:'RESOLVED',resolvedAt:NOW,resolveDueAt:NOW},{status:'CANCELLED',resolvedAt:NOW,resolveDueAt:NOW}],range).totalCount,1)
 assert.equal(ticketSla([],range).rate,null)
})
test('deadlines remain independent, overdue counts once and due-soon excludes overdue WOs',()=>{
 const w=work('multi',{startedAt:NOW-5*HOUR,status:'IN_PROGRESS',resolveDueAt:NOW-HOUR,dueDate:NOW-2*HOUR})
 assert.equal(overdue(w),true);assert.equal([w].filter(overdue).length,1);assert.equal(dueSoon(w),false)
 assert.equal(overdue({...w,dueDate:NOW+5*HOUR}),true)
 assert.equal(dueSoon(work('soon',{responseDueAt:NOW+HOUR/4})),true)
 assert.equal(dueSoon(work('far',{responseDueAt:NOW+HOUR/2})),false)
})
test('location/type scope filters WOs before staff grouping; multi-location totals deduplicate',()=>{
 const tickets=[{id:'a',location:'A',type:'Air'},{id:'b',location:'B',type:'Water'}]
 const w=work('multi',{ticketIds:['a','b']})
 assert.deepEqual(workLocations(w,tickets),['A','B'])
 assert.equal(workScope(w,tickets,'B','Air'),true)
 assert.equal(workScope(w,tickets,'C','all'),false)
 const other=work('elsewhere',{staffId:'bao',location:'C'})
 assert.equal(staffRows([w,other].filter(x=>workScope(x,tickets,'B','all')),range).length,1)
 assert.equal(staffRows([w],range)[0].open.length,1)
})
test('staff SLA belongs to current assignee and current workload does not use period dates',()=>{
 const w=work('reassign',{staffId:'bao',startedByStaffId:'an',assignedAt:range.from-1000,createdAt:range.from-2*HOUR,responseDueAt:range.from+HOUR})
 const rows=staffRows([w],range);assert.equal(rows.length,1);assert.equal(rows[0].id,'bao');assert.equal(rows[0].response.totalCount,1);assert.equal(rows[0].open.length,1)
 assert.equal(completion([w],range).assigned.length,0)
})
test('attention sorts oldest breach, then nearest due, urgent, To do priority and assignment time',()=>{
 const ws=[work('normal',{responseDueAt:NOW+5*HOUR,priority:'LOW'}),work('high',{responseDueAt:NOW+5*HOUR,priority:'HIGH'}),work('urgent',{responseDueAt:NOW+5*HOUR,priority:'URGENT',status:'IN_PROGRESS',startedAt:NOW,resolveDueAt:NOW+10*HOUR}),work('soon',{responseDueAt:NOW+HOUR/8}),work('late',{responseDueAt:NOW-HOUR}),work('oldest',{responseDueAt:NOW-2*HOUR})]
 assert.deepEqual(ws.sort(attentionSort).map(w=>w.id),['oldest','late','soon','urgent','high','normal'])
})
test('readiness needs manual In progress ticket, at least one linked WO, and all linked WOs ended',()=>{
 const t={id:'t',status:'IN_PROGRESS',workflowMode:'manual'}
 assert.equal(readyToResolve(t,[]),false)
 assert.equal(readyToResolve(t,[work('w',{ticketIds:['t'],status:'COMPLETED'})]),true)
 assert.equal(readyToResolve({...t,workflowMode:'workflow'},[work('w',{ticketIds:['t'],status:'COMPLETED'})]),false)
 assert.equal(readyToResolve(t,[work('w',{ticketIds:['t'],status:'IN_PROGRESS'})]),false)
})
