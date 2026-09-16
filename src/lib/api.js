const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export class ApiError extends Error {
  constructor(message, code = 'UNKNOWN', details = null) {
    super(message); this.name = 'ApiError'; this.code = code; this.details = details
  }
}

export async function api(path, options = {}) {
  const formData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { ...(formData ? {} : { 'Content-Type': 'application/json' }), ...options.headers }, ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(body?.error?.message || `Request failed (${response.status})`, body?.error?.code, body?.error?.details)
  }
  if (response.status === 204) return null
  return response.json()
}

async function ticketRequest(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(body?.error?.message || `Upload request failed (${response.status})`, body?.error?.code, body?.error?.details)
  }
  return response.status === 204 ? null : response.json().catch(() => null)
}

export const videoApi = {
  list: (params = '') => api(`/source-videos${params}`),
  detail: (id) => api(`/source-videos/${id}`),
  meetings: (id) => api(`/source-videos/${id}/meetings`),
  deadFootage: (id) => api(`/source-videos/${id}/dead-footage`),
  promoteDeadFootage: (videoId, segmentId) => api(`/dead-footage/${segmentId}/promote-to-meeting`, { method: 'POST', body: JSON.stringify({ video_id: videoId }) }),
  extractionImpact: (id, dryRun = true) => api(`/source-videos/${id}/extract`, { method: 'POST', body: JSON.stringify({ dry_run: dryRun }) }),
  createUpload: (body) => api('/source-videos', { method: 'POST', body: JSON.stringify(body) }),
  uploadPart: (url, blob) => ticketRequest(url, { method: 'PUT', body: blob, headers: { 'Content-Type': 'application/octet-stream' } }),
  completeUpload: (url) => ticketRequest(url, { method: 'POST' }),
  abortUpload: (url) => ticketRequest(url, { method: 'POST' }),
  media: (id) => api(`/source-videos/${id}/media`),
  remove: (id) => api(`/source-videos/${id}`, { method: 'DELETE' }),
  extendDeadFootage: (videoId, segmentId, beforeMs, afterMs) => api(`/dead-footage/${segmentId}/extend`, { method: 'POST', body: JSON.stringify({ video_id: videoId, before_ms: beforeMs, after_ms: afterMs }) }),
}

export const overviewApi = { get: () => api('/overview') }
export const authApi = { me: () => api('/me') }
export const governanceApi = { global: () => api('/governance') }
export const exportApi = { list: (analysisId = '') => api(`/exports${analysisId ? `?analysis_id=${encodeURIComponent(analysisId)}` : ''}`) }

