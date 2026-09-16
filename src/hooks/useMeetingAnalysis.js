import { useQuery } from "@tanstack/react-query"
import { analysisApi } from "../lib/api"

/* Which Analysis a meeting surface should display.
 *
 * `current_analysis_id` is PUBLISHED-only by design: it is what a Report cites.
 * Every surface that keyed off it alone therefore went blank the moment an
 * Analysis existed but had not been published — the dashboard and the meeting
 * workspace both said "No analysis yet" and offered "Create analysis" beside a
 * meeting that already had one.
 *
 * That is a dead end rather than a delay. BRD 20.2 refuses to publish while a
 * weighted Recipe is unscorable, so for such a meeting nothing ever becomes
 * current and the empty state is permanent.
 *
 * It lives in one hook because it was fixed on one page first and the sibling
 * page kept the bug: two copies of this rule is how it comes back. Callers must
 * label a non-published Analysis — an unlabelled score reads as a verdict.
 */
export function useMeetingAnalysisId(meetingId, meeting, override, enabled = true) {
  const list = useQuery({
    queryKey: ['analyses', meetingId],
    queryFn: () => analysisApi.list(`meeting_id=${meetingId}`),
    enabled: Boolean(meetingId) && enabled,
  })
  // Newest first. The API filters drafts out for published-only principals, so
  // this cannot widen what a Viewer is allowed to see.
  const latest = [...(list.data || [])]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0]
  return override || meeting?.current_analysis_id || latest?.analysis_id
}
