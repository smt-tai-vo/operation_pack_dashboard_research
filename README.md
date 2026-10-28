# SmartOS — Maintenance operations prototype

React + Vite. The interface, sample content, CSV exports and accessibility labels are in English. All data is a static demo as of **22 Oct 2026, 10:30 (UTC+7)**; there is no backend or database connection. Refresh to reset trial actions.

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Pages

- **PMS Dashboard (`#dashboard`):** three blocks for Ticket requests, Work orders and Workflow. Each block has one Open/Active total; tickets and WOs have a clickable status row followed by overdue/due-soon signals, plus ticket readiness to resolve. Select a total, status or signal to open its list.
- **PMS Reports (`#reports`):** volume, resolution SLA, average response/resolution times, ticket types, locations, workflow results and staff performance. Metrics and chart points open their exact record groups.
- **MPA (`#mpa`):** personal performance and up to four priority open WOs. Overdue, due soon and urgent work appears first. Open a WO to inspect its checklist, notes, linked tickets and history, or try start/pause/resume/complete actions.
- Dashboard and Reports have separate navigation and support browser Back/Forward. PMS location, type and period selections persist between those pages. Current backlog and priority work are independent of report dates.

## Reporting periods

- Default: **This month** on PMS and MPA. Select this/last week, month, quarter or year, or custom dates.
- Weeks start on Monday; months, quarters and years follow the calendar in the demo business timezone, UTC+7. Reporting does not depend on the browser timezone.
- Current periods stop at the demo timestamp. Compare with the same elapsed duration in the previous calendar period, capped at its end when it is shorter. Completed calendar periods compare with the full previous calendar period.
- Custom dates include both boundary dates, stop at the demo timestamp and compare with the immediately preceding interval of equal elapsed length.
- Charts show daily buckets for weeks/months, calendar-week buckets for quarters and calendar-month buckets for years. Custom ranges use daily buckets up to 31 days, weekly up to 120 days, and monthly thereafter. Partial first/last buckets are clipped to the exact report range.
- Created volume uses creation dates; completed volume and resolution SLA use completion dates. Records created before the period are included when completed in it. Empty baselines show no percentage change; empty result sets show a dash rather than zero SLA.

## Metrics and interactions

- Each Ticket/WO overview shows created volume, resolved/completed volume, resolution SLA, average response and average resolution once. The SLA donut is green over light gray, with the rate in its center and clickable on-time/late counts.
- Ticket response: Submitted → Approved, using tickets approved in the period. Ticket resolution: Approved → Resolved, using tickets resolved in the period. The resolution SLA starts at approval.
- WO response: Created → First start, using WOs first started in the period. WO resolution: First start → Completed, using WOs completed in the period. Pauses count; the due date is independent of SLA.
- Cancelled records and missing/negative durations are excluded from performance metrics. Archived WOs keep their completion outcomes. CSV exports include timestamps, durations in minutes and SLA outcomes.
- Ticket type rankings switch between most reported (creation date, including later cancellations) and most resolved (resolution date). Location rankings use created requests. Ranking items open the matching ticket list. The expandable type table includes current open/overdue backlog and period outcomes.
- Staff response belongs to the first technician to start. Resolution and SLA belong to the assignee at completion. The demo does not split durations by reassignment.
- Detail tables for ticket types, workflows and staff start collapsed. List modals support search, filters, pagination and CSV export of all filtered rows. Closing a WO drawer returns to the underlying list.

## Workflows

- Dashboard shows the Active total once, then Failed and Waiting over 24 hours. Filter the Active list to inspect runs waiting for approval or WOs. Groups may overlap. The 24-hour threshold is illustrative, not an SLA.
- Reports show completion outcomes over time, workflows with the most failures and an expandable per-workflow table. Workflow charts use the same calendar buckets as ticket charts.
- Success rate = succeeded ÷ (succeeded + failed) for runs completed in the period; cancelled and unfinished runs are excluded. Average successful duration includes waiting time. Runs started and WOs created use their own dates.
- Location and ticket-type filters apply to workflows. A run without a ticket type is excluded when filtering a specific type. Run details show the current step, error and linked records. The prototype does not operate backend workflows.

## GitHub Pages

`base: './'` supports repository paths on GitHub Pages. Hash navigation requires no SPA fallback.

1. Push the project to its GitHub repository.
2. Settings → Pages → Source: **GitHub Actions**.
3. The existing deployment workflow builds and publishes `dist`.

```sh
pnpm build
pnpm preview
```

Status labels follow the Operations backend enums: tickets use Submitted, Approved, In progress, Resolved and Cancelled; WOs use To do, In progress, Paused, Completed and Closed. Status codes remain unchanged.
