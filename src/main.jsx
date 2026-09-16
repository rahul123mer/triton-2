import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles.css'
import './restaurant/restaurant.css'
import './safespace-theme.css'
import './restaurant/product.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
})

async function start() {
  if (import.meta.env.VITE_API_MODE !== 'live') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } })
  } else {
    // Live mode: tear down any MSW worker this origin registered earlier.
    // A service worker outlives the page that installed it, so a browser that
    // once loaded the app in mock mode (the .env.example default) keeps
    // intercepting fetches afterwards -- serving stale fixtures, or nothing at
    // all -- while every other machine looks fine. Nothing here registers it in
    // live mode, so anything still installed is a leftover.
    if ('serviceWorker' in navigator) {
      try {
        const workers = await navigator.serviceWorker.getRegistrations()
        await Promise.all(workers.map(w => w.unregister()))
        if (workers.length) console.info(`[triton] removed ${workers.length} stale service worker(s); reload to be sure`)
      } catch { /* private mode or blocked storage: nothing to clean up */ }
    }
  }
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>
    </React.StrictMode>,
  )
}

start()
