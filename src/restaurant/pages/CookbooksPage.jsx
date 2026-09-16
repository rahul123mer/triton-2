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
      <Card className="ss-panel-card">
        <header className="ss-section-head">
          <SectionLabel blue>COOKBOOK</SectionLabel>
          <div className="ss-cookbook-title">
            <h3>{cookbook.name}</h3>
            <StatusPill status={cookbook.status} />
          </div>
          <p>{cookbook.description}</p>
        </header>
        <div className="rdi-meta ss-meta-spaced">
          <div><span>Recipes</span><strong>{cookbook.recipeCount}</strong></div>
          <div><span>Use case</span><strong>{cookbook.useCase}</strong></div>
          <div><span>Last evaluated</span><strong>{formatClock(cookbook.lastEvaluated)}</strong></div>
          <div><span>Events evaluated</span><strong>{cookbook.eventsEvaluated}</strong></div>
        </div>
      </Card>
      <header className="ss-section-head" style={{ marginTop: 20, marginBottom: 12 }}>
        <SectionLabel>RECIPES</SectionLabel>
        <h3>Available recipes</h3>
        <p>Each recipe evaluates occupancy, waiter, or kitchen events for the selected window.</p>
      </header>
      <div className="rdi-person-grid">
        {cookbook.recipes.map((row) => (
          <Card key={row.recipe.recipeId} className="ss-recipe-card">
            <SectionLabel>RECIPE</SectionLabel>
            <h3>{row.recipe.name}</h3>
            <p>{row.recipe.description}</p>
            <div className="rdi-meta ss-meta-spaced">
              <div><span>Status</span><strong>Evaluated</strong></div>
              <div><span>Events</span><strong>{row.eventsEvaluated}</strong></div>
            </div>
            <p className="ss-recipe-result">{row.result}</p>
            <Link className="button primary ss-recipe-cta" to={`/restaurant/analysis?recipe=${row.recipe.recipeId}`}>Open analysis</Link>
          </Card>
        ))}
      </div>
    </>
  )
}
