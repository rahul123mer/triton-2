import { create } from 'zustand'
import { useConfigStore } from '../restaurant/configStore'

const STORAGE_KEY = 'triton.auth.session'

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode */
  }
}

function toSession(user) {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export const useAuthStore = create((set, get) => ({
  session: readSession(),
  remember: true,
  error: null,

  setRemember: (remember) => set({ remember: Boolean(remember) }),

  login: (email, password) => {
    const normalized = String(email || '').trim().toLowerCase()
    const pass = String(password || '')
    const users = useConfigStore.getState().users
    const user = users.find((row) => row.email === normalized)

    if (!user || user.password !== pass) {
      set({ error: 'Invalid email or password.' })
      return { ok: false }
    }
    if (user.status === 'disabled') {
      set({ error: 'This account is disabled. Contact an admin.' })
      return { ok: false }
    }

    if (user.status === 'invited') {
      useConfigStore.getState().updateUser(user.userId, {
        status: 'active',
        lastLogin: new Date().toISOString(),
      })
    } else {
      useConfigStore.getState().updateUser(user.userId, {
        lastLogin: new Date().toISOString(),
      })
    }

    const session = toSession({ ...user, status: 'active' })
    if (get().remember) writeSession(session)
    else writeSession(null)
    set({ session, error: null })
    return { ok: true, session }
  },

  logout: () => {
    writeSession(null)
    set({ session: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
