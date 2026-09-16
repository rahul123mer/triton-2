export function formatDuration(ms, options = {}) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (options.short) return hours ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function formatSourceTime(ms) {
  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']; const index = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** index).toFixed(index > 2 ? 1 : 0)} ${units[index]}`
}

export function formatDate(value) {
  if (!value) return 'Date not available'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Date not available'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

/* Identifying a meeting.
 *
 * Compute numbers meetings WITHIN their source video (extract.py, "Meeting {n}"),
 * so several recordings that each yielded one meeting are all legitimately called
 * "Meeting 1". The label alone therefore never identifies a meeting, and any list
 * that shows it bare -- the library rail, the New Analysis picker, the confirm
 * step -- reads as a bug. What distinguishes them is where they came from: the
 * room if one was set at upload, else the recording, plus the offset into it.
 */
export function sourceLabel(filename) {
  if (!filename) return null
  const base = filename.replace(/\.[^.]+$/, '')
  // Short enough that a container's text-overflow will not trim it again: the
  // identity of a recorder filename is its TAIL (--part1, --part2), so a second
  // trim from the right would remove exactly the distinguishing part.
  return base.length > 20 ? `…${base.slice(-19)}` : base
}

/** Where a meeting came from: room if known, else the recording it was cut from. */
export function meetingOrigin(meeting, video) {
  return meeting?.room_name || video?.room_name || sourceLabel(video?.filename) || meeting?.video_id || null
}

/** One line that tells two same-named meetings apart. Skips what it does not know. */
export function meetingSubtitle(meeting, video) {
  if (!meeting) return ''
  return [
    meetingOrigin(meeting, video),
    meeting.recorded_on ? formatDate(meeting.recorded_on) : null,
    `${formatSourceTime(meeting.start_offset_ms)}–${formatSourceTime(meeting.end_offset_ms)}`,
    formatDuration(meeting.duration_ms, { short: true }),
    meeting.participant_count != null ? `${meeting.participant_count} people` : null,
  ].filter(Boolean).join(' · ')
}

/* Who was actually in the room.
 *
 * A meeting's participant rows mix three very different things, and counting
 * them together produced "19 participants" for a room holding four people:
 *
 *   identified          a face matched to an enrolled identity — a person
 *   unidentified faces  face clusters nobody could name. 121 tracks became 96
 *                       unnamed ones and then 12 clusters, so the count reflects
 *                       how badly tracks fragmented, not how many people there were
 *   unattributed speech diarized speakers with no face link. Without a voice
 *                       enrolled for them the bridge cannot fire, so they surface
 *                       as "Off-camera Speaker" — usually the SAME humans already
 *                       counted above, listed a second time
 *
 * Presenting them apart keeps every row (nothing is hidden, and a genuinely
 * off-camera speaker is still first-class) while letting the headline say
 * something true.
 */
export function partitionParticipants(participants = []) {
  const identified = [], faces = [], speakers = []
  for (const p of participants) {
    const hasFace = (p.face_track_ids || []).length > 0
    if (p.identity_status === 'known') identified.push(p)
    else if (hasFace) faces.push(p)
    else speakers.push(p)
  }
  return { identified, faces, speakers, reviewCount: faces.length + speakers.length }
}

/** Headline for a meeting header: honest about what is known and what is not. */
export function participantSummary(participants = []) {
  const { identified, reviewCount } = partitionParticipants(participants)
  if (!participants.length) return 'no participants yet'
  if (!reviewCount) return `${identified.length} participant${identified.length === 1 ? '' : 's'}`
  return `${identified.length} identified · ${reviewCount} to review`
}
