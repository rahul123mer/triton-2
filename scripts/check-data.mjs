import { occupancySessions, waiterVisits, events, lookup } from '../src/restaurant/data.js'
import { kpis, windowBounds, evaluateRecipe } from '../src/restaurant/analytics.js'

function dwell(start, end, day = '2026-09-15') {
  return new Date(`${day}T${end}+05:30`) - new Date(`${day}T${start}+05:30`)
}

const alexT04 = waiterVisits.filter(v => v.visitId.startsWith('wtr-alex-t04-') && !v.visitId.includes('l'))
const alexT04Ms = alexT04.reduce((s, v) => s + dwell(v.start, v.end), 0)
console.log('Alex T04 visits', alexT04.length, 'ms', alexT04Ms, 'expect 702000', alexT04Ms === 702000)

const t04 = occupancySessions.filter(s => s.tableId === 'tbl-04' && s.occupancyId.includes('-d'))
console.log('T04 dinner sessions', t04.map(s => [s.start, s.end, dwell(s.start, s.end)]))

const dangling = events.filter(e => (e.personId && !lookup.person[e.personId]) || (e.tableId && !lookup.table[e.tableId]) || (e.cameraId && !lookup.camera[e.cameraId]) || (e.videoId && !lookup.video[e.videoId]))
console.log('dangling refs', dangling.length)

const { start, end } = windowBounds('2026-09-15', 'dinner')
const snap = kpis(start, end)
console.log('dinner occupied', snap.occupiedTables, 'visits', snap.waiterVisits, 'avg', snap.averageTableDwell)
console.log('top waiter', snap.waiterRows[0].name, snap.waiterRows[0].visitCount)
console.log('top counter', snap.counterRows[0].name, snap.counterRows[0].dwellMs)
console.log('top table', [...snap.tableRows].sort((a,b)=>b.occupancyMs-a.occupancyMs)[0].code)
const waiterRecipe = evaluateRecipe('rcp-waiter-service', start, end, { tableId: 'tbl-04' })
console.log('T04 waiter recipe', waiterRecipe.result, waiterRecipe.eventsEvaluated)
