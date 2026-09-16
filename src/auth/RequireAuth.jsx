import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './authStore'

/** Gate for authenticated app routes. Unauthenticated users go to /login. */
export function RequireAuth({ children }) {
  const session = useAuthStore((s) => s.session)
  const location = useLocation()
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
