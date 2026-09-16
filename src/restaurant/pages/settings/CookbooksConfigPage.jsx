import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Card, SectionLabel, StatusPill } from '../../../components/ui'
import { useRestaurantWindow } from '../../components'
import { evaluateRecipe } from '../../analytics'
import { formatClock } from '../../format'
import { StatGrid, SubNav } from '../../widgets'
import { useConfigStore } from '../../configStore'
import { SETTINGS_NAV } from './UploadsPage'

const OUTPUT = {
  'rcp-table-occupancy': { feeds: 'Analytics → Tables', signal: 'Occupancy sessions, duration, covers' },
  'rcp-waiter-service': { feeds: 'Analytics → Servers', signal: 'Visits during occupancy, attention score' },
  'rcp-kitchen-utilisation': { feeds: 'Analytics → Kitchen', signal: 'Station time by region and employee' },
  'rcp-service-pattern': { feeds: 'Overview → Needs attention', signal: 'Under-served sessions below threshold' },
}

export function CookbooksConfigPage() {
  const navigate = useNavigate()
  const { start, end } = useRestaurantWindow()
  const cookbooks = useConfigStore((s) => s.cookbooks)
  const recipes = useConfigStore((s) => s.recipes)
  const toggleRecipe = useConfigStore((s) => s.toggleRecipe)
  const setRecipeThreshold = useConfigStore((s) => s.setRecipeThreshold)
  const [cookbook] = cookbooks
  const evaluated = useMemo(() => Object.fromEntries(recipes.map((recipe) => [recipe.recipeId, evaluateRecipe(recipe.recipeId, start, end)])), [recipes, start, end])
  const enabled = recipes.filter((row) => row.enabled)

  return (
    <div className="ss-settings">
      <SubNav items={SETTINGS_NAV} />
      <StatGrid
        columns={4}
        items={[
          { label: 'Cookbooks', value: cookbooks.length, hint: cookbook.useCase },
          { label: 'Recipes enabled', value: `${enabled.length} / ${recipes.length}` },
          { label: 'Events evaluated', value: enabled.reduce((sum, row) => sum + (evaluated[row.recipeId]?.eventsEvaluated || 0), 0), hint: 'Current window' },
          { label: 'Last evaluated', value: formatClock(cookbook.lastEvaluated).slice(0, 5), hint: 'Runs after each processed upload' },
        ]}
      />
      <Card className="ss-panel-card">
        <header className="ss-section-head ss-section-head-row">
          <div>
            <SectionLabel>COOKBOOK</SectionLabel>
            <div className="ss-cookbook-title"><h3>{cookbook.name}</h3><StatusPill status={cookbook.status} /></div>
            <p>{cookbook.description}</p>
          </div>
          <button type="button" className="ss-link-btn" onClick={() => navigate('/restaurant/analytics')}>Open analytics <ArrowUpRight size={14} /></button>
        </header>
        <div className="ss-recipe-config">
          {recipes.map((recipe) => {
            const result = evaluated[recipe.recipeId]
            const output = OUTPUT[recipe.recipeId]
            return (
              <div key={recipe.recipeId} className={`ss-recipe-row${recipe.enabled ? '' : ' is-off'}`}>
                <label className="ss-switch ss-switch-lg">
                  <input type="checkbox" checked={recipe.enabled} onChange={() => toggleRecipe(recipe.recipeId)} aria-label={`Enable ${recipe.name}`} />
                  <i />
                </label>
                <div className="ss-recipe-copy">
                  <strong>{recipe.name}</strong>
                  <span>{recipe.description}</span>
                  <div className="ss-recipe-meta">
                    <span>Events: {recipe.eventTypes.join(', ')}</span>
                    <span>Feeds: {output?.feeds}</span>
                    <span>Signal: {output?.signal}</span>
                  </div>
                  {recipe.threshold != null ? (
                    <label className="ss-threshold">
                      <span>Under-served below attention</span>
                      <input type="range" min={0.2} max={1} step={0.05} value={recipe.threshold} onChange={(e) => setRecipeThreshold(recipe.recipeId, Number(e.target.value))} disabled={!recipe.enabled} />
                      <strong>{recipe.threshold.toFixed(2)}</strong>
                    </label>
                  ) : null}
                </div>
                <div className="ss-recipe-eval">
                  <span>{recipe.enabled ? 'Evaluated' : 'Paused'}</span>
                  <strong>{recipe.enabled ? result?.eventsEvaluated : '—'}</strong>
                  <em>events in window</em>
                  <p>{recipe.enabled ? result?.result : 'Enable to evaluate this recipe on the next run.'}</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="ss-footnote">Recipes are the only place analytics rules live. Disabling one hides its outputs from Overview and Analytics; it does not delete events.</p>
      </Card>
    </div>
  )
}
