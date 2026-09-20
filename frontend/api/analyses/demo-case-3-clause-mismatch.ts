export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
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
        },
        {
          id: 'ev_demo3_2',
          statement: 'Insurers must substantiate claim repudiation under operative policy provisions; repudiation under non-existent terms is invalid.',
          source_type: 'provision',
          provision_ref: 'IRDAI Master Circular 2024 cl. 6 / Fair Repudiation Norms',
          source_text: "[IRDAI Master Circular 2024 cl. 6]: Rejection of claims shall be made only with reference to operative policy terms in the policyholder's contract.",
          ordinal: 2,
        }
      ],
      generated_at: '2026-08-20T10:00:00Z',
      statutory_deadline: '15 Calendar Days (IRDAI Master Circular 2024 cl. 6)',
      non_advice_notice: 'This evaluation is generated for grievance assistance and dispute documentation under IRDAI guidelines. It does not constitute formal legal counsel.',
      flow: 'flow_a',
      grounds_letter_available: false,
      appeal_available: true,
    }
  });
}
