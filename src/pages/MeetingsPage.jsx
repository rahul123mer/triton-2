import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Users } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, formatDuration, formatSourceTime } from '../lib/format'
import { Card, ErrorCard, LoadingCards, SectionLabel, StatusPill } from '../components/ui'

export function MeetingsPage() {
  const query = useQuery({ queryKey: ['meetings'], queryFn: () => api('/meetings') })
  return <div className="page">
    <div className="page-heading"><div><SectionLabel blue>MEETING LIBRARY</SectionLabel><h2>Extracted Meetings</h2><p>Open any session at its exact source-video timestamp.</p></div></div>
    <Card className="library-card">
      {query.isLoading ? <LoadingCards/> : query.isError ? <ErrorCard error={query.error}/> : <div className="table-scroll">
        <table><thead><tr><th>Meeting</th><th>Recorded</th><th>Source range</th><th>Duration</th><th>Participants</th><th>Score</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{query.data.map(meeting => <tr key={meeting.meeting_id}>
            <td><strong>{meeting.label}</strong><small className="table-sub">{meeting.room_name}</small></td><td>{formatDate(meeting.recorded_on)}</td><td className="numeric">{formatSourceTime(meeting.start_offset_ms)}–{formatSourceTime(meeting.end_offset_ms)}</td><td>{formatDuration(meeting.duration_ms)}</td><td><Users size={13}/> {meeting.participant_count}</td><td>{meeting.overall_score ?? '—'}</td><td><StatusPill status={meeting.status}/></td><td><Link aria-label={`Open ${meeting.label}`} className="icon-button" to={`/meetings/${meeting.meeting_id}`}><ArrowUpRight size={15}/></Link></td>
          </tr>)}</tbody></table>
        {query.data.length === 0 && <div className="no-results">No extracted meetings are available.</div>}
      </div>}
    </Card>
  </div>
}
