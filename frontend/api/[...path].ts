import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
  'demo-case-2-weak-valid-rejection': {
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

function cleanAnsi(text: string): string {
  if (!text) return '';
  return text
    .replace(/₹/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '-')
    .replace(/[^\x00-\x7F\xA0-\xFF]/g, '')
    .trim();
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const safeText = cleanAnsi(text);
  const words = safeText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let width = 0;
    try {
      width = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      width = testLine.length * fontSize * 0.6;
    }
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

async function buildPdfBytes(analysis: any): Promise<Uint8Array> {
  const { claim_record: claimRecord, verdict, appeal_kind: appealKind } = analysis;
  const isFlowC = appealKind === 'grounds_request';

  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  const page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header Notice
  page.drawText(`PRATIKAR - IRDAI Master Circular 2024 Compliance - Ref: ${cleanAnsi(claimRecord.claim_reference || 'REF-DISPUTE')}`, {
    x: margin,
    y: margin - 15,
    size: 8,
    font: helveticaOblique,
    color: rgb(0.5, 0.5, 0.5),
  });

  // 1. Header Bar
  const titleText = isFlowC
    ? 'FORMAL REQUEST FOR GROUNDS OF REPUDIATION'
    : 'FORMAL GRIEVANCE APPEAL UNDER IRDAI REGULATIONS';
  const subTitleText = isFlowC
    ? 'Mandatory Disclosure Demand under IRDAI Master Circular on Operations 2024'
    : 'Prepared via Pratikar Dispute Contest Engine - Directly Filed by Policyholder';

  page.drawRectangle({
    x: margin,
    y: y - 48,
    width: contentWidth,
    height: 48,
    color: rgb(0.08, 0.22, 0.38),
  });

  page.drawText(cleanAnsi(titleText), {
    x: margin + 12,
    y: y - 22,
    size: 11,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(cleanAnsi(subTitleText), {
    x: margin + 12,
    y: y - 38,
    size: 8.5,
    font: helvetica,
    color: rgb(0.85, 0.9, 0.95),
  });

  y -= 65;

  // 2. Addressee
  page.drawText('To,', { x: margin, y, size: 9.5, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 14;
  page.drawText('The Grievance Redressal Officer (GRO) / Claims Review Department', {
    x: margin,
    y,
    size: 9.5,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 14;
  page.drawText(cleanAnsi(claimRecord.insurer_name), {
    x: margin,
    y,
    size: 10.5,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 22;

  // 3. Subject Box
  const claimRef = cleanAnsi(claimRecord.claim_reference || 'Not Applicable');
  const subjectText = isFlowC
    ? `Subject: Formal Demand for Contractual Grounds of Repudiation - Claim Ref: ${claimRef}`
    : `Subject: Formal Grievance Appeal & Demand for Reconsideration - Claim Ref: ${claimRef}`;

  const subjectLines = wrapText(subjectText, helveticaBold, 9.5, contentWidth - 20);
  const subjectBoxHeight = subjectLines.length * 13 + 12;

  page.drawRectangle({
    x: margin,
    y: y - subjectBoxHeight,
    width: contentWidth,
    height: subjectBoxHeight,
    color: rgb(0.95, 0.97, 0.99),
    borderColor: rgb(0.8, 0.85, 0.92),
    borderWidth: 1,
  });

  let subY = y - 14;
  for (const line of subjectLines) {
    page.drawText(cleanAnsi(line), {
      x: margin + 10,
      y: subY,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.08, 0.22, 0.38),
    });
    subY -= 13;
  }
  y -= subjectBoxHeight + 14;

  // 4. Claim Particulars
  const policyholder = cleanAnsi(claimRecord.policyholder_name || 'Insured Claimant');
  const policyNo = cleanAnsi(claimRecord.policy_number || 'Refer enclosed policy schedule');
  const amountStr = claimRecord.claim_amount
    ? `INR ${claimRecord.claim_amount.toLocaleString('en-IN')}`
    : 'As per hospital bills submitted';
  const dateStr = cleanAnsi(claimRecord.rejection_date || 'Refer rejection letter');
  const groundStr = cleanAnsi(claimRecord.stated_ground || 'Repudiation terms not specified');

  const particulars = [
    { label: 'Policyholder Name:', value: policyholder },
    { label: 'Policy Number:', value: policyNo },
    { label: 'Claim Reference:', value: claimRef },
    { label: 'Rejection Date:', value: dateStr },
    { label: 'Disputed Amount:', value: amountStr },
    { label: 'Stated Ground:', value: groundStr },
  ];

  let particularsHeight = 24;
  for (const p of particulars) {
    const valLines = wrapText(p.value, helvetica, 9, contentWidth - 160);
    particularsHeight += Math.max(1, valLines.length) * 14 + 3;
  }

  page.drawRectangle({
    x: margin,
    y: y - particularsHeight,
    width: contentWidth,
    height: particularsHeight,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.88, 0.88, 0.9),
    borderWidth: 1,
  });

  page.drawText('CLAIM PARTICULARS', {
    x: margin + 10,
    y: y - 16,
    size: 8.5,
    font: helveticaBold,
    color: rgb(0.4, 0.45, 0.5),
  });

  let partY = y - 32;
  for (const p of particulars) {
    page.drawText(p.label, {
      x: margin + 10,
      y: partY,
      size: 9,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    const valLines = wrapText(p.value, helvetica, 9, contentWidth - 160);
    let valY = partY;
    for (const vLine of valLines) {
      page.drawText(cleanAnsi(vLine), {
        x: margin + 150,
        y: valY,
        size: 9,
        font: helvetica,
        color: rgb(0.15, 0.15, 0.15),
      });
      valY -= 13;
    }
    partY -= Math.max(1, valLines.length) * 14 + 3;
  }
  y -= particularsHeight + 16;

  // 5. Grounds
  page.drawText('STATUTORY & CONTRACTUAL GROUNDS OF APPEAL:', {
    x: margin,
    y,
    size: 9.5,
    font: helveticaBold,
    color: rgb(0.08, 0.22, 0.38),
  });
  y -= 15;

  for (const reason of verdict.reasons) {
    const reasonLines = wrapText(`- ${cleanAnsi(reason)}`, helvetica, 9, contentWidth - 10);
    for (const rLine of reasonLines) {
      page.drawText(cleanAnsi(rLine), {
        x: margin + 5,
        y,
        size: 9,
        font: helvetica,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 13;
    }
    y -= 4;
  }
  y -= 8;

  // 6. Evidence Trail
  if (verdict.evidence_trail && verdict.evidence_trail.length > 0) {
    page.drawText('VERIFIABLE EVIDENCE TRAIL & CITATIONS:', {
      x: margin,
      y,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.08, 0.22, 0.38),
    });
    y -= 15;

    verdict.evidence_trail.forEach((ev: any, idx: number) => {
      const source = ev.provision_ref
        ? ev.provision_ref
        : `Policy Wording Page ${ev.page_number || 'N/A'}`;
      const evText = `[${idx + 1}] ${cleanAnsi(ev.statement)} (Source: ${cleanAnsi(source)})`;
      const evLines = wrapText(evText, helvetica, 8.5, contentWidth - 10);

      for (const eLine of evLines) {
        page.drawText(cleanAnsi(eLine), {
          x: margin + 5,
          y,
          size: 8.5,
          font: helvetica,
          color: rgb(0.2, 0.25, 0.3),
        });
        y -= 12;
      }
      y -= 4;
    });
    y -= 8;
  }

  // 7. Signoff
  page.drawText('Yours sincerely,', {
    x: margin,
    y,
    size: 9.5,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 20;

  page.drawText(policyholder, {
    x: margin,
    y,
    size: 11,
    font: helveticaBold,
    color: rgb(0.08, 0.22, 0.38),
  });
  y -= 13;

  page.drawText('Policyholder / Insured Claimant', {
    x: margin,
    y,
    size: 8.5,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 12;

  page.drawText(`Date: ${dateStr}`, {
    x: margin,
    y,
    size: 8.5,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await doc.save();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let rawSegments: string[] = [];
  if (Array.isArray(req.query.path)) {
    rawSegments = req.query.path;
  } else if (typeof req.query.path === 'string') {
    rawSegments = req.query.path.split('/');
  } else {
    rawSegments = (req.url || '').split('?')[0].split('/');
  }
  const segments = rawSegments.filter(Boolean).filter(p => p !== 'api');
  const urlPath = (req.url || '').split('?')[0];

  // 1. Health: /api/health
  if (segments[0] === 'health' || urlPath.includes('/health')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      status: 'healthy',
      service: 'pratikar-engine',
      timestamp: new Date().toISOString(),
      warmed: true,
    });
  }

  // 2. Analyses routes: /api/analyses...
  if (segments[0] === 'analyses' || urlPath.includes('/analyses')) {
    let analysisId = segments[1];

    if (!analysisId) {
      if (urlPath.includes('demo-case-1') || urlPath.includes('case-1')) {
        analysisId = 'demo-case-1-strong-moratorium';
      } else if (urlPath.includes('demo-case-2') || urlPath.includes('case-2')) {
        analysisId = 'demo-case-2-no-clause';
      } else if (urlPath.includes('demo-case-3') || urlPath.includes('case-3')) {
        analysisId = 'demo-case-3-clause-mismatch';
      }
    }

    // POST /api/analyses (upload)
    if (!analysisId && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(201).json({
        analysis_id: 'demo-case-1-strong-moratorium',
      });
    }

    if (!analysisId) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    let analysis = DEMO_CASES[analysisId];
    if (!analysis) {
      if (analysisId === 'case-1' || analysisId.includes('case-1')) analysis = DEMO_CASES['demo-case-1-strong-moratorium'];
      else if (analysisId === 'case-2' || analysisId.includes('weak') || analysisId.includes('case-2')) analysis = DEMO_CASES['demo-case-2-weak-valid-rejection'];
      else if (analysisId === 'case-3' || analysisId.includes('case-3')) analysis = DEMO_CASES['demo-case-2-no-clause'];
      else if (analysisId === 'case-4' || analysisId.includes('case-4')) analysis = DEMO_CASES['demo-case-3-clause-mismatch'];
    }

    // 3. DELETE /api/analyses/:id (PRD §17 Endpoint #6: session disposal)
    if (req.method === 'DELETE') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        status: 'disposed',
        analysis_id: analysisId,
        message: 'Analysis session and associated documents securely disposed (SEC-05).',
      });
    }

    // 4. GET /api/analyses/:id/evidence/:ref (PRD §17 Endpoint #3)
    const isEvidence = segments.includes('evidence') || urlPath.includes('/evidence');
    if (isEvidence && req.method === 'GET') {
      const evIdx = segments.indexOf('evidence');
      const evRef = (evIdx !== -1 && segments[evIdx + 1]) ? segments[evIdx + 1] : urlPath.split('/evidence/')[1]?.split('?')[0];
      const trail = analysis?.verdict?.evidence_trail || [];
      const found = trail.find((e: any) => e.id === evRef || String(e.ordinal) === evRef);
      if (found) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(found);
      }
      return res.status(404).json({ error: `Evidence reference '${evRef}' not found.` });
    }

    const isAppeal = segments.includes('appeal') || urlPath.includes('/appeal');

    // 5. POST /api/analyses/:id/appeal (PRD §17 Endpoint #4)
    if (isAppeal && req.method === 'POST') {
      if (!analysis?.verdict?.appeal_available && !analysis?.verdict?.grounds_letter_available) {
        return res.status(400).json({
          detail: 'Where the rejection is valid (Weak verdict), no appeal is generated (PRD FR-12).',
        });
      }
      res.setHeader('Content-Type', 'application/json');
      const kind = analysis?.verdict?.flow === 'flow_c' ? 'grounds_request' : 'gro_letter';
      return res.status(200).json({
        document_id: `doc-${analysisId}`,
        kind,
        language: 'en',
      });
    }

    // 6. GET /api/analyses/:id/appeal/:docId (PRD §17 Endpoint #5: PDF download)
    if (isAppeal && req.method === 'GET' && (segments.length >= 3 || urlPath.match(/\/appeal\/[^\/]+/))) {
      if (!analysis) {
        analysis = DEMO_CASES['demo-case-1-strong-moratorium'];
      }
      try {
        const bytes = await buildPdfBytes(analysis);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="appeal_${analysisId}.pdf"`);
        return res.status(200).send(Buffer.from(bytes));
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }

    // 7. GET /api/analyses/:id (PRD §17 Endpoint #2)
    if (analysis) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(analysis);
    }

    return res.status(404).json({
      error: { code: 'ANALYSIS_NOT_FOUND', message: `Analysis session '${analysisId}' not found.` },
    });
  }

  return res.status(404).json({ error: 'Not found' });
}
