import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
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
const TablesPage = lazy(() => import('./restaurant/pages/TablesPage').then(module => ({ default: module.TablesPage })))
const TableDetailPage = lazy(() => import('./restaurant/pages/TableDetailPage').then(module => ({ default: module.TableDetailPage })))
const ServicePage = lazy(() => import('./restaurant/pages/ServicePage').then(module => ({ default: module.ServicePage })))
const WaiterDetailPage = lazy(() => import('./restaurant/pages/WaiterDetailPage').then(module => ({ default: module.WaiterDetailPage })))
const KitchenPage = lazy(() => import('./restaurant/pages/KitchenPage').then(module => ({ default: module.KitchenPage })))
const KitchenEmployeePage = lazy(() => import('./restaurant/pages/KitchenEmployeePage').then(module => ({ default: module.KitchenEmployeePage })))
const RestaurantCookbooksPage = lazy(() => import('./restaurant/pages/CookbooksPage').then(module => ({ default: module.RestaurantCookbooksPage })))
const RestaurantAnalysisPage = lazy(() => import('./restaurant/pages/AnalysisPage').then(module => ({ default: module.RestaurantAnalysisPage })))
const RestaurantReportsPage = lazy(() => import('./restaurant/pages/ReportsPage').then(module => ({ default: module.RestaurantReportsPage })))
const load = (element) => <Suspense fallback={<div className="route-loading" aria-label="Loading page"><span/></div>}>{element}</Suspense>

export const router = createBrowserRouter([{
  path: '/', element: <AppShell />, errorElement: <RouteErrorPage />, children: [
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
      { path: 'tables', element: load(<TablesPage />) },
      { path: 'tables/:tableId', element: load(<TableDetailPage />) },
      { path: 'service', element: load(<ServicePage />) },
      { path: 'service/:personId', element: load(<WaiterDetailPage />) },
      { path: 'kitchen', element: load(<KitchenPage />) },
      { path: 'kitchen/:personId', element: load(<KitchenEmployeePage />) },
      { path: 'cookbooks', element: load(<RestaurantCookbooksPage />) },
      { path: 'analysis', element: load(<RestaurantAnalysisPage />) },
      { path: 'reports', element: load(<RestaurantReportsPage />) },
    ] },
    { path: ':section/*', element: <PlaceholderPage /> },
  ],
}])
