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
  location: 'Bandra West, Mumbai',
  venue: 'Sea Face Pavilion',
  serviceStyle: 'Fine dining',
  covers: 42,
  timezone: 'Asia/Kolkata',
}

export const cameras = [
  { cameraId: 'cam-df-01', name: 'Dining Floor 01', zone: 'dining', coverage: 'T01–T04' },
  { cameraId: 'cam-df-02', name: 'Dining Floor 02', zone: 'dining', coverage: 'T05–T07' },
  { cameraId: 'cam-df-03', name: 'Dining Floor 03', zone: 'dining', coverage: 'T08–T10' },
  { cameraId: 'cam-kit-01', name: 'Kitchen 01', zone: 'kitchen', coverage: 'Grill, Prep, Plating' },
  { cameraId: 'cam-kit-02', name: 'Kitchen 02', zone: 'kitchen', coverage: 'Pastry, Cold Station, Pass' },
]

export const videos = [
  { videoId: 'vid-dining-floor', cameraId: 'cam-df-01', title: 'Dining floor seating', src: '/restaurant-media/dining-floor.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-table-occupancy', cameraId: 'cam-df-01', title: 'Table T04 occupancy', src: '/restaurant-media/table-occupancy.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', title: 'Waiter visit at T04', src: '/restaurant-media/waiter-visit.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', title: 'Multi-table service', src: '/restaurant-media/multi-table-service.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', title: 'Plating counter activity', src: '/restaurant-media/kitchen-activity.mp4', durationMs: 15000, recordedOn: DAY },
  { videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', title: 'Kitchen station movement', src: '/restaurant-media/kitchen-movement.mp4', durationMs: 15000, recordedOn: DAY },
]

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

export const waiters = [
  { personId: 'wtr-alex', name: 'Alex Morgan', role: 'waiter', employeeCode: 'SRV-041', enrolled: true },
  { personId: 'wtr-sofia', name: 'Sofia Bennett', role: 'waiter', employeeCode: 'SRV-018', enrolled: true },
  { personId: 'wtr-ethan', name: 'Ethan Carter', role: 'waiter', employeeCode: 'SRV-027', enrolled: true },
  { personId: 'wtr-danielb', name: 'Daniel Brooks', role: 'waiter', employeeCode: 'SRV-033', enrolled: true },
]

export const kitchenStaff = [
  { personId: 'kit-daniel', name: 'Daniel Carter', role: 'kitchen', station: 'Plating', employeeCode: 'KIT-012', enrolled: true },
  { personId: 'kit-maria', name: 'Maria Thompson', role: 'kitchen', station: 'Prep', employeeCode: 'KIT-007', enrolled: true },
  { personId: 'kit-james', name: 'James Wilson', role: 'kitchen', station: 'Grill', employeeCode: 'KIT-021', enrolled: true },
  { personId: 'kit-olivia', name: 'Olivia Bennett', role: 'kitchen', station: 'Pastry', employeeCode: 'KIT-015', enrolled: true },
]

export const people = [...waiters, ...kitchenStaff]

export const counters = [
  { counterId: 'ctr-grill', name: 'Grill', cameraId: 'cam-kit-01', x: 6, y: 14, w: 28, h: 30 },
  { counterId: 'ctr-prep', name: 'Prep', cameraId: 'cam-kit-01', x: 38, y: 14, w: 28, h: 30 },
  { counterId: 'ctr-plating', name: 'Plating', cameraId: 'cam-kit-01', x: 70, y: 14, w: 24, h: 30 },
  { counterId: 'ctr-pastry', name: 'Pastry', cameraId: 'cam-kit-02', x: 6, y: 56, w: 28, h: 30 },
  { counterId: 'ctr-cold', name: 'Cold Station', cameraId: 'cam-kit-02', x: 38, y: 56, w: 28, h: 30 },
  { counterId: 'ctr-pass', name: 'Pass', cameraId: 'cam-kit-02', x: 70, y: 56, w: 24, h: 30 },
]

export const timeWindows = [
  { windowId: 'morning', label: 'Morning', start: '09:00:00', end: '12:00:00' },
  { windowId: 'lunch', label: 'Lunch', start: '12:00:00', end: '15:00:00' },
  { windowId: 'dinner', label: 'Dinner', start: '18:00:00', end: '21:00:00' },
  { windowId: 'evening', label: 'Evening', start: '21:00:00', end: '23:00:00' },
  { windowId: 'custom', label: 'Custom', start: null, end: null },
]

export const occupancySessions = [
  // Lunch
  { occupancyId: 'occ-t01-l1', tableId: 'tbl-01', start: '12:18:40', end: '13:11:22', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t02-l1', tableId: 'tbl-02', start: '12:24:05', end: '13:46:18', guestCount: 4, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t05-l1', tableId: 'tbl-05', start: '12:31:10', end: '14:02:44', guestCount: 5, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t06-l1', tableId: 'tbl-06', start: '12:40:22', end: '13:28:09', guestCount: 3, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t09-l1', tableId: 'tbl-09', start: '13:05:33', end: '14:21:16', guestCount: 4, videoId: 'vid-multi-table-service', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t04-l1', tableId: 'tbl-04', start: '13:12:08', end: '14:08:51', guestCount: 2, videoId: 'vid-table-occupancy', cameraId: 'cam-df-01' },
  // Dinner — T04 is the longest combined occupancy
  { occupancyId: 'occ-t02-d1', tableId: 'tbl-02', start: '18:41:20', end: '20:12:07', guestCount: 4, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t01-d1', tableId: 'tbl-01', start: '18:48:11', end: '20:06:40', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t06-d1', tableId: 'tbl-06', start: '18:55:02', end: '20:22:40', guestCount: 4, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t04-d1', tableId: 'tbl-04', start: '19:02:14', end: '19:48:31', guestCount: 4, videoId: 'vid-table-occupancy', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t07-d1', tableId: 'tbl-07', start: '19:06:40', end: '20:47:22', guestCount: 4, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t09-d1', tableId: 'tbl-09', start: '19:11:05', end: '20:29:48', guestCount: 3, videoId: 'vid-multi-table-service', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t05-d1', tableId: 'tbl-05', start: '19:18:33', end: '20:54:10', guestCount: 6, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
  { occupancyId: 'occ-t08-d1', tableId: 'tbl-08', start: '19:22:18', end: '20:14:55', guestCount: 2, videoId: 'vid-dining-floor', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t10-d1', tableId: 'tbl-10', start: '19:36:40', end: '20:22:08', guestCount: 7, videoId: 'vid-dining-floor', cameraId: 'cam-df-03' },
  { occupancyId: 'occ-t04-d2', tableId: 'tbl-04', start: '20:04:12', end: '21:17:44', guestCount: 4, videoId: 'vid-table-occupancy', cameraId: 'cam-df-01' },
  { occupancyId: 'occ-t07-d2', tableId: 'tbl-07', start: '21:08:16', end: '22:11:03', guestCount: 2, videoId: 'vid-multi-table-service', cameraId: 'cam-df-02' },
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
  { visitId: 'wtr-alex-t09-1', personId: 'wtr-alex', tableId: 'tbl-09', start: '19:18:40', end: '19:21:02', videoId: 'vid-multi-table-service', cameraId: 'cam-df-03', confidence: 0.9, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-alex-t09-2', personId: 'wtr-alex', tableId: 'tbl-09', start: '19:44:11', end: '19:46:28', videoId: 'vid-multi-table-service', cameraId: 'cam-df-03', confidence: 0.93, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-alex-t09-3', personId: 'wtr-alex', tableId: 'tbl-09', start: '20:02:33', end: '20:05:01', videoId: 'vid-multi-table-service', cameraId: 'cam-df-03', confidence: 0.92, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-alex-t09-4', personId: 'wtr-alex', tableId: 'tbl-09', start: '20:18:14', end: '20:20:38', videoId: 'vid-multi-table-service', cameraId: 'cam-df-03', confidence: 0.91, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-alex-t04-l1', personId: 'wtr-alex', tableId: 'tbl-04', start: '13:20:08', end: '13:22:11', videoId: 'vid-waiter-visit', cameraId: 'cam-df-01', confidence: 0.89, occupancyId: 'occ-t04-l1' },
  { visitId: 'wtr-alex-t02-l1', personId: 'wtr-alex', tableId: 'tbl-02', start: '12:31:40', end: '12:33:18', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.88, occupancyId: 'occ-t02-l1' },

  // Sofia Bennett
  { visitId: 'wtr-sofia-t02-1', personId: 'wtr-sofia', tableId: 'tbl-02', start: '18:46:12', end: '18:48:40', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.95, occupancyId: 'occ-t02-d1' },
  { visitId: 'wtr-sofia-t02-2', personId: 'wtr-sofia', tableId: 'tbl-02', start: '19:12:08', end: '19:14:22', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.93, occupancyId: 'occ-t02-d1' },
  { visitId: 'wtr-sofia-t02-3', personId: 'wtr-sofia', tableId: 'tbl-02', start: '19:41:16', end: '19:43:05', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.94, occupancyId: 'occ-t02-d1' },
  { visitId: 'wtr-sofia-t01-1', personId: 'wtr-sofia', tableId: 'tbl-01', start: '18:52:20', end: '18:54:02', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.92, occupancyId: 'occ-t01-d1' },
  { visitId: 'wtr-sofia-t01-2', personId: 'wtr-sofia', tableId: 'tbl-01', start: '19:21:44', end: '19:23:18', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.9, occupancyId: 'occ-t01-d1' },
  { visitId: 'wtr-sofia-t01-3', personId: 'wtr-sofia', tableId: 'tbl-01', start: '19:48:11', end: '19:49:50', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.91, occupancyId: 'occ-t01-d1' },
  { visitId: 'wtr-sofia-t08-1', personId: 'wtr-sofia', tableId: 'tbl-08', start: '19:26:40', end: '19:28:12', videoId: 'vid-dining-floor', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t08-d1' },
  { visitId: 'wtr-sofia-t08-2', personId: 'wtr-sofia', tableId: 'tbl-08', start: '19:51:03', end: '19:52:41', videoId: 'vid-dining-floor', cameraId: 'cam-df-03', confidence: 0.87, occupancyId: 'occ-t08-d1' },
  { visitId: 'wtr-sofia-t05-l1', personId: 'wtr-sofia', tableId: 'tbl-05', start: '12:38:14', end: '12:40:40', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.9, occupancyId: 'occ-t05-l1' },
  { visitId: 'wtr-sofia-t05-l2', personId: 'wtr-sofia', tableId: 'tbl-05', start: '13:22:08', end: '13:24:01', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.89, occupancyId: 'occ-t05-l1' },

  // Ethan Carter
  { visitId: 'wtr-ethan-t05-1', personId: 'wtr-ethan', tableId: 'tbl-05', start: '19:22:40', end: '19:25:18', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.94, occupancyId: 'occ-t05-d1' },
  { visitId: 'wtr-ethan-t05-2', personId: 'wtr-ethan', tableId: 'tbl-05', start: '19:49:12', end: '19:51:40', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.93, occupancyId: 'occ-t05-d1' },
  { visitId: 'wtr-ethan-t05-3', personId: 'wtr-ethan', tableId: 'tbl-05', start: '20:18:22', end: '20:20:55', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.95, occupancyId: 'occ-t05-d1' },
  { visitId: 'wtr-ethan-t06-1', personId: 'wtr-ethan', tableId: 'tbl-06', start: '19:01:08', end: '19:03:33', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.91, occupancyId: 'occ-t06-d1' },
  { visitId: 'wtr-ethan-t06-2', personId: 'wtr-ethan', tableId: 'tbl-06', start: '19:28:14', end: '19:30:02', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.9, occupancyId: 'occ-t06-d1' },
  { visitId: 'wtr-ethan-t06-3', personId: 'wtr-ethan', tableId: 'tbl-06', start: '20:04:40', end: '20:06:51', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.92, occupancyId: 'occ-t06-d1' },
  { visitId: 'wtr-ethan-t10-1', personId: 'wtr-ethan', tableId: 'tbl-10', start: '19:40:11', end: '19:42:48', videoId: 'vid-dining-floor', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t10-d1' },
  { visitId: 'wtr-ethan-t10-2', personId: 'wtr-ethan', tableId: 'tbl-10', start: '20:01:22', end: '20:03:09', videoId: 'vid-dining-floor', cameraId: 'cam-df-03', confidence: 0.86, occupancyId: 'occ-t10-d1' },

  // Daniel Brooks
  { visitId: 'wtr-db-t07-1', personId: 'wtr-danielb', tableId: 'tbl-07', start: '19:09:18', end: '19:11:02', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.9, occupancyId: 'occ-t07-d1' },
  { visitId: 'wtr-db-t07-2', personId: 'wtr-danielb', tableId: 'tbl-07', start: '19:33:40', end: '19:35:16', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.89, occupancyId: 'occ-t07-d1' },
  { visitId: 'wtr-db-t09-1', personId: 'wtr-danielb', tableId: 'tbl-09', start: '19:13:22', end: '19:15:08', videoId: 'vid-multi-table-service', cameraId: 'cam-df-03', confidence: 0.91, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-db-t09-2', personId: 'wtr-danielb', tableId: 'tbl-09', start: '19:52:14', end: '19:53:49', videoId: 'vid-multi-table-service', cameraId: 'cam-df-03', confidence: 0.88, occupancyId: 'occ-t09-d1' },
  { visitId: 'wtr-db-t06-l1', personId: 'wtr-danielb', tableId: 'tbl-06', start: '12:44:18', end: '12:46:02', videoId: 'vid-multi-table-service', cameraId: 'cam-df-02', confidence: 0.87, occupancyId: 'occ-t06-l1' },
  { visitId: 'wtr-db-t09-l1', personId: 'wtr-danielb', tableId: 'tbl-09', start: '13:11:40', end: '13:13:55', videoId: 'vid-multi-table-service', cameraId: 'cam-df-03', confidence: 0.86, occupancyId: 'occ-t09-l1' },
  { visitId: 'wtr-db-t01-l1', personId: 'wtr-danielb', tableId: 'tbl-01', start: '12:22:08', end: '12:23:41', videoId: 'vid-dining-floor', cameraId: 'cam-df-01', confidence: 0.85, occupancyId: 'occ-t01-l1' },
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
  { dwellId: 'kit-daniel-pass-1', personId: 'kit-daniel', counterId: 'ctr-pass', start: '19:49:10', end: '19:55:22', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.91 },
  { dwellId: 'kit-daniel-pass-2', personId: 'kit-daniel', counterId: 'ctr-pass', start: '20:22:05', end: '20:28:30', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.9 },

  // Maria Thompson — Prep heavy, plating, cold, pastry
  { dwellId: 'kit-maria-prep-1', personId: 'kit-maria', counterId: 'ctr-prep', start: '11:40:00', end: '12:05:20', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.92 },
  { dwellId: 'kit-maria-prep-2', personId: 'kit-maria', counterId: 'ctr-prep', start: '17:50:10', end: '18:05:00', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.93 },
  { dwellId: 'kit-maria-prep-3', personId: 'kit-maria', counterId: 'ctr-prep', start: '19:02:00', end: '19:16:18', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.94 },
  { dwellId: 'kit-maria-plating-1', personId: 'kit-maria', counterId: 'ctr-plating', start: '18:22:40', end: '18:31:10', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.9 },
  { dwellId: 'kit-maria-plating-2', personId: 'kit-maria', counterId: 'ctr-plating', start: '19:20:08', end: '19:28:50', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.91 },
  { dwellId: 'kit-maria-cold-1', personId: 'kit-maria', counterId: 'ctr-cold', start: '18:32:00', end: '18:45:20', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.89 },
  { dwellId: 'kit-maria-cold-2', personId: 'kit-maria', counterId: 'ctr-cold', start: '20:10:12', end: '20:18:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.88 },
  { dwellId: 'kit-maria-grill-1', personId: 'kit-maria', counterId: 'ctr-grill', start: '19:50:00', end: '19:56:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.86 },
  { dwellId: 'kit-maria-pastry-1', personId: 'kit-maria', counterId: 'ctr-pastry', start: '20:32:10', end: '20:38:50', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.85 },
  { dwellId: 'kit-maria-pass-1', personId: 'kit-maria', counterId: 'ctr-pass', start: '19:29:10', end: '19:32:30', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.87 },

  // James Wilson — Grill primary
  { dwellId: 'kit-james-grill-1', personId: 'kit-james', counterId: 'ctr-grill', start: '12:05:00', end: '12:28:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.93 },
  { dwellId: 'kit-james-grill-2', personId: 'kit-james', counterId: 'ctr-grill', start: '18:00:20', end: '18:08:20', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.95 },
  { dwellId: 'kit-james-grill-3', personId: 'kit-james', counterId: 'ctr-grill', start: '19:00:00', end: '19:08:00', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.94 },
  { dwellId: 'kit-james-grill-4', personId: 'kit-james', counterId: 'ctr-grill', start: '19:40:08', end: '19:46:08', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.92 },
  { dwellId: 'kit-james-plating-1', personId: 'kit-james', counterId: 'ctr-plating', start: '19:19:00', end: '19:25:40', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.88 },
  { dwellId: 'kit-james-pass-1', personId: 'kit-james', counterId: 'ctr-pass', start: '19:56:10', end: '20:06:10', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.9 },

  // Olivia Bennett — Pastry / cold
  { dwellId: 'kit-olivia-pastry-1', personId: 'kit-olivia', counterId: 'ctr-pastry', start: '11:20:00', end: '11:48:20', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.93 },
  { dwellId: 'kit-olivia-pastry-2', personId: 'kit-olivia', counterId: 'ctr-pastry', start: '17:40:00', end: '18:12:30', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.94 },
  { dwellId: 'kit-olivia-pastry-3', personId: 'kit-olivia', counterId: 'ctr-pastry', start: '19:05:10', end: '19:24:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.92 },
  { dwellId: 'kit-olivia-cold-1', personId: 'kit-olivia', counterId: 'ctr-cold', start: '18:14:00', end: '18:24:40', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.9 },
  { dwellId: 'kit-olivia-cold-2', personId: 'kit-olivia', counterId: 'ctr-cold', start: '19:28:12', end: '19:36:50', videoId: 'vid-kitchen-movement', cameraId: 'cam-kit-02', confidence: 0.89 },
  { dwellId: 'kit-olivia-prep-1', personId: 'kit-olivia', counterId: 'ctr-prep', start: '18:26:00', end: '18:36:00', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.87 },
  { dwellId: 'kit-olivia-plating-1', personId: 'kit-olivia', counterId: 'ctr-plating', start: '19:38:00', end: '19:41:20', videoId: 'vid-kitchen-activity', cameraId: 'cam-kit-01', confidence: 0.86 },
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
    description: 'Employee dwell time across grill, prep, plating, pastry, cold station, and pass.',
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
  camera: Object.fromEntries(cameras.map((row) => [row.cameraId, row])),
  video: Object.fromEntries(videos.map((row) => [row.videoId, row])),
  event: Object.fromEntries(events.map((row) => [row.eventId, row])),
  cookbook: Object.fromEntries(cookbooks.map((row) => [row.cookbookId, row])),
  recipe: Object.fromEntries(recipes.map((row) => [row.recipeId, row])),
}
