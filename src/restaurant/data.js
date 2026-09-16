export const DAY = '2026-09-15'
export const TIMEZONE = '+05:30'

export function at(clock, day = DAY) {
  return `${day}T${clock}${TIMEZONE}`
}

export function msBetween(startIso, endIso) {
  return Math.max(0, new Date(endIso).getTime() - new Date(startIso).getTime())
}

export const restaurant = {
  restaurantId: 'rst-ember-room',
  name: 'The Ember Room',
  location: 'Chicago, Illinois',
  venue: 'River North',
  serviceStyle: 'Upscale casual',
  covers: 42,
  timezone: 'Asia/Kolkata',
}

export const cameras = [
  { cameraId: 'cam-df-01', name: 'Dining Area 01', zone: 'dining', coverage: 'T01–T04 · booths' },
  { cameraId: 'cam-df-02', name: 'Dining Area 02', zone: 'dining', coverage: 'T05–T07 · centre tables' },
  { cameraId: 'cam-df-03', name: 'Dining Wide', zone: 'dining', coverage: 'T01–T10 · full floor' },
  { cameraId: 'cam-kit-01', name: 'Kitchen Prep', zone: 'kitchen', coverage: 'Food prep, cooking, plating & takeaway' },
  { cameraId: 'cam-kit-02', name: 'Kitchen Wash', zone: 'kitchen', coverage: 'Dish and vegetable wash' },
  { cameraId: 'cam-reception', name: 'Reception', zone: 'front', coverage: 'Host stand and entrance' },
]

/** Kitchen regions the prospect will recognise. Stations roll up into these. */
export const kitchenRegions = [
  { regionId: 'reg-prep', name: 'Food prep / cooking', cameraId: 'cam-kit-01', description: 'Mise en place, grill, range and plating before service.' },
  { regionId: 'reg-assembly', name: 'Final food assembly', cameraId: 'cam-kit-01', description: 'Pass plating and takeaway packing on the prep camera.' },
  { regionId: 'reg-wash', name: 'Dish & vegetable wash', cameraId: 'cam-kit-02', description: 'Three-compartment sink, dishwasher and vegetable rinse.' },
]

export const videos = [
  { videoId: 'vid-dining-floor', cameraId: 'cam-df-01', title: 'Dining Area 01', src: '/restaurant-media/v3/dining-cam-1.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-table-occupancy', cameraId: 'cam-df-01', title: 'Dining Area 01 · booth focus', src: '/restaurant-media/v3/dining-cam-1.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', title: 'Dining Area 01 · server visit', src: '/restaurant-media/v3/dining-cam-1.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', title: 'Dining Area 02', src: '/restaurant-media/v3/dining-cam-2.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-dining-wide', cameraId: 'cam-df-03', title: 'Dining Wide', src: '/restaurant-media/v3/dining-wide.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', title: 'Kitchen Prep · cooking & takeaway', src: '/restaurant-media/v3/kitchen-prep.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', title: 'Kitchen Wash', src: '/restaurant-media/v3/kitchen-wash.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-reception', cameraId: 'cam-reception', title: 'Reception / Front Desk', src: '/restaurant-media/v3/reception.mp4', durationMs: 15000, recordedOn: DAY },
]

