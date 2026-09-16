import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  MoreHorizontal,
  Settings2,
  Users,
  Video,
  X,
} from 'lucide-react'
import { useAuthStore } from '../auth/authStore'

const navItems = [
  { id: 'overview', label: 'Overview', to: '/restaurant', icon: LayoutDashboard, end: true },
  { id: 'analytics', label: 'Analytics', to: '/restaurant/analytics', icon: LineChart },
  {
    id: 'live',
    label: 'Live Feeds',
    icon: Video,
    base: '/restaurant/live',
    children: [
      { id: 'live-kitchen', label: 'Kitchen', to: '/restaurant/live/kitchen' },
      { id: 'live-tables', label: 'Tables', to: '/restaurant/live/tables' },
    ],
  },
  {
    id: 'cohorts',
    label: 'Cohorts',
    icon: Users,
    base: '/restaurant/cohorts',
    children: [
      { id: 'cohorts-kitchen', label: 'Kitchen Staffs', to: '/restaurant/cohorts/kitchen' },
      { id: 'cohorts-serving', label: 'Serving Staffs', to: '/restaurant/cohorts/serving' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings & Configurations',
    icon: Settings2,
    base: '/restaurant/settings',
    children: [
      { id: 'settings-timings', label: 'Restaurant timings', to: '/restaurant/settings/timings' },
      { id: 'settings-users', label: 'User Management', to: '/restaurant/settings/users' },
      { id: 'settings-tables', label: 'Tables', to: '/restaurant/settings/tables' },
      { id: 'settings-uploads', label: 'Uploads video', to: '/restaurant/settings/uploads' },
      { id: 'settings-cookbooks', label: 'Cookbooks', to: '/restaurant/settings/cookbooks' },
      { id: 'settings-polygons', label: 'Polygons', to: '/restaurant/settings/polygons' },
    ],
  },
]

const pages = [
  ['/restaurant/analytics/tables', 'Table analytics', 'Every occupancy session as its own record, with the servers who covered it.'],
  ['/restaurant/analytics/servers', 'Server performance', 'Ranked by attention score. Visits only count while a table is occupied.'],
  ['/restaurant/analytics/kitchen', 'Kitchen performance', 'Station time by employee across Food prep / cooking and Final food assembly.'],
  ['/restaurant/analytics', 'Analytics', 'Restaurant, table, server and kitchen performance for the selected period.'],
  ['/restaurant/live/kitchen', 'Live Feeds · Kitchen', 'Kitchen cameras with station polygons and recognised staff.'],
  ['/restaurant/live/tables', 'Live Feeds · Tables', 'Dining-floor cameras with table zones and live occupancy status.'],
  ['/restaurant/cohorts/kitchen', 'Kitchen Staffs', 'Enrolled kitchen employees and detections still waiting to be resolved.'],
  ['/restaurant/cohorts/serving', 'Serving Staffs', 'Enrolled servers and detections still waiting to be resolved.'],
  ['/restaurant/settings/timings', 'Restaurant timings', 'Morning, Lunch, Dinner and Evening service windows for the filter bar.'],
  ['/restaurant/settings/users', 'User Management', 'Register people who can log in to SafeSpace Triton.'],
  ['/restaurant/settings/tables', 'Tables', 'Register tables with Table ID, seats, section, camera and notes.'],
  ['/restaurant/settings/uploads', 'Uploads video', 'Upload camera recordings for processing and review the history.'],
  ['/restaurant/settings/cookbooks', 'Cookbooks', 'Recipes that evaluate occupancy, service and kitchen events.'],
  ['/restaurant/settings/polygons', 'Polygons', 'Draw and rename the zones each camera watches.'],
  ['/restaurant', 'Overview', 'Performance snapshot for The Ember Room.'],
]

function pageMeta(pathname) {
  const match = pages.find(([href]) => pathname === href || pathname.startsWith(`${href}/`))
  return { title: match?.[1] || 'Overview', lead: match?.[2] || '' }
}

function NavGroup({ item, pathname, collapsed }) {
  const Icon = item.icon
  const childActive = pathname.startsWith(item.base)
  const [open, setOpen] = useState(childActive)
  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])
  const expanded = collapsed ? childActive : open
  return (
    <div className={`ss-nav-group${childActive ? ' child-active' : ''}`}>
      <button
        type="button"
        className={`nav-item ss-nav-parent${childActive ? ' child-active' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={expanded}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={18} strokeWidth={1.75} />
        <span>{item.label}</span>
        <ChevronDown size={14} className={`nav-chevron ss-group-chevron${expanded ? ' open' : ''}`} />
      </button>
      {expanded ? (
        <div className="ss-nav-children">
          {item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.to}
              className={({ isActive }) => (isActive ? 'nav-item ss-nav-child active' : 'nav-item ss-nav-child')}
            >
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  useEffect(() => setNavOpen(false), [location.pathname])
  const { title, lead } = useMemo(() => pageMeta(location.pathname), [location.pathname])
  const initial = (session?.name || 'U').trim().charAt(0).toUpperCase()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
            if (item.children) {
              return <NavGroup key={item.id} item={item} pathname={location.pathname} collapsed={collapsed} />
            }
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
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
            <span className="ss-notify-avatar">{initial}</span>
          </button>
          <div className="ss-user">
            <div className="ss-user-photo" aria-hidden="true">{initial}</div>
            <div className="ss-user-copy">
              <strong>{session?.name || 'User'}</strong>
              <span>{session?.email || ''}</span>
            </div>
            <div className="ss-user-menu-wrap">
              <button
                type="button"
                className="ss-user-more"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((value) => !value)}
              >
                <MoreHorizontal size={16} />
              </button>
              {accountOpen ? (
                <div className="ss-user-menu" role="menu">
                  <button type="button" role="menuitem" onClick={onLogout}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
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