import { Outlet, useNavigate } from 'react-router-dom'
import { EventDrawer, RestaurantFilters, useRestaurantWindow } from './components'
import { restaurant } from './data'
import { resolveEvent } from './analytics'
import { formatDateLong } from './format'
import { useRestaurantStore } from './store'
import { PageNav, SectionLabel } from '../components/ui'

export function RestaurantLayout() {
  const navigate = useNavigate()
  const selectedEventId = useRestaurantStore((s) => s.selectedEventId)
  const clearEvent = useRestaurantStore((s) => s.clearEvent)
  const date = useRestaurantStore((s) => s.date)
  const windowInfo = useRestaurantWindow()
  const detail = selectedEventId ? resolveEvent(selectedEventId) : null
  return (
    <div className="page">
      <PageNav />
      <div className="rdi-bar">
        <div>
          <SectionLabel blue>RESTAURANT INTELLIGENCE</SectionLabel>
          <h2>{restaurant.name}</h2>
          <p>{restaurant.location} · {formatDateLong(date)} · {windowInfo.label}</p>
        </div>
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