export const videoPersonZones = {
  'vid-kitchen-activity': [
    { zoneId: 'kit-area-plating', kind: 'area', role: 'station', label: 'Final assembly', badge: 'pass / plating', color: '#22c55e', points: [[2, 30], [42, 28], [44, 92], [2, 96]] },
    { zoneId: 'kit-area-range', kind: 'area', role: 'station', label: 'Cooking line', badge: 'range', color: '#f59e0b', points: [[44, 18], [78, 16], [80, 72], [46, 76]] },
    { zoneId: 'kit-area-prep', kind: 'area', role: 'station', label: 'Food prep', badge: 'prep board', color: '#3b82f6', points: [[72, 40], [98, 38], [98, 92], [74, 96]] },
    { zoneId: 'kit-area-takeaway', kind: 'area', role: 'station', label: 'Takeaway pack', badge: 'to-go', color: '#a855f7', points: [[28, 70], [62, 68], [64, 98], [26, 98]] },
    { zoneId: 'kit-act-daniel', kind: 'person', personId: 'kit-daniel', role: 'staff', label: 'Daniel Carter', detail: 'Final assembly', color: '#22c55e', x: 22, y: 48, rx: 5.5, ry: 3.2 },
    { zoneId: 'kit-act-james', kind: 'person', personId: 'kit-james', role: 'staff', label: 'James Wilson', detail: 'Cooking line', color: '#f59e0b', x: 58, y: 42, rx: 5.5, ry: 3.2 },
    { zoneId: 'kit-act-maria', kind: 'person', personId: 'kit-maria', role: 'staff', label: 'Maria Thompson', detail: 'Food prep', color: '#3b82f6', x: 84, y: 58, rx: 5.5, ry: 3.2 },
  ],
  'vid-kitchen-movement': [
    { zoneId: 'kit-area-dish', kind: 'area', role: 'station', label: 'Dish wash', badge: '3-compartment sink', color: '#06b6d4', points: [[18, 28], [62, 24], [66, 88], [16, 92]] },
    { zoneId: 'kit-area-veg', kind: 'area', role: 'station', label: 'Vegetable wash', badge: 'veg sink', color: '#22c55e', points: [[62, 36], [98, 34], [98, 92], [64, 96]] },
    { zoneId: 'kit-mov-marcus', kind: 'person', personId: 'kit-marcus', role: 'staff', label: 'Marcus Reed', detail: 'Dish wash', color: '#06b6d4', x: 40, y: 52, rx: 5.5, ry: 3.2 },
    { zoneId: 'kit-mov-olivia', kind: 'person', personId: 'kit-olivia', role: 'staff', label: 'Olivia Bennett', detail: 'Vegetable wash', color: '#22c55e', x: 78, y: 58, rx: 5, ry: 2.8 },
  ],
  'vid-dining-floor': [
    { zoneId: 'df-t01', kind: 'area', role: 'table', label: 'T01', badge: '2 seated', color: '#22c55e', points: [[2, 48], [28, 44], [30, 78], [2, 82]] },
    { zoneId: 'df-t02', kind: 'area', role: 'table', label: 'T02', badge: '2 seated', color: '#3b82f6', points: [[28, 36], [52, 32], [54, 66], [26, 70]] },
    { zoneId: 'df-t03', kind: 'area', role: 'table', label: 'T03', badge: '2 seated', color: '#a855f7', points: [[52, 28], [74, 24], [76, 56], [50, 60]] },
    { zoneId: 'df-t04', kind: 'area', role: 'table', label: 'T04', badge: '2 seated', color: '#f59e0b', points: [[58, 58], [86, 54], [88, 88], [56, 92]] },
    {
      zoneId: 'df-alex',
      kind: 'person',
      personId: 'wtr-alex',
      role: 'waiter',
      label: 'Alex Morgan',
      detail: 'Floor service',
      color: '#06b6d4',
      track: [
        { t: 0, x: 18, y: 58, rx: 4.5, ry: 2.6 },
        { t: 5, x: 22, y: 54, rx: 4.5, ry: 2.6 },
        { t: 10, x: 28, y: 50, rx: 4.5, ry: 2.6 },
      ],
    },
    {
      zoneId: 'df-ethan',
      kind: 'person',
      personId: 'wtr-ethan',
      role: 'waiter',
      label: 'Ethan Carter',
      detail: 'Floor service',
      color: '#ec4899',
      track: [
        { t: 0, x: 62, y: 48, rx: 4.5, ry: 2.6 },
        { t: 5, x: 58, y: 56, rx: 4.5, ry: 2.6 },
        { t: 10, x: 54, y: 68, rx: 4.5, ry: 2.6 },
      ],
    },
  ],
  'vid-table-occupancy': [
    { zoneId: 't04-area', kind: 'area', role: 'table', label: 'T04', badge: '2 seated', color: '#f59e0b', points: [[58, 58], [86, 54], [88, 88], [56, 92]] },
    { zoneId: 't04-g1', kind: 'person', role: 'guest', label: 'Guest 1', detail: 'T04', color: '#22c55e', x: 66, y: 70, rx: 5, ry: 3 },
    { zoneId: 't04-g2', kind: 'person', role: 'guest', label: 'Guest 2', detail: 'T04', color: '#3b82f6', x: 78, y: 72, rx: 5, ry: 3 },
  ],
  'vid-waiter-visit': [
    { zoneId: 'wtr-table', kind: 'area', role: 'table', label: 'T01', badge: '2 seated', color: '#22c55e', points: [[2, 48], [28, 44], [30, 78], [2, 82]] },
    {
      zoneId: 'wtr-alex-visit',
      kind: 'person',
      personId: 'wtr-alex',
      role: 'waiter',
      label: 'Alex Morgan',
      detail: 'Server visit',
      color: '#06b6d4',
      track: [
        { t: 0, x: 18, y: 58, rx: 4.8, ry: 2.8 },
        { t: 5, x: 20, y: 56, rx: 4.8, ry: 2.8 },
        { t: 10, x: 24, y: 52, rx: 4.8, ry: 2.8 },
      ],
    },
  ],
  'vid-multi-table-service': [
    { zoneId: 'mt-t05', kind: 'area', role: 'table', label: 'T05', badge: '4 seated', color: '#22c55e', points: [[4, 58], [38, 54], [40, 92], [2, 96]] },
    { zoneId: 'mt-t06', kind: 'area', role: 'table', label: 'T06', badge: '2 seated', color: '#3b82f6', points: [[8, 28], [40, 24], [42, 54], [6, 58]] },
    { zoneId: 'mt-t07', kind: 'area', role: 'table', label: 'T07', badge: '2 seated', color: '#f59e0b', points: [[58, 58], [92, 54], [94, 92], [56, 96]] },
    {
      zoneId: 'mt-sofia',
      kind: 'person',
      personId: 'wtr-sofia',
      role: 'waiter',
      label: 'Sofia Bennett',
      detail: 'Floor service',
      color: '#ec4899',
      track: [
        { t: 0, x: 28, y: 42, rx: 4.5, ry: 2.6 },
        { t: 5, x: 32, y: 40, rx: 4.5, ry: 2.6 },
        { t: 10, x: 36, y: 38, rx: 4.5, ry: 2.6 },
      ],
    },
    {
      zoneId: 'mt-danielb',
      kind: 'person',
      personId: 'wtr-danielb',
      role: 'waiter',
      label: 'Daniel Brooks',
      detail: 'Floor service',
      color: '#06b6d4',
      track: [
        { t: 0, x: 72, y: 68, rx: 4.5, ry: 2.6 },
        { t: 5, x: 68, y: 66, rx: 4.5, ry: 2.6 },
        { t: 10, x: 64, y: 64, rx: 4.5, ry: 2.6 },
      ],
    },
  ],
  'vid-dining-wide': [
    { zoneId: 'dw-t01', kind: 'area', role: 'table', label: 'T01', badge: '2 seated', color: '#22c55e', points: [[28, 52], [44, 48], [46, 72], [26, 76]] },
    { zoneId: 'dw-t05', kind: 'area', role: 'table', label: 'T05', badge: '4 seated', color: '#3b82f6', points: [[46, 42], [66, 38], [68, 64], [44, 68]] },
    { zoneId: 'dw-booth', kind: 'area', role: 'table', label: 'T08', badge: '2 seated', color: '#f59e0b', points: [[68, 48], [92, 44], [94, 78], [66, 82]] },
    {
      zoneId: 'dw-alex',
      kind: 'person',
      personId: 'wtr-alex',
      role: 'waiter',
      label: 'Alex Morgan',
      detail: 'Floor service',
      color: '#06b6d4',
      track: [
        { t: 0, x: 42, y: 48, rx: 3.8, ry: 2.2 },
        { t: 5, x: 48, y: 46, rx: 3.8, ry: 2.2 },
        { t: 10, x: 54, y: 44, rx: 3.8, ry: 2.2 },
      ],
    },
    {
      zoneId: 'dw-sofia',
      kind: 'person',
      personId: 'wtr-sofia',
      role: 'waiter',
      label: 'Sofia Bennett',
      detail: 'Floor service',
      color: '#ec4899',
      track: [
        { t: 0, x: 72, y: 56, rx: 3.8, ry: 2.2 },
        { t: 5, x: 74, y: 54, rx: 3.8, ry: 2.2 },
        { t: 10, x: 76, y: 52, rx: 3.8, ry: 2.2 },
      ],
    },
    {
      zoneId: 'dw-grace',
      kind: 'person',
      personId: 'fd-grace',
      role: 'host',
      label: 'Grace Kim',
      detail: 'Host stand',
      color: '#a855f7',
      x: 14,
      y: 58,
      rx: 3.8,
      ry: 2.2,
    },
  ],
  'vid-reception': [
    { zoneId: 'rx-stand', kind: 'area', role: 'station', label: 'Host stand', badge: 'POS', color: '#a855f7', points: [[28, 48], [62, 44], [66, 92], [24, 96]] },
    {
      zoneId: 'rx-grace',
      kind: 'person',
      personId: 'fd-grace',
      role: 'host',
      label: 'Grace Kim',
      detail: 'Reception',
      color: '#a855f7',
      track: [
        { t: 0, x: 42, y: 58, rx: 5, ry: 3 },
        { t: 5, x: 44, y: 56, rx: 5, ry: 3 },
        { t: 10, x: 46, y: 54, rx: 5, ry: 3 },
      ],
    },
    {
      zoneId: 'rx-ethan',
      kind: 'person',
      personId: 'wtr-ethan',
      role: 'waiter',
      label: 'Ethan Carter',
      detail: 'Floor service',
      color: '#06b6d4',
      track: [
        { t: 0, x: 58, y: 42, rx: 4.5, ry: 2.6 },
        { t: 5, x: 62, y: 40, rx: 4.5, ry: 2.6 },
        { t: 10, x: 68, y: 38, rx: 4.5, ry: 2.6 },
      ],
    },
  ],
}

export const tables = [
  { tableId: 'tbl-01', code: 'T01', seats: 2, x: 8, y: 12, w: 16, h: 16, cameraId: 'cam-df-01', reservedDinner: false },
  { tableId: 'tbl-02', code: 'T02', seats: 4, x: 30, y: 10, w: 20, h: 18, cameraId: 'cam-df-01', reservedDinner: false },
  { tableId: 'tbl-03', code: 'T03', seats: 2, x: 56, y: 12, w: 16, h: 16, cameraId: 'cam-df-01', reservedDinner: true },
  { tableId: 'tbl-04', code: 'T04', seats: 4, x: 78, y: 10, w: 18, h: 20, cameraId: 'cam-df-01', reservedDinner: false },
  { tableId: 'tbl-05', code: 'T05', seats: 6, x: 10, y: 42, w: 24, h: 20, cameraId: 'cam-df-02', reservedDinner: false },
  { tableId: 'tbl-06', code: 'T06', seats: 4, x: 42, y: 44, w: 20, h: 18, cameraId: 'cam-df-02', reservedDinner: false },
  { tableId: 'tbl-07', code: 'T07', seats: 4, x: 72, y: 42, w: 22, h: 20, cameraId: 'cam-df-02', reservedDinner: false },
  { tableId: 'tbl-08', code: 'T08', seats: 2, x: 12, y: 74, w: 16, h: 16, cameraId: 'cam-df-03', reservedDinner: false },
  { tableId: 'tbl-09', code: 'T09', seats: 4, x: 40, y: 72, w: 20, h: 18, cameraId: 'cam-df-03', reservedDinner: false },
  { tableId: 'tbl-10', code: 'T10', seats: 8, x: 70, y: 70, w: 26, h: 22, cameraId: 'cam-df-03', reservedDinner: false },
]

const portrait = (personId) => `/restaurant-media/portraits/${personId}.png`

export const waiters = [
  { personId: 'wtr-alex', name: 'Alex Morgan', role: 'waiter', title: 'Server', employeeCode: 'SRV-041', enrolled: true, enrolledOn: '2026-08-02', samples: 6, avatar: portrait('wtr-alex') },
  { personId: 'wtr-sofia', name: 'Sofia Bennett', role: 'waiter', title: 'Server', employeeCode: 'SRV-018', enrolled: true, enrolledOn: '2026-07-19', samples: 8, avatar: portrait('wtr-sofia') },
  { personId: 'wtr-ethan', name: 'Ethan Carter', role: 'waiter', title: 'Server', employeeCode: 'SRV-027', enrolled: true, enrolledOn: '2026-08-11', samples: 5, avatar: portrait('wtr-ethan') },
  { personId: 'wtr-danielb', name: 'Daniel Brooks', role: 'waiter', title: 'Senior server', employeeCode: 'SRV-033', enrolled: true, enrolledOn: '2026-08-11', samples: 4, avatar: portrait('wtr-danielb') },
  { personId: 'fd-grace', name: 'Grace Kim', role: 'waiter', title: 'Host', employeeCode: 'HST-003', enrolled: true, enrolledOn: '2026-08-20', samples: 5, avatar: portrait('fd-grace') },
]

