import { Outlet, useNavigate } from 'react-router-dom'
import { EventDrawer, RestaurantFilters } from './components'
import { resolveEvent } from './analytics'
import { useRestaurantStore } from './store'

export function RestaurantLayout() {
  const navigate = useNavigate()
  const date = useRestaurantStore((s) => s.date)
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const clearEvent = useRestaurantStore((s) => s.clearEvent)
  const detail = selectedEventId ? resolveEvent(selectedEventId, date) : null
  return (
    <div className="ss-page">
      <div className="ss-toolbar">
        <RestaurantFilters />
      </div>
      <Outlet />
      <EventDrawer
        detail={detail}
        onClose={clearEvent}
        onOpen={(href) => { clearEvent(); navigate(href) }}
      />
    </div>
  )
}
