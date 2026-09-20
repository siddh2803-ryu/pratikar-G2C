export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    analysis_id: 'demo-case-2-no-clause',
    status: 'complete',
    created_at: new Date().toISOString(),
    language: 'en',
    appeal_available: false,
    grounds_letter_available: true,
    appeal_kind: 'grounds_request',
    appeal_document_id: 'doc-demo-2',
    claim_record: {
      insurer_name: 'Care Health Insurance',
      policy_number: '18942201-00',
      claim_reference: 'CARE/2026/CLM/44120',
      claim_amount: 92000.0,
      rejection_date: '2026-08-18',
      stated_ground: 'Claim repudiated as per terms and conditions of the policy.',
      cited_clause_ref: null,
      policy_inception_date: '2026-08-06',
      continuous_months: 0,
      policyholder_name: 'Sneha Verma',
    },
    verdict: {
      level: 'moderate',
      summary: 'The insurer has repudiated the claim without specifying any contractual policy clause, exclusion, condition, or provision.',
      reasons: [
        'The rejection letter does not specify any contractual clause, exclusion, condition, or policy provision explaining why the claim was rejected.',
        'Under IRDAI Master Circular on Operations 2024 cl. 6, insurers are legally mandated to communicate specific grounds along with operative policy terms for any claim rejection.',
        'A formal Request-for-Grounds letter has been prepared demanding the insurer disclose the specific clause and evidence relied upon.'
      ],
      evidence_trail: [
        {
          id: 'ev_demo2_1',
          statement: 'Insurers are legally mandated to convey specific contractual grounds and operative policy clauses for claim repudiation.',
          source_type: 'provision',
          provision_ref: 'IRDAI Master Circular on Operations 2024 cl. 6 / Claim Settlement Norms',
          source_text: '[IRDAI Master Circular on Operations 2024 cl. 6]: Rejection of claims shall be made only after communicating specific grounds along with operative policy terms and conditions.',
          ordinal: 1,
        }
      ],
      generated_at: '2026-08-18T10:00:00Z',
      statutory_deadline: '15 Calendar Days (IRDAI Master Circular 2024 cl. 6)',
      non_advice_notice: 'This evaluation is generated for grievance assistance and dispute documentation under IRDAI guidelines. It does not constitute formal legal counsel.',
      flow: 'flow_c',
      grounds_letter_available: true,
      appeal_available: false,
    }
  });
}
