export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    analysis_id: 'demo-case-1-strong-moratorium',
    status: 'complete',
    created_at: new Date().toISOString(),
    language: 'en',
    appeal_available: true,
    grounds_letter_available: false,
    appeal_kind: 'gro_letter',
    appeal_document_id: 'doc-demo-1',
    claim_record: {
      insurer_name: 'Star Health and Allied Insurance',
      policy_number: 'P/161114/01/2021/008742',
      claim_reference: 'CIR/2026/161114/098711',
      claim_amount: 284500.0,
      rejection_date: '2026-08-14',
      stated_ground: 'Repudiation under Clause 4.2: Pre-existing condition (Essential Hypertension & Cardiac history) not disclosed at inception.',
      cited_clause_ref: 'Clause 4.2',
      policy_inception_date: '2021-03-01',
      continuous_months: 65,
      policyholder_name: 'Rajesh Kumar',
    },
    verdict: {
      level: 'strong',
      summary: "The insurer's repudiation violates binding IRDAI regulations. After 60 continuous months of coverage, claims cannot be contested for pre-existing disease or non-disclosure.",
      reasons: [
        'The insurer rejected the claim citing pre-existing condition or non-disclosure, but the policy has completed 65 months of continuous coverage. Under IRDAI Master Circular 2024 cl. 13, the moratorium period of 60 months has elapsed, making the policy and claim incontestable on these grounds.',
        'Policy Clause 4.2 operates subject to statutory IRDAI moratorium limits which override restrictive policy wording.'
      ],
      evidence_trail: [
        {
          id: 'ev_demo1_1',
          statement: 'The policy has completed 65 continuous months of coverage, exceeding the 60-month statutory moratorium.',
          source_type: 'provision',
          provision_ref: 'IRDAI Master Circular 2024 cl. 13 / Moratorium Clause',
          source_text: '[IRDAI Master Circular 2024 cl. 13]: After sixty continuous months of health insurance coverage, no policy and no claim can be contested on grounds of non-disclosure, misrepresentation, or pre-existing disease, save for established fraud.',
          ordinal: 1,
        },
        {
          id: 'ev_demo1_2',
          statement: 'Policy Clause 4.2 retrieved verbatim from Page 14 of Star Health Comprehensive Policy Wording.',
          source_type: 'policy_span',
          page_number: 14,
          source_text: 'Clause 4.2 Pre-Existing Diseases (Code-Excl01): Expenses related to the treatment of a Pre-Existing Disease (PED) and its direct complications shall be excluded until the expiry of the waiting period specified in the policy schedule.',
          ordinal: 2,
        }
      ],
      generated_at: '2026-08-14T10:00:00Z',
      statutory_deadline: '15 Calendar Days (IRDAI Master Circular 2024 cl. 6)',
      non_advice_notice: 'This evaluation is generated for grievance assistance and dispute documentation under IRDAI guidelines. It does not constitute formal legal counsel.',
      flow: 'flow_a',
      grounds_letter_available: false,
      appeal_available: true,
    }
  });
}
