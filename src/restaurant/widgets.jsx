import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { attentionBand } from './analytics'
import { formatDwell } from './format'

const PALETTE = ['#6da7ec', '#f472b6', '#38bdf8', '#a3e635', '#fbbf24', '#c084fc', '#34d399', '#fb7185']

function hashHue(value) {
  let h = 0
  for (const ch of String(value || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** Portrait with an initials fallback when the still has not been generated yet. */
export function Avatar({ person, size = 32, className = '' }) {
  const [broken, setBroken] = useState(false)
  const initials = (person?.name || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const style = { width: size, height: size, '--avatar': hashHue(person?.personId || person?.name) }
  if (person?.avatar && !broken) {
    return <img className={`ss-avatar ${className}`.trim()} style={style} src={person.avatar} alt="" onError={() => setBroken(true)} />
  }
  return <span className={`ss-avatar ss-avatar-fallback ${className}`.trim()} style={style} aria-hidden="true">{initials}</span>
}

export function PersonCell({ person, meta, size = 32 }) {
  return (
    <span className="ss-person-cell">
      <Avatar person={person} size={size} />
      <span className="ss-person-cell-copy">
        <strong>{person?.name || 'Unknown'}</strong>
        {meta ? <span>{meta}</span> : null}
      </span>
    </span>
  )
}

export function AttentionPill({ score, compact = false }) {
  const band = attentionBand(score)
  return (
    <span className={`ss-attention ss-attention-${band.tone}`} title="Visits per 15 minutes of occupied table time">
      <strong>{score ? score.toFixed(2) : '0.00'}</strong>
      {compact ? null : <span>{band.label}</span>}
    </span>
  )
}

export function StatTile({ label, value, hint, tone }) {
  return (
    <div className={`ss-stat${tone ? ` ss-stat-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <em>{hint}</em> : null}
    </div>
  )
}

export function StatGrid({ items, columns }) {
  return (
    <div className="ss-stat-grid" style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
      {items.map((item) => <StatTile key={item.label} {...item} />)}
    </div>
  )
}

/** Horizontal sub-navigation for a hub page (Analytics, Settings). */
export function SubNav({ items }) {
  return (
    <nav className="ss-subnav" aria-label="Section">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
          {item.label}
          {item.count != null ? <em>{item.count}</em> : null}
        </NavLink>
      ))}
    </nav>
  )
}

export function Footnote({ children }) {
  return <p className="ss-footnote">{children}</p>
}

/**
 * Dense sortable ranking table.
 * columns: [{ key, label, align, sortValue(row), render(row), width }]
 */
export function RankTable({ rows, columns, rowKey, onRowClick, defaultSort, defaultDir = 'desc', empty, footnote, dense = true }) {
  const [sortKey, setSortKey] = useState(defaultSort || null)
  const [dir, setDir] = useState(defaultDir)
  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const column = columns.find((col) => col.key === sortKey)
    if (!column) return rows
    const value = column.sortValue || ((row) => row[column.key])
    return [...rows].sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string' || typeof bv === 'string') {
        return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      }
      return dir === 'asc' ? av - bv : bv - av
    })
  }, [rows, columns, sortKey, dir])

  const toggle = (key) => {
    if (sortKey === key) setDir((value) => (value === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setDir('desc')
    }
  }

  if (!rows.length) {
    return <div className="rdi-empty"><strong>{empty?.title || 'Nothing to rank'}</strong><span>{empty?.detail || 'Widen the period or clear a filter.'}</span></div>
  }

  return (
    <div className="table-scroll">
      <table className={`ss-rank${dense ? ' is-dense' : ''}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: column.align || 'left', width: column.width }}>
                {column.sortable === false ? column.label : (
                  <button type="button" className={`ss-rank-sort${sortKey === column.key ? ' is-on' : ''}`} onClick={() => toggle(column.key)}>
                    {column.label}
                    {sortKey === column.key ? (dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? 'is-clickable' : ''}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onRowClick(row) } } : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align || 'left' }}>
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footnote ? <Footnote>{footnote}</Footnote> : null}
    </div>
  )
}

export function MiniBar({ value, max, color }) {
  const pct = max ? Math.max(3, Math.min(100, (value / max) * 100)) : 0
  return (
    <span className="ss-minibar" aria-hidden="true">
      <i style={{ width: `${pct}%`, background: color }} />
    </span>
  )
}

export function DwellCell({ ms, max, color }) {
  return (
    <span className="ss-dwell-cell">
      <MiniBar value={ms} max={max} color={color} />
      <span>{ms ? formatDwell(ms) : '—'}</span>
    </span>
  )
}

export function RankBadge({ rank }) {
  return <span className={`ss-rank-badge${rank === 1 ? ' is-top' : ''}`}>{rank}</span>
}
