/* Turning diarization labels into something a person can read.
 *
 * Pure, and in its own module, because it is applied in three places on the summary
 * card -- the prose, each contribution, and the speaker's own heading -- and the bug
 * that made it worth extracting was applying it to only one of them. A raw
 * `SPEAKER_02` mid-sentence cannot be fixed by resolving that speaker; it just sits
 * there. One function, one rule, every display path.
 */

/** Map of speaker_id -> display name, for participants somebody has identified. */
export function namedSpeakers(participants = []) {
  const by = {}
  for (const person of participants) {
    for (const sid of person.speaker_ids || []) {
      if (person.identity_status === 'known') by[sid] = person.display_name
    }
  }
  return by
}

/* `SPEAKER_02` becomes the person's name once they are identified, and "Speaker 2"
 * until then -- positional, but readable, and honest about being positional. The
 * substitution happens at RENDER rather than being baked into the stored text, so
 * identifying somebody improves every account already written without a GPU call. */
export function humaniseSpeakers(text, named = {}) {
  return (text || '').replace(/SPEAKER_(\d+)/gi,
    (token, n) => named[token.toUpperCase()] || `Speaker ${Number(n)}`)
}
