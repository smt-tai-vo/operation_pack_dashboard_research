# SmartOS maintenance dashboard prototype

React + Vite prototype with static sample records at 22 Oct 2026, 10:30 (UTC+7). It does not call backend APIs or apply migrations. Refresh the browser to reset record actions. Location/type and period selections persist for the browser session.

## Run

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

## PMS

One page at `#dashboard`: Needs action now → Needs monitoring → Period report. The reference layout is adapted to the updated decisions: no banner, ready-to-resolve manual tickets and due-soon WOs appear in action cards, and failed runs do not repeat in monitoring. Both current sections are independent of report dates.

Shared location/type filters apply before staff grouping. Staff need no location assignment. Multi-location WOs count once in each relevant location; totals deduplicate WOs. SLA belongs to the current assignee's WOs, not an employee performance score.

The report defaults to seven local calendar days through the demo timestamp. Choose 30 days or custom dates (maximum 90 days, no future end date). Three SLA cards show WO response, WO resolution and ticket resolution, with daily ticket/WO charts and sortable location/staff tables. Rates display whenever there is at least one evaluated record; no minimum-five rule. Empty samples display a dash. Tables show 20 rows initially and support Show more, with totals for all scoped rows. CSV exports summary, daily series, locations and staff with weighted SLA numerators/denominators. CSV and quick actions are local prototype interactions, not server exports or workflow execution.

## MPA

At `#mpa`: current open/overdue counts, assignment completion x/y and response/resolution SLA for 7/30 days, then at most five priority WOs. Completion uses current assignedAt in the period, excluding cancelled WOs and retaining archived completions. SLA uses its event cohort, independent of assignment dates. Reassignment moves all metrics to the current assignee.

Attention order: oldest overdue deadline, nearest due-soon deadline, urgent, To do, remaining work; priority and assignment time break ties. WO deadlines remain independent, while due-date display takes precedence over future resolution SLA. Every overdue applicable label remains visible. Cards show priority flags, deduplicated linked locations and checklist progress. Start/resume work directly, pause with a required reason (500 characters maximum), edit unfinished checklists in a sheet and confirm completion. Completing a WO removes it from the active list and updates counts. First starting a linked WO updates approved demo tickets to In progress.

## Limits

Authentication, actual notifications/unread badges, real API loading/errors, automatic refresh, server-side exports and native tab navigation are outside this static prototype. Existing list dialogs and WO drawers remain available for drilldowns. The portal switch is a demo navigation aid. No backend conformance or end-to-end API integration is implied by passing UI/model tests.
