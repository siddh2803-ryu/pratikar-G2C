import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { StructuredClaimRecord, Verdict } from '../api/client';

export interface GeneratePdfOptions {
  claimRecord: StructuredClaimRecord;
  verdict: Verdict;
  appealKind: string;
  language?: string;
}

/**
 * Sanitizes text to pure WinAnsi-compatible characters so standard Helvetica
 * never encounters unencodable Unicode glyphs.
 */
export function cleanAnsi(text: string): string {
  if (!text) return '';
  return text
    .replace(/₹/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '-')
    .replace(/·/g, '-')
    .replace(/[^\x00-\x7F\xA0-\xFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Wraps text to fit within a given maxWidth for a given font and fontSize.
 */
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

/**
 * Generates an official, publication-quality ready-to-file PDF appeal document
 * matching the on-screen preview and backend ReportLab structure.
 */
export async function generateAppealPdfBytes(options: GeneratePdfOptions): Promise<Uint8Array> {
  const { claimRecord, verdict, appealKind } = options;
  const isFlowC = appealKind === 'grounds_request';

  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y - neededHeight < margin + 30) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    // Footer notice on all pages
    const footerNotice = `PRATIKAR - IRDAI Master Circular 2024 Compliance - Ref: ${cleanAnsi(claimRecord.claim_reference || 'REF-DISPUTE')}`;
    page.drawText(footerNotice, {
      x: margin,
      y: margin - 15,
      size: 8,
      font: helveticaOblique,
      color: rgb(0.5, 0.5, 0.5),
    });
  };

  drawHeaderFooter();

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
    color: rgb(0.08, 0.22, 0.38), // Brand Navy
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

  // 4. Claim Particulars Box
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

  // 5. Grounds Section
  checkPageBreak(80);
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
    checkPageBreak(reasonLines.length * 13 + 6);
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

  // 6. Evidence Trail Section
  if (verdict.evidence_trail && verdict.evidence_trail.length > 0) {
    checkPageBreak(70);
    page.drawText('VERIFIABLE EVIDENCE TRAIL & CITATIONS:', {
      x: margin,
      y,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.08, 0.22, 0.38),
    });
    y -= 15;

    verdict.evidence_trail.forEach((ev, idx) => {
      const source = ev.provision_ref
        ? ev.provision_ref
        : `Policy Wording Page ${ev.page_number || 'N/A'}`;
      const evText = `[${idx + 1}] ${cleanAnsi(ev.statement)} (Source: ${cleanAnsi(source)})`;
      const evLines = wrapText(evText, helvetica, 8.5, contentWidth - 10);

      checkPageBreak(evLines.length * 12 + 6);
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

  // 7. Demand & Timeline Box
  checkPageBreak(65);
  const demandText1 =
    'MANDATORY RESOLUTION DEMAND: Under IRDAI regulations, the insurer is legally required to resolve this grievance in writing within 15 calendar days of receipt.';
  const demandText2 =
    'Failure to satisfactorily resolve this claim within 15 calendar days will result in immediate escalation to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017, and civil litigation without further notice.';

  const d1Lines = wrapText(demandText1, helveticaBold, 8.5, contentWidth - 16);
  const d2Lines = wrapText(demandText2, helvetica, 8.5, contentWidth - 16);
  const demandBoxHeight = (d1Lines.length + d2Lines.length) * 12 + 16;

  page.drawRectangle({
    x: margin,
    y: y - demandBoxHeight,
    width: contentWidth,
    height: demandBoxHeight,
    color: rgb(0.99, 0.97, 0.95),
    borderColor: rgb(0.9, 0.82, 0.75),
    borderWidth: 1,
  });

  let dY = y - 13;
  for (const line of d1Lines) {
    page.drawText(cleanAnsi(line), {
      x: margin + 8,
      y: dY,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.6, 0.25, 0.05),
    });
    dY -= 12;
  }
  dY -= 2;
  for (const line of d2Lines) {
    page.drawText(cleanAnsi(line), {
      x: margin + 8,
      y: dY,
      size: 8.5,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
    dY -= 12;
  }
  y -= demandBoxHeight + 16;

  // 8. Signoff
  checkPageBreak(70);
  page.drawText('Yours sincerely,', {
    x: margin,
    y,
    size: 9.5,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 22;

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
