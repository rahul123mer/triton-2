import {
  at,
  cameras,
  cookbooks,
  counters,
  DAY,
  events,
  kitchenRegions,
  kitchenStaff,
  lookup,
  occupancySessions,
  recipes,
  restaurant,
  tables,
  timeWindows,
  waiters,
} from './data'

/** One "attention" unit: how often a server should touch an occupied table. */
export const ATTENTION_UNIT_MS = 15 * 60 * 1000

export function padClock(value) {
  const [h = '00', m = '00', s = '00'] = String(value || '00:00:00').split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${(s || '00').padStart(2, '0')}`
}

/** Keep event clock times, but align them to the selected service date so filters stay responsive. */
export function alignIsoToDate(iso, date) {
  if (!iso || !date) return iso
  const tIndex = String(iso).indexOf('T')
  if (tIndex === -1) return at('00:00:00', date)
  return `${date}${String(iso).slice(tIndex)}`
}

function windowDay(windowStart) {
  return String(windowStart || DAY).slice(0, 10)
}

export function windowBounds(date, windowId, customStart, customEnd) {
  if (windowId === 'custom') {
    return {
      start: at(padClock(customStart || '00:00:00'), date),
      end: at(padClock(customEnd || '23:59:59'), date),
      label: `${customStart || '00:00'} – ${customEnd || '23:59'}`,
    }
  }
  const preset = timeWindows.find((item) => item.windowId === windowId) || timeWindows[2]
  return {
    start: at(preset.start, date),
    end: at(preset.end, date),
    label: `${preset.label} · ${preset.start.slice(0, 5)} – ${preset.end.slice(0, 5)}`,
  }
}

export function overlapMs(startAt, endAt, windowStart, windowEnd) {
  const day = windowDay(windowStart)
  const start = Math.max(new Date(alignIsoToDate(startAt, day)).getTime(), new Date(windowStart).getTime())
  const end = Math.min(new Date(alignIsoToDate(endAt, day)).getTime(), new Date(windowEnd).getTime())
  return Math.max(0, end - start)
}

export function overlapsWindow(record, windowStart, windowEnd) {
  const day = windowDay(windowStart)
  const start = new Date(alignIsoToDate(record.startAt, day)).getTime()
  const end = new Date(alignIsoToDate(record.endAt || record.startAt, day)).getTime()
  return start <= new Date(windowEnd).getTime() && end >= new Date(windowStart).getTime()
}

export function eventsInWindow(windowStart, windowEnd, predicate = () => true) {
  return events.filter((event) => overlapsWindow(event, windowStart, windowEnd) && predicate(event))
}

function clipped(event, windowStart, windowEnd) {
  const day = windowDay(windowStart)
  const startAt = alignIsoToDate(event.startAt, day)
  const endAt = alignIsoToDate(event.endAt || event.startAt, day)
  const durationMs = event.durationMs > 0
    ? overlapMs(event.startAt, event.endAt, windowStart, windowEnd)
    : 0
  return { ...event, startAt, endAt, durationMs }
}

export function occupancyInWindow(windowStart, windowEnd, tableId) {
  return eventsInWindow(windowStart, windowEnd, (event) => event.eventType === 'table.occupancy' && (!tableId || event.tableId === tableId))
    .map((event) => clipped(event, windowStart, windowEnd))
    .filter((event) => event.durationMs > 0)
}

export function visitsInWindow(windowStart, windowEnd, { tableId, personId } = {}) {
  return eventsInWindow(windowStart, windowEnd, (event) => (
    event.eventType === 'waiter.visit'
    && (!tableId || event.tableId === tableId)
    && (!personId || event.personId === personId)
  )).map((event) => clipped(event, windowStart, windowEnd)).filter((event) => event.durationMs > 0)
}

export function kitchenInWindow(windowStart, windowEnd, { counterId, personId } = {}) {
  return eventsInWindow(windowStart, windowEnd, (event) => (
    event.eventType === 'kitchen.dwell'
    && (!counterId || event.counterId === counterId)
    && (!personId || event.personId === personId)
  )).map((event) => clipped(event, windowStart, windowEnd)).filter((event) => event.durationMs > 0)
}

export function tableStatus(table, windowStart, windowEnd) {
  const sessions = occupancyInWindow(windowStart, windowEnd, table.tableId)
  const windowEndMs = new Date(windowEnd).getTime()
  const active = sessions.find((session) => new Date(session.startAt).getTime() <= windowEndMs && new Date(session.endAt).getTime() > windowEndMs)
  if (active) return { status: 'occupied', label: 'Occupied', session: active }
  const last = sessions.sort((a, b) => b.endAt.localeCompare(a.endAt))[0]
  if (last && windowEndMs - new Date(last.endAt).getTime() <= 20 * 60 * 1000 && new Date(last.endAt).getTime() <= windowEndMs) {
    return { status: 'cleared', label: 'Recently cleared', session: last }
  }
  const windowHour = Number(String(windowStart).slice(11, 13))
  if (table.reservedDinner && windowHour >= 18) {
    return { status: 'reserved', label: 'Reserved', session: last || null }
  }
  return { status: 'available', label: 'Available', session: last || null }
}

export function tableSummaries(windowStart, windowEnd) {
  return tables.map((table) => {
    const sessions = occupancyInWindow(windowStart, windowEnd, table.tableId)
    const visits = visitsInWindow(windowStart, windowEnd, { tableId: table.tableId })
    const occupancyMs = sessions.reduce((sum, session) => sum + session.durationMs, 0)
    const state = tableStatus(table, windowStart, windowEnd)
    const lastActivity = [...sessions, ...visits].sort((a, b) => b.endAt.localeCompare(a.endAt))[0]
    return {
      ...table,
      ...state,
      sessionCount: sessions.length,
      occupancyMs,
      guestCount: state.session?.guestCount || sessions[sessions.length - 1]?.guestCount || 0,
      visitCount: visits.length,
      waiterDwellMs: visits.reduce((sum, visit) => sum + visit.durationMs, 0),
      lastActivity,
      camera: lookup.camera[table.cameraId],
    }
  })
}

export function waiterSummaries(windowStart, windowEnd) {
  return waiters.map((waiter) => {
    const visits = visitsInWindow(windowStart, windowEnd, { personId: waiter.personId })
    const byTable = {}
    for (const visit of visits) {
      const bucket = byTable[visit.tableId] || { tableId: visit.tableId, visits: 0, dwellMs: 0 }
      bucket.visits += 1
      bucket.dwellMs += visit.durationMs
      byTable[visit.tableId] = bucket
    }
    const tablesVisited = Object.values(byTable)
      .map((row) => ({ ...row, table: lookup.table[row.tableId] }))
      .sort((a, b) => b.visits - a.visits || b.dwellMs - a.dwellMs)
    const dwellMs = visits.reduce((sum, visit) => sum + visit.durationMs, 0)
    const first = visits[0]
    const last = visits[visits.length - 1]
    return {
      ...waiter,
      visitCount: visits.length,
      tableCount: tablesVisited.length,
      dwellMs,
      averageMs: visits.length ? Math.round(dwellMs / visits.length) : 0,
      firstVisit: first?.startAt || null,
      lastVisit: last?.endAt || null,
      tablesVisited,
      visits,
    }
  }).sort((a, b) => b.visitCount - a.visitCount || b.dwellMs - a.dwellMs)
}

export function kitchenEmployeeSummaries(windowStart, windowEnd) {
  return kitchenStaff.map((person) => {
    const dwells = kitchenInWindow(windowStart, windowEnd, { personId: person.personId })
    const byCounter = {}
    for (const dwell of dwells) {
      const bucket = byCounter[dwell.counterId] || { counterId: dwell.counterId, visits: 0, dwellMs: 0, lastAt: dwell.endAt }
      bucket.visits += 1
      bucket.dwellMs += dwell.durationMs
      if (dwell.endAt > bucket.lastAt) bucket.lastAt = dwell.endAt
      byCounter[dwell.counterId] = bucket
    }
    const countersVisited = Object.values(byCounter)
      .map((row) => ({ ...row, counter: lookup.counter[row.counterId] }))
      .sort((a, b) => b.dwellMs - a.dwellMs)
    const dwellMs = dwells.reduce((sum, dwell) => sum + dwell.durationMs, 0)
    return {
      ...person,
      visitCount: dwells.length,
      dwellMs,
      averageMs: dwells.length ? Math.round(dwellMs / dwells.length) : 0,
      lastActivity: [...dwells].sort((a, b) => b.endAt.localeCompare(a.endAt))[0] || null,
      countersVisited,
      dwells,
    }
  }).sort((a, b) => b.dwellMs - a.dwellMs)
}

export function counterSummaries(windowStart, windowEnd) {
  return counters.map((counter) => {
    const dwells = kitchenInWindow(windowStart, windowEnd, { counterId: counter.counterId })
    const peopleIds = new Set(dwells.map((dwell) => dwell.personId))
    const dwellMs = dwells.reduce((sum, dwell) => sum + dwell.durationMs, 0)
    const windowMs = new Date(windowEnd).getTime() - new Date(windowStart).getTime()
    return {
      ...counter,
      visitCount: dwells.length,
      employeeCount: peopleIds.size,
      dwellMs,
      averageMs: dwells.length ? Math.round(dwellMs / dwells.length) : 0,
      utilisation: windowMs ? Math.min(1, dwellMs / windowMs) : 0,
      lastActivity: [...dwells].sort((a, b) => b.endAt.localeCompare(a.endAt))[0] || null,
      dwells,
    }
  }).sort((a, b) => b.dwellMs - a.dwellMs)
}

export function kpis(windowStart, windowEnd) {
  const tableRows = tableSummaries(windowStart, windowEnd)
  const waiterRows = waiterSummaries(windowStart, windowEnd)
  const kitchenRows = kitchenEmployeeSummaries(windowStart, windowEnd)
  const counterRows = counterSummaries(windowStart, windowEnd)
  const sessions = occupancyInWindow(windowStart, windowEnd)
  const occupancyMs = sessions.reduce((sum, session) => sum + session.durationMs, 0)
  const occupiedWithTime = tableRows.filter((row) => row.occupancyMs > 0)
  const waiterVisits = waiterRows.reduce((sum, row) => sum + row.visitCount, 0)
  const waiterDwell = waiterRows.reduce((sum, row) => sum + row.dwellMs, 0)
  const kitchenActive = kitchenRows.filter((row) => row.visitCount > 0).length
  return {
    totalTables: tableRows.length,
    occupiedTables: occupiedWithTime.length,
    currentlyOccupied: tableRows.filter((row) => row.status === 'occupied').length,
    occupancySessions: sessions.length,
    averageTableDwell: sessions.length ? Math.round(occupancyMs / sessions.length) : 0,
    waiterVisits,
    waiterDwell,
    kitchenStaffActive: kitchenActive,
    kitchenCounterActivity: counterRows.filter((row) => row.visitCount > 0).length,
    tableRows,
    waiterRows,
    kitchenRows,
    counterRows,
  }
}

export function timelineForTable(tableId, windowStart, windowEnd) {
  return eventsInWindow(windowStart, windowEnd, (event) => event.tableId === tableId && [
    'guest.seated', 'table.cleared', 'waiter.entered', 'waiter.exited', 'waiter.visit', 'table.occupancy',
  ].includes(event.eventType)).sort((a, b) => a.startAt.localeCompare(b.startAt) || a.eventId.localeCompare(b.eventId))
}

export function timelineForPerson(personId, windowStart, windowEnd) {
  return eventsInWindow(windowStart, windowEnd, (event) => event.personId === personId)
    .sort((a, b) => a.startAt.localeCompare(b.startAt) || a.eventId.localeCompare(b.eventId))
}

export function insightsFor(windowStart, windowEnd) {
  const snapshot = kpis(windowStart, windowEnd)
  const longestTable = [...snapshot.tableRows].sort((a, b) => b.occupancyMs - a.occupancyMs)[0]
  const busiestWaiter = [...snapshot.waiterRows].sort((a, b) => b.visitCount - a.visitCount || b.dwellMs - a.dwellMs)[0]
  const busiestCounter = [...snapshot.counterRows].sort((a, b) => b.dwellMs - a.dwellMs)[0]
  const busiestKitchen = [...snapshot.kitchenRows].sort((a, b) => b.dwellMs - a.dwellMs)[0]
  const underServed = snapshot.tableRows
    .filter((row) => row.occupancyMs > 0)
    .map((row) => ({ ...row, ratio: row.occupancyMs ? row.visitCount / (row.occupancyMs / 60000) : 0 }))
    .sort((a, b) => a.ratio - b.ratio)[0]
  const items = []
  if (longestTable?.occupancyMs) {
    items.push({
      insightId: 'ins-longest-table',
      text: `${longestTable.code} had the longest occupancy duration during the selected period.`,
      recipeId: 'rcp-table-occupancy',
      eventIds: occupancyInWindow(windowStart, windowEnd, longestTable.tableId).map((event) => event.eventId),
      href: `/restaurant/analytics/tables/${longestTable.tableId}`,
    })
  }
  if (busiestWaiter?.visitCount) {
    items.push({
      insightId: 'ins-busiest-waiter',
      text: `${busiestWaiter.name} recorded the highest number of table visits during the selected period.`,
      recipeId: 'rcp-waiter-service',
      eventIds: visitsInWindow(windowStart, windowEnd, { personId: busiestWaiter.personId }).map((event) => event.eventId),
      href: `/restaurant/analytics/servers/${busiestWaiter.personId}`,
    })
  }
  if (busiestCounter?.dwellMs) {
    items.push({
      insightId: 'ins-busiest-counter',
      text: `${busiestCounter.name} recorded the highest cumulative employee dwell time during the selected kitchen period.`,
      recipeId: 'rcp-kitchen-utilisation',
      eventIds: kitchenInWindow(windowStart, windowEnd, { counterId: busiestCounter.counterId }).map((event) => event.eventId),
      href: `/restaurant/live/kitchen?counter=${busiestCounter.counterId}`,
    })
  }
  if (busiestKitchen?.dwellMs) {
    items.push({
      insightId: 'ins-kitchen-lead',
      text: `${busiestKitchen.name} accumulated the most station dwell time across kitchen counters.`,
      recipeId: 'rcp-kitchen-utilisation',
      eventIds: kitchenInWindow(windowStart, windowEnd, { personId: busiestKitchen.personId }).map((event) => event.eventId),
      href: `/restaurant/analytics/kitchen/${busiestKitchen.personId}`,
    })
  }
  if (underServed?.occupancyMs) {
    items.push({
      insightId: 'ins-service-pattern',
      text: `${underServed.code} had the fewest waiter visits relative to occupancy duration in this window.`,
      recipeId: 'rcp-service-pattern',
      eventIds: [
        ...occupancyInWindow(windowStart, windowEnd, underServed.tableId),
        ...visitsInWindow(windowStart, windowEnd, { tableId: underServed.tableId }),
      ].map((event) => event.eventId),
      href: `/restaurant/analytics/tables/${underServed.tableId}`,
    })
  }
  return items
}

export function evaluateRecipe(recipeId, windowStart, windowEnd, filters = {}) {
  const recipe = lookup.recipe[recipeId]
  const occupancy = occupancyInWindow(windowStart, windowEnd, filters.tableId)
  const visits = visitsInWindow(windowStart, windowEnd, { tableId: filters.tableId, personId: filters.personId })
  const kitchen = kitchenInWindow(windowStart, windowEnd, { counterId: filters.counterId, personId: filters.personId })
  if (recipeId === 'rcp-table-occupancy') {
    const byTable = tableSummaries(windowStart, windowEnd).filter((row) => row.occupancyMs > 0 && (!filters.tableId || row.tableId === filters.tableId))
    const longest = [...byTable].sort((a, b) => b.occupancyMs - a.occupancyMs)[0]
    return {
      recipe,
      eventsEvaluated: occupancy.length,
      supportingEvents: occupancy,
      rows: byTable.map((row) => ({ id: row.tableId, label: row.code, sessions: row.sessionCount, dwellMs: row.occupancyMs, guests: row.guestCount })),
      result: longest
        ? `${longest.code} led occupancy with ${longest.sessionCount} session${longest.sessionCount === 1 ? '' : 's'} across the selected window.`
        : 'No table occupancy was recorded in this window.',
    }
  }
  if (recipeId === 'rcp-waiter-service') {
    const waiterRows = waiterSummaries(windowStart, windowEnd).filter((row) => row.visitCount > 0 && (!filters.personId || row.personId === filters.personId))
    const top = waiterRows[0]
    const tableFocus = filters.tableId ? visitsInWindow(windowStart, windowEnd, { tableId: filters.tableId }) : visits
    const focusTable = filters.tableId ? lookup.table[filters.tableId] : null
    return {
      recipe,
      eventsEvaluated: tableFocus.length,
      supportingEvents: tableFocus,
      rows: waiterRows.map((row) => ({ id: row.personId, label: row.name, visits: row.visitCount, dwellMs: row.dwellMs, tables: row.tableCount })),
      result: focusTable
        ? `${focusTable.code} received ${tableFocus.length} waiter visit${tableFocus.length === 1 ? '' : 's'} during the selected period.`
        : top
          ? `${top.name} recorded ${top.visitCount} visits across ${top.tableCount} tables.`
          : 'No waiter visits were recorded in this window.',
    }
  }
  if (recipeId === 'rcp-kitchen-utilisation') {
    const counterRows = counterSummaries(windowStart, windowEnd).filter((row) => row.dwellMs > 0 && (!filters.counterId || row.counterId === filters.counterId))
    const top = counterRows[0]
    return {
      recipe,
      eventsEvaluated: kitchen.length,
      supportingEvents: kitchen,
      rows: counterRows.map((row) => ({ id: row.counterId, label: row.name, visits: row.visitCount, dwellMs: row.dwellMs, employees: row.employeeCount })),
      result: top
        ? `${top.name} accumulated the highest station dwell, with ${top.employeeCount} identified employee${top.employeeCount === 1 ? '' : 's'} observed.`
        : 'No kitchen station dwell was recorded in this window.',
    }
  }
  const tableRows = tableSummaries(windowStart, windowEnd).filter((row) => row.occupancyMs > 0)
  const paired = tableRows.map((row) => ({
    id: row.tableId,
    label: row.code,
    occupancyMs: row.occupancyMs,
    visits: row.visitCount,
    waiterDwellMs: row.waiterDwellMs,
    visitsPerHour: row.occupancyMs ? row.visitCount / (row.occupancyMs / 3600000) : 0,
  })).sort((a, b) => b.visits - a.visits)
  const lead = paired[0]
  return {
    recipe,
    eventsEvaluated: occupancy.length + visits.length,
    supportingEvents: [...occupancy, ...visits],
    rows: paired,
    result: lead
      ? `${lead.label} received the densest waiter coverage among occupied tables, with ${lead.visits} visits during occupancy.`
      : 'No occupancy and waiter activity could be paired in this window.',
  }
}

export function cookbookStatus(windowStart, windowEnd) {
  return cookbooks.map((cookbook) => {
    const recipeRows = cookbook.recipeIds.map((recipeId) => evaluateRecipe(recipeId, windowStart, windowEnd))
    const eventsEvaluated = recipeRows.reduce((sum, row) => sum + row.eventsEvaluated, 0)
    return {
      ...cookbook,
      recipeCount: cookbook.recipeIds.length,
      eventsEvaluated,
      recipes: recipeRows,
    }
  })
}

export function resolveEvent(eventId, date = DAY) {
  const event = lookup.event[eventId]
  if (!event) return null
  const day = date || DAY
  return {
    ...event,
    startAt: alignIsoToDate(event.startAt, day),
    endAt: alignIsoToDate(event.endAt || event.startAt, day),
    person: event.personId ? lookup.person[event.personId] : null,
    table: event.tableId ? lookup.table[event.tableId] : null,
    counter: event.counterId ? lookup.counter[event.counterId] : null,
    camera: lookup.camera[event.cameraId],
    video: lookup.video[event.videoId],
    occupancy: event.occupancyId ? occupancySessions.find((row) => row.occupancyId === event.occupancyId) : null,
  }
}

export function availableDates() {
  return [DAY]
}

// ---------------------------------------------------------------------------
// Occupancy-aware analytics (CTO rules)
//
// Granularity is the table occupancy session, not the guest. A waiter visit
// only counts while that table is occupied. Every function below accepts a
// list of {start,end,date} ranges so a single service window or a multi-day
// period is handled by the same code path.
// ---------------------------------------------------------------------------

/** Shift a YYYY-MM-DD string by whole days without touching time zones. */
export function addDays(date, count) {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + count)
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Expand a date (or date range) plus a time window into per-day bounds. */
export function rangeBoundsList(dateStart, dateEnd, windowId, customStart, customEnd) {
  const first = dateStart || DAY
  const last = dateEnd && dateEnd >= first ? dateEnd : first
  const out = []
  let cursor = first
  let guard = 0
  while (cursor <= last && guard < 31) {
    const bounds = windowBounds(cursor, windowId, customStart, customEnd)
    out.push({ ...bounds, date: cursor })
    cursor = addDays(cursor, 1)
    guard += 1
  }
  return out
}

export function attentionScore(visits, occupancyMs) {
  if (!occupancyMs) return 0
  return visits / (occupancyMs / ATTENTION_UNIT_MS)
}

/** Bands calibrated for fine dining: a touch every ~25 min is attentive, ~35 min is steady. */
export const ATTENTION_THRESHOLDS = { attentive: 0.6, steady: 0.4 }

export function attentionBand(score, lowBelow = ATTENTION_THRESHOLDS.steady) {
  if (score >= ATTENTION_THRESHOLDS.attentive) return { tone: 'good', label: 'Attentive' }
  if (score >= lowBelow) return { tone: 'steady', label: 'Steady' }
  if (score > 0) return { tone: 'low', label: 'Under-served' }
  return { tone: 'none', label: 'No visits' }
}

function clipToSession(visit, session) {
  const start = Math.max(new Date(visit.startAt).getTime(), new Date(session.startAt).getTime())
  const end = Math.min(new Date(visit.endAt).getTime(), new Date(session.endAt).getTime())
  return Math.max(0, end - start)
}

/**
 * One record per occupancy session in the ranges, with the server visits that
 * happened while the table was occupied. Visits outside occupancy are dropped.
 */
export function sessionRecords(ranges, { tableId, personId } = {}) {
  const records = []
  for (const range of ranges) {
    const sessions = occupancyInWindow(range.start, range.end, tableId)
    const visits = visitsInWindow(range.start, range.end, { tableId })
    for (const session of sessions) {
      const during = visits.filter((visit) => (
        visit.tableId === session.tableId
        && (visit.occupancyId === session.occupancyId || clipToSession(visit, session) > 0)
      )).map((visit) => ({ ...visit, durationMs: clipToSession(visit, session) })).filter((visit) => visit.durationMs > 0)
      if (personId && !during.some((visit) => visit.personId === personId)) continue
      const byServer = {}
      for (const visit of during) {
        const bucket = byServer[visit.personId] || { personId: visit.personId, person: lookup.person[visit.personId], visits: 0, dwellMs: 0 }
        bucket.visits += 1
        bucket.dwellMs += visit.durationMs
        byServer[visit.personId] = bucket
      }
      const servers = Object.values(byServer).sort((a, b) => b.visits - a.visits || b.dwellMs - a.dwellMs)
      const serverDwellMs = during.reduce((sum, visit) => sum + visit.durationMs, 0)
      records.push({
        ...session,
        date: range.date,
        table: lookup.table[session.tableId],
        servers,
        visits: during,
        visitCount: during.length,
        serverDwellMs,
        attention: attentionScore(during.length, session.durationMs),
        gapMs: during.length ? Math.round(session.durationMs / (during.length + 1)) : session.durationMs,
      })
    }
  }
  return records.sort((a, b) => a.date.localeCompare(b.date) || a.startAt.localeCompare(b.startAt))
}

/** Ranked server comparison. Visits are only counted during table occupancy. */
export function serverPerformance(ranges) {
  const records = sessionRecords(ranges)
  const rows = waiters.map((waiter) => {
    const covered = records.filter((record) => record.servers.some((server) => server.personId === waiter.personId))
    const visits = covered.flatMap((record) => record.visits.filter((visit) => visit.personId === waiter.personId))
    const occupancyMs = covered.reduce((sum, record) => sum + record.durationMs, 0)
    const dwellMs = visits.reduce((sum, visit) => sum + visit.durationMs, 0)
    const tableIds = [...new Set(covered.map((record) => record.tableId))]
    const allVisits = ranges.reduce((sum, range) => sum + visitsInWindow(range.start, range.end, { personId: waiter.personId }).length, 0)
    const byTable = tableIds.map((tableId) => {
      const tableRecords = covered.filter((record) => record.tableId === tableId)
      const tableVisits = visits.filter((visit) => visit.tableId === tableId)
      const tableOccupancy = tableRecords.reduce((sum, record) => sum + record.durationMs, 0)
      return {
        tableId,
        table: lookup.table[tableId],
        sessions: tableRecords.length,
        visits: tableVisits.length,
        dwellMs: tableVisits.reduce((sum, visit) => sum + visit.durationMs, 0),
        occupancyMs: tableOccupancy,
        attention: attentionScore(tableVisits.length, tableOccupancy),
      }
    }).sort((a, b) => b.visits - a.visits)
    const score = attentionScore(visits.length, occupancyMs)
    return {
      ...waiter,
      sessionsCovered: covered.length,
      tablesServed: tableIds.length,
      tableIds,
      byTable,
      occupancyMs,
      visitCount: visits.length,
      visitsOutsideOccupancy: Math.max(0, allVisits - visits.length),
      dwellMs,
      averageVisitMs: visits.length ? Math.round(dwellMs / visits.length) : 0,
      attention: score,
      band: attentionBand(score),
      sessions: covered,
    }
  })
  return rows
    .sort((a, b) => b.attention - a.attention || b.visitCount - a.visitCount || b.dwellMs - a.dwellMs)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

/** Per-table roll-up of occupancy sessions with server coverage. */
export function tablePerformance(ranges) {
  const records = sessionRecords(ranges)
  return tables.map((table) => {
    const rows = records.filter((record) => record.tableId === table.tableId)
    const occupancyMs = rows.reduce((sum, record) => sum + record.durationMs, 0)
    const visitCount = rows.reduce((sum, record) => sum + record.visitCount, 0)
    const covers = rows.reduce((sum, record) => sum + (record.guestCount || 0), 0)
    const serverIds = [...new Set(rows.flatMap((record) => record.servers.map((server) => server.personId)))]
    const score = attentionScore(visitCount, occupancyMs)
    return {
      ...table,
      camera: lookup.camera[table.cameraId],
      sessions: rows,
      sessionCount: rows.length,
      occupancyMs,
      averageSessionMs: rows.length ? Math.round(occupancyMs / rows.length) : 0,
      covers,
      visitCount,
      serverDwellMs: rows.reduce((sum, record) => sum + record.serverDwellMs, 0),
      serverIds,
      servers: serverIds.map((personId) => lookup.person[personId]).filter(Boolean),
      attention: score,
      band: attentionBand(score),
    }
  }).sort((a, b) => b.occupancyMs - a.occupancyMs)
}

/** Ranked kitchen staff by station time, rolled up into the two CTO regions. */
export function kitchenPerformance(ranges) {
  const windowMs = ranges.reduce((sum, range) => sum + Math.max(0, new Date(range.end) - new Date(range.start)), 0)
  const rows = kitchenStaff.map((person) => {
    const dwells = ranges.flatMap((range) => kitchenInWindow(range.start, range.end, { personId: person.personId }))
    const dwellMs = dwells.reduce((sum, dwell) => sum + dwell.durationMs, 0)
    const byRegion = Object.fromEntries(kitchenRegions.map((region) => [region.regionId, { ...region, dwellMs: 0, visits: 0 }]))
    const byCounter = {}
    for (const dwell of dwells) {
      const counter = lookup.counter[dwell.counterId]
      if (counter?.regionId && byRegion[counter.regionId]) {
        byRegion[counter.regionId].dwellMs += dwell.durationMs
        byRegion[counter.regionId].visits += 1
      }
      const bucket = byCounter[dwell.counterId] || { counterId: dwell.counterId, counter, visits: 0, dwellMs: 0 }
      bucket.visits += 1
      bucket.dwellMs += dwell.durationMs
      byCounter[dwell.counterId] = bucket
    }
    const regions = Object.values(byRegion)
    const primary = [...regions].sort((a, b) => b.dwellMs - a.dwellMs)[0]
    return {
      ...person,
      dwells,
      dwellMs,
      visitCount: dwells.length,
      averageMs: dwells.length ? Math.round(dwellMs / dwells.length) : 0,
      utilisation: windowMs ? Math.min(1, dwellMs / windowMs) : 0,
      regions,
      primaryRegion: primary?.dwellMs ? primary : null,
      counters: Object.values(byCounter).sort((a, b) => b.dwellMs - a.dwellMs),
      lastActivity: [...dwells].sort((a, b) => b.endAt.localeCompare(a.endAt))[0] || null,
    }
  })
  return rows
    .sort((a, b) => b.dwellMs - a.dwellMs || b.visitCount - a.visitCount)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

export function regionSummaries(ranges) {
  const staff = kitchenPerformance(ranges)
  return kitchenRegions.map((region) => {
    const dwellMs = staff.reduce((sum, row) => sum + (row.regions.find((item) => item.regionId === region.regionId)?.dwellMs || 0), 0)
    const visits = staff.reduce((sum, row) => sum + (row.regions.find((item) => item.regionId === region.regionId)?.visits || 0), 0)
    const people = staff.filter((row) => (row.regions.find((item) => item.regionId === region.regionId)?.dwellMs || 0) > 0)
    return {
      ...region,
      dwellMs,
      visits,
      staffCount: people.length,
      stations: counters.filter((counter) => counter.regionId === region.regionId).map((counter) => ({
        ...counter,
        dwellMs: staff.reduce((sum, row) => sum + (row.counters.find((item) => item.counterId === counter.counterId)?.dwellMs || 0), 0),
      })).sort((a, b) => b.dwellMs - a.dwellMs),
    }
  }).sort((a, b) => b.dwellMs - a.dwellMs)
}

/** Whole-restaurant scoreboard numbers for the period. */
export function restaurantSummary(ranges) {
  const records = sessionRecords(ranges)
  const servers = serverPerformance(ranges)
  const kitchen = kitchenPerformance(ranges)
  const occupancyMs = records.reduce((sum, record) => sum + record.durationMs, 0)
  const visitCount = records.reduce((sum, record) => sum + record.visitCount, 0)
  const covers = records.reduce((sum, record) => sum + (record.guestCount || 0), 0)
  const kitchenDwellMs = kitchen.reduce((sum, row) => sum + row.dwellMs, 0)
  const tablesUsed = new Set(records.map((record) => record.tableId)).size
  const score = attentionScore(visitCount, occupancyMs)
  return {
    days: ranges.length,
    sessions: records.length,
    covers,
    tablesUsed,
    totalTables: tables.length,
    occupancyMs,
    averageSessionMs: records.length ? Math.round(occupancyMs / records.length) : 0,
    visitCount,
    attention: score,
    band: attentionBand(score),
    activeServers: servers.filter((row) => row.visitCount > 0).length,
    activeKitchen: kitchen.filter((row) => row.dwellMs > 0).length,
    kitchenDwellMs,
    underServed: records.filter((record) => record.visitCount > 0 && record.attention < ATTENTION_THRESHOLDS.steady).length,
    unvisited: records.filter((record) => record.visitCount === 0).length,
    records,
    servers,
    kitchen,
  }
}

export { cameras, recipes, restaurant, tables, timeWindows }
