import { create } from 'zustand'
import { DAY } from './data'

export const useRestaurantStore = create((set) => ({
  date: DAY,
  /** Null means a single service day. Set to a later date for a period. */
  dateEnd: null,
  windowId: 'dinner',
  customStart: '18:00',
  customEnd: '21:00',
  selectedEventId: null,
  setDate: (date) => set((state) => ({ date, dateEnd: state.dateEnd && state.dateEnd < date ? null : state.dateEnd })),
  setDateEnd: (dateEnd) => set((state) => ({ dateEnd: dateEnd && dateEnd > state.date ? dateEnd : null })),
  clearRange: () => set({ dateEnd: null }),
  setWindowId: (windowId) => set({ windowId }),
  setCustomRange: (customStart, customEnd) => set({ customStart, customEnd, windowId: 'custom' }),
  selectEvent: (selectedEventId) => set({ selectedEventId }),
  clearEvent: () => set({ selectedEventId: null }),
}))
