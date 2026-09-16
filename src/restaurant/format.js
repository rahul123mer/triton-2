export function formatDwell(ms) {
  const total = Math.max(0, Math.round((ms || 0) / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function formatClock(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(iso))
}

export function formatDateLong(value) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatPercent(value) {
  return `${Math.round((value || 0) * 100)}%`
}

export function eventTypeLabel(type) {
  return ({
    'table.occupancy': 'Table occupancy',
    'guest.seated': 'Guests seated',
    'table.cleared': 'Table cleared',
    'waiter.visit': 'Waiter visit',
    'waiter.entered': 'Waiter entered',
    'waiter.exited': 'Waiter exited',
    'kitchen.dwell': 'Counter dwell',
    'kitchen.entered': 'Counter entry',
    'kitchen.exited': 'Counter exit',
  })[type] || type
}

export function personTypeLabel(type) {
  return ({ waiter: 'Waiter', kitchen: 'Kitchen', guest: 'Guest' })[type] || 'Unidentified'
}
