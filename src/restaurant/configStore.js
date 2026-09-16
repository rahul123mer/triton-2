import { create } from 'zustand'
import {
  cookbooks as seedCookbooks,
  kitchenStaff as seedKitchen,
  recipes as seedRecipes,
  tables as seedTables,
  timeWindows as seedWindows,
  unresolvedFaces as seedUnresolved,
  uploadHistory as seedUploads,
  videoPersonZones as seedZones,
  waiters as seedWaiters,
} from './data'
import persistedSettings from './settings.json'

let counter = 0
const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}${(counter += 1)}`

function cloneZones(source) {
  return Object.fromEntries(Object.entries(source).map(([videoId, zones]) => [videoId, zones.map((zone) => ({
    ...zone,
    points: zone.points ? zone.points.map((point) => [...point]) : undefined,
    track: zone.track ? zone.track.map((frame) => ({ ...frame })) : undefined,
  }))]))
}

function enrichTable(row) {
  return {
    ...row,
    name: row.name || '',
    section: row.section || (row.cameraId === 'cam-df-01' ? 'Booths' : row.cameraId === 'cam-df-02' ? 'Centre' : 'Wide floor'),
    shape: row.shape || (row.seats >= 6 ? 'Rectangle' : row.seats === 4 ? 'Square' : 'Round'),
    notes: row.notes || '',
  }
}

function defaultServiceWindows() {
  return seedWindows
    .filter((row) => row.windowId !== 'custom')
    .map((row) => ({ ...row, enabled: true }))
}

function mergeAreaZones(areaZones) {
  const base = cloneZones(seedZones)
  if (!areaZones || typeof areaZones !== 'object') return base
  for (const [videoId, areas] of Object.entries(areaZones)) {
    const people = (base[videoId] || []).filter((zone) => zone.kind === 'person')
    const nextAreas = (areas || []).map((zone) => ({
      zoneId: zone.zoneId,
      kind: 'area',
      role: zone.role || 'table',
      label: zone.label || 'Zone',
      badge: zone.badge || '',
      color: zone.color || '#38bdf8',
      points: (zone.points || []).map((point) => [Number(point[0]), Number(point[1])]),
    }))
    base[videoId] = [...nextAreas, ...people]
  }
  return base
}

function areaZonesPayload(zonesByVideo) {
  return Object.fromEntries(Object.entries(zonesByVideo || {}).map(([videoId, zones]) => [
    videoId,
    (zones || [])
      .filter((zone) => zone.kind === 'area')
      .map((zone) => ({
        zoneId: zone.zoneId,
        kind: 'area',
        role: zone.role,
        label: zone.label,
        badge: zone.badge || '',
        color: zone.color,
        points: zone.points,
      })),
  ]))
}

export const EMAIL_DOMAIN = 'safespaceglobal.ai'

const FALLBACK_USERS = [
  { userId: 'usr-rahul', name: 'Rahul Mer', email: 'rahul.mer@safespaceglobal.ai', password: 'SafeSpace@Rahul1', role: 'Admin', status: 'active', createdOn: '2026-07-12', lastLogin: '2026-09-17T09:40:00+05:30' },
  { userId: 'usr-sourav', name: 'Sourav Sarkar', email: 'sourav.sarkar@safespaceglobal.ai', password: 'SafeSpace@Sourav1', role: 'Admin', status: 'active', createdOn: '2026-08-01', lastLogin: '2026-09-16T22:10:00+05:30' },
  { userId: 'usr-anand', name: 'Anand Ijju', email: 'anand.ijju@safespaceglobal.ai', password: 'SafeSpace@Anand1', role: 'Manager', status: 'active', createdOn: '2026-08-18', lastLogin: '2026-09-15T18:05:00+05:30' },
  { userId: 'usr-sasi', name: 'Sasidhar Valluru', email: 'sasidhar.valluru@safespaceglobal.ai', password: 'SafeSpace@Sasi1', role: 'Manager', status: 'active', createdOn: '2026-09-01', lastLogin: '2026-09-14T11:20:00+05:30' },
  { userId: 'usr-rohan', name: 'Rohan', email: 'rohan@safespaceglobal.ai', password: 'SafeSpace@Rohan1', role: 'Analyst', status: 'active', createdOn: '2026-09-10', lastLogin: null },
]

function loadPersisted() {
  const file = persistedSettings && typeof persistedSettings === 'object' ? persistedSettings : {}
  return {
    serviceWindows: Array.isArray(file.serviceWindows) && file.serviceWindows.length
      ? file.serviceWindows.map((row) => ({ ...row, enabled: row.enabled !== false }))
      : defaultServiceWindows(),
    users: Array.isArray(file.users) && file.users.length
      ? file.users.map((row) => ({ ...row }))
      : FALLBACK_USERS.map((row) => ({ ...row })),
    tables: Array.isArray(file.tables) && file.tables.length
      ? file.tables.map(enrichTable)
      : seedTables.map(enrichTable),
    zonesByVideo: mergeAreaZones(file.areaZones),
  }
}

export function normalizeWorkEmail(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw.includes('@')) {
    const [local] = raw.split('@')
    return `${local}@${EMAIL_DOMAIN}`
  }
  return `${raw}@${EMAIL_DOMAIN}`
}

const initial = loadPersisted()

/**
 * Restaurant settings. Seeded from src/restaurant/settings.json.
 * Save writes that file through the Vite dev middleware (not localStorage).
 */
export const useConfigStore = create((set, get) => ({
  waiters: seedWaiters.map((row) => ({ ...row })),
  kitchenStaff: seedKitchen.map((row) => ({ ...row })),
  unresolved: seedUnresolved.map((row) => ({ ...row })),
  uploads: seedUploads.map((row) => ({ ...row })),
  tables: initial.tables,
  cookbooks: seedCookbooks.map((row) => ({ ...row, enabled: true })),
  recipes: seedRecipes.map((row) => ({ ...row, enabled: true, threshold: row.recipeId === 'rcp-service-pattern' ? 0.4 : null })),
  zonesByVideo: initial.zonesByVideo,
  serviceWindows: initial.serviceWindows,
  users: initial.users,
  activity: [],
  saveState: 'idle',
  saveError: null,
  savePath: 'src/restaurant/settings.json',

  log: (text) => set((state) => ({ activity: [{ id: nextId('act'), at: new Date().toISOString(), text }, ...state.activity].slice(0, 40) })),

  buildSettingsPayload: () => {
    const state = get()
    return {
      serviceWindows: state.serviceWindows,
      users: state.users,
      tables: state.tables,
      areaZones: areaZonesPayload(state.zonesByVideo),
    }
  },

  saveSettings: async () => {
    set({ saveState: 'saving', saveError: null })
    try {
      const payload = get().buildSettingsPayload()
      const response = await fetch('/__triton/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || body.ok === false) {
        throw new Error(body.error || `Save failed (${response.status})`)
      }
      set({ saveState: 'saved', saveError: null, savePath: body.path || 'src/restaurant/settings.json' })
      get().log('Saved settings to settings.json')
      window.setTimeout(() => {
        if (get().saveState === 'saved') set({ saveState: 'idle' })
      }, 2500)
      return { ok: true }
    } catch (error) {
      const message = String(error.message || error)
      set({ saveState: 'error', saveError: message })
      get().log(`Save failed: ${message}`)
      return { ok: false, error: message }
    }
  },

  // Service timings -------------------------------------------------------
  updateServiceWindow: (windowId, patch) => {
    set((state) => ({
      serviceWindows: state.serviceWindows.map((row) => row.windowId === windowId ? { ...row, ...patch } : row),
      saveState: state.saveState === 'saved' ? 'idle' : state.saveState,
    }))
    const row = get().serviceWindows.find((item) => item.windowId === windowId)
    if (!row) return
    if (patch.label != null) get().log(`Renamed service window to ${row.label}`)
    else get().log(`Updated ${row.label} window to ${String(row.start).slice(0, 5)}–${String(row.end).slice(0, 5)}`)
  },
  resetServiceWindows: () => {
    set({ serviceWindows: defaultServiceWindows(), saveState: 'idle' })
    get().log('Reset restaurant timings to defaults')
  },

  // Users -----------------------------------------------------------------
  addUser: ({ name, email, role, password }) => {
    const user = {
      userId: nextId('usr'),
      name: name.trim(),
      email: normalizeWorkEmail(email),
      password: String(password || 'SafeSpace@Change1'),
      role: role || 'Viewer',
      status: 'invited',
      createdOn: new Date().toISOString().slice(0, 10),
      lastLogin: null,
    }
    set((state) => ({ users: [user, ...state.users], saveState: 'idle' }))
    get().log(`Registered user ${user.name} (${user.role})`)
    return user
  },
  updateUser: (userId, patch) => set((state) => ({
    users: state.users.map((row) => {
      if (row.userId !== userId) return row
      const next = { ...row, ...patch }
      if (patch.email != null) next.email = normalizeWorkEmail(patch.email)
      return next
    }),
    saveState: 'idle',
  })),
  removeUser: (userId) => {
    const user = get().users.find((row) => row.userId === userId)
    set((state) => ({ users: state.users.filter((row) => row.userId !== userId), saveState: 'idle' }))
    if (user) get().log(`Removed user ${user.name}`)
  },

  // Cohorts ---------------------------------------------------------------
  enrollPerson: ({ name, role, employeeCode, avatar, station, title }) => {
    const personId = nextId(role === 'kitchen' ? 'kit' : 'wtr')
    const person = {
      personId,
      name,
      role,
      title: title || (role === 'kitchen' ? 'Cook' : 'Server'),
      station: station || (role === 'kitchen' ? 'Food prep' : undefined),
      employeeCode: employeeCode || `${role === 'kitchen' ? 'KIT' : 'SRV'}-${String(100 + Math.floor(Math.random() * 899))}`,
      enrolled: true,
      enrolledOn: new Date().toISOString().slice(0, 10),
      samples: 1,
      avatar: avatar || null,
      pending: true,
    }
    set((state) => (role === 'kitchen'
      ? { kitchenStaff: [...state.kitchenStaff, person] }
      : { waiters: [...state.waiters, person] }))
    get().log(`Enrolled ${name} into ${role === 'kitchen' ? 'Kitchen staff' : 'Serving staff'}`)
    return person
  },
  removePerson: (personId) => {
    const all = [...get().waiters, ...get().kitchenStaff]
    const person = all.find((row) => row.personId === personId)
    set((state) => ({
      waiters: state.waiters.filter((row) => row.personId !== personId),
      kitchenStaff: state.kitchenStaff.filter((row) => row.personId !== personId),
    }))
    if (person) get().log(`Removed ${person.name} from the cohort`)
  },
  resolveUnresolved: (unresolvedId, { personId, name, role }) => {
    const row = get().unresolved.find((item) => item.unresolvedId === unresolvedId)
    if (!row) return null
    let target = null
    if (personId) {
      target = [...get().waiters, ...get().kitchenStaff].find((item) => item.personId === personId) || null
      if (target) {
        set((state) => ({
          waiters: state.waiters.map((item) => item.personId === personId ? { ...item, samples: (item.samples || 0) + row.occurrences } : item),
          kitchenStaff: state.kitchenStaff.map((item) => item.personId === personId ? { ...item, samples: (item.samples || 0) + row.occurrences } : item),
        }))
      }
    } else if (name) {
      target = get().enrollPerson({ name, role: role || row.role, avatar: row.sample })
    }
    set((state) => ({ unresolved: state.unresolved.filter((item) => item.unresolvedId !== unresolvedId) }))
    if (target) get().log(`Resolved ${row.occurrences} detections to ${target.name}`)
    return target
  },
  dismissUnresolved: (unresolvedId) => {
    set((state) => ({ unresolved: state.unresolved.filter((item) => item.unresolvedId !== unresolvedId) }))
    get().log('Dismissed an unresolved detection')
  },

  // Uploads ---------------------------------------------------------------
  queueUpload: ({ fileName, sizeMb, cameraId, recordedOn, window }) => {
    const uploadId = nextId('upl')
    const record = {
      uploadId,
      fileName,
      cameraId,
      recordedOn,
      window,
      durationMs: null,
      sizeMb,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      progress: 0,
      events: 0,
      faces: 0,
    }
    set((state) => ({ uploads: [record, ...state.uploads] }))
    get().log(`Queued ${fileName}`)
    return uploadId
  },
  updateUpload: (uploadId, patch) => set((state) => ({
    uploads: state.uploads.map((row) => row.uploadId === uploadId ? { ...row, ...patch } : row),
  })),
  removeUpload: (uploadId) => set((state) => ({ uploads: state.uploads.filter((row) => row.uploadId !== uploadId) })),

  // Tables ----------------------------------------------------------------
  updateTable: (tableId, patch) => set((state) => ({
    tables: state.tables.map((row) => row.tableId === tableId ? { ...row, ...patch } : row),
    saveState: 'idle',
  })),
  addTable: (partial) => {
    const existingCodes = new Set(get().tables.map((row) => row.code.toUpperCase()))
    let code = (partial.code || '').trim().toUpperCase()
    if (!code || existingCodes.has(code)) {
      let n = get().tables.length + 1
      while (existingCodes.has(`T${String(n).padStart(2, '0')}`)) n += 1
      code = `T${String(n).padStart(2, '0')}`
    }
    const tableId = partial.tableId?.trim() || nextId('tbl')
    const table = {
      tableId,
      code,
      name: (partial.name || '').trim(),
      seats: Number(partial.seats) || 2,
      cameraId: partial.cameraId || 'cam-df-03',
      section: partial.section || 'Centre',
      shape: partial.shape || 'Square',
      notes: (partial.notes || '').trim(),
      reservedDinner: Boolean(partial.reservedDinner),
      x: partial.x ?? 8,
      y: partial.y ?? 90,
      w: partial.w ?? (Number(partial.seats) >= 6 ? 24 : 16),
      h: partial.h ?? (Number(partial.seats) >= 6 ? 20 : 14),
    }
    set((state) => ({ tables: [...state.tables, table], saveState: 'idle' }))
    get().log(`Registered table ${table.code}${table.name ? ` (${table.name})` : ''}`)
    return table
  },
  removeTable: (tableId) => {
    const table = get().tables.find((row) => row.tableId === tableId)
    set((state) => ({ tables: state.tables.filter((row) => row.tableId !== tableId), saveState: 'idle' }))
    if (table) get().log(`Removed ${table.code} from the floor plan`)
  },

  // Cookbooks -------------------------------------------------------------
  toggleRecipe: (recipeId) => set((state) => ({
    recipes: state.recipes.map((row) => row.recipeId === recipeId ? { ...row, enabled: !row.enabled } : row),
  })),
  setRecipeThreshold: (recipeId, threshold) => set((state) => ({
    recipes: state.recipes.map((row) => row.recipeId === recipeId ? { ...row, threshold } : row),
  })),

  // Polygons --------------------------------------------------------------
  updateZone: (videoId, zoneId, patch) => set((state) => ({
    zonesByVideo: {
      ...state.zonesByVideo,
      [videoId]: (state.zonesByVideo[videoId] || []).map((zone) => zone.zoneId === zoneId ? { ...zone, ...patch } : zone),
    },
    saveState: 'idle',
  })),
  moveZonePoint: (videoId, zoneId, index, point) => set((state) => ({
    zonesByVideo: {
      ...state.zonesByVideo,
      [videoId]: (state.zonesByVideo[videoId] || []).map((zone) => {
        if (zone.zoneId !== zoneId || !zone.points) return zone
        const points = zone.points.map((existing, i) => (i === index ? point : existing))
        return { ...zone, points }
      }),
    },
    saveState: 'idle',
  })),
  addZone: (videoId, zone) => {
    const zoneId = nextId('zone')
    const record = {
      zoneId,
      kind: 'area',
      role: zone.role || 'table',
      label: zone.label || 'New zone',
      badge: zone.badge || '',
      color: zone.color || '#38bdf8',
      points: Array.isArray(zone.points) && zone.points.length
        ? zone.points.map((point) => [Number(point[0]), Number(point[1])])
        : [[30, 30], [70, 30], [70, 70], [30, 70]],
    }
    set((state) => ({
      zonesByVideo: { ...state.zonesByVideo, [videoId]: [...(state.zonesByVideo[videoId] || []), record] },
      saveState: 'idle',
    }))
    get().log(`Added polygon "${record.label}"`)
    return record
  },
  removeZone: (videoId, zoneId) => {
    const zone = (get().zonesByVideo[videoId] || []).find((row) => row.zoneId === zoneId)
    set((state) => ({
      zonesByVideo: { ...state.zonesByVideo, [videoId]: (state.zonesByVideo[videoId] || []).filter((row) => row.zoneId !== zoneId) },
      saveState: 'idle',
    }))
    if (zone) get().log(`Removed polygon "${zone.label}"`)
  },
  resetZones: (videoId) => set((state) => ({
    zonesByVideo: { ...state.zonesByVideo, [videoId]: cloneZones({ [videoId]: seedZones[videoId] || [] })[videoId] },
    saveState: 'idle',
  })),
}))