export const kitchenStaff = [
  { personId: 'kit-daniel', name: 'Daniel Carter', role: 'kitchen', title: 'Head chef', station: 'Final assembly', employeeCode: 'KIT-012', enrolled: true, enrolledOn: '2026-07-19', samples: 7, avatar: portrait('kit-daniel') },
  { personId: 'kit-maria', name: 'Maria Thompson', role: 'kitchen', title: 'Chef de partie', station: 'Food prep', employeeCode: 'KIT-007', enrolled: true, enrolledOn: '2026-07-19', samples: 6, avatar: portrait('kit-maria') },
  { personId: 'kit-james', name: 'James Wilson', role: 'kitchen', title: 'Grill cook', station: 'Cooking line', employeeCode: 'KIT-021', enrolled: true, enrolledOn: '2026-08-02', samples: 5, avatar: portrait('kit-james') },
  { personId: 'kit-olivia', name: 'Olivia Bennett', role: 'kitchen', title: 'Pastry cook', station: 'Vegetable wash', employeeCode: 'KIT-015', enrolled: true, enrolledOn: '2026-08-02', samples: 6, avatar: portrait('kit-olivia') },
  { personId: 'kit-marcus', name: 'Marcus Reed', role: 'kitchen', title: 'Kitchen porter', station: 'Dish wash', employeeCode: 'KIT-028', enrolled: true, enrolledOn: '2026-08-20', samples: 4, avatar: portrait('kit-marcus') },
]

export const people = [...waiters, ...kitchenStaff]

/**
 * Detections the face gallery could not match to an enrolled employee. These
 * feed the Resolve queue in Cohorts and the Servers analytics tab.
 */
export const unresolvedFaces = [
  {
    unresolvedId: 'unres-001',
    role: 'waiter',
    cameraId: 'cam-df-02',
    videoId: 'vid-multi-table-service',
    sample: portrait('unresolved-1'),
    firstSeen: '19:33:40',
    lastSeen: '20:41:12',
    occurrences: 6,
    tableIds: ['tbl-06', 'tbl-07'],
    bestMatch: { personId: 'wtr-ethan', similarity: 0.61 },
    note: 'Served T06 and T07 during dinner. Not in the serving-staff cohort.',
  },
  {
    unresolvedId: 'unres-002',
    role: 'kitchen',
    cameraId: 'cam-kit-01',
    videoId: 'vid-kitchen-activity',
    sample: portrait('unresolved-2'),
    firstSeen: '18:05:10',
    lastSeen: '18:41:00',
    occurrences: 3,
    counterIds: ['ctr-prep'],
    bestMatch: { personId: 'kit-maria', similarity: 0.54 },
    note: 'Seen at Food prep before service. Possibly a new hire or agency cover.',
  },
]

/** Video uploads processed for this restaurant. Newest first. */
export const uploadHistory = [
  { uploadId: 'upl-0142', fileName: 'dining-floor-01_2026-09-15_dinner.mp4', cameraId: 'cam-df-01', recordedOn: '2026-09-15', window: 'Dinner', durationMs: 3 * 3600000, sizeMb: 2140, uploadedAt: '2026-09-15T23:12:40+05:30', status: 'processed', events: 96, faces: 4 },
  { uploadId: 'upl-0141', fileName: 'dining-floor-02_2026-09-15_dinner.mp4', cameraId: 'cam-df-02', recordedOn: '2026-09-15', window: 'Dinner', durationMs: 3 * 3600000, sizeMb: 2088, uploadedAt: '2026-09-15T23:10:02+05:30', status: 'processed', events: 74, faces: 4 },
  { uploadId: 'upl-0140', fileName: 'kitchen-01_2026-09-15_dinner.mp4', cameraId: 'cam-kit-01', recordedOn: '2026-09-15', window: 'Dinner', durationMs: 3 * 3600000, sizeMb: 1980, uploadedAt: '2026-09-15T23:04:18+05:30', status: 'processed', events: 41, faces: 4 },
  { uploadId: 'upl-0139', fileName: 'kitchen-02_2026-09-15_dinner.mp4', cameraId: 'cam-kit-02', recordedOn: '2026-09-15', window: 'Dinner', durationMs: 3 * 3600000, sizeMb: 2012, uploadedAt: '2026-09-15T23:01:55+05:30', status: 'processed', events: 38, faces: 3 },
  { uploadId: 'upl-0138', fileName: 'dining-floor-01_2026-09-15_lunch.mp4', cameraId: 'cam-df-01', recordedOn: '2026-09-15', window: 'Lunch', durationMs: 3 * 3600000, sizeMb: 2101, uploadedAt: '2026-09-15T16:20:08+05:30', status: 'processed', events: 63, faces: 4 },
  { uploadId: 'upl-0137', fileName: 'dining-floor-03_2026-09-15_lunch.mp4', cameraId: 'cam-df-03', recordedOn: '2026-09-15', window: 'Lunch', durationMs: 3 * 3600000, sizeMb: 2064, uploadedAt: '2026-09-15T16:18:44+05:30', status: 'processed', events: 48, faces: 3 },
  { uploadId: 'upl-0136', fileName: 'kitchen-01_2026-09-15_morning.mp4', cameraId: 'cam-kit-01', recordedOn: '2026-09-15', window: 'Morning', durationMs: 3 * 3600000, sizeMb: 1876, uploadedAt: '2026-09-15T12:40:31+05:30', status: 'processed', events: 22, faces: 3 },
  { uploadId: 'upl-0135', fileName: 'dining-floor-02_2026-09-14_dinner.mp4', cameraId: 'cam-df-02', recordedOn: '2026-09-14', window: 'Dinner', durationMs: 3 * 3600000, sizeMb: 2122, uploadedAt: '2026-09-14T23:08:12+05:30', status: 'failed', events: 0, faces: 0, error: 'Container truncated at 02:41:10. Re-export from NVR and upload again.' },
]

export function videoForWaiter(personId, tableFilter) {
  if (personId === 'fd-grace') return 'vid-reception'
  if (tableFilter) {
    const table = tables.find((row) => row.tableId === tableFilter)
    if (table?.cameraId === 'cam-df-02') return 'vid-multi-table-service'
    if (table?.cameraId === 'cam-df-03') return 'vid-dining-wide'
  }
  if (personId === 'wtr-sofia' || personId === 'wtr-danielb') return 'vid-multi-table-service'
  if (personId === 'wtr-ethan') return 'vid-dining-floor'
  return 'vid-dining-floor'
}

export function resolveVideoZones(videoId, timeSec = 0, focusPersonId = null, zoneMap = videoPersonZones) {
  const zones = (zoneMap || videoPersonZones)[videoId] || []
  const resolved = []

  for (const zone of zones) {
    if (zone.kind === 'area') {
      resolved.push(zone)
      continue
    }

    if (zone.track?.length) {
      const matching = focusPersonId
        ? zone.track.filter((frame) => (frame.personId ?? zone.personId) === focusPersonId)
        : zone.track

      if (focusPersonId && !matching.length && zone.personId !== focusPersonId) {
        continue
      }

      const frames = matching.length ? matching : zone.track
      let active = frames[0]
      const trail = []
      for (const frame of frames) {
        if (timeSec >= frame.t) {
          active = frame
          trail.push([frame.x, frame.y])
        }
      }
      if (!trail.length) trail.push([active.x, active.y])

      const personId = focusPersonId || active.personId || zone.personId
      const person = personId ? people.find((row) => row.personId === personId) : null
      resolved.push({
        ...zone,
        personId,
        label: focusPersonId
          ? (person?.name || active.label || zone.label)
          : (active.label ?? zone.label ?? person?.name),
        x: active.x,
        y: active.y,
        rx: active.rx ?? zone.rx ?? 4.5,
        ry: active.ry ?? zone.ry ?? 2.6,
        detail: zone.detail || active.detail || 'In frame',
        trail,
        focused: Boolean(focusPersonId && personId === focusPersonId),
      })
      continue
    }

    if (focusPersonId && zone.personId && zone.personId !== focusPersonId) {
      // Keep seated guests visible for table context; hide other recognised staff/waiters.
      if (zone.role !== 'guest') continue
    }

    resolved.push({
      ...zone,
      trail: zone.kind === 'person' ? [[zone.x, zone.y]] : undefined,
      focused: Boolean(focusPersonId && zone.personId === focusPersonId),
    })
  }

  return resolved
}

