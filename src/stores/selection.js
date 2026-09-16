import { create } from "zustand"

export const useSelection = create((set) => ({
  analysisId: null, recipeId: null, findingId: null, evidenceId: null, focusMs: null,
  selectEvidence: (event, seek) => { const focusMs=event.start_ms; set({ evidenceId:event.event_id, focusMs }); seek?.(focusMs) },
  selectFinding: (recipeId, finding) => set({ recipeId, findingId:finding.finding_id, evidenceId:finding.evidence_refs?.[0]?.id || null, focusMs:finding.evidence_refs?.[0]?.start_ms || null }),
  setAnalysis: (analysisId) => set({ analysisId }),
  clear: () => set({ recipeId:null,findingId:null,evidenceId:null,focusMs:null }),
}))
