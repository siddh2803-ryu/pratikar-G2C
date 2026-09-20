const DEMO_CASES: Record<string, any> = {
  'demo-case-1-strong-moratorium': {
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
  },
  'demo-case-2-no-clause': {
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
  },
  'demo-case-3-clause-mismatch': {
    analysis_id: 'demo-case-3-clause-mismatch',
    status: 'complete',
    created_at: new Date().toISOString(),
    language: 'en',
    appeal_available: true,
    grounds_letter_available: false,
    appeal_kind: 'gro_letter',
    appeal_document_id: 'doc-demo-3',
    claim_record: {
      insurer_name: 'HDFC ERGO General Insurance',
      policy_number: '2801 2049 1928 0000',
      claim_reference: 'HD/REP/2026/8921',
      claim_amount: 165000.0,
      rejection_date: '2026-08-20',
      stated_ground: 'Repudiation under Clause 5.9: Treatment excluded under specific non-contracted waiting period schedule.',
      cited_clause_ref: 'Clause 5.9',
      policy_inception_date: '2023-01-15',
      continuous_months: 43,
      policyholder_name: 'Vikram Malhotra',
    },
    verdict: {
      level: 'strong',
      summary: "Clause/Policy Mismatch: The insurer repudiated the claim citing 'Clause 5.9', but this clause does not exist anywhere in the policy wording.",
      reasons: [
        "The insurer cited 'Clause 5.9' as the basis for claim repudiation, but verification against the policy wording confirms that this clause does not exist in the policy contract.",
        'Under IRDAI regulations and insurance contract law, an insurer cannot reject a claim based on non-existent, uncontracted, or phantom policy terms.',
        'An official Grievance Redressal Officer (GRO) appeal has been prepared demanding immediate withdrawal of the repudiation due to contractual invalidity.'
      ],
      evidence_trail: [
        {
          id: 'ev_demo3_1',
          statement: "Clause 'Clause 5.9' cited in the rejection letter does not appear anywhere in the policy wording issued to the policyholder.",
          source_type: 'provision',
          provision_ref: 'Policy Document Audit / Clause Verification',
          source_text: "[Policy Document Audit]: The uploaded policy wording was audited for 'Clause 5.9'. No operative clause or exclusion matching this reference exists in the policy contract issued to the insured.",
          ordinal: 1,
        }
      ],
      generated_at: '2026-08-20T10:00:00Z',
      statutory_deadline: '15 Calendar Days (IRDAI Master Circular 2024 cl. 6)',
      non_advice_notice: 'This evaluation is generated for grievance assistance and dispute documentation under IRDAI guidelines. It does not constitute formal legal counsel.',
      flow: 'flow_a',
      grounds_letter_available: false,
      appeal_available: true,
    }
  }
};

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { id } = req.query;
  const analysisId = String(id || '');

  let analysis = DEMO_CASES[analysisId];
  if (!analysis) {
    if (analysisId === 'case-1') analysis = DEMO_CASES['demo-case-1-strong-moratorium'];
    else if (analysisId === 'case-2') analysis = DEMO_CASES['demo-case-2-no-clause'];
    else if (analysisId === 'case-3') analysis = DEMO_CASES['demo-case-3-clause-mismatch'];
  }

  if (analysis) {
    return res.status(200).json(analysis);
  }

  return res.status(404).json({
    error: {
      code: 'ANALYSIS_NOT_FOUND',
      message: `Analysis session '${analysisId}' was not found.`,
    },
  });
}
