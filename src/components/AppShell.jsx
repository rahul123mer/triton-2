import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ChefHat, ChevronRight, ClipboardList, ConciergeBell, LayoutGrid, LineChart, Menu, Search, UtensilsCrossed, X } from 'lucide-react'
import { kitchenStaff, tables, waiters } from '../restaurant/data'

const restaurantNav = [
  ['Overview', '/restaurant', UtensilsCrossed],
  ['Tables', '/restaurant/tables', LayoutGrid],
  ['Service', '/restaurant/service', ConciergeBell],
  ['Kitchen', '/restaurant/kitchen', ChefHat],
  ['Cookbook', '/restaurant/cookbooks', BookOpen],
  ['Analysis', '/restaurant/analysis', LineChart],
  ['Reports', '/restaurant/reports', ClipboardList],
]

function navTitle(pathname) {
  const match = restaurantNav
    .filter(([, href]) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b[1].length - a[1].length)[0]
  return match?.[0] || 'Fine Dining'
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => setNavOpen(false), [location.pathname])
  const needle = search.trim().toLowerCase()
  const hits = useMemo(() => {
    if (needle.length < 1) return []
    return [
      ...tables.filter((row) => row.code.toLowerCase().includes(needle)).map((row) => ({ id: row.tableId, label: row.code, detail: `${row.seats}-top`, to: `/restaurant/tables/${row.tableId}` })),
      ...waiters.filter((row) => row.name.toLowerCase().includes(needle)).map((row) => ({ id: row.personId, label: row.name, detail: 'Waiter', to: `/restaurant/service/${row.personId}` })),
      ...kitchenStaff.filter((row) => row.name.toLowerCase().includes(needle)).map((row) => ({ id: row.personId, label: row.name, detail: row.station, to: `/restaurant/kitchen/${row.personId}` })),
    ].slice(0, 8)
  }, [needle])
  return <div className="app-shell">
    <button className="mobile-nav-button" onClick={() => setNavOpen(value => !value)} aria-label={navOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={navOpen}>{navOpen ? <X /> : <Menu />}</button>
    {navOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}
    <aside className={navOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand">
        <img className="brand-logo" src="/brand/safespace.webp" alt="SafeSpace" width="1161" height="219" />
        <div><strong>Triton</strong><span>Fine Dining Intelligence</span></div>
      </div>
      <nav aria-label="Primary navigation">
        <div className="nav-group-label">The Ember Room</div>
        {restaurantNav.map(([label, href, Icon]) => (
          <NavLink key={href} to={href} end={href === '/restaurant'} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Icon size={17} /><span>{label}</span><ChevronRight className="nav-chevron" size={14} />
          </NavLink>
        ))}
      </nav>
      <div className="user-card">
        <div className="avatar">SK</div>
        <div><strong>Sourav K.</strong><span>operations lead</span></div>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <div><span className="eyebrow">THE EMBER ROOM</span><h1>{navTitle(location.pathname)}</h1></div>
        <div className="global-search-wrap">
          <div className="global-search"><Search size={16} /><input aria-label="Search restaurant activity" placeholder="Search tables, waiters or kitchen staff" value={search} onChange={e => setSearch(e.target.value)} /></div>
          {needle.length > 0 && (
            <div className="search-popover">
              {hits.map((hit) => (
                <button key={hit.id} onClick={() => { navigate(hit.to); setSearch('') }}>
                  <strong>{hit.label}</strong>
                  <span>{hit.detail}</span>
                </button>
              ))}
              {hits.length === 0 && <span className="searching">No matching people or tables.</span>}
            </div>
          )}
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  </div>
}
