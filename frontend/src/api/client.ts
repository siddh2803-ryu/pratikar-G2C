/**
 * Typed API Client for Pratikar Backend
 * Implements exactly the 7 endpoints defined in Tech Stack §5.4.
 */

export interface StructuredClaimRecord {
  insurer_name: string;
  policy_number: string | null;
  claim_reference: string | null;
  claim_amount: number | null;
  rejection_date: string;
  stated_ground: string;
  cited_clause_ref: string | null;
  policy_inception_date: string | null;
  continuous_months: number | null;
  policyholder_name?: string | null;
}

export interface EvidenceItem {
  id: string;
  statement: string;
  source_type: 'policy_span' | 'provision';
  policy_chunk_id?: string | null;
  page_number?: number | null;
  provision_ref?: string | null;
  source_text: string;
  ordinal: number;
}

export interface Verdict {
  level: 'strong' | 'moderate' | 'weak';
  summary: string;
  reasons: string[];
  evidence_trail: EvidenceItem[];
  generated_at: string;
  statutory_deadline: string;
  non_advice_notice: string;
  flow: 'flow_a' | 'flow_b' | 'flow_c' | 'flow_d';
  grounds_letter_available: boolean;
  appeal_available: boolean;
}

export interface AnalysisResponse {
  analysis_id: string;
  status: 'processing' | 'complete' | 'failed';
  created_at: string;
  claim_record: StructuredClaimRecord | null;
  verdict: Verdict | null;
  appeal_document_id?: string | null;
  appeal_kind?: 'gro_letter' | 'grounds_request' | null;
  language: string;
  appeal_available?: boolean;
  grounds_letter_available?: boolean;
  error?: {
    code: string;
    message: string;
  } | null;
}

// Support dynamic backend URL on Vercel/Cloudflare or fallback to local /api proxy
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

export const api = {
  // 1. POST /api/analyses
  async startAnalysis(letterFile: File, policyFile: File, language: string = 'en'): Promise<{ analysis_id: string }> {
    const formData = new FormData();
    formData.append('rejection_letter', letterFile);
    formData.append('policy_wording', policyFile);
    formData.append('language', language);

    const res = await fetch(`${API_BASE}/analyses`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message = errorData.detail?.message || errorData.error?.message || 'Failed to start analysis';
      throw new Error(message);
    }
    return res.json();
  },

  // 2. GET /api/analyses/{id}
  async getAnalysis(analysisId: string): Promise<AnalysisResponse> {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message = errorData.detail?.message || errorData.error?.message || 'Analysis not found';
      throw new Error(message);
    }
    return res.json();
  },

  // 3. GET /api/analyses/{id}/evidence/{ref}
  async getEvidence(analysisId: string, evidenceRef: string): Promise<EvidenceItem> {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}/evidence/${evidenceRef}`);
    if (!res.ok) {
      throw new Error('Evidence item not found');
    }
    return res.json();
  },

  // 4. POST /api/analyses/{id}/appeal
  async generateAppeal(analysisId: string, language: string = 'en'): Promise<{ document_id: string; kind: string; language: string }> {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}/appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message = errorData.detail || errorData.error?.message || 'Appeal generation failed';
      throw new Error(message);
    }
    return res.json();
  },

  // 5. GET /api/analyses/{id}/appeal/{docId} URL
  getAppealDownloadUrl(analysisId: string, docId: string): string {
    return `${API_BASE}/analyses/${analysisId}/appeal/${docId}`;
  },

  // 6. DELETE /api/analyses/{id}
  async disposeSession(analysisId: string): Promise<void> {
    await fetch(`${API_BASE}/analyses/${analysisId}`, { method: 'DELETE' });
  },

  // 7. GET /api/health
  async getHealth(): Promise<{ status: string; warmed: boolean; providers: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
};
