import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ConciergeBell,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  Menu,
  MoreHorizontal,
  X,
} from 'lucide-react'

const navItems = [
  { id: 'overview', label: 'Overview', to: '/restaurant', icon: LayoutDashboard, end: true },
  { id: 'tables', label: 'Tables', to: '/restaurant/tables', icon: LayoutGrid },
  { id: 'service', label: 'Service', to: '/restaurant/service', icon: ConciergeBell },
  { id: 'kitchen', label: 'Kitchen', to: '/restaurant/kitchen', icon: ChefHat },
  { id: 'cookbook', label: 'Cookbook', to: '/restaurant/cookbooks', icon: BookOpen },
  { id: 'analysis', label: 'Analysis', to: '/restaurant/analysis', icon: LineChart },
  { id: 'reports', label: 'Reports', to: '/restaurant/reports', icon: ClipboardList },
]

const pages = [
  ['/restaurant/tables', 'Tables', 'Floor occupancy, guest load, and waiter visits by table.'],
  ['/restaurant/service', 'Service', 'Face-recognised waiter visits and dwell across the dining room.'],
  ['/restaurant/kitchen', 'Kitchen', 'Station utilisation and identified kitchen staff dwell.'],
  ['/restaurant/cookbooks', 'Cookbook', 'Recipes that evaluate occupancy, service, and kitchen events.'],
  ['/restaurant/analysis', 'Analysis', 'Run a cookbook recipe over the captured event stream and inspect supporting evidence.'],
  ['/restaurant/reports', 'Reports', 'Period findings derived from the same occupancy and dwell events.'],
  ['/restaurant', 'Overview', 'Occupancy, service, and kitchen activity for The Ember Room.'],
]

function pageMeta(pathname) {
  const match = pages.find(([href]) => pathname === href || pathname.startsWith(`${href}/`))
  return { title: match?.[1] || 'Overview', lead: match?.[2] || '' }
}

export function AppShell() {
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => setNavOpen(false), [location.pathname])
  const { title, lead } = useMemo(() => pageMeta(location.pathname), [location.pathname])

  return (
    <div className={`app-shell ss-shell${collapsed ? ' collapsed' : ''}${navOpen ? ' nav-open' : ''}`}>
      <button className="mobile-nav-button" onClick={() => setNavOpen((value) => !value)} aria-label={navOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={navOpen}>
        {navOpen ? <X /> : <Menu />}
      </button>
      {navOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}
      <aside className={navOpen ? 'sidebar open' : 'sidebar'}>
        <div className="ss-brand">
          <img className="ss-brand-logo" src="/brand/safespace.webp" alt="SafeSpace" />
          <span className="ss-brand-tag">Triton</span>
        </div>
        <button
          type="button"
          className="ss-collapse"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.end}
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="ss-sidebar-foot">
          <button type="button" className="ss-notifications">
            <span className="ss-bell-wrap">
              <Bell size={16} strokeWidth={1.75} />
              <i className="ss-notify-dot" />
            </span>
            <span>Notifications</span>
            <span className="ss-notify-avatar">R</span>
          </button>
          <div className="ss-user">
            <div className="ss-user-photo" aria-hidden="true">R</div>
            <div className="ss-user-copy">
              <strong>Rahul</strong>
              <span>rahul123mer@gmail.com</span>
            </div>
            <button type="button" className="ss-user-more" aria-label="Account menu"><MoreHorizontal size={16} /></button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <main className="ss-main">
          <div className="ss-page-heading">
            <h1 className="ss-page-title">{title}</h1>
            {lead ? <p className="ss-page-lead">{lead}</p> : null}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