export const meetingApi = {
  // The dashboard's library rail needs every meeting, not the five the Overview
  // contract carries as `recent_meetings`. /meetings already supports the filters.
  list: (query = '') => api(`/meetings${query ? `?${query}` : ''}`),
  detail: (id) => api(`/meetings/${id}`),
  rename: (id, label) => api(`/meetings/${id}`, { method: 'PATCH', body: JSON.stringify({ label }) }),
  media: (id) => api(`/meetings/${id}/media`),
  tracks: (id, fromMs, toMs) => api(`/meetings/${id}/tracks?from_ms=${encodeURIComponent(fromMs)}&to_ms=${encodeURIComponent(toMs)}`),
  transcript: (id, query = '') => api(`/meetings/${id}/transcript${query ? `?${query}` : ''}`),
  evidence: (id, query = '') => api(`/meetings/${id}/evidence${query ? `?${query}` : ''}`),
  lineage: (id, query = '') => api(`/meetings/${id}/lineage${query ? `?${query}` : ''}`),
  participants: (id) => api(`/meetings/${id}/participants`),
  updateParticipant: (meetingId, participantId, body) => api(`/meetings/${meetingId}/participants/${participantId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  associations: (id) => api(`/meetings/${id}/associations`),
  updateAssociation: (meetingId, associationId, body) => api(`/meetings/${meetingId}/associations/${associationId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  governance: (id) => api(`/meetings/${id}/governance`),
  notes: (id, params = '') => api(`/meetings/${id}/notes${params ? `?${params}` : ''}`),
  summary: (id) => api(`/meetings/${id}/summary`),
  addNote: (id, body) => api(`/meetings/${id}/notes`, { method: 'POST', body: JSON.stringify(body) }),
  recipeResults: (id) => api(`/meetings/${id}/recipe-results`),
  observations: (id, modality = '') => api(`/meetings/${id}/observations${modality ? `?modality=${modality}` : ''}`),
  setBoundaries: (id, body) => api(`/meetings/${id}/boundaries`, { method: 'PATCH', body: JSON.stringify(body) }),
  split: (id, atMs) => api(`/meetings/${id}/split`, { method: 'POST', body: JSON.stringify({ at_ms: atMs }) }),
  merge: (meetingIds) => api('/meetings/merge', { method: 'POST', body: JSON.stringify({ meeting_ids: meetingIds }) }),
  markAsDead: (id, reason) => api(`/meetings/${id}/mark-as-dead`, { method: 'POST', body: JSON.stringify({ reason }) }),
  // Distinct from markAsDead, which RECLASSIFIES a span as non-meeting footage and
  // keeps it on the source timeline. This forgets the meeting entirely.
  remove: (id) => api(`/meetings/${id}`, { method: 'DELETE' }),
}

export const analysisApi = {
  detail: (id) => api(`/analyses/${id}`),
  scorecard: (id) => api(`/analyses/${id}/scorecard`),
  recipe: (analysisId, recipeId) => api(`/analyses/${analysisId}/recipes/${recipeId}`),
  list: (query = '') => api(`/analyses${query ? `?${query}` : ''}`),
  publish: (id) => api(`/analyses/${id}/publish`, { method: 'POST' }),
  create: (body) => api('/analyses', { method: 'POST', body: JSON.stringify(body) }),
  setHumanScores: (id, scores) => api(`/analyses/${id}/human-scores`, { method: 'PUT', body: JSON.stringify({ scores }) }),
  reportPreview: (id) => api(`/analyses/${id}/report-preview`),
  exportReport: (id, format = 'pdf') => api(`/analyses/${id}/export`, { method: 'POST', body: JSON.stringify({ format }) }),
  remove: (id) => api(`/analyses/${id}`, { method: 'DELETE' }),
}

export const cookbookApi = {
  list: () => api('/cookbooks'),
  // One endpoint, two shapes: `clone_from` copies an existing Cookbook, `recipes`
  // builds one from the catalogue. The API refuses a request carrying both.
  clone: (body) => api('/cookbooks', { method: 'POST', body: JSON.stringify(body) }),
  create: (body) => api('/cookbooks', { method: 'POST', body: JSON.stringify(body) }),
  remove: (id) => api(`/cookbooks/${id}`, { method: 'DELETE' }),
  update: (id, body) => api(`/cookbooks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
}

export const galleryApi = {
  faces: () => api('/gallery/faces'), voices: () => api('/gallery/voices'),
  enroll: (kind, body) => api(`/gallery/${kind}`, { method: 'POST', body: JSON.stringify(body) }),
  upload: (kind, displayName, files) => { const body=new FormData();body.append('display_name',displayName);files.forEach(file=>body.append('files',file));return api(`/gallery/${kind}/upload`,{method:'POST',body}) },
  resolve: (participantId, body) => api(`/participants/${participantId}/resolve`, { method: 'POST', body: JSON.stringify(body) }),
  mergeParticipant: (participantId, into) => api(`/participants/${participantId}/merge`, { method: 'POST', body: JSON.stringify({ into }) }),
  mappings: () => api('/gallery/mappings'),
  remove: (kind, identityId) => api(`/gallery/${kind}/${identityId}`, { method: 'DELETE' }),
  unresolved: (kind = '') => api(`/gallery/unresolved${kind ? `?kind=${kind}` : ''}`),
}
export const recipeApi = {
  list: () => api('/recipes'),
  ingredients: () => api('/recipes/ingredients'),
  create: (body) => api('/recipes', { method: 'POST', body: JSON.stringify(body) }),
}

export const searchApi = { search: (q, scope = '') => api(`/search?q=${encodeURIComponent(q)}${scope ? `&scope=${scope}` : ''}`) }
export const jobApi = { list: () => api('/jobs'), detail: (id) => api(`/jobs/${id}`), retry: (id) => api(`/jobs/${id}/retry`, { method: 'POST' }), cancel: (id) => api(`/jobs/${id}/cancel`, { method: 'POST' }) }