export const counters = [
  { counterId: 'ctr-grill', name: 'Cooking line', shortName: 'Cooking', regionId: 'reg-prep', cameraId: 'cam-kit-01', x: 44, y: 18, w: 34, h: 40 },
  { counterId: 'ctr-prep', name: 'Food prep', shortName: 'Prep', regionId: 'reg-prep', cameraId: 'cam-kit-01', x: 72, y: 40, w: 26, h: 40 },
  { counterId: 'ctr-plating', name: 'Final assembly', shortName: 'Assembly', regionId: 'reg-assembly', cameraId: 'cam-kit-01', x: 2, y: 30, w: 40, h: 50 },
  { counterId: 'ctr-takeaway', name: 'Takeaway pack', shortName: 'Takeaway', regionId: 'reg-assembly', cameraId: 'cam-kit-01', x: 28, y: 70, w: 34, h: 26 },
  { counterId: 'ctr-dish', name: 'Dish wash', shortName: 'Dish', regionId: 'reg-wash', cameraId: 'cam-kit-02', x: 18, y: 28, w: 44, h: 50 },
  { counterId: 'ctr-veg', name: 'Vegetable wash', shortName: 'Veg', regionId: 'reg-wash', cameraId: 'cam-kit-02', x: 62, y: 36, w: 36, h: 48 },
]

function clampPct(value) {
  return Math.max(1.2, Math.min(98.8, value))
}

function haloPolygon(x, y, w, h, pad = 3.6) {
  return [
    [clampPct(x - pad * 0.95), clampPct(y + h * 0.16)],
    [clampPct(x + w * 0.2), clampPct(y - pad)],
    [clampPct(x + w * 0.68), clampPct(y - pad * 0.55)],
    [clampPct(x + w + pad), clampPct(y + h * 0.18)],
    [clampPct(x + w + pad * 0.72), clampPct(y + h * 0.74)],
    [clampPct(x + w * 0.58), clampPct(y + h + pad)],
    [clampPct(x + w * 0.14), clampPct(y + h + pad * 0.5)],
    [clampPct(x - pad * 0.7), clampPct(y + h * 0.64)],
  ]
}

export const kitchenZones = [
  { zoneId: 'zone-grill', name: 'Cooking line', kind: 'station', counterId: 'ctr-grill', points: haloPolygon(44, 18, 34, 40, 4.2) },
  { zoneId: 'zone-prep', name: 'Food prep', kind: 'station', counterId: 'ctr-prep', points: haloPolygon(72, 40, 26, 40, 3.8) },
  { zoneId: 'zone-plating', name: 'Final assembly', kind: 'station', counterId: 'ctr-plating', points: haloPolygon(2, 30, 40, 50, 4) },
  { zoneId: 'zone-takeaway', name: 'Takeaway pack', kind: 'station', counterId: 'ctr-takeaway', points: haloPolygon(28, 70, 34, 26, 3.6) },
  { zoneId: 'zone-dish', name: 'Dish wash', kind: 'station', counterId: 'ctr-dish', points: haloPolygon(18, 28, 44, 50, 4) },
  { zoneId: 'zone-veg', name: 'Vegetable wash', kind: 'station', counterId: 'ctr-veg', points: haloPolygon(62, 36, 36, 48, 3.6) },
]

export const tableZones = [
  ...tables.map((table) => ({
    zoneId: `zone-${table.tableId}`,
    name: `${table.code} service`,
    kind: 'service',
    tableId: table.tableId,
    points: haloPolygon(table.x, table.y, table.w, table.h, table.seats >= 6 ? 4.8 : 3.8),
  })),
  {
    zoneId: 'zone-aisle-top',
    name: 'Front aisle',
    kind: 'movement',
    points: [[6, 30], [28, 28], [54, 29], [78, 27], [96, 31], [95, 38], [76, 36], [50, 37], [26, 36], [5, 38]],
  },
  {
    zoneId: 'zone-aisle-mid',
    name: 'Centre aisle',
    kind: 'movement',
    points: [[8, 62], [34, 60], [62, 61], [92, 59], [94, 68], [60, 70], [32, 69], [7, 70]],
  },
  {
    zoneId: 'zone-aisle-service',
    name: 'Service run',
    kind: 'movement',
    points: [[2, 18], [8, 16], [10, 78], [4, 86], [1, 48]],
  },
]

export const timeWindows = [
  { windowId: 'morning', label: 'Morning', start: '09:00:00', end: '12:00:00' },
  { windowId: 'lunch', label: 'Lunch', start: '12:00:00', end: '15:00:00' },
  { windowId: 'dinner', label: 'Dinner', start: '18:00:00', end: '21:00:00' },
  { windowId: 'evening', label: 'Evening', start: '21:00:00', end: '23:00:00' },
  { windowId: 'custom', label: 'Custom', start: null, end: null },
]

