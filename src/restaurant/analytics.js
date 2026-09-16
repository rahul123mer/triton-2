import {
  at,
  cameras,
  cookbooks,
  counters,
  DAY,
  events,
  kitchenStaff,
  lookup,
  occupancySessions,
  recipes,
  restaurant,
  tables,
  timeWindows,
  waiters,
} from './data'

export function padClock(value) {
  const [h = '00', m = '00', s = '00'] = String(value || '00:00:00').split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${(s || '00').padStart(2, '0')}`
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
  const start = Math.max(new Date(startAt).getTime(), new Date(windowStart).getTime())
  const end = Math.min(new Date(endAt).getTime(), new Date(windowEnd).getTime())
  return Math.max(0, end - start)
}

export function overlapsWindow(record, windowStart, windowEnd) {
  const start = new Date(record.startAt).getTime()
  const end = new Date(record.endAt || record.startAt).getTime()
  return start <= new Date(windowEnd).getTime() && end >= new Date(windowStart).getTime()
}

export function eventsInWindow(windowStart, windowEnd, predicate = () => true) {
  return events.filter((event) => overlapsWindow(event, windowStart, windowEnd) && predicate(event))
}

function clipped(event, windowStart, windowEnd) {
  const durationMs = event.durationMs > 0
    ? overlapMs(event.startAt, event.endAt, windowStart, windowEnd)
    : 0
  return { ...event, durationMs }
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
  const occupancyMs = tableRows.reduce((sum, row) => sum + row.occupancyMs, 0)
  const occupied = tableRows.filter((row) => row.status === 'occupied').length
  const waiterVisits = waiterRows.reduce((sum, row) => sum + row.visitCount, 0)
  const waiterDwell = waiterRows.reduce((sum, row) => sum + row.dwellMs, 0)
  const kitchenActive = kitchenRows.filter((row) => row.visitCount > 0).length
  const occupiedWithTime = tableRows.filter((row) => row.occupancyMs > 0)
  return {
    totalTables: tableRows.length,
    occupiedTables: occupied,
    occupancySessions: occupancyInWindow(windowStart, windowEnd).length,
    averageTableDwell: occupiedWithTime.length ? Math.round(occupancyMs / occupiedWithTime.length) : 0,
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
      href: `/restaurant/tables/${longestTable.tableId}`,
    })
  }
  if (busiestWaiter?.visitCount) {
    items.push({
      insightId: 'ins-busiest-waiter',
      text: `${busiestWaiter.name} recorded the highest number of table visits during the selected period.`,
      recipeId: 'rcp-waiter-service',
      eventIds: visitsInWindow(windowStart, windowEnd, { personId: busiestWaiter.personId }).map((event) => event.eventId),
      href: `/restaurant/service/${busiestWaiter.personId}`,
    })
  }
  if (busiestCounter?.dwellMs) {
    items.push({
      insightId: 'ins-busiest-counter',
      text: `${busiestCounter.name} recorded the highest cumulative employee dwell time during the selected kitchen period.`,
      recipeId: 'rcp-kitchen-utilisation',
      eventIds: kitchenInWindow(windowStart, windowEnd, { counterId: busiestCounter.counterId }).map((event) => event.eventId),
      href: `/restaurant/kitchen?counter=${busiestCounter.counterId}`,
    })
  }
  if (busiestKitchen?.dwellMs) {
    items.push({
      insightId: 'ins-kitchen-lead',
      text: `${busiestKitchen.name} accumulated the most station dwell time across kitchen counters.`,
      recipeId: 'rcp-kitchen-utilisation',
      eventIds: kitchenInWindow(windowStart, windowEnd, { personId: busiestKitchen.personId }).map((event) => event.eventId),
      href: `/restaurant/kitchen/${busiestKitchen.personId}`,
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
      href: `/restaurant/tables/${underServed.tableId}`,
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

export function resolveEvent(eventId) {
  const event = lookup.event[eventId]
  if (!event) return null
  return {
    ...event,
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

export { cameras, recipes, restaurant, tables, timeWindows }
