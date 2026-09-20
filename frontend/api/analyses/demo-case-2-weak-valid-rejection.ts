export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    analysis_id: 'demo-case-2-weak-valid-rejection',
    status: 'complete',
    created_at: new Date().toISOString(),
    language: 'en',
    appeal_available: false,
    grounds_letter_available: false,
    appeal_kind: 'gro_letter',
    appeal_document_id: 'doc-demo-weak',
    claim_record: {
      insurer_name: 'Bajaj Allianz General Insurance',
      policy_number: 'OG-26-1902-1801-00001234',
      claim_reference: 'BAGIC/2026/CLM/99102',
      claim_amount: 75000.0,
      rejection_date: '2026-08-18',
      stated_ground: 'Repudiation under Clause 4.1: Claim occurred within initial 30 days waiting period.',
      cited_clause_ref: 'Clause 4.1',
      policy_inception_date: '2026-08-06',
      continuous_months: 0,
      policyholder_name: 'Amit Sharma',
    },
    verdict: {
      level: 'weak',
      summary: "The insurer's repudiation is legally and contractually valid under operative policy waiting period provisions.",
      reasons: [
        'The insurer repudiated the claim citing Clause 4.1 (30-day initial waiting period for illnesses other than accidents).',
        'The policy incepted on 2026-08-06 and the hospitalization occurred on 2026-08-18 (after only 12 days of active coverage).',
        'Under IRDAI Master Circular on Operations 2024 and standard health insurance policy conditions, an initial waiting period of 30 days from inception is statutorily and contractually valid. No appeal grounds exist for this repudiation.'
      ],
      evidence_trail: [
        {
          id: 'ev_demo_weak_1',
          statement: 'Policy Clause 4.1 specifies an initial waiting period of 30 days from inception during which illness claims are excluded.',
          source_type: 'policy_span',
          page_number: 8,
          source_text: 'Clause 4.1 Initial 30-Day Waiting Period: A waiting period of 30 days from the inception date of the policy will be applicable for all illness claims except accidental injuries.',
          ordinal: 1,
        },
        {
          id: 'ev_demo_weak_2',
          statement: 'The claim occurred 12 days after policy inception, falling squarely within the contractually operative 30-day exclusion window.',
          source_type: 'provision',
          provision_ref: 'IRDAI Health Insurance Regulations / Waiting Period Norms',
          source_text: '[IRDAI Norms]: Insurers are permitted an initial 30-day waiting period from policy inception for all illnesses. Repudiation within this window is valid.',
          ordinal: 2,
        }
      ],
      generated_at: '2026-08-18T10:00:00Z',
      statutory_deadline: '15 Calendar Days (IRDAI Master Circular 2024 cl. 6)',
      non_advice_notice: 'This evaluation is generated for grievance assistance and dispute documentation under IRDAI guidelines. It does not constitute formal legal counsel.',
      flow: 'flow_b',
      grounds_letter_available: false,
      appeal_available: false,
    }
  });
}
