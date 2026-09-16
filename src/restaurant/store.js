import { create } from 'zustand'
import { DAY } from './data'

export const useRestaurantStore = create((set) => ({
  date: DAY,
  windowId: 'dinner',
  customStart: '18:00',
  customEnd: '21:00',
  selectedEventId: null,
  setDate: (date) => set({ date }),
  setWindowId: (windowId) => set({ windowId }),
  setCustomRange: (customStart, customEnd) => set({ customStart, customEnd, windowId: 'custom' }),
  selectEvent: (selectedEventId) => set({ selectedEventId }),
  clearEvent: () => set({ selectedEventId: null }),
}))
