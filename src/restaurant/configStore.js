import { create } from 'zustand'
import {
  cookbooks as seedCookbooks,
  kitchenStaff as seedKitchen,
  recipes as seedRecipes,
  tables as seedTables,
  unresolvedFaces as seedUnresolved,
  uploadHistory as seedUploads,
  videoPersonZones as seedZones,
  waiters as seedWaiters,
} from './data'

let counter = 0
const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}${(counter += 1)}`

function cloneZones(source) {
  return Object.fromEntries(Object.entries(source).map(([videoId, zones]) => [videoId, zones.map((zone) => ({
    ...zone,
    points: zone.points ? zone.points.map((point) => [...point]) : undefined,
    track: zone.track ? zone.track.map((frame) => ({ ...frame })) : undefined,
  }))]))
}

/**
 * Session-scoped configuration. Cohorts, uploads, table layout, cookbook
 * toggles and polygon edits live here so Settings changes show up across the
 * product without a backend.
 */
export const useConfigStore = create((set, get) => ({
  waiters: seedWaiters.map((row) => ({ ...row })),
  kitchenStaff: seedKitchen.map((row) => ({ ...row })),
  unresolved: seedUnresolved.map((row) => ({ ...row })),
  uploads: seedUploads.map((row) => ({ ...row })),
  tables: seedTables.map((row) => ({ ...row })),
  cookbooks: seedCookbooks.map((row) => ({ ...row, enabled: true })),
  recipes: seedRecipes.map((row) => ({ ...row, enabled: true, threshold: row.recipeId === 'rcp-service-pattern' ? 0.4 : null })),
  zonesByVideo: cloneZones(seedZones),
  activity: [],

  log: (text) => set((state) => ({ activity: [{ id: nextId('act'), at: new Date().toISOString(), text }, ...state.activity].slice(0, 40) })),

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
  })),
  addTable: (partial) => {
    const tableId = nextId('tbl')
    const codeNumber = get().tables.length + 1
    const table = {
      tableId,
      code: partial.code || `T${String(codeNumber).padStart(2, '0')}`,
      seats: partial.seats || 2,
      cameraId: partial.cameraId || 'cam-df-03',
      reservedDinner: Boolean(partial.reservedDinner),
      x: partial.x ?? 8,
      y: partial.y ?? 90,
      w: 16,
      h: 14,
    }
    set((state) => ({ tables: [...state.tables, table] }))
    get().log(`Added ${table.code} (${table.seats} seats)`)
    return table
  },
  removeTable: (tableId) => {
    const table = get().tables.find((row) => row.tableId === tableId)
    set((state) => ({ tables: state.tables.filter((row) => row.tableId !== tableId) }))
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
      points: zone.points || [[30, 30], [70, 30], [70, 70], [30, 70]],
    }
    set((state) => ({ zonesByVideo: { ...state.zonesByVideo, [videoId]: [...(state.zonesByVideo[videoId] || []), record] } }))
    get().log(`Added polygon "${record.label}"`)
    return record
  },
  removeZone: (videoId, zoneId) => set((state) => ({
    zonesByVideo: { ...state.zonesByVideo, [videoId]: (state.zonesByVideo[videoId] || []).filter((zone) => zone.zoneId !== zoneId) },
  })),
  resetZones: (videoId) => set((state) => ({
    zonesByVideo: { ...state.zonesByVideo, [videoId]: cloneZones({ [videoId]: seedZones[videoId] || [] })[videoId] },
  })),
}))
