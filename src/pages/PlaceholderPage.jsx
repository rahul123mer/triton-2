import { useParams } from 'react-router-dom'
import { Card, SectionLabel } from '../components/ui'
export function PlaceholderPage() { const { section } = useParams(); return <div className="page"><SectionLabel blue>NOT FOUND</SectionLabel><Card className="placeholder"><h2>{section?.replace('-', ' ')}</h2><p>This workspace route does not exist.</p></Card></div> }