export const occupancySessions = [
  // Morning — breakfast and early covers
  { occupancyId: 'occ-t01-m1', tableId: 'tbl-01', start: '09:22:18', end: '10:05:40', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t02-m1', tableId: 'tbl-02', start: '09:35:08', end: '10:48:22', guestCount: 3, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t04-m1', tableId: 'tbl-04', start: '10:12:40', end: '11:06:15', guestCount: 2, videoId: 'vid-table-occupancy', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t05-m1', tableId: 'tbl-05', start: '09:48:11', end: '11:12:33', guestCount: 4, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t08-m1', tableId: 'tbl-08', start: '10:05:20', end: '10:52:08', guestCount: 2, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t10-m1', tableId: 'tbl-10', start: '10:18:44', end: '11:40:12', guestCount: 6, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  // Lunch
  { occupancyId: 'occ-t01-l1', tableId: 'tbl-01', start: '12:18:40', end: '13:11:22', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t02-l1', tableId: 'tbl-02', start: '12:24:05', end: '13:46:18', guestCount: 4, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t03-l1', tableId: 'tbl-03', start: '12:28:16', end: '13:18:40', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t04-l1', tableId: 'tbl-04', start: '13:12:08', end: '14:08:51', guestCount: 2, videoId: 'vid-table-occupancy', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t05-l1', tableId: 'tbl-05', start: '12:31:10', end: '14:02:44', guestCount: 5, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t06-l1', tableId: 'tbl-06', start: '12:40:22', end: '13:28:09', guestCount: 3, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t07-l1', tableId: 'tbl-07', start: '12:52:40', end: '14:10:18', guestCount: 4, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t08-l1', tableId: 'tbl-08', start: '13:18:05', end: '14:02:33', guestCount: 2, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t09-l1', tableId: 'tbl-09', start: '13:05:33', end: '14:21:16', guestCount: 4, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t10-l1', tableId: 'tbl-10', start: '12:15:22', end: '13:40:08', guestCount: 6, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  // Dinner — T04 is the longest combined occupancy
  { occupancyId: 'occ-t02-d1', tableId: 'tbl-02', start: '18:41:20', end: '20:12:07', guestCount: 4, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t01-d1', tableId: 'tbl-01', start: '18:48:11', end: '20:06:40', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t06-d1', tableId: 'tbl-06', start: '18:55:02', end: '20:22:40', guestCount: 4, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t04-d1', tableId: 'tbl-04', start: '19:02:14', end: '19:48:31', guestCount: 4, videoId: 'vid-table-occupancy', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t07-d1', tableId: 'tbl-07', start: '19:06:40', end: '20:47:22', guestCount: 4, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t09-d1', tableId: 'tbl-09', start: '19:11:05', end: '20:29:48', guestCount: 3, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t05-d1', tableId: 'tbl-05', start: '19:18:33', end: '20:54:10', guestCount: 6, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t08-d1', tableId: 'tbl-08', start: '19:22:18', end: '20:14:55', guestCount: 2, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t10-d1', tableId: 'tbl-10', start: '19:36:40', end: '20:22:08', guestCount: 7, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t04-d2', tableId: 'tbl-04', start: '20:04:12', end: '21:17:44', guestCount: 4, videoId: 'vid-table-occupancy', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t07-d2', tableId: 'tbl-07', start: '21:08:16', end: '22:11:03', guestCount: 2, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  // Evening — late covers after 21:00
  { occupancyId: 'occ-t02-e1', tableId: 'tbl-02', start: '21:12:08', end: '22:05:40', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t01-e1', tableId: 'tbl-01', start: '21:35:22', end: '22:18:11', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t05-e1', tableId: 'tbl-05', start: '21:18:40', end: '22:28:16', guestCount: 4, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t09-e1', tableId: 'tbl-09', start: '21:22:14', end: '22:15:08', guestCount: 2, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t10-e1', tableId: 'tbl-10', start: '21:08:05', end: '21:55:33', guestCount: 5, videoId: 'vid-dining-wide', cameraId: 'cam-df-03' },
]

export const waiterVisits = [
  // Alex Morgan — T04 5 visits / 11m 42s, T07 3 / 7m 18s, T09 4 / 9m 31s
  { visitId: 'wtr-alex-t04-1', personId: 'wtr-alex', tableId: 'tbl-04', start: '19:08:14', end: '19:10:32', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.96, occupancyId: 'occ-t04-d1' },
  { visitId: 'wtr-alex-t04-2', personId: 'wtr-alex', tableId: 'tbl-04', start: '19:26:05', end: '19:28:21', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.94, occupancyId: 'occ-t04-d1' },
  { visitId: 'wtr-alex-t04-3', personId: 'wtr-alex', tableId: 'tbl-04', start: '19:38:40', end: '19:41:02', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.95, occupancyId: 'occ-t04-d1' },
  { visitId: 'wtr-alex-t04-4', personId: 'wtr-alex', tableId: 'tbl-04', start: '20:12:18', end: '20:14:50', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.93, occupancyId: 'occ-t04-d2' },
  { visitId: 'wtr-alex-t04-5', personId: 'wtr-alex', tableId: 'tbl-04', start: '20:48:05', end: '20:50:19', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.97, occupancyId: 'occ-t04-d2' },
  { visitId: 'wtr-alex-t07-1', personId: 'wtr-alex', tableId: 'tbl-07', start: '19:14:22', end: '19:16:48', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.92, occupancyId: 'occ-t07-d1' },
  { visitId: 'wtr-alex-t07-2', personId: 'wtr-alex', tableId: 'tbl-07', start: '19:47:10', end: '19:49:41', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.91, occupancyId: 'occ-t07-d1' },
  { visitId: 'wtr-alex-t07-3', personId: 'wtr-alex', tableId: 'tbl-07', start: '20:21:05', end: '20:23:26', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.94, occupancyId: 'occ-t07-d1' },
  { visitId: 'wtr-alex-t09-1', personId: 'wtr-alex', tableId: 'tbl-09', start: '19:18:40', end: '19:21:02', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.9, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-alex-t09-2', personId: 'wtr-alex', tableId: 'tbl-09', start: '19:44:11', end: '19:46:28', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.93, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-alex-t09-3', personId: 'wtr-alex', tableId: 'tbl-09', start: '20:02:33', end: '20:05:01', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.92, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-alex-t09-4', personId: 'wtr-alex', tableId: 'tbl-09', start: '20:18:14', end: '20:20:38', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.91, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-alex-t04-l1', personId: 'wtr-alex', tableId: 'tbl-04', start: '13:20:08', end: '13:22:11', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.89, occupancyId: 'occ-t04-l1' },
  { visitId: 'wtr-alex-t02-l1', personId: 'wtr-alex', tableId: 'tbl-02', start: '12:31:40', end: '12:33:18', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.88, occupancyId: 'occ-t02-l1' },

  // Sofia Bennett
  { visitId: 'wtr-sofia-t02-1', personId: 'wtr-sofia', tableId: 'tbl-02', start: '18:46:12', end: '18:48:40', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.95, occupancyId: 'occ-t02-d1' },
  { visitId: 'wtr-sofia-t02-2', personId: 'wtr-sofia', tableId: 'tbl-02', start: '19:12:08', end: '19:14:22', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.93, occupancyId: 'occ-t02-d1' },
  { visitId: 'wtr-sofia-t02-3', personId: 'wtr-sofia', tableId: 'tbl-02', start: '19:41:16', end: '19:43:05', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.94, occupancyId: 'occ-t02-d1' },
  { visitId: 'wtr-sofia-t01-1', personId: 'wtr-sofia', tableId: 'tbl-01', start: '18:52:20', end: '18:54:02', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.92, occupancyId: 'occ-t01-d1' },
  { visitId: 'wtr-sofia-t01-2', personId: 'wtr-sofia', tableId: 'tbl-01', start: '19:21:44', end: '19:23:18', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.9, occupancyId: 'occ-t01-d1' },
  { visitId: 'wtr-sofia-t01-3', personId: 'wtr-sofia', tableId: 'tbl-01', start: '19:48:11', end: '19:49:50', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.91, occupancyId: 'occ-t01-d1' },
  { visitId: 'wtr-sofia-t08-1', personId: 'wtr-sofia', tableId: 'tbl-08', start: '19:26:40', end: '19:28:12', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t08-d1' },
  { visitId: 'wtr-sofia-t08-2', personId: 'wtr-sofia', tableId: 'tbl-08', start: '19:51:03', end: '19:52:41', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.87, occupancyId: 'occ-t08-d1' },
  { visitId: 'wtr-sofia-t05-l1', personId: 'wtr-sofia', tableId: 'tbl-05', start: '12:38:14', end: '12:40:40', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.9, occupancyId: 'occ-t05-l1' },
  { visitId: 'wtr-sofia-t05-l2', personId: 'wtr-sofia', tableId: 'tbl-05', start: '13:22:08', end: '13:24:01', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.89, occupancyId: 'occ-t05-l1' },

  // Ethan Carter
  { visitId: 'wtr-ethan-t05-1', personId: 'wtr-ethan', tableId: 'tbl-05', start: '19:22:40', end: '19:25:18', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.94, occupancyId: 'occ-t05-d1' },
  { visitId: 'wtr-ethan-t05-2', personId: 'wtr-ethan', tableId: 'tbl-05', start: '19:49:12', end: '19:51:40', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.93, occupancyId: 'occ-t05-d1' },
  { visitId: 'wtr-ethan-t05-3', personId: 'wtr-ethan', tableId: 'tbl-05', start: '20:18:22', end: '20:20:55', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.95, occupancyId: 'occ-t05-d1' },
  { visitId: 'wtr-ethan-t06-1', personId: 'wtr-ethan', tableId: 'tbl-06', start: '19:01:08', end: '19:03:33', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.91, occupancyId: 'occ-t06-d1' },
  { visitId: 'wtr-ethan-t06-2', personId: 'wtr-ethan', tableId: 'tbl-06', start: '19:28:14', end: '19:30:02', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.9, occupancyId: 'occ-t06-d1' },
  { visitId: 'wtr-ethan-t06-3', personId: 'wtr-ethan', tableId: 'tbl-06', start: '20:04:40', end: '20:06:51', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.92, occupancyId: 'occ-t06-d1' },
  { visitId: 'wtr-ethan-t10-1', personId: 'wtr-ethan', tableId: 'tbl-10', start: '19:40:11', end: '19:42:48', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t10-d1' },
  { visitId: 'wtr-ethan-t10-2', personId: 'wtr-ethan', tableId: 'tbl-10', start: '20:01:22', end: '20:03:09', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.86, occupancyId: 'occ-t10-d1' },

  // Daniel Brooks
  { visitId: 'wtr-db-t07-1', personId: 'wtr-danielb', tableId: 'tbl-07', start: '19:09:18', end: '19:11:02', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.9, occupancyId: 'occ-t07-d1' },
  { visitId: 'wtr-db-t07-2', personId: 'wtr-danielb', tableId: 'tbl-07', start: '19:33:40', end: '19:35:16', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.89, occupancyId: 'occ-t07-d1' },
  { visitId: 'wtr-db-t09-1', personId: 'wtr-danielb', tableId: 'tbl-09', start: '19:13:22', end: '19:15:08', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.91, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-db-t09-2', personId: 'wtr-danielb', tableId: 'tbl-09', start: '19:52:14', end: '19:53:49', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-db-t06-l1', personId: 'wtr-danielb', tableId: 'tbl-06', start: '12:44:18', end: '12:46:02', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.87, occupancyId: 'occ-t06-l1' },
  { visitId: 'wtr-db-t09-l1', personId: 'wtr-danielb', tableId: 'tbl-09', start: '13:11:40', end: '13:13:55', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.86, occupancyId: 'occ-t09-l1' },
  { visitId: 'wtr-db-t01-l1', personId: 'wtr-danielb', tableId: 'tbl-01', start: '12:22:08', end: '12:23:41', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.85, occupancyId: 'occ-t01-l1' },
  { visitId: 'wtr-sofia-t03-l1', personId: 'wtr-sofia', tableId: 'tbl-03', start: '12:32:18', end: '12:34:02', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.88, occupancyId: 'occ-t03-l1' },
  { visitId: 'wtr-sofia-t03-l2', personId: 'wtr-sofia', tableId: 'tbl-03', start: '13:02:40', end: '13:04:11', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.87, occupancyId: 'occ-t03-l1' },
  { visitId: 'wtr-ethan-t07-l1', personId: 'wtr-ethan', tableId: 'tbl-07', start: '12:58:14', end: '13:00:40', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.9, occupancyId: 'occ-t07-l1' },
  { visitId: 'wtr-ethan-t07-l2', personId: 'wtr-ethan', tableId: 'tbl-07', start: '13:36:08', end: '13:38:22', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.89, occupancyId: 'occ-t07-l1' },
  { visitId: 'wtr-danielb-t08-l1', personId: 'wtr-danielb', tableId: 'tbl-08', start: '13:22:40', end: '13:24:16', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.86, occupancyId: 'occ-t08-l1' },
  { visitId: 'wtr-ethan-t10-l1', personId: 'wtr-ethan', tableId: 'tbl-10', start: '12:22:05', end: '12:24:40', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t10-l1' },
  { visitId: 'wtr-ethan-t10-l2', personId: 'wtr-ethan', tableId: 'tbl-10', start: '13:08:18', end: '13:10:02', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.87, occupancyId: 'occ-t10-l1' },

  // Morning
  { visitId: 'wtr-sofia-t01-m1', personId: 'wtr-sofia', tableId: 'tbl-01', start: '09:26:12', end: '09:28:01', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.91, occupancyId: 'occ-t01-m1' },
  { visitId: 'wtr-sofia-t01-m2', personId: 'wtr-sofia', tableId: 'tbl-01', start: '09:48:40', end: '09:50:18', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.9, occupancyId: 'occ-t01-m1' },
  { visitId: 'wtr-sofia-t02-m1', personId: 'wtr-sofia', tableId: 'tbl-02', start: '09:40:08', end: '09:42:22', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.92, occupancyId: 'occ-t02-m1' },
  { visitId: 'wtr-sofia-t02-m2', personId: 'wtr-sofia', tableId: 'tbl-02', start: '10:18:14', end: '10:20:02', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.89, occupancyId: 'occ-t02-m1' },
  { visitId: 'wtr-sofia-t08-m1', personId: 'wtr-sofia', tableId: 'tbl-08', start: '10:12:40', end: '10:14:16', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t08-m1' },
  { visitId: 'wtr-ethan-t05-m1', personId: 'wtr-ethan', tableId: 'tbl-05', start: '09:54:10', end: '09:56:44', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.9, occupancyId: 'occ-t05-m1' },
  { visitId: 'wtr-ethan-t05-m2', personId: 'wtr-ethan', tableId: 'tbl-05', start: '10:36:22', end: '10:38:08', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.91, occupancyId: 'occ-t05-m1' },
  { visitId: 'wtr-ethan-t10-m1', personId: 'wtr-ethan', tableId: 'tbl-10', start: '10:24:18', end: '10:26:40', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.89, occupancyId: 'occ-t10-m1' },
  { visitId: 'wtr-ethan-t10-m2', personId: 'wtr-ethan', tableId: 'tbl-10', start: '11:08:05', end: '11:10:22', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t10-m1' },
  { visitId: 'wtr-danielb-t04-m1', personId: 'wtr-danielb', tableId: 'tbl-04', start: '10:18:40', end: '10:20:28', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.87, occupancyId: 'occ-t04-m1' },
  { visitId: 'wtr-danielb-t04-m2', personId: 'wtr-danielb', tableId: 'tbl-04', start: '10:48:12', end: '10:50:01', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.86, occupancyId: 'occ-t04-m1' },

  // Evening
  { visitId: 'wtr-alex-t07-e1', personId: 'wtr-alex', tableId: 'tbl-07', start: '21:14:22', end: '21:16:40', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.93, occupancyId: 'occ-t07-d2' },
  { visitId: 'wtr-alex-t02-e1', personId: 'wtr-alex', tableId: 'tbl-02', start: '21:18:08', end: '21:20:16', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.91, occupancyId: 'occ-t02-e1' },
  { visitId: 'wtr-sofia-t01-e1', personId: 'wtr-sofia', tableId: 'tbl-01', start: '21:38:40', end: '21:40:22', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.9, occupancyId: 'occ-t01-e1' },
  { visitId: 'wtr-sofia-t05-e1', personId: 'wtr-sofia', tableId: 'tbl-05', start: '21:24:12', end: '21:26:48', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.92, occupancyId: 'occ-t05-e1' },
  { visitId: 'wtr-sofia-t05-e2', personId: 'wtr-sofia', tableId: 'tbl-05', start: '21:58:05', end: '22:00:18', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.89, occupancyId: 'occ-t05-e1' },
  { visitId: 'wtr-ethan-t10-e1', personId: 'wtr-ethan', tableId: 'tbl-10', start: '21:12:40', end: '21:15:02', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t10-e1' },
  { visitId: 'wtr-ethan-t09-e1', personId: 'wtr-ethan', tableId: 'tbl-09', start: '21:28:16', end: '21:30:08', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.87, occupancyId: 'occ-t09-e1' },
  { visitId: 'wtr-danielb-t02-e1', personId: 'wtr-danielb', tableId: 'tbl-02', start: '21:42:14', end: '21:43:50', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.86, occupancyId: 'occ-t02-e1' },
  { visitId: 'wtr-danielb-t09-e1', personId: 'wtr-danielb', tableId: 'tbl-09', start: '21:52:22', end: '21:54:01', videoId: 'vid-dining-wide', cameraId: 'cam-df-03', confidence: 0.85, occupancyId: 'occ-t09-e1' },
]

export const kitchenDwells = [
  // Daniel Carter — Grill 24m18s, Prep 17m42s, Plating 31m05s, Pass 12m37s
  { dwellId: 'kit-daniel-grill-1', personId: 'kit-daniel', counterId: 'ctr-grill', start: '18:12:00', end: '18:22:00', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.93 },
  { dwellId: 'kit-daniel-grill-2', personId: 'kit-daniel', counterId: 'ctr-grill', start: '19:10:20', end: '19:24:38', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.94 },
  { dwellId: 'kit-daniel-prep-1', personId: 'kit-daniel', counterId: 'ctr-prep', start: '18:22:10', end: '18:29:01', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-01', confidence: 0.92 },
  { dwellId: 'kit-daniel-prep-2', personId: 'kit-daniel', counterId: 'ctr-prep', start: '19:31:12', end: '19:42:03', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-01', confidence: 0.95 },
  { dwellId: 'kit-daniel-plating-1', personId: 'kit-daniel', counterId: 'ctr-plating', start: '19:42:17', end: '19:48:54', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.96 },
  { dwellId: 'kit-daniel-plating-2', personId: 'kit-daniel', counterId: 'ctr-plating', start: '20:05:00', end: '20:21:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.94 },
  { dwellId: 'kit-daniel-plating-3', personId: 'kit-daniel', counterId: 'ctr-plating', start: '20:44:12', end: '20:52:00', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.93 },
  { dwellId: 'kit-daniel-pass-1', personId: 'kit-daniel', counterId: 'ctr-plating', start: '19:49:10', end: '19:55:22', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.91 },
  { dwellId: 'kit-daniel-pass-2', personId: 'kit-daniel', counterId: 'ctr-plating', start: '20:22:05', end: '20:28:30', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.9 },

  // Maria Thompson — Prep heavy, plating, cold, pastry
  { dwellId: 'kit-maria-prep-1', personId: 'kit-maria', counterId: 'ctr-prep', start: '11:40:00', end: '12:05:20', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.92 },
  { dwellId: 'kit-maria-prep-2', personId: 'kit-maria', counterId: 'ctr-prep', start: '17:50:10', end: '18:05:00', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.93 },
  { dwellId: 'kit-maria-prep-3', personId: 'kit-maria', counterId: 'ctr-prep', start: '19:02:00', end: '19:16:18', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.94 },
  { dwellId: 'kit-maria-plating-1', personId: 'kit-maria', counterId: 'ctr-plating', start: '18:22:40', end: '18:31:10', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.9 },
  { dwellId: 'kit-maria-plating-2', personId: 'kit-maria', counterId: 'ctr-plating', start: '19:20:08', end: '19:28:50', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.91 },
  { dwellId: 'kit-maria-cold-1', personId: 'kit-maria', counterId: 'ctr-dish', start: '18:32:00', end: '18:45:20', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.89 },
  { dwellId: 'kit-maria-cold-2', personId: 'kit-maria', counterId: 'ctr-dish', start: '20:10:12', end: '20:18:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.88 },
  { dwellId: 'kit-maria-grill-1', personId: 'kit-maria', counterId: 'ctr-grill', start: '19:50:00', end: '19:56:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.86 },
  { dwellId: 'kit-maria-pastry-1', personId: 'kit-maria', counterId: 'ctr-veg', start: '20:32:10', end: '20:38:50', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.85 },
  { dwellId: 'kit-maria-pass-1', personId: 'kit-maria', counterId: 'ctr-plating', start: '19:29:10', end: '19:32:30', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.87 },

  // James Wilson — Grill primary
  { dwellId: 'kit-james-grill-1', personId: 'kit-james', counterId: 'ctr-grill', start: '12:05:00', end: '12:28:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.93 },
  { dwellId: 'kit-james-grill-2', personId: 'kit-james', counterId: 'ctr-grill', start: '18:00:20', end: '18:08:20', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.95 },
  { dwellId: 'kit-james-grill-3', personId: 'kit-james', counterId: 'ctr-grill', start: '19:00:00', end: '19:08:00', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.94 },
  { dwellId: 'kit-james-grill-4', personId: 'kit-james', counterId: 'ctr-grill', start: '19:40:08', end: '19:46:08', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.92 },
  { dwellId: 'kit-james-plating-1', personId: 'kit-james', counterId: 'ctr-plating', start: '19:19:00', end: '19:25:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.88 },
  { dwellId: 'kit-james-pass-1', personId: 'kit-james', counterId: 'ctr-plating', start: '19:56:10', end: '20:06:10', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.9 },

  // Olivia Bennett — Pastry / cold
  { dwellId: 'kit-olivia-pastry-1', personId: 'kit-olivia', counterId: 'ctr-veg', start: '11:20:00', end: '11:48:20', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.93 },
  { dwellId: 'kit-olivia-pastry-2', personId: 'kit-olivia', counterId: 'ctr-veg', start: '17:40:00', end: '18:12:30', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.94 },
  { dwellId: 'kit-olivia-pastry-3', personId: 'kit-olivia', counterId: 'ctr-veg', start: '19:05:10', end: '19:24:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.92 },
  { dwellId: 'kit-olivia-cold-1', personId: 'kit-olivia', counterId: 'ctr-dish', start: '18:14:00', end: '18:24:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.9 },
  { dwellId: 'kit-olivia-cold-2', personId: 'kit-olivia', counterId: 'ctr-dish', start: '19:28:12', end: '19:36:50', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.89 },
  { dwellId: 'kit-olivia-prep-1', personId: 'kit-olivia', counterId: 'ctr-prep', start: '18:26:00', end: '18:36:00', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.87 },
  { dwellId: 'kit-olivia-plating-1', personId: 'kit-olivia', counterId: 'ctr-plating', start: '19:38:00', end: '19:41:20', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.86 },

  // Lunch kitchen
  { dwellId: 'kit-james-grill-l2', personId: 'kit-james', counterId: 'ctr-grill', start: '12:40:00', end: '13:18:20', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.92 },
  { dwellId: 'kit-james-plating-l1', personId: 'kit-james', counterId: 'ctr-plating', start: '13:20:00', end: '13:38:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.9 },
  { dwellId: 'kit-maria-prep-l1', personId: 'kit-maria', counterId: 'ctr-prep', start: '12:08:00', end: '12:48:22', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.93 },
  { dwellId: 'kit-maria-cold-l1', personId: 'kit-maria', counterId: 'ctr-dish', start: '12:52:00', end: '13:16:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.89 },
  { dwellId: 'kit-daniel-plating-l1', personId: 'kit-daniel', counterId: 'ctr-plating', start: '12:30:00', end: '13:05:18', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.91 },
  { dwellId: 'kit-daniel-pass-l1', personId: 'kit-daniel', counterId: 'ctr-plating', start: '13:06:00', end: '13:22:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.9 },
  { dwellId: 'kit-olivia-pastry-l1', personId: 'kit-olivia', counterId: 'ctr-veg', start: '12:10:00', end: '12:55:30', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.94 },
  { dwellId: 'kit-olivia-cold-l1', personId: 'kit-olivia', counterId: 'ctr-dish', start: '13:00:00', end: '13:24:16', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.88 },

  // Morning kitchen — mise en place and pastry
  { dwellId: 'kit-olivia-pastry-m1', personId: 'kit-olivia', counterId: 'ctr-veg', start: '09:10:00', end: '09:55:20', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.94 },
  { dwellId: 'kit-olivia-pastry-m2', personId: 'kit-olivia', counterId: 'ctr-veg', start: '10:20:00', end: '11:05:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.93 },
  { dwellId: 'kit-maria-prep-m1', personId: 'kit-maria', counterId: 'ctr-prep', start: '09:15:00', end: '10:05:18', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.92 },
  { dwellId: 'kit-maria-prep-m2', personId: 'kit-maria', counterId: 'ctr-prep', start: '10:30:00', end: '11:20:12', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.91 },
  { dwellId: 'kit-james-grill-m1', personId: 'kit-james', counterId: 'ctr-grill', start: '09:40:00', end: '10:15:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.9 },
  { dwellId: 'kit-daniel-plating-m1', personId: 'kit-daniel', counterId: 'ctr-plating', start: '10:50:00', end: '11:25:20', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.89 },
  { dwellId: 'kit-daniel-pass-m1', personId: 'kit-daniel', counterId: 'ctr-plating', start: '11:25:40', end: '11:45:08', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.88 },

  // Evening kitchen — close-down
  { dwellId: 'kit-daniel-plating-e1', personId: 'kit-daniel', counterId: 'ctr-plating', start: '21:05:00', end: '21:28:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.93 },
  { dwellId: 'kit-daniel-pass-e1', personId: 'kit-daniel', counterId: 'ctr-plating', start: '21:28:50', end: '21:42:16', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.91 },
  { dwellId: 'kit-maria-prep-e1', personId: 'kit-maria', counterId: 'ctr-prep', start: '21:00:10', end: '21:18:22', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.9 },
  { dwellId: 'kit-maria-cold-e1', personId: 'kit-maria', counterId: 'ctr-dish', start: '21:20:00', end: '21:35:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.88 },
  { dwellId: 'kit-james-grill-e1', personId: 'kit-james', counterId: 'ctr-grill', start: '21:02:00', end: '21:22:18', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.92 },
  { dwellId: 'kit-olivia-pastry-e1', personId: 'kit-olivia', counterId: 'ctr-veg', start: '21:10:00', end: '21:40:12', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.9 },
  { dwellId: 'kit-olivia-cold-e1', personId: 'kit-olivia', counterId: 'ctr-dish', start: '21:42:00', end: '21:55:30', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.87 },
  { dwellId: 'kit-marcus-dish-1', personId: 'kit-marcus', counterId: 'ctr-dish', start: '18:40:00', end: '19:12:20', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.94 },
  { dwellId: 'kit-marcus-dish-2', personId: 'kit-marcus', counterId: 'ctr-dish', start: '19:20:00', end: '19:55:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.93 },
  { dwellId: 'kit-marcus-dish-3', personId: 'kit-marcus', counterId: 'ctr-dish', start: '20:05:10', end: '20:42:30', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.95 },
  { dwellId: 'kit-marcus-dish-4', personId: 'kit-marcus', counterId: 'ctr-dish', start: '20:50:00', end: '21:18:16', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.92 },
]

export const cookbooks = [
  {
    cookbookId: 'cbk-fine-dining-ops',
    name: 'Fine Dining Operations',
    description: 'Reusable dwell-time recipes for table occupancy, waiter service, and kitchen station utilisation.',
    status: 'active',
    useCase: 'Restaurant operations',
    lastEvaluated: at('21:20:14'),
    recipeIds: ['rcp-table-occupancy', 'rcp-waiter-service', 'rcp-kitchen-utilisation', 'rcp-service-pattern'],
  },
]

export const recipes = [
  {
    recipeId: 'rcp-table-occupancy',
    cookbookId: 'cbk-fine-dining-ops',
    name: 'Table Occupancy Analysis',
    description: 'Occupancy duration, session count, and guest load by table for the selected period.',
    status: 'evaluated',
    eventTypes: ['table.occupancy'],
  },
  {
    recipeId: 'rcp-waiter-service',
    cookbookId: 'cbk-fine-dining-ops',
    name: 'Waiter Service Analysis',
    description: 'Visit count and dwell time by waiter and table, identified through face recognition and zone tracking.',
    status: 'evaluated',
    eventTypes: ['waiter.visit'],
  },
  {
    recipeId: 'rcp-kitchen-utilisation',
    cookbookId: 'cbk-fine-dining-ops',
    name: 'Kitchen Counter Utilisation',
    description: 'Employee dwell time across Food prep / cooking and Final food assembly stations.',
    status: 'evaluated',
    eventTypes: ['kitchen.dwell'],
  },
  {
    recipeId: 'rcp-service-pattern',
    cookbookId: 'cbk-fine-dining-ops',
    name: 'Service Pattern Analysis',
    description: 'Combines table occupancy with waiter visits to show how service is distributed across occupied tables.',
    status: 'evaluated',
    eventTypes: ['table.occupancy', 'waiter.visit'],
  },
]

function baseEvent(partial) {
  return {
    restaurantId: restaurant.restaurantId,
    personId: null,
    personType: null,
    tableId: null,
    counterId: null,
    occupancyId: null,
    visitId: null,
    dwellId: null,
    guestCount: null,
    confidence: null,
    ...partial,
  }
}

function expandOccupancy(session) {
  const startAt = at(session.start)
  const endAt = at(session.end)
  const durationMs = msBetween(startAt, endAt)
  const occupancy = baseEvent({
    eventId: `evt-${session.occupancyId}`,
    eventType: 'table.occupancy',
    locationType: 'table',
    locationId: session.tableId,
    zoneId: `${session.tableId}-zone`,
    tableId: session.tableId,
    occupancyId: session.occupancyId,
    cameraId: session.cameraId,
    videoId: session.videoId,
    startAt,
    endAt,
    durationMs,
    guestCount: session.guestCount,
    confidence: 0.91,
    summary: `Table occupied by ${session.guestCount} guests`,
  })
  const seated = baseEvent({
    eventId: `evt-${session.occupancyId}-seated`,
    eventType: 'guest.seated',
    locationType: 'table',
    locationId: session.tableId,
    zoneId: `${session.tableId}-zone`,
    tableId: session.tableId,
    occupancyId: session.occupancyId,
    cameraId: session.cameraId,
    videoId: session.videoId,
    startAt,
    endAt: startAt,
    durationMs: 0,
    guestCount: session.guestCount,
    confidence: 0.9,
    summary: 'Guests seated',
    parentEventId: occupancy.eventId,
  })
  const cleared = baseEvent({
    eventId: `evt-${session.occupancyId}-cleared`,
    eventType: 'table.cleared',
    locationType: 'table',
    locationId: session.tableId,
    zoneId: `${session.tableId}-zone`,
    tableId: session.tableId,
    occupancyId: session.occupancyId,
    cameraId: session.cameraId,
    videoId: session.videoId,
    startAt: endAt,
    endAt,
    durationMs: 0,
    guestCount: session.guestCount,
    confidence: 0.89,
    summary: 'Table cleared',
    parentEventId: occupancy.eventId,
  })
  return [occupancy, seated, cleared]
}

function expandVisit(visit) {
  const startAt = at(visit.start)
  const endAt = at(visit.end)
  const durationMs = msBetween(startAt, endAt)
  const person = people.find((p) => p.personId === visit.personId)
  const table = tables.find((t) => t.tableId === visit.tableId)
  const dwell = baseEvent({
    eventId: `evt-${visit.visitId}`,
    eventType: 'waiter.visit',
    personId: visit.personId,
    personType: 'waiter',
    locationType: 'table',
    locationId: visit.tableId,
    zoneId: `${visit.tableId}-service`,
    tableId: visit.tableId,
    occupancyId: visit.occupancyId,
    visitId: visit.visitId,
    cameraId: visit.cameraId,
    videoId: visit.videoId,
    startAt,
    endAt,
    durationMs,
    confidence: visit.confidence,
    summary: `${person.name} visited ${table.code}`,
  })
  const entered = baseEvent({
    eventId: `evt-${visit.visitId}-enter`,
    eventType: 'waiter.entered',
    personId: visit.personId,
    personType: 'waiter',
    locationType: 'table',
    locationId: visit.tableId,
    zoneId: `${visit.tableId}-service`,
    tableId: visit.tableId,
    occupancyId: visit.occupancyId,
    visitId: visit.visitId,
    cameraId: visit.cameraId,
    videoId: visit.videoId,
    startAt,
    endAt: startAt,
    durationMs: 0,
    confidence: visit.confidence,
    summary: `Entered ${table.code} service zone`,
    parentEventId: dwell.eventId,
  })
  const exited = baseEvent({
    eventId: `evt-${visit.visitId}-exit`,
    eventType: 'waiter.exited',
    personId: visit.personId,
    personType: 'waiter',
    locationType: 'table',
    locationId: visit.tableId,
    zoneId: `${visit.tableId}-service`,
    tableId: visit.tableId,
    occupancyId: visit.occupancyId,
    visitId: visit.visitId,
    cameraId: visit.cameraId,
    videoId: visit.videoId,
    startAt: endAt,
    endAt,
    durationMs: 0,
    confidence: visit.confidence,
    summary: `Exited ${table.code} service zone`,
    parentEventId: dwell.eventId,
  })
  return [dwell, entered, exited]
}

function expandKitchen(dwell) {
  const startAt = at(dwell.start)
  const endAt = at(dwell.end)
  const durationMs = msBetween(startAt, endAt)
  const person = people.find((p) => p.personId === dwell.personId)
  const counter = counters.find((c) => c.counterId === dwell.counterId)
  const record = baseEvent({
    eventId: `evt-${dwell.dwellId}`,
    eventType: 'kitchen.dwell',
    personId: dwell.personId,
    personType: 'kitchen',
    locationType: 'counter',
    locationId: dwell.counterId,
    zoneId: dwell.counterId,
    counterId: dwell.counterId,
    dwellId: dwell.dwellId,
    cameraId: dwell.cameraId,
    videoId: dwell.videoId,
    startAt,
    endAt,
    durationMs,
    confidence: dwell.confidence,
    summary: `${person.name} at ${counter.name}`,
  })
  const entered = baseEvent({
    eventId: `evt-${dwell.dwellId}-enter`,
    eventType: 'kitchen.entered',
    personId: dwell.personId,
    personType: 'kitchen',
    locationType: 'counter',
    locationId: dwell.counterId,
    zoneId: dwell.counterId,
    counterId: dwell.counterId,
    dwellId: dwell.dwellId,
    cameraId: dwell.cameraId,
    videoId: dwell.videoId,
    startAt,
    endAt: startAt,
    durationMs: 0,
    confidence: dwell.confidence,
    summary: `Entered ${counter.name}`,
    parentEventId: record.eventId,
  })
  const exited = baseEvent({
    eventId: `evt-${dwell.dwellId}-exit`,
    eventType: 'kitchen.exited',
    personId: dwell.personId,
    personType: 'kitchen',
    locationType: 'counter',
    locationId: dwell.counterId,
    zoneId: dwell.counterId,
    counterId: dwell.counterId,
    dwellId: dwell.dwellId,
    cameraId: dwell.cameraId,
    videoId: dwell.videoId,
    startAt: endAt,
    endAt,
    durationMs: 0,
    confidence: dwell.confidence,
    summary: `Exited ${counter.name}`,
    parentEventId: record.eventId,
  })
  return [record, entered, exited]
}

export const events = [
  ...occupancySessions.flatMap(expandOccupancy),
  ...waiterVisits.flatMap(expandVisit),
  ...kitchenDwells.flatMap(expandKitchen),
].sort((a, b) => a.startAt.localeCompare(b.startAt) || a.eventId.localeCompare(b.eventId))

export const lookup = {
  restaurant,
  table: Object.fromEntries(tables.map((row) => [row.tableId, row])),
  person: Object.fromEntries(people.map((row) => [row.personId, row])),
  counter: Object.fromEntries(counters.map((row) => [row.counterId, row])),
  region: Object.fromEntries(kitchenRegions.map((row) => [row.regionId, row])),
  camera: Object.fromEntries(cameras.map((row) => [row.cameraId, row])),
  video: Object.fromEntries(videos.map((row) => [row.videoId, row])),
  event: Object.fromEntries(events.map((row) => [row.eventId, row])),
  cookbook: Object.fromEntries(cookbooks.map((row) => [row.cookbookId, row])),
  recipe: Object.fromEntries(recipes.map((row) => [row.recipeId, row])),
}
