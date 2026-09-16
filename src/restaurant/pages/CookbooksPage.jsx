import { Link } from 'react-router-dom'
import { Card, SectionLabel, StatusPill } from '../../components/ui'
import { useRestaurantWindow } from '../components'
import { cookbookStatus } from '../analytics'
import { formatClock } from '../format'

export function RestaurantCookbooksPage() {
  const { start, end } = useRestaurantWindow()
  const [cookbook] = cookbookStatus(start, end)
  return (
    <>
      <Card>
        <div className="analysis-card-head">
          <div>
            <SectionLabel blue>COOKBOOK</SectionLabel>
            <strong>{cookbook.name}</strong>
            <p style={{ color: 'var(--ink-600)', margin: '6px 0 0' }}>{cookbook.description}</p>
          </div>
          <StatusPill status={cookbook.status} />
        </div>
        <div className="rdi-meta">
          <div><span>Recipes</span><strong>{cookbook.recipeCount}</strong></div>
          <div><span>Use case</span><strong>{cookbook.useCase}</strong></div>
          <div><span>Last evaluated</span><strong>{formatClock(cookbook.lastEvaluated)}</strong></div>
          <div><span>Events evaluated</span><strong>{cookbook.eventsEvaluated}</strong></div>
        </div>
      </Card>
      <div className="rdi-person-grid" style={{ marginTop: 14 }}>
        {cookbook.recipes.map((row) => (
          <Card key={row.recipe.recipeId}>
            <SectionLabel>RECIPE</SectionLabel>
            <h3 style={{ margin: '6px 0' }}>{row.recipe.name}</h3>
            <p style={{ color: 'var(--ink-600)', fontSize: 13 }}>{row.recipe.description}</p>
            <div className="rdi-meta">
              <div><span>Status</span><strong>Evaluated</strong></div>
              <div><span>Events</span><strong>{row.eventsEvaluated}</strong></div>
            </div>
            <p style={{ fontSize: 13 }}>{row.result}</p>
            <Link className="button primary" to={`/restaurant/analysis?recipe=${row.recipe.recipeId}`}>Open analysis</Link>
          </Card>
        ))}
      </div>
    </>
  )
}
