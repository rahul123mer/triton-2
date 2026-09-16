import { create } from "zustand"

let videoElement = null

export const usePlayback = create((set, get) => ({
  currentMs: 0,
  durationMs: 0,
  clipOffsetMs: 0,
  playing: false,
  mediaAvailable: true,
  registerVideo: (element, { clipOffsetMs = 0, durationMs = 0 } = {}) => {
    videoElement = element
    // Honour a seek that arrived BEFORE the player existed. "Jump to video" is
    // clicked on the Evidence tab, where no player is mounted: it sets the
    // position and then navigates to the surface that has one. Resetting to the
    // clip start here threw that position away, so the button navigated correctly
    // and then played from the beginning.
    //
    // reset() runs on every meeting change and sets currentMs to 0, which is at or
    // before any clip start, so a new meeting still opens at its beginning.
    const pending = get().currentMs
    const within = pending > clipOffsetMs && pending <= clipOffsetMs + durationMs
    set({ clipOffsetMs, durationMs, currentMs: within ? pending : clipOffsetMs })
    if (within) element.currentTime = (pending - clipOffsetMs) / 1000
  },
  unregisterVideo: (element) => { if (videoElement === element) videoElement = null },
  seek: (sourceMs) => {
    const { clipOffsetMs, durationMs } = get()
    // With no player mounted durationMs is 0, so clamping to [clipOffsetMs,
    // clipOffsetMs + 0] collapsed every seek to the clip start. "Jump to video"
    // is clicked from the Evidence tab, which has no player, so the position was
    // flattened to zero before the player could ever receive it. Remember the
    // request instead; registerVideo applies it once a player exists.
    const clamped = durationMs > 0
      ? Math.max(clipOffsetMs, Math.min(sourceMs, clipOffsetMs + durationMs))
      : Math.max(0, sourceMs)
    if (videoElement) videoElement.currentTime = (clamped - clipOffsetMs) / 1000
    set({ currentMs: Math.round(clamped) })
  },
  togglePlayback: async () => {
    if (!videoElement) return
    if (videoElement.paused) await videoElement.play().catch(() => set({ mediaAvailable: false }))
    else videoElement.pause()
  },
  setCurrentMs: (currentMs) => set({ currentMs: Math.round(currentMs) }),
  setPlaying: (playing) => set({ playing }),
  setMediaAvailable: (mediaAvailable) => set({ mediaAvailable }),
  reset: () => { videoElement = null; set({ currentMs: 0, durationMs: 0, clipOffsetMs: 0, playing: false, mediaAvailable: true }) },
}))
