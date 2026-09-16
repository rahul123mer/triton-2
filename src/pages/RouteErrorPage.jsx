import { AlertTriangle, RotateCcw } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button, Card, SectionLabel } from '../components/ui'

export function RouteErrorPage() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error?.message || 'An unexpected interface error occurred.'

  return <div className="route-error-page">
    <Card className="route-error-card">
      <AlertTriangle size={30}/>
      <SectionLabel blue>WORKSPACE ERROR</SectionLabel>
      <h1>This view could not be displayed</h1>
      <p>{detail}</p>
      <div>
        <Button onClick={()=>window.location.reload()}><RotateCcw size={14}/>Try again</Button>
        <Link className="button secondary" to="/home">Return to Home</Link>
      </div>
    </Card>
  </div>
}
