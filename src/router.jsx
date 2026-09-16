import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useLocation, useParams } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { RouteErrorPage } from './pages/RouteErrorPage'

const VideoLibraryPage = lazy(() => import('./pages/VideoLibraryPage').then(module => ({ default: module.VideoLibraryPage })))
const VideoDetailPage = lazy(() => import('./pages/VideoDetailPage').then(module => ({ default: module.VideoDetailPage })))
const MeetingWorkspacePage = lazy(() => import('./pages/MeetingWorkspacePage').then(module => ({ default: module.MeetingWorkspacePage })))
const MeetingsPage = lazy(() => import('./pages/MeetingsPage').then(module => ({ default: module.MeetingsPage })))
const AnalysesPage = lazy(() => import('./pages/AnalysesPage').then(module => ({ default: module.AnalysesPage })))
const CookbooksPage = lazy(() => import('./pages/CookbooksPage').then(module => ({ default: module.CookbooksPage })))
const GalleryPage = lazy(() => import('./pages/GalleryPage').then(module => ({ default: module.GalleryPage })))
const GovernancePage = lazy(() => import('./pages/GovernancePage').then(module => ({ default: module.GovernancePage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })))
const DeadFootagePage = lazy(() => import('./pages/DeadFootagePage').then(module => ({ default: module.DeadFootagePage })))
const NewAnalysisPage = lazy(() => import('./pages/NewAnalysisPage').then(module => ({ default: module.NewAnalysisPage })))
const HumanScoringPage = lazy(() => import('./pages/HumanScoringPage').then(module => ({ default: module.HumanScoringPage })))
const ConfidenceReviewPage = lazy(() => import('./pages/ConfidenceReviewPage').then(module => ({ default: module.ConfidenceReviewPage })))
const ReportPreviewPage = lazy(() => import('./pages/ReportPreviewPage').then(module => ({ default: module.ReportPreviewPage })))
const ExtractionReviewPage = lazy(() => import('./pages/ExtractionReviewPage').then(module => ({ default: module.ExtractionReviewPage })))
const RecipeDrilldownPage = lazy(() => import('./pages/RecipeDrilldownPage').then(module => ({ default: module.RecipeDrilldownPage })))
const RestaurantLayout = lazy(() => import('./restaurant/RestaurantLayout').then(module => ({ default: module.RestaurantLayout })))
const RestaurantOverviewPage = lazy(() => import('./restaurant/pages/OverviewPage').then(module => ({ default: module.RestaurantOverviewPage })))
const AnalyticsPage = lazy(() => import('./restaurant/pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })))
const TableDetailPage = lazy(() => import('./restaurant/pages/TableDetailPage').then(module => ({ default: module.TableDetailPage })))
const WaiterDetailPage = lazy(() => import('./restaurant/pages/WaiterDetailPage').then(module => ({ default: module.WaiterDetailPage })))
const KitchenEmployeePage = lazy(() => import('./restaurant/pages/KitchenEmployeePage').then(module => ({ default: module.KitchenEmployeePage })))
const LiveKitchenPage = lazy(() => import('./restaurant/pages/LiveKitchenPage').then(module => ({ default: module.LiveKitchenPage })))
const LiveTablesPage = lazy(() => import('./restaurant/pages/LiveTablesPage').then(module => ({ default: module.LiveTablesPage })))
const CohortPage = lazy(() => import('./restaurant/pages/CohortPage').then(module => ({ default: module.CohortPage })))
const UploadsPage = lazy(() => import('./restaurant/pages/settings/UploadsPage').then(module => ({ default: module.UploadsPage })))
const TablesConfigPage = lazy(() => import('./restaurant/pages/settings/TablesConfigPage').then(module => ({ default: module.TablesConfigPage })))
const CookbooksConfigPage = lazy(() => import('./restaurant/pages/settings/CookbooksConfigPage').then(module => ({ default: module.CookbooksConfigPage })))
const PolygonsPage = lazy(() => import('./restaurant/pages/settings/PolygonsPage').then(module => ({ default: module.PolygonsPage })))
const TimingsPage = lazy(() => import('./restaurant/pages/settings/TimingsPage').then(module => ({ default: module.TimingsPage })))
const UsersPage = lazy(() => import('./restaurant/pages/settings/UsersPage').then(module => ({ default: module.UsersPage })))
const load = (element) => <Suspense fallback={<div className="route-loading" aria-label="Loading page"><span/></div>}>{element}</Suspense>

/** Old restaurant URLs still circulate in bookmarks and the CTO deck. */
function LegacyRedirect({ to, param = false }) {
  const params = useParams()
  const location = useLocation()
  const value = param ? (params.tableId || params.personId) : null
  return <Navigate to={`${to}${value ? `/${value}` : ''}${location.search || ''}`} replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    path: '/',
    element: <RequireAuth><AppShell /></RequireAuth>,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/restaurant" replace /> },
      { path: 'home', element: <Navigate to="/restaurant" replace /> },
      // Overview was renamed to Home after the demo. Bookmarks, the error page and
      // anything already circulating still point at the old path, so it redirects
      // rather than falling through to PlaceholderPage.
      { path: 'overview', element: <Navigate to="/restaurant" replace /> },
      { path: 'videos', element: load(<VideoLibraryPage />) },
      { path: 'videos/:videoId', element: load(<VideoDetailPage />) },
      { path: 'videos/:videoId/dead-footage/:segmentId', element: load(<DeadFootagePage />) },
      { path: 'videos/:videoId/extraction-review', element: load(<ExtractionReviewPage />) },
      { path: 'meetings/:meetingId', element: load(<MeetingWorkspacePage />) },
      { path: 'meetings', element: load(<MeetingsPage />) },
      { path: 'analyses', element: load(<AnalysesPage mode="analyses" />) },
      { path: 'analyses/new', element: load(<NewAnalysisPage />) },
      { path: 'analyses/:analysisId/human-scoring', element: load(<HumanScoringPage />) },
      { path: 'analyses/:analysisId/confidence', element: load(<ConfidenceReviewPage />) },
      { path: 'analyses/:analysisId/recipes/:recipeId', element: load(<RecipeDrilldownPage />) },
      { path: 'reports', element: load(<AnalysesPage mode="reports" />) },
      { path: 'reports/:analysisId', element: load(<ReportPreviewPage />) },
      { path: 'cookbooks', element: load(<CookbooksPage />) },
      { path: 'gallery', element: load(<GalleryPage />) },
      { path: 'governance', element: load(<GovernancePage />) },
      { path: 'settings', element: load(<SettingsPage />) },
      { path: 'restaurant', element: load(<RestaurantLayout />), children: [
        { index: true, element: load(<RestaurantOverviewPage />) },
        // Analytics hub + drilldowns
        { path: 'analytics', element: load(<AnalyticsPage view="restaurant" />) },
        { path: 'analytics/tables', element: load(<AnalyticsPage view="tables" />) },
        { path: 'analytics/tables/:tableId', element: load(<TableDetailPage />) },
        { path: 'analytics/servers', element: load(<AnalyticsPage view="servers" />) },
        { path: 'analytics/servers/:personId', element: load(<WaiterDetailPage />) },
        { path: 'analytics/kitchen', element: load(<AnalyticsPage view="kitchen" />) },
        { path: 'analytics/kitchen/:personId', element: load(<KitchenEmployeePage />) },
        // Live feeds
        { path: 'live', element: <Navigate to="/restaurant/live/kitchen" replace /> },
        { path: 'live/kitchen', element: load(<LiveKitchenPage />) },
        { path: 'live/tables', element: load(<LiveTablesPage />) },
        // Cohorts
        { path: 'cohorts', element: <Navigate to="/restaurant/cohorts/serving" replace /> },
        { path: 'cohorts/kitchen', element: load(<CohortPage role="kitchen" />) },
        { path: 'cohorts/serving', element: load(<CohortPage role="waiter" />) },
        // Settings & configurations
        { path: 'settings', element: <Navigate to="/restaurant/settings/timings" replace /> },
        { path: 'settings/timings', element: load(<TimingsPage />) },
        { path: 'settings/users', element: load(<UsersPage />) },
        { path: 'settings/uploads', element: load(<UploadsPage />) },
        { path: 'settings/tables', element: load(<TablesConfigPage />) },
        { path: 'settings/cookbooks', element: load(<CookbooksConfigPage />) },
        { path: 'settings/polygons', element: load(<PolygonsPage />) },
        // Legacy redirects
        { path: 'tables', element: <Navigate to="/restaurant/live/tables" replace /> },
        { path: 'tables/:tableId', element: <LegacyRedirect to="/restaurant/analytics/tables" param /> },
        { path: 'service', element: <Navigate to="/restaurant/cohorts/serving" replace /> },
        { path: 'service/:personId', element: <LegacyRedirect to="/restaurant/analytics/servers" param /> },
        { path: 'kitchen', element: <LegacyRedirect to="/restaurant/live/kitchen" /> },
        { path: 'kitchen/:personId', element: <LegacyRedirect to="/restaurant/analytics/kitchen" param /> },
        { path: 'cookbooks', element: <Navigate to="/restaurant/settings/cookbooks" replace /> },
        { path: 'analysis', element: <Navigate to="/restaurant/analytics" replace /> },
        { path: 'reports', element: <Navigate to="/restaurant/analytics" replace /> },
      ] },
      { path: ':section/*', element: <PlaceholderPage /> },
    ],
  },
])
